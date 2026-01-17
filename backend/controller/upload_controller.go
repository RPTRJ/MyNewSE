package controller

import (
	"net/http"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/services"
)

type UploadController struct{}

func NewUploadController() *UploadController {
	return &UploadController{}
}

// Max file size: 5MB
const MaxFileSize = 5 * 1024 * 1024

// Allowed image extensions
var AllowedImageExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".gif":  true,
	".webp": true,
	".bmp":  true,
}

// Allowed document extensions
var AllowedDocExtensions = map[string]bool{
	".pdf":  true,
	".doc":  true,
	".docx": true,
	".xls":  true,
	".xlsx": true,
}

// Allowed MIME types
var AllowedMimeTypes = map[string]bool{
	"image/jpeg":         true,
	"image/png":          true,
	"image/gif":          true,
	"image/webp":         true,
	"image/bmp":          true,
	"application/pdf":    true,
	"application/msword": true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
	"application/vnd.ms-excel": true,
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
}

func (u *UploadController) UploadFile(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File is required"})
		return
	}
	defer file.Close()

	// Check file size (5MB limit)
	if header.Size > MaxFileSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must not exceed 5MB"})
		return
	}

	// Check file extension
	ext := strings.ToLower(filepath.Ext(header.Filename))
	isImage := AllowedImageExtensions[ext]
	isDoc := AllowedDocExtensions[ext]

	if !isImage && !isDoc {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Only image files (JPG, PNG, GIF, WEBP, BMP) and documents (PDF, DOC, DOCX, XLS, XLSX) are allowed"})
		return
	}

	// Get or detect content type
	contentType := header.Header.Get("Content-Type")
	if !AllowedMimeTypes[contentType] {
		// Try to detect from extension
		switch ext {
		case ".jpg", ".jpeg":
			contentType = "image/jpeg"
		case ".png":
			contentType = "image/png"
		case ".gif":
			contentType = "image/gif"
		case ".webp":
			contentType = "image/webp"
		case ".bmp":
			contentType = "image/bmp"
		case ".pdf":
			contentType = "application/pdf"
		case ".doc":
			contentType = "application/msword"
		case ".docx":
			contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
		case ".xls":
			contentType = "application/vnd.ms-excel"
		case ".xlsx":
			contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
		default:
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type"})
			return
		}
	}

	// Upload to Local Storage
	if services.LocalStorage == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Storage service not initialized"})
		return
	}

	savedPath, err := services.LocalStorage.UploadFile(file, header.Filename, contentType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload file: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"file_path": savedPath})
}

// DeleteFile deletes a file from storage by filename
func (u *UploadController) DeleteFile(c *gin.Context) {
	filename := c.Param("filename")
	if filename == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Filename is required"})
		return
	}

	if services.LocalStorage == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Storage service not initialized"})
		return
	}

	err := services.LocalStorage.DeleteFile(filename)
	if err != nil {
		// File might not exist, which is okay for profile image replacement
		c.JSON(http.StatusOK, gin.H{"message": "File deleted or not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File deleted successfully"})
}
