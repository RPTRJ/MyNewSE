package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type FeedbackController struct {
	DB *gorm.DB
}

func (c *FeedbackController) Create(ctx *gin.Context) {
	// 1️⃣ ดึง user_id จาก JWT middleware
	userIDAny, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	userID := userIDAny.(uint)

	// 2️⃣ รับข้อมูลจาก frontend
	var feedback entity.Feedback
	if err := ctx.ShouldBindJSON(&feedback); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 3️⃣ กำหนด UserID ให้ feedback (คนที่ให้ feedback = teacher/reviewer)
	feedback.UserID = userID

	// 4️⃣ บันทึกลง database
	if err := c.DB.Create(&feedback).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, feedback)
}

func (c *FeedbackController) GetAll(ctx *gin.Context) {
	var feedbacks []entity.Feedback
	if err := c.DB.Preload("User").Preload("PortfolioSubmission").Find(&feedbacks).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, feedbacks)
}

func (c *FeedbackController) GetByID(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var feedback entity.Feedback
	if err := c.DB.Preload("User").Preload("PortfolioSubmission").First(&feedback, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	ctx.JSON(http.StatusOK, feedback)
}


func (c *FeedbackController) GetBySubmissionID(ctx *gin.Context) {
	submissionID, _ := strconv.Atoi(ctx.Param("id"))
	var feedback entity.Feedback
	if err := c.DB.Where("portfolio_submission_id = ?", submissionID).
		Preload("User").Preload("PortfolioSubmission").
		First(&feedback).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	ctx.JSON(http.StatusOK, feedback)
}

func (c *FeedbackController) Update(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var feedback entity.Feedback
	if err := c.DB.First(&feedback, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var body struct {
		OverallComment        string `json:"overall_comment"`
		Strengths             string `json:"strengths"`
		AreasForImprovement   string `json:"areas_for_improvement"`
	}
	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	feedback.Overall_comment = body.OverallComment
	feedback.Strengths = body.Strengths
	feedback.Areas_for_improvement = body.AreasForImprovement

	if err := c.DB.Save(&feedback).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, feedback)
}