package controller

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

type WorkingController struct{}

func NewWorkingController() *WorkingController {
	return &WorkingController{}
}

// CreateWorking
func (wc *WorkingController) CreateWorking(c *gin.Context) {
	var working entity.Working

	// Bind JSON to working struct
	if err := c.ShouldBindJSON(&working); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.GetDB()

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Safely assert type
	if v, ok := userID.(uint); ok {
		working.UserID = v
	} else if v, ok := userID.(float64); ok {
		working.UserID = uint(v)
	} else {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "invalid user id type"})
		return
	}

	// Create the working (and associated detail if struct is set up right)
	if err := db.Create(&working).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": working})
}

// GetWorking
func (wc *WorkingController) GetWorking(c *gin.Context) {
	id := c.Param("id")
	var working entity.Working

	db := config.GetDB()
	if err := db.Preload("WorkingDetail").
		Preload("WorkingDetail.TypeWorking").
		Preload("WorkingDetail.Images").
		Preload("WorkingDetail.Links").
		Preload("User").
		First(&working, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Working not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": working})
}

// ListWorkings - OPTIMIZED with pagination
// Query params: ?page=1&limit=20&include_images=false
func (wc *WorkingController) ListWorkings(c *gin.Context) {
	db := config.GetDB()

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

	var workings []entity.Working
	var total int64

	db.Model(&entity.Working{}).Count(&total)

	query := db.Preload("WorkingDetail").
		Preload("WorkingDetail.TypeWorking")

	// Only preload images/links if explicitly requested
	if includeImages {
		query = query.Preload("WorkingDetail.Images").Preload("WorkingDetail.Links")
	}

	if err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&workings).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":       workings,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

// UpdateWorking
func (wc *WorkingController) UpdateWorking(c *gin.Context) {
	id := c.Param("id")
	var working entity.Working

	db := config.GetDB()
	if err := db.First(&working, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Working not found"})
		return
	}

	if err := c.ShouldBindJSON(&working); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.Save(&working).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": working})
}

// DeleteWorking
func (wc *WorkingController) DeleteWorking(c *gin.Context) {
	id := c.Param("id")
	db := config.GetDB()

	if err := db.Delete(&entity.Working{}, id).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": "id deleted"})
}

// ListTypeWorkings
func (wc *WorkingController) ListTypeWorkings(c *gin.Context) {
	var types []entity.TypeWorking

	db := config.GetDB()
	if err := db.Find(&types).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, types)
}

// ListWorkingsByUser lists all workings for a specific user - OPTIMIZED with pagination
func (wc *WorkingController) ListWorkingsByUser(c *gin.Context) {
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

	var workings []entity.Working
	var total int64

	db.Model(&entity.Working{}).Where("user_id = ?", userId).Count(&total)

	query := db.Preload("WorkingDetail").
		Preload("WorkingDetail.TypeWorking").
		Where("user_id = ?", userId)

	if includeImages {
		query = query.Preload("WorkingDetail.Images").Preload("WorkingDetail.Links")
	}

	if err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&workings).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":       workings,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}
