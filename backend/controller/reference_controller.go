package controller

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type ReferenceController struct {
	DB *gorm.DB
}

func NewReferenceController(db *gorm.DB) *ReferenceController {
	return &ReferenceController{DB: db}
}

func (rc *ReferenceController) GetEducationLevels(ctx *gin.Context) {
	var items []entity.EducationLevel
	if err := rc.DB.Order("name asc").Find(&items).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"items": items})
}

func (rc *ReferenceController) GetSchoolTypes(ctx *gin.Context) {
	var items []entity.SchoolType
	if err := rc.DB.Order("name asc").Find(&items).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"items": items})
}

func (rc *ReferenceController) GetCurriculumTypes(ctx *gin.Context) {
	var items []entity.CurriculumType
	schoolTypeID := parseIntWithDefault(ctx.Query("school_type_id"), 0)

	q := rc.DB.Model(&entity.CurriculumType{}).Order("name asc")
	if schoolTypeID > 0 {
		q = q.Where("school_type_id = ? OR school_type_id IS NULL", schoolTypeID)
	}

	if err := q.Find(&items).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"items": items})
}

// GET /reference/schools?search=...&limit=...&offset=...
func (rc *ReferenceController) SearchSchools(ctx *gin.Context) {
	search := strings.TrimSpace(ctx.Query("search"))
	searchLower := strings.ToLower(search)

	limit := parseIntWithDefault(ctx.Query("limit"), 20)
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	offset := parseIntWithDefault(ctx.Query("offset"), 0)
	if offset < 0 {
		offset = 0
	}

	schoolTypeID := parseIntWithDefault(ctx.Query("school_type_id"), 0)
	isProjectBasedParam := strings.TrimSpace(ctx.Query("is_project_based"))
	var filterProject *bool
	if isProjectBasedParam != "" {
		val := strings.ToLower(isProjectBasedParam)
		if val == "true" || val == "1" {
			trueVal := true
			filterProject = &trueVal
		} else if val == "false" || val == "0" {
			falseVal := false
			filterProject = &falseVal
		}
	}

	q := rc.DB.Model(&entity.School{}).
		Preload("SchoolType").
		Order("name asc").
		Limit(limit).
		Offset(offset)

	if searchLower != "" {
		like := "%" + searchLower + "%"
		// DB-agnostic search
		q = q.Where("LOWER(name) LIKE ? OR LOWER(code) LIKE ?", like, like)
	}
	if schoolTypeID > 0 {
		q = q.Where("school_type_id = ?", schoolTypeID)
	}
	if filterProject != nil {
		q = q.Where("is_project_based = ?", *filterProject)
	}

	var items []entity.School
	if err := q.Find(&items).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var total int64
	countQ := rc.DB.Model(&entity.School{})
	if searchLower != "" {
		like := "%" + searchLower + "%"
		countQ = countQ.Where("LOWER(name) LIKE ? OR LOWER(code) LIKE ?", like, like)
	}
	if schoolTypeID > 0 {
		countQ = countQ.Where("school_type_id = ?", schoolTypeID)
	}
	if filterProject != nil {
		countQ = countQ.Where("is_project_based = ?", *filterProject)
	}
	if err := countQ.Count(&total).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"items":  items,
		"total":  total,
		"limit":  limit,
		"offset": offset,
		"search": search,
	})
}

func parseIntWithDefault(v string, def int) int {
	v = strings.TrimSpace(v)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}
