package services

import (
	"context"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob/blob"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azblob/blockblob"
)

type AzureStorageService struct {
	client        *azblob.Client
	containerName string
	accountName   string
}

var AzureStorage *AzureStorageService

func InitAzureStorage() error {
	connectionString := os.Getenv("AZURE_STORAGE_CONNECTION_STRING")
	containerName := os.Getenv("AZURE_STORAGE_CONTAINER")

	if connectionString == "" {
		return fmt.Errorf("AZURE_STORAGE_CONNECTION_STRING is not set")
	}

	if containerName == "" {
		containerName = "uploads"
	}

	client, err := azblob.NewClientFromConnectionString(connectionString, nil)
	if err != nil {
		return fmt.Errorf("failed to create Azure Blob client: %v", err)
	}

	// Extract account name from connection string
	accountName := extractAccountName(connectionString)

	AzureStorage = &AzureStorageService{
		client:        client,
		containerName: containerName,
		accountName:   accountName,
	}

	return nil
}

func extractAccountName(connectionString string) string {
	parts := strings.Split(connectionString, ";")
	for _, part := range parts {
		if strings.HasPrefix(part, "AccountName=") {
			return strings.TrimPrefix(part, "AccountName=")
		}
	}
	return ""
}

func (s *AzureStorageService) UploadFile(file io.Reader, fileName string, contentType string) (string, error) {
	ctx := context.Background()

	// Generate unique filename
	ext := filepath.Ext(fileName)
	uniqueName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)

	// Upload to Azure Blob Storage
	_, err := s.client.UploadStream(ctx, s.containerName, uniqueName, file, &blockblob.UploadStreamOptions{
		HTTPHeaders: &blob.HTTPHeaders{
			BlobContentType: &contentType,
		},
	})

	if err != nil {
		return "", fmt.Errorf("failed to upload file: %v", err)
	}

	// Return the URL
	url := fmt.Sprintf("https://%s.blob.core.windows.net/%s/%s",
		s.accountName, s.containerName, uniqueName)

	return url, nil
}

func (s *AzureStorageService) DeleteFile(fileName string) error {
	ctx := context.Background()
	_, err := s.client.DeleteBlob(ctx, s.containerName, fileName, nil)
	return err
}
