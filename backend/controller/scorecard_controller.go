package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type ScorecardController struct {
	DB *gorm.DB
}

func (c *ScorecardController) Create(ctx *gin.Context) {
	userIDAny, exists := ctx.Get("user_id")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "user not authenticated"})
		return
	}
	userID := userIDAny.(uint)

	var scorecard entity.Scorecard
	if err := ctx.ShouldBindJSON(&scorecard); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	scorecard.ID = 0
	scorecard.UserID = userID
	for i := range scorecard.ScoreCriteria {
		scorecard.ScoreCriteria[i].ID = 0
	}

	// คำนวณ total_score
	var totalScore float64
	for _, c := range scorecard.ScoreCriteria {
		totalScore += (c.Score * c.Weight_Percent) / 100.0
	}
	scorecard.Total_Score = totalScore
	scorecard.Max_Score = 100

	// ✅ ใช้ Transaction
	tx := c.DB.Begin()
	
	if err := tx.Omit("ScoreCriteria.*").Create(&scorecard).Error; err != nil {
		tx.Rollback()
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// สร้าง Criteria แต่ละตัว
	for i := range scorecard.ScoreCriteria {
		scorecard.ScoreCriteria[i].ID = 0
		scorecard.ScoreCriteria[i].ScorecardID = scorecard.ID

		if err := tx.Create(&scorecard.ScoreCriteria[i]).Error; err != nil {
			tx.Rollback()
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	tx.Commit()

	// Reload พร้อม criteria
	c.DB.Preload("ScoreCriteria").First(&scorecard, scorecard.ID)
	ctx.JSON(http.StatusCreated, scorecard)
}

func (c *ScorecardController) Update(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var scorecard entity.Scorecard
	if err := c.DB.Preload("ScoreCriteria").First(&scorecard, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}

	var body struct {
		General_Comment string                   `json:"general_comment"`
		ScoreCriteria   []entity.ScoreCriteria   `json:"score_criteria"`
	}
	if err := ctx.ShouldBindJSON(&body); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update scorecard
	scorecard.General_Comment = body.General_Comment

	// คำนวณ total_score
	var totalScore float64
	for _, c := range body.ScoreCriteria {
		totalScore += (c.Score * c.Weight_Percent) / 100.0
	}
	scorecard.Total_Score = totalScore

	// ✅ สร้าง map ของ criteria ที่มีอยู่แล้ว
	existingCriteria := make(map[uint]bool)
	for _, crit := range scorecard.ScoreCriteria {
		existingCriteria[crit.ID] = true
	}

	// ✅ Update criteria
	for _, newCrit := range body.ScoreCriteria {
		if newCrit.ID == 0 {
			// CREATE ใหม่
			newCrit.ScorecardID = scorecard.ID
			if err := c.DB.Create(&newCrit).Error; err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		} else if existingCriteria[newCrit.ID] {
			// UPDATE (ตรวจสอบว่ามี ID นี้จริงใน scorecard)
			if err := c.DB.Model(&entity.ScoreCriteria{}).
				Where("id = ? AND scorecard_id = ?", newCrit.ID, scorecard.ID).
				Updates(map[string]interface{}{
					"criteria_number": newCrit.Criteria_Number,
					"criteria_name":   newCrit.Criteria_Name,
					"max_score":       newCrit.Max_Score,
					"score":           newCrit.Score,
					"weight_percent":  newCrit.Weight_Percent,
					"comment":         newCrit.Comment,
					"order_index":     newCrit.Order_index,
				}).Error; err != nil {
				ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
		}
	}

	if err := c.DB.Save(&scorecard).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload ข้อมูลให้ตรงกับ DB
	c.DB.Preload("ScoreCriteria").First(&scorecard, id)
	ctx.JSON(http.StatusOK, scorecard)
}

func (c *ScorecardController) GetAll(ctx *gin.Context) {
	var scorecards []entity.Scorecard
	if err := c.DB.Preload("User").Preload("PortfolioSubmission").Find(&scorecards).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, scorecards)
}

func (c *ScorecardController) GetByID(ctx *gin.Context) {
	id, _ := strconv.Atoi(ctx.Param("id"))
	var scorecard entity.Scorecard
	if err := c.DB.Preload("User").Preload("PortfolioSubmission").First(&scorecard, id).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	ctx.JSON(http.StatusOK, scorecard)
}


func (c *ScorecardController) GetBySubmissionID(ctx *gin.Context) {
	submissionID, _ := strconv.Atoi(ctx.Param("id"))
	var scorecard entity.Scorecard
	if err := c.DB.Where("portfolio_submission_id = ?", submissionID).
		Preload("User").
		Preload("PortfolioSubmission").
		Preload("ScoreCriteria"). 
		First(&scorecard).Error; err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	ctx.JSON(http.StatusOK, scorecard)
}

