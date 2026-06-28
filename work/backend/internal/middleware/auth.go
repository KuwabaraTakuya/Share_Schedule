package middleware

import (
	"context"
	"strings"

	firebase "firebase.google.com/go/v4"
	"github.com/gofiber/fiber/v2"
)

func AuthMiddleware(app *firebase.App) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header is required",
			})
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid authorization format",
			})
		}

		idToken := parts[1]

		authClient, err := app.Auth(context.Background())
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to initialize auth client",
			})
		}

		token, err := authClient.VerifyIDToken(context.Background(), idToken)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
			})
		}

		c.Locals("uid", token.UID)
		c.Locals("email", token.Claims["email"])
		return c.Next()
	}
}

func GetUID(c *fiber.Ctx) string {
	uid, _ := c.Locals("uid").(string)
	return uid
}

func GetEmail(c *fiber.Ctx) string {
	email, _ := c.Locals("email").(string)
	return email
}
