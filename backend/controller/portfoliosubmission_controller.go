package controller

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type PortfolioSubmissionController struct {
	DB *gorm.DB
}

// ===================== CRUD พื้นฐาน =====================

func (c *PortfolioSubmissionController) Create(ctx *gin.Context) {
	// 1️⃣ รับเฉพาะ field ที่ frontend ส่งมา
	var body struct {
		PortfolioID uint `json:"portfolio_id"`
	}

	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 2️⃣ ดึง user_id จาก middleware (JWT)
	userIDAny, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	userID := userIDAny.(uint)

	// 3️⃣ หา version ล่าสุด
	var last entity.PortfolioSubmission
	version := 1
	err := c.DB.
		Where("portfolio_id = ? AND user_id = ?", body.PortfolioID, userID).
		Order("version desc").
		First(&last).Error

	if err == nil {
		version = last.Version + 1

		// ปิด current version ตัวเก่า
		c.DB.Model(&entity.PortfolioSubmission{}).
			Where("portfolio_id = ? AND user_id = ? AND is_current_version = ?", body.PortfolioID, userID, true).
			Update("is_current_version", false)
	}

	// 4️⃣ สร้าง submission ใหม่
	submission := entity.PortfolioSubmission{
		PortfolioID:     body.PortfolioID,
		UserID:          userID,
		Status:          "awaiting",
		Version:         version,
		Is_current_version:true,
		Submission_at:    time.Now(),
	}

	if err := c.DB.Create(&submission).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, submission)
}


func (c *PortfolioSubmissionController) GetAll(ctx *gin.Context) {
	var submissions []entity.PortfolioSubmission
	if err := c.DB.Preload("User").Preload("Portfolio").Find(&submissions).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, submissions)
}

func (c *PortfolioSubmissionController) GetByID(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var submission entity.PortfolioSubmission
	if err := c.DB.Preload("User").Preload("Portfolio").First(&submission, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	ctx.JSON(http.StatusOK, submission)
}

//อันนี้คือการแก้ไข submission ทั้งหมด
func (c *PortfolioSubmissionController) Update(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var submission entity.PortfolioSubmission
	if err := c.DB.First(&submission, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	if err := ctx.ShouldBindJSON(&submission); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.DB.Save(&submission)
	ctx.JSON(http.StatusOK, submission)
}

func (c *PortfolioSubmissionController) Delete(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	if err := c.DB.Delete(&entity.PortfolioSubmission{}, id).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// ===================== เพิ่มเติม =====================

// ดึงตามสถานะ
func (c *PortfolioSubmissionController) GetByStatus(ctx *gin.Context) {
	status := ctx.Param("status")
	var submissions []entity.PortfolioSubmission
	if err := c.DB.Preload("User").Preload("Portfolio").
		Where("status = ? AND is_current_version = ?", status, true).Find(&submissions).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, submissions)
}

// mark เป็น reviewed
func (c *PortfolioSubmissionController) MarkAsReviewed(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var submission entity.PortfolioSubmission
	if err := c.DB.Preload("User").Preload("Portfolio").First(&submission, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	submission.Status = "reviewed"
	now := time.Now()
	submission.ReviewedAt = &now
	if err := c.DB.Save(&submission).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, submission)
}

// mark เป็น approved
func (c *PortfolioSubmissionController) MarkAsApproved(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var submission entity.PortfolioSubmission
	if err := c.DB.Preload("User").Preload("Portfolio").First(&submission, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	submission.Status = "approved"
	now := time.Now()
	submission.ApprovedAt = &now
	if err := c.DB.Save(&submission).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, submission)
}

// update status โดยตรง
func (c *PortfolioSubmissionController) UpdateStatus(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var submission entity.PortfolioSubmission
	if err := c.DB.Preload("User").Preload("Portfolio").First(&submission, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var body struct {
		Status string `json:"status"`
	}
	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	submission.Status = body.Status
	if err := c.DB.Save(&submission).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, submission)
}