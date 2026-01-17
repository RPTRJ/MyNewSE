package services

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"github.com/sut68/team14/backend/utils"
	"gorm.io/gorm"
)

type PasswordResetService struct {
	db           *gorm.DB
	emailService *EmailService
}

func NewPasswordResetService(db *gorm.DB, emailService *EmailService) *PasswordResetService {
	return &PasswordResetService{
		db:           db,
		emailService: emailService,
	}
}

// ✅ Rate Limiting Check
func (s *PasswordResetService) checkRateLimit(email string) error {
	var recentResets []entity.PasswordReset

	// หา requests ใน 15 นาทีที่แล้ว
	fifteenMinutesAgo := time.Now().Add(-15 * time.Minute)
	err := s.db.Where("email = ? AND created_at > ?", email, fifteenMinutesAgo).
		Find(&recentResets).Error

	if err != nil {
		log.Printf("[SECURITY] Error checking rate limit for %s: %v", email, err)
		return err
	}

	// อนุญาตสูงสุด 3 requests ต่อ 15 นาที
	if len(recentResets) >= 3 {
		log.Printf("[SECURITY] Rate limit exceeded for: %s (%d requests in 15 min)", email, len(recentResets))
		return errors.New("too many reset requests, please try again in 15 minutes")
	}

	return nil
}

// ✅ Request Password Reset with Rate Limiting + Timing Attack Prevention
func (s *PasswordResetService) RequestPasswordReset(email string, baseURL string) error {
	// 🔒 เริ่มจับเวลา (สำหรับ timing attack prevention)
	start := time.Now()
	defer func() {
		// Ensure constant response time (min 500ms)
		elapsed := time.Since(start)
		minDuration := 500 * time.Millisecond
		if elapsed < minDuration {
			time.Sleep(minDuration - elapsed)
		}
	}()

	// 🔒 Rate Limiting Check
	if err := s.checkRateLimit(email); err != nil {
		return err
	}

	// ตรวจสอบว่า email มีอยู่ในระบบหรือไม่
	var user entity.User
	userExists := true

	err := s.db.Where("email = ?", email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			userExists = false
			log.Printf("[SECURITY] Password reset requested for non-existent email: %s", email)
		} else {
			log.Printf("[ERROR] Database error while checking email %s: %v", email, err)
			return err
		}
	}

	// ถ้า user มีจริง ส่ง email
	if userExists {
		// สร้าง token
		token, err := utils.GenerateRandomToken(32)
		if err != nil {
			log.Printf("[ERROR] Failed to generate token for %s: %v", email, err)
			return err
		}

		// บันทึก token ในฐานข้อมูล
		resetRecord := entity.PasswordReset{
			Email:     email,
			Token:     token,
			ExpiresAt: time.Now().Add(15 * time.Minute),
			Used:      false,
		}

		if err := s.db.Create(&resetRecord).Error; err != nil {
			log.Printf("[ERROR] Failed to save reset token for %s: %v", email, err)
			return err
		}

		// สร้าง reset link
		resetLink := fmt.Sprintf("%s/reset-password?token=%s", baseURL, token)

		// ส่ง email
		log.Printf("[EMAIL] Attempting to send password reset to: %s", email)
		if err := s.emailService.SendPasswordResetEmail(email, resetLink); err != nil {
			log.Printf("[EMAIL] ❌ Failed to send to %s: %v", email, err)
			return err
		}

		log.Printf("[EMAIL] ✅ Successfully sent to: %s", email)
	}

	// 🔒 เสมอ return nil (ไม่เปิดเผยว่า email มีหรือไม่)
	return nil
}

// ✅ Validate Token
func (s *PasswordResetService) validateToken(token string) (*entity.PasswordReset, error) {
	var reset entity.PasswordReset

	// หา token ในฐานข้อมูล
	if err := s.db.Where("token = ?", token).First(&reset).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("[SECURITY] Invalid token used: %s...", token[:min(10, len(token))])
			return nil, errors.New("invalid or expired reset token")
		}
		return nil, err
	}

	// ตรวจสอบว่า token หมดอายุหรือยัง
	if time.Now().After(reset.ExpiresAt) {
		log.Printf("[SECURITY] Expired token used for email: %s", reset.Email)
		return nil, errors.New("reset token has expired")
	}

	// ตรวจสอบว่า token ถูกใช้แล้วหรือยัง
	if reset.Used {
		log.Printf("[SECURITY] Already used token attempted for email: %s", reset.Email)
		return nil, errors.New("reset token has already been used")
	}

	return &reset, nil
}

// ✅ Reset Password with Validation + Logging
func (s *PasswordResetService) ResetPassword(token, newPassword string) error {
	// Validate password length
	if len(newPassword) < 6 {
		return errors.New("password must be at least 6 characters long")
	}

	// Validate token
	reset, err := s.validateToken(token)
	if err != nil {
		return err
	}

	// Hash รหัสผ่านใหม่
	hashedPassword, err := config.HashPassword(newPassword)
	if err != nil {
		log.Printf("[ERROR] Failed to hash password for %s: %v", reset.Email, err)
		return err
	}

	// อัพเดทรหัสผ่านในฐานข้อมูล
	if err := s.db.Model(&entity.User{}).
		Where("email = ?", reset.Email).
		Update("password", hashedPassword).Error; err != nil {
		log.Printf("[ERROR] Failed to update password for %s: %v", reset.Email, err)
		return err
	}

	// ทำเครื่องหมายว่า token ถูกใช้แล้ว
	if err := s.db.Model(&reset).Update("used", true).Error; err != nil {
		log.Printf("[ERROR] Failed to mark token as used for %s: %v", reset.Email, err)
		return err
	}

	log.Printf("[SECURITY] Password successfully reset for email: %s", reset.Email)
	return nil
}

// Helper function for min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
