package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"github.com/joho/godotenv"
	"google.golang.org/api/option"

	"github.com/share-schedule/backend/internal/handlers"
	"github.com/share-schedule/backend/internal/middleware"
	"github.com/share-schedule/backend/internal/repository"
	"github.com/share-schedule/backend/internal/services/availability"
	"github.com/share-schedule/backend/internal/services/gemini"
	"github.com/share-schedule/backend/internal/services/safebrowsing"
)

func main() {
	// .env読み込み
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	ctx := context.Background()

	// Firebase初期化
	var firebaseApp *firebase.App
	var err error

	credFile := os.Getenv("FIREBASE_CREDENTIALS_FILE")
	projectID := os.Getenv("FIREBASE_PROJECT_ID")

	config := &firebase.Config{ProjectID: projectID}

	if credFile != "" {
		if _, err := os.Stat(credFile); err == nil {
			firebaseApp, err = firebase.NewApp(ctx, config, option.WithCredentialsFile(credFile))
		} else {
			// Application Default Credentials
			firebaseApp, err = firebase.NewApp(ctx, config)
		}
	} else {
		firebaseApp, err = firebase.NewApp(ctx, config)
	}

	if err != nil {
		log.Fatalf("Failed to initialize Firebase: %v", err)
	}

	// Firestoreクライアント
	var firestoreClient *firestore.Client
	if credFile != "" {
		if _, statErr := os.Stat(credFile); statErr == nil {
			firestoreClient, err = firestore.NewClient(ctx, projectID, option.WithCredentialsFile(credFile))
		} else {
			firestoreClient, err = firestore.NewClient(ctx, projectID)
		}
	} else {
		firestoreClient, err = firestore.NewClient(ctx, projectID)
	}

	if err != nil {
		log.Fatalf("Failed to initialize Firestore: %v", err)
	}
	defer firestoreClient.Close()

	// リポジトリ
	firestoreRepo := repository.NewFirestoreRepo(firestoreClient)
	userRepo := repository.NewUserRepository(firestoreRepo)
	communityRepo := repository.NewCommunityRepository(firestoreRepo)
	channelRepo := repository.NewChannelRepository(firestoreRepo)
	messageRepo := repository.NewMessageRepository(firestoreRepo)
	eventRepo := repository.NewEventRepository(firestoreRepo)

	// Geminiクライアント
	var geminiClient *gemini.Client
	if apiKey := os.Getenv("GEMINI_API_KEY"); apiKey != "" {
		geminiClient, err = gemini.NewClient(apiKey)
		if err != nil {
			log.Printf("Warning: Failed to initialize Gemini: %v", err)
		}
	}

	// Safe Browsing
	safeChecker := safebrowsing.NewChecker(os.Getenv("SAFE_BROWSING_API_KEY"))

	// 可用性計算
	availCalc := availability.NewCalculator(eventRepo, communityRepo, geminiClient)

	// ハンドラー
	authHandler := handlers.NewAuthHandler(userRepo)
	communityHandler := handlers.NewCommunityHandler(communityRepo, userRepo)
	channelHandler := handlers.NewChannelHandler(channelRepo, communityRepo)
	messageHandler := handlers.NewMessageHandler(messageRepo, channelRepo, communityRepo, firestoreRepo)
	eventHandler := handlers.NewEventHandler(eventRepo, communityRepo, geminiClient, availCalc)
	uploadHandler := handlers.NewUploadHandler(nil, os.Getenv("FIREBASE_PROJECT_ID")+".appspot.com", safeChecker)
	searchHandler := handlers.NewSearchHandler(communityRepo, messageRepo)
	notificationHandler := handlers.NewNotificationHandler(userRepo)

	// Fiber
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{"error": err.Error()})
		},
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(middleware.CORSMiddleware())

	// ヘルスチェック
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// APIルーター
	api := app.Group("/api/v1")

	// 認証（JWTなし）
	api.Post("/auth/verify", middleware.AuthMiddleware(firebaseApp), authHandler.Verify)

	// 認証付きルート
	auth := api.Use(middleware.AuthMiddleware(firebaseApp))

	// コミュニティ
	auth.Get("/communities", communityHandler.GetAll)
	auth.Post("/communities", communityHandler.Create)
	auth.Post("/communities/join", communityHandler.Join)
	auth.Get("/communities/:id", communityHandler.GetByID)
	auth.Get("/communities/:id/members", communityHandler.GetMembers)
	auth.Post("/communities/:id/invite", communityHandler.GenerateInvite)
	auth.Delete("/communities/:id/members/:uid", communityHandler.KickMember)
	auth.Patch("/communities/:id/members/:uid", communityHandler.UpdateMemberRole)

	// チャンネル
	auth.Get("/communities/:id/channels", channelHandler.GetByCommunity)
	auth.Post("/communities/:id/channels", channelHandler.Create)
	auth.Patch("/channels/:id/position", channelHandler.UpdatePosition)
	auth.Delete("/channels/:id", channelHandler.Delete)

	// メッセージ
	auth.Get("/channels/:id/messages", messageHandler.GetByChannel)
	auth.Post("/channels/:id/messages", messageHandler.Send)
	auth.Patch("/messages/:id", messageHandler.Edit)
	auth.Delete("/messages/:id", messageHandler.Delete)
	auth.Post("/messages/:id/reactions", messageHandler.AddReaction)
	auth.Delete("/messages/:id/reactions/:emoji", messageHandler.RemoveReaction)

	// イベント
	auth.Get("/events", eventHandler.GetAll)
	auth.Post("/events", eventHandler.Create)
	auth.Post("/events/parse", eventHandler.ParseFromText)
	auth.Post("/events/sync/google", eventHandler.SyncGoogleCalendar)
	auth.Post("/events/import/ics", eventHandler.ImportICS)
	auth.Patch("/events/:id", eventHandler.Update)
	auth.Delete("/events/:id", eventHandler.Delete)
	auth.Get("/communities/:id/availability", eventHandler.GetAvailability)

	// アップロード
	auth.Post("/upload/image", uploadHandler.UploadImage)
	auth.Post("/upload/file", uploadHandler.UploadFile)
	auth.Post("/url/check", uploadHandler.CheckURLSafety)

	// 検索
	auth.Get("/search/users", searchHandler.SearchUsers)
	auth.Get("/search/messages", searchHandler.SearchMessages)
	auth.Get("/search/places", searchHandler.SearchPlaces)

	// 通知
	auth.Post("/notifications/token", notificationHandler.RegisterToken)
	auth.Patch("/notifications/settings", notificationHandler.UpdateSettings)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := app.Listen(fmt.Sprintf(":%s", port)); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
