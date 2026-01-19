package services

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"
)

type LocalStorageService struct {
	uploadDir string
	baseURL   string
}

var LocalStorage *LocalStorageService

func InitLocalStorage() error {
	uploadDir := os.Getenv("UPLOAD_DIR")
	if uploadDir == "" {
		uploadDir = "./uploads"
	}

	// ✅ BASE_URL: ถ้าไม่กำหนด ให้ใช้ empty string (จะ return relative path)
	baseURL := os.Getenv("BASE_URL")
	// baseURL จะเป็น empty string เป็นค่า default
	// ถ้าต้องการ absolute URL ให้กำหนดใน .env (เช่น development)

	// Create upload directory if not exists
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return fmt.Errorf("failed to create upload directory: %v", err)
	}

	LocalStorage = &LocalStorageService{
		uploadDir: uploadDir,
		baseURL:   baseURL,
	}

	return nil
}

func (s *LocalStorageService) UploadFile(file io.Reader, fileName string, contentType string) (string, error) {
	// Generate unique filename
	ext := filepath.Ext(fileName)
	uniqueName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)

	// Create file path
	filePath := filepath.Join(s.uploadDir, uniqueName)

	// Create the file
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %v", err)
	}
	defer dst.Close()

	// Copy content to file
	if _, err := io.Copy(dst, file); err != nil {
		return "", fmt.Errorf("failed to write file: %v", err)
	}

	// ✅ Return URL based on BASE_URL
	var url string
	if s.baseURL != "" {
		// ถ้ามี BASE_URL (development) ให้ใช้ absolute URL
		url = fmt.Sprintf("%s/uploads/%s", s.baseURL, uniqueName)
	} else {
		// ✅ ถ้าไม่มี BASE_URL (production) ให้ใช้ relative path
		// Frontend จะต้อง prepend API_URL เอง หรือใช้ผ่าน nginx proxy
		url = fmt.Sprintf("/uploads/%s", uniqueName)
	}

	return url, nil
}

func (s *LocalStorageService) DeleteFile(fileName string) error {
	filePath := filepath.Join(s.uploadDir, fileName)
	return os.Remove(filePath)
}
