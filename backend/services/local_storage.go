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

	// ===== FIX: BASE_URL ต้องเป็น URL ที่ผู้ใช้งานสามารถเข้าถึงได้ =====
	// ตัวอย่าง:
	// - Development: http://localhost:8080
	// - Production via nginx: http://sutportfolio.online/api
	//
	// ถ้าไม่กำหนด BASE_URL จะใช้ relative path แทน (/uploads/filename.ext)
	// ซึ่ง frontend จะต้องจัดการ prepend domain เอง
	baseURL := os.Getenv("BASE_URL")
	// ถ้าไม่กำหนด BASE_URL ให้ใช้ empty string เพื่อ return relative path
	// Frontend จะจัดการ prepend API URL เอง
	if baseURL == "" {
		baseURL = ""
	}

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

	// ===== FIX: Return URL based on BASE_URL setting =====
	var url string
	if s.baseURL != "" {
		// ถ้ามี BASE_URL ให้ใช้ full URL
		url = fmt.Sprintf("%s/uploads/%s", s.baseURL, uniqueName)
	} else {
		// ถ้าไม่มี BASE_URL ให้ใช้ relative path
		// Frontend จะ prepend API URL เอง
		url = fmt.Sprintf("/uploads/%s", uniqueName)
	}

	return url, nil
}

func (s *LocalStorageService) DeleteFile(fileName string) error {
	filePath := filepath.Join(s.uploadDir, fileName)
	return os.Remove(filePath)
}
