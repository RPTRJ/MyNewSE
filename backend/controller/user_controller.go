package controller

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"github.com/sut68/team14/backend/services"
	"gorm.io/gorm"
)

const birthdayLayout = "2006-01-02"

type UserController struct {
	db *gorm.DB
}

func NewUserController() *UserController {
	return &UserController{db: config.GetDB()}
}

type UserPayload struct {
	FirstNameTH     string `json:"first_name_th"`
	LastNameTH      string `json:"last_name_th"`
	FirstNameEN     string `json:"first_name_en"`
	LastNameEN      string `json:"last_name_en"`
	Email           string `json:"email" binding:"required,email"`
	Password        string `json:"password"`
	ProfileImageURL string `json:"profile_image_url"`
	IDNumber        string `json:"id_number"`
	Phone           string `json:"phone"`
	Birthday        string `json:"birthday" binding:"required,datetime=2006-01-02"`
	PDPAConsent     bool   `json:"pdpa_consent"`
	AccountTypeID   uint   `json:"account_type_id"`
	IDDocTypeID     uint   `json:"id_doc_type_id"`
}

func (uc *UserController) RegisterRoutes(router gin.IRoutes) {
	router.GET("/users", uc.ListUsers)
	router.GET("/users/:id", uc.GetUser)
	router.POST("/users", uc.CreateUser)
	router.PUT("/users/:id", uc.UpdateUser)
	router.DELETE("/users/:id", uc.DeleteUser)
}

func (uc *UserController) RegisterSelfRoutes(router gin.IRoutes) {
	router.GET("/me", uc.GetMe)
	router.PUT("/users/me/onboarding", uc.CompleteOnboarding)
	router.GET("/users/me/check-id", uc.CheckIDDuplicate)
}

func (uc *UserController) ListUsers(c *gin.Context) {
	var users []entity.User
	if err := uc.db.Preload("AccountType").Preload("IDDocType").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": users})
}

func (uc *UserController) GetUser(c *gin.Context) {
	id, err := parseUintParam(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var user entity.User
	if err := uc.db.Preload("AccountType").Preload("IDDocType").First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

func (uc *UserController) CreateUser(c *gin.Context) {
	var payload UserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	birthday, err := time.Parse(birthdayLayout, payload.Birthday)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid birthday format"})
		return
	}

	passwordHash, err := config.HashPassword(payload.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	user := entity.User{
		FirstNameTH:     payload.FirstNameTH,
		LastNameTH:      payload.LastNameTH,
		FirstNameEN:     payload.FirstNameEN,
		LastNameEN:      payload.LastNameEN,
		Email:           payload.Email,
		Password:        passwordHash,
		ProfileImageURL: payload.ProfileImageURL,
		IDNumber:        payload.IDNumber,
		Phone:           payload.Phone,
		Birthday:        birthday,
		PDPAConsent:     payload.PDPAConsent,
		AccountTypeID:   payload.AccountTypeID,
		IDDocTypeID:     payload.IDDocTypeID,
	}

	if payload.PDPAConsent {
		now := time.Now()
		user.PDPAConsentAt = &now
	}

	if err := services.ValidateUser(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := uc.db.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": user})
}

func (uc *UserController) GetMe(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	var user entity.User
	if err := uc.db.Preload("AccountType").Preload("IDDocType").First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

type OnboardingPayload struct {
	FirstNameTH string `json:"first_name_th"`
	LastNameTH  string `json:"last_name_th"`
	FirstNameEN string `json:"first_name_en"`
	LastNameEN  string `json:"last_name_en"`
	IDNumber    string `json:"id_number" binding:"required"`
	IDTypeName  string `json:"id_type_name" binding:"required"`
	Phone       string `json:"phone" binding:"required"`
	Birthday    string `json:"birthday" binding:"required,datetime=2006-01-02"`
	PDPAConsent bool   `json:"pdpa_consent" binding:"required"`
}

func (uc *UserController) CompleteOnboarding(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	var payload OnboardingPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	firstName := firstNonEmpty(payload.FirstNameTH, payload.FirstNameEN)
	lastName := firstNonEmpty(payload.LastNameTH, payload.LastNameEN)

	if strings.TrimSpace(firstName) == "" || strings.TrimSpace(lastName) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required in Thai or English"})
		return
	}

	if !payload.PDPAConsent {
		c.JSON(http.StatusBadRequest, gin.H{"error": "pdpa consent is required"})
		return
	}

	birthday, err := time.Parse(birthdayLayout, payload.Birthday)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid birthday format"})
		return
	}

	// Check duplicate ID number (excluding current user)
	var dup entity.User
	if err := uc.db.Where("id_number = ? AND id <> ?", payload.IDNumber, userID).First(&dup).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "id number already in use"})
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var user entity.User
	if err := uc.db.First(&user, userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Route name to Thai or English fields based on characters to avoid mixed-language validation errors.
	if containsThai(firstName) || containsThai(lastName) {
		user.FirstNameTH = firstName
		user.LastNameTH = lastName
		user.FirstNameEN = ""
		user.LastNameEN = ""
	} else {
		user.FirstNameTH = ""
		user.LastNameTH = ""
		user.FirstNameEN = firstName
		user.LastNameEN = lastName
	}

	user.IDNumber = payload.IDNumber
	user.Phone = payload.Phone
	user.PDPAConsent = true
	now := time.Now()
	user.PDPAConsentAt = &now
	user.ProfileCompleted = true

	// Resolve ID document type by name (create if missing)
	var idType entity.IDTypes
	if err := uc.db.Where("id_name = ?", payload.IDTypeName).First(&idType).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			idType.IDName = payload.IDTypeName
			if err := uc.db.Create(&idType).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}
	user.IDDocTypeID = idType.ID
	user.Birthday = birthday

	if err := services.ValidateUser(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := uc.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

func (uc *UserController) UpdateUser(c *gin.Context) {
	id, err := parseUintParam(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	var payload UserPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user entity.User
	if err := uc.db.First(&user, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	birthday, err := time.Parse(birthdayLayout, payload.Birthday)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid birthday format"})
		return
	}

	user.FirstNameTH = payload.FirstNameTH
	user.LastNameTH = payload.LastNameTH
	user.FirstNameEN = payload.FirstNameEN
	user.LastNameEN = payload.LastNameEN
	user.Email = payload.Email
	if payload.Password != "" {
		passwordHash, err := config.HashPassword(payload.Password)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
			return
		}
		user.Password = passwordHash
	}
	user.ProfileImageURL = payload.ProfileImageURL
	user.IDNumber = payload.IDNumber
	user.Phone = payload.Phone
	user.Birthday = birthday
	user.PDPAConsent = payload.PDPAConsent
	if payload.PDPAConsent {
		now := time.Now()
		user.PDPAConsentAt = &now
	} else {
		user.PDPAConsentAt = nil
	}
	user.AccountTypeID = payload.AccountTypeID
	user.IDDocTypeID = payload.IDDocTypeID

	if err := services.ValidateUser(&user); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := uc.db.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": user})
}

func (uc *UserController) DeleteUser(c *gin.Context) {
	id, err := parseUintParam(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	if err := uc.db.Delete(&entity.User{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func parseUintParam(value string) (uint, error) {
	id, err := strconv.ParseUint(value, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(id), nil
}

func getUserIDFromContext(c *gin.Context) (uint, bool) {
	userIDVal, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}

	userID, ok := userIDVal.(uint)
	if !ok {
		return 0, false
	}
	return userID, true
}

// CheckIDDuplicate verifies if a given id_number is already used by other users.
// Returns 409 if duplicate with specific error message, 200 if available.
func (uc *UserController) CheckIDDuplicate(c *gin.Context) {
	userID, ok := getUserIDFromContext(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user not found in context"})
		return
	}

	idNumber := c.Query("id_number")
	idTypeName := c.Query("id_type_name") // รับประเภทเอกสารมาด้วย

	if strings.TrimSpace(idNumber) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id_number is required"})
		return
	}

	if strings.TrimSpace(idTypeName) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id_type_name is required"})
		return
	}

	// ตรวจสอบว่ามีเลขเอกสารนี้ในระบบแล้วหรือไม่ (ไม่รวม user คนปัจจุบัน)
	var dup entity.User
	if err := uc.db.Where("id_number = ? AND id <> ?", idNumber, userID).First(&dup).Error; err == nil {
		// พบเอกสารซ้ำ - ส่ง error message ตามประเภทเอกสาร
		var errorMessage string
		switch strings.ToLower(idTypeName) {
		case "citizen_id", "บัตรประชาชน", "id card":
			errorMessage = "หมายเลขบัตรประชาชนนี้ถูกลงทะเบียนแล้ว"
		case "g_code", "g-code":
			errorMessage = "หมายเลข G-Code นี้ถูกลงทะเบียนแล้ว"
		case "passport", "หนังสือเดินทาง":
			errorMessage = "หมายเลขหนังสือเดินทางนี้ถูกลงทะเบียนแล้ว"
		default:
			errorMessage = "หมายเลขเอกสารนี้ถูกลงทะเบียนแล้ว"
		}

		c.JSON(http.StatusConflict, gin.H{
			"error":        errorMessage,
			"is_duplicate": true,
			"id_type_name": idTypeName,
		})
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// ไม่พบเอกสารซ้ำ - available
	c.JSON(http.StatusOK, gin.H{
		"unique":       true,
		"is_duplicate": false,
	})
}

func firstNonEmpty(values ...string) string {
	for _, v := range values {
		if strings.TrimSpace(v) != "" {
			return v
		}
	}
	return ""
}

func containsThai(value string) bool {
	for _, r := range value {
		if unicode.In(r, unicode.Thai) {
			return true
		}
	}
	return false
}
