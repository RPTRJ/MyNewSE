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
    userIDAny, _ := ctx.Get("user_id")
    userID := userIDAny.(uint)

    var body struct {
        PortfolioSubmissionID uint                     `json:"portfolio_submission_id"`
        GeneralComment        string                   `json:"general_comment"`
        ScoreCriteria         []entity.ScoreCriteria   `json:"score_criteria"`
    }

    if err := ctx.ShouldBindJSON(&body); err != nil {
        ctx.JSON(400, gin.H{"error": err.Error()})
        return
    }

    scorecard := entity.Scorecard{
        PortfolioSubmissionID: body.PortfolioSubmissionID,
        General_Comment:       body.GeneralComment,
        UserID:               userID,
        Max_Score:            100,
    }

    // calc total
    var total float64
    for _, c := range body.ScoreCriteria {
        total += c.Score
    }
    scorecard.Total_Score = total

    tx := c.DB.Begin()

    if err := tx.Create(&scorecard).Error; err != nil {
        tx.Rollback()
        ctx.JSON(500, gin.H{"error": err.Error()})
        return
    }

    for i := range body.ScoreCriteria {
        body.ScoreCriteria[i].ScorecardID = scorecard.ID
        body.ScoreCriteria[i].ID = 0
        if err := tx.Create(&body.ScoreCriteria[i]).Error; err != nil {
            tx.Rollback()
            return
        }
    }

    tx.Commit()

    c.DB.Preload("ScoreCriteria").First(&scorecard, scorecard.ID)
    ctx.JSON(201, scorecard)
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
		totalScore += c.Score
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
	if err := c.DB.Preload("User").Preload("PortfolioSubmission").First(&scorecards).Error; err != nil {
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

