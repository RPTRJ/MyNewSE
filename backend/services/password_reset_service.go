package services

import (
	"errors"
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

func (s *PasswordResetService) RequestPasswordReset(email string, baseURL string) error {
	// ตรวจสอบว่า email มีอยู่ในระบบหรือไม่
	var user entity.User
	if err := s.db.Where("email = ?", email).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// ไม่บอกว่า email ไม่มี เพื่อความปลอดภัย (ป้องกัน email enumeration)
			return nil
		}
		return err
	}

	// สร้าง token
	token, err := utils.GenerateRandomToken(32)
	if err != nil {
		return err
	}

	// บันทึก token ใน database
	resetRecord := entity.PasswordReset{
		Email:     email,
		Token:     token,
		ExpiresAt: time.Now().Add(15 * time.Minute), // อายุ 15 นาที
		Used:      false,
	}

	if err := s.db.Create(&resetRecord).Error; err != nil {
		return err
	}

	// ส่ง email
	resetLink := baseURL + "/reset-password?token=" + token
	return s.emailService.SendPasswordResetEmail(email, resetLink)
}

func (s *PasswordResetService) ResetPassword(token, newPassword string) error {
	// หา reset record
	var reset entity.PasswordReset
	if err := s.db.Where("token = ? AND used = false", token).First(&reset).Error; err != nil {
		return errors.New("invalid or expired token")
	}

	// ตรวจสอบว่าหมดอายุหรือไม่
	if time.Now().After(reset.ExpiresAt) {
		return errors.New("token has expired")
	}

	// หาผู้ใช้
	var user entity.User
	if err := s.db.Where("email = ?", reset.Email).First(&user).Error; err != nil {
		return err
	}

	// Hash password ใหม่
	hashedPassword, err := config.HashPassword(newPassword)
	if err != nil {
		return err
	}

	// อัพเดทรหัสผ่าน
	if err := s.db.Model(&user).Update("password", hashedPassword).Error; err != nil {
		return err
	}

	// ทำเครื่องหมายว่า token ถูกใช้แล้ว
	s.db.Model(&reset).Update("used", true)

	return nil
}
