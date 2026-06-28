package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func CORSMiddleware() fiber.Handler {
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:5173"
	}

	origins := strings.Split(allowedOrigins, ",")
	for i, o := range origins {
		origins[i] = strings.TrimSpace(o)
	}

	return cors.New(cors.Config{
		AllowOrigins:     strings.Join(origins, ","),
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		AllowHeaders:     "Origin,Content-Type,Authorization",
		AllowCredentials: false,
		MaxAge:           86400,
	})
}
