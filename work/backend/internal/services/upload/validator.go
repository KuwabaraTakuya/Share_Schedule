package upload

import (
	"fmt"
	"mime/multipart"
	"strings"
)

const (
	MaxImageSize = 10 * 1024 * 1024 // 10MB
	MaxFileSize  = 50 * 1024 * 1024 // 50MB
)

var dangerousMIMETypes = map[string]bool{
	"application/x-msdownload":      true,
	"application/x-executable":      true,
	"application/x-sh":              true,
	"application/x-bat":             true,
	"application/x-msdos-program":   true,
	"application/java-archive":       true,
	"application/x-python-code":     true,
	"application/x-ruby":            true,
}

var dangerousExtensions = []string{
	".exe", ".sh", ".bat", ".cmd", ".msi", ".app", ".apk",
	".dmg", ".deb", ".rpm", ".jar", ".vbs", ".ps1", ".py",
	".rb", ".pl", ".php",
}

var allowedImageMIMETypes = map[string]bool{
	"image/jpeg":    true,
	"image/png":     true,
	"image/gif":     true,
	"image/webp":    true,
	"image/svg+xml": true,
}

func ValidateImageFile(file *multipart.FileHeader) error {
	if file.Size > MaxImageSize {
		return fmt.Errorf("画像ファイルのサイズは10MB以下にしてください")
	}

	mimeType := file.Header.Get("Content-Type")
	if !allowedImageMIMETypes[mimeType] {
		return fmt.Errorf("サポートされていない画像形式です")
	}

	return nil
}

func ValidateFile(file *multipart.FileHeader) error {
	if file.Size > MaxFileSize {
		return fmt.Errorf("ファイルのサイズは50MB以下にしてください")
	}
	return nil
}

func IsDangerousFile(mimeType, fileName string) bool {
	if dangerousMIMETypes[mimeType] {
		return true
	}

	lower := strings.ToLower(fileName)
	for _, ext := range dangerousExtensions {
		if strings.HasSuffix(lower, ext) {
			return true
		}
	}
	return false
}
