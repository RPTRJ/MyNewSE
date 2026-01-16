package controller

import (
	"errors"
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
    var body struct {
        PortfolioID uint `json:"portfolio_id"`
    }

    if err := ctx.ShouldBindJSON(&body); err != nil {
        ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    userIDAny, _ := ctx.Get("user_id")
    userID := userIDAny.(uint)

    err := c.DB.Transaction(func(tx *gorm.DB) error {
        // หา current submission ล่าสุดของ portfolio นี้
        var current entity.PortfolioSubmission
        err := tx.
            Where("portfolio_id = ? AND user_id = ?", body.PortfolioID, userID).
            Order("version desc").
            First(&current).Error
        if errors.Is(err, gorm.ErrRecordNotFound) {
            // ไม่มี submission เก่า สร้างใหม่ version 1
            submission := entity.PortfolioSubmission{
                PortfolioID:   body.PortfolioID,
                UserID:        userID,
                Status:        "awaiting_review",
                Version:       1,
                Submission_at: time.Now(),
            }
            return tx.Create(&submission).Error
        }
        if err != nil {
            return err
        }

        // อัพเดต status และ version ของ submission ล่าสุด
        current.Status = "awaiting_review"
        current.Version = current.Version + 1
        current.Submission_at = time.Now()

        return tx.Save(&current).Error
    })

    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // ส่ง response ว่าอัพเดทสำเร็จ (ไม่มี submission object ใหม่ให้ return)
    ctx.JSON(201, gin.H{
        "message": "Portfolio submission updated successfully",
    })
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

// อันนี้คือการแก้ไข submission ทั้งหมด
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
		Where("status = ? ", status, true).Find(&submissions).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, submissions)
}

func (c *PortfolioSubmissionController) GetByPortfolio(ctx *gin.Context) {
    portfolioID, _ := strconv.Atoi(ctx.Param("id"))

    var submissions []entity.PortfolioSubmission
    err := c.DB.
        Preload("User").
        Preload("Portfolio").
        Where("portfolio_id = ?", portfolioID).
        Order("submission_at DESC").
        Find(&submissions).Error

    if err != nil {
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
    if err := c.DB.First(&submission, id).Error; err != nil {
        ctx.JSON(404, gin.H{"error": "submission not found"})
        return
    }

    //  ตรวจว่ามี scorecard หรือไม่
    var scorecard entity.Scorecard
    if err := c.DB.Where("portfolio_submission_id = ?", submission.ID).
        First(&scorecard).Error; err != nil {

        ctx.JSON(400, gin.H{
            "error": "cannot approve without scorecard",
        })
        return
    }

    submission.Status = "approved"
    now := time.Now()
    submission.ApprovedAt = &now

    c.DB.Save(&submission)
    ctx.JSON(200, submission)
}

func (c *PortfolioSubmissionController) ApproveWithScorecard(ctx *gin.Context) {
    id, _ := strconv.Atoi(ctx.Param("id"))

    var submission entity.PortfolioSubmission
    if err := c.DB.First(&submission, id).Error; err != nil {
        ctx.JSON(404, gin.H{"error": "submission not found"})
        return
    }

    var body struct {
        Scorecard entity.Scorecard `json:"scorecard"`
        Feedback  entity.Feedback  `json:"feedback"`
    }

    if err := ctx.ShouldBindJSON(&body); err != nil {
        ctx.JSON(400, gin.H{"error": err.Error()})
        return
    }

    tx := c.DB.Begin()

    // bind submission id
    body.Scorecard.PortfolioSubmissionID = submission.ID
    body.Feedback.PortfolioSubmissionID = submission.ID

    // create scorecard
    if err := tx.Create(&body.Scorecard).Error; err != nil {
        tx.Rollback()
        ctx.JSON(500, gin.H{"error": err.Error()})
        return
    }

    // create criteria
    for i := range body.Scorecard.ScoreCriteria {
        body.Scorecard.ScoreCriteria[i].ScorecardID = body.Scorecard.ID
        if err := tx.Create(&body.Scorecard.ScoreCriteria[i]).Error; err != nil {
            tx.Rollback()
            return
        }
    }

    // create feedback
    if err := tx.Create(&body.Feedback).Error; err != nil {
        tx.Rollback()
        return
    }

    // approve
    submission.Status = "approved"
    now := time.Now()
    submission.ApprovedAt = &now

    if err := tx.Save(&submission).Error; err != nil {
        tx.Rollback()
        return
    }

    tx.Commit()
    ctx.JSON(200, submission)
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

func (c *PortfolioSubmissionController) GetPending(ctx *gin.Context) {
    var submissions []entity.PortfolioSubmission
    err := c.DB.
        Where("status = ?", "awaiting_review").
        Preload("User").
        Preload("Portfolio").
        Order("submission_at desc").
        Find(&submissions).Error
    
    if err != nil {
        ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }
    
    ctx.JSON(http.StatusOK, submissions)
}