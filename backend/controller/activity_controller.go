package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

type ActivityController struct{}

func NewActivityController() *ActivityController {
	return &ActivityController{}
}

// CreateActivity creates a new activity with nested details
func (ac *ActivityController) CreateActivity(c *gin.Context) {
	var activity entity.Activity

	if err := c.ShouldBindJSON(&activity); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.GetDB()

	// get user_id from context (set by middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Safely assert type
	if v, ok := userID.(uint); ok {
		activity.UserID = v
	} else if v, ok := userID.(float64); ok {
		activity.UserID = uint(v)
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user id type"})
		return
	}

	// Create activity
	if err := db.Create(&activity).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": activity})
}

// GetActivity gets a single activity by ID
func (ac *ActivityController) GetActivity(c *gin.Context) {
	var activity entity.Activity
	id := c.Param("id")
	db := config.GetDB()

	if err := db.Preload("ActivityDetail").
		Preload("ActivityDetail.TypeActivity").
		Preload("ActivityDetail.LevelActivity").
		Preload("ActivityDetail.Images").
		Preload("Reward"). // Note: Reward is directly on Activity, not Detail, based on entity definition
		Preload("User").
		First(&activity, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Activity not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": activity})
}

// ListActivities lists all activities for the authenticated user - OPTIMIZED with pagination
// Query params: ?page=1&limit=20&include_images=false
func (ac *ActivityController) ListActivities(c *gin.Context) {
	db := config.GetDB()

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	includeImages := c.DefaultQuery("include_images", "false") == "true"

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var activities []entity.Activity
	var total int64

	db.Model(&entity.Activity{}).Where("user_id = ?", userID).Count(&total)

	query := db.Preload("ActivityDetail").
		Preload("ActivityDetail.TypeActivity").
		Preload("ActivityDetail.LevelActivity").
		Preload("Reward").
		Where("user_id = ?", userID)

	// Only preload images if explicitly requested
	if includeImages {
		query = query.Preload("ActivityDetail.Images")
	}

	if err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&activities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":       activities,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

// UpdateActivity updates an existing activity
func (ac *ActivityController) UpdateActivity(c *gin.Context) {
	var activity entity.Activity
	id := c.Param("id")
	db := config.GetDB()

	// Check if activity exists
	if err := db.First(&activity, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Activity not found"})
		return
	}

	// Bind new data
	var input entity.Activity
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	activity.ActivityName = input.ActivityName
	activity.RewardID = input.RewardID

	// Update ActivityDetail if provided
	if input.ActivityDetail != nil {
		// If existing detail exists, update it
		if activity.ActivityDetailID != 0 {
			var detail entity.ActivityDetail
			if err := db.First(&detail, activity.ActivityDetailID).Error; err == nil {
				detail.ActivityAt = input.ActivityDetail.ActivityAt
				detail.Institution = input.ActivityDetail.Institution
				detail.Description = input.ActivityDetail.Description
				detail.TypeActivityID = input.ActivityDetail.TypeActivityID
				detail.LevelActivityID = input.ActivityDetail.LevelActivityID

				// Delete existing images
				db.Delete(&entity.ActivityImage{}, "activity_detail_id = ?", detail.ID)

				// Assign new images
				detail.Images = input.ActivityDetail.Images

				// Save detail
				db.Save(&detail)
			}
		} else {
			// If not exists (shouldn't happen for valid activity), create one?
			// Simpler to just assume it updates if we are using Full Update logic,
			// but GORM association update can be tricky.
			// Let's use GORM's association mode or just update explicitly.
			activity.ActivityDetail = input.ActivityDetail
		}
	}

	if err := db.Save(&activity).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": activity})
}

// DeleteActivity deletes an activity
func (ac *ActivityController) DeleteActivity(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()

	if err := db.Delete(&entity.Activity{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": "success"})
}

// ListTypeActivities lists all type activities
func (ac *ActivityController) ListTypeActivities(c *gin.Context) {
	var types []entity.TypeActivity
	if err := config.GetDB().Find(&types).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, types)
}

// ListLevelActivities lists all level activities
func (ac *ActivityController) ListLevelActivities(c *gin.Context) {
	var levels []entity.LevelActivity
	if err := config.GetDB().Find(&levels).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, levels)
}

// ListRewards lists all rewards
func (ac *ActivityController) ListRewards(c *gin.Context) {
	var rewards []entity.Reward
	if err := config.GetDB().Find(&rewards).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, rewards)
}

// fueng add list เพื่อดึงข้อมูล - OPTIMIZED with pagination
func (ac *ActivityController) ListActivitiesByUser(c *gin.Context) {
	userId := c.Param("userId")
	db := config.GetDB()

	// Pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	includeImages := c.DefaultQuery("include_images", "true") == "true"

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset := (page - 1) * limit

	var activities []entity.Activity
	var total int64

	db.Model(&entity.Activity{}).Where("user_id = ?", userId).Count(&total)

	query := db.Preload("ActivityDetail").
		Preload("ActivityDetail.TypeActivity").
		Preload("ActivityDetail.LevelActivity").
		Preload("Reward").
		Where("user_id = ?", userId)

	if includeImages {
		query = query.Preload("ActivityDetail.Images")
	}

	if err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&activities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":       activities,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}
