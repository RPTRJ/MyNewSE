package utils

import (
	"crypto/rand"
	"encoding/hex"
)

// GenerateRandomToken สร้าง token แบบสุ่มสำหรับ password reset
func GenerateRandomToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}
