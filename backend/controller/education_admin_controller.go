package controller

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

// EducationAdminController handles CRUD for education reference data (levels, school types, curriculum types, schools).
type EducationAdminController struct {
	db *gorm.DB
}

func NewEducationAdminController(db *gorm.DB) *EducationAdminController {
	return &EducationAdminController{db: db}
}

// RegisterRoutes attaches admin-only endpoints under /admin/education.
func (ec *EducationAdminController) RegisterRoutes(protected *gin.RouterGroup) {
	admin := protected.Group("/admin/education")
	{
		admin.GET("/levels", ec.ListEducationLevels)
		admin.POST("/levels", ec.CreateEducationLevel)
		admin.PUT("/levels/:id", ec.UpdateEducationLevel)
		admin.DELETE("/levels/:id", ec.DeleteEducationLevel)

		admin.GET("/school-types", ec.ListSchoolTypes)
		admin.POST("/school-types", ec.CreateSchoolType)
		admin.PUT("/school-types/:id", ec.UpdateSchoolType)
		admin.DELETE("/school-types/:id", ec.DeleteSchoolType)

		admin.GET("/curriculum-types", ec.ListCurriculumTypes)
		admin.POST("/curriculum-types", ec.CreateCurriculumType)
		admin.PUT("/curriculum-types/:id", ec.UpdateCurriculumType)
		admin.DELETE("/curriculum-types/:id", ec.DeleteCurriculumType)

		admin.GET("/schools", ec.ListSchools)
		admin.POST("/schools", ec.CreateSchool)
		admin.PUT("/schools/:id", ec.UpdateSchool)
		admin.DELETE("/schools/:id", ec.DeleteSchool)
	}
}

// ===== Education Levels =====

func (ec *EducationAdminController) ListEducationLevels(ctx *gin.Context) {
	var items []entity.EducationLevel
	if err := ec.db.Order("name asc").Find(&items).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": items})
}

func (ec *EducationAdminController) CreateEducationLevel(ctx *gin.Context) {
	var payload struct {
		Name string `json:"name"`
	}
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	name := strings.TrimSpace(payload.Name)
	if name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	level := entity.EducationLevel{Name: name}
	if err := ec.db.Create(&level).Error; err != nil {
		ctx.JSON(resolveDBStatus(err), gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, gin.H{"data": level})
}

func (ec *EducationAdminController) UpdateEducationLevel(ctx *gin.Context) {
	id := ctx.Param("id")

	var payload struct {
		Name string `json:"name"`
	}
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	name := strings.TrimSpace(payload.Name)
	if name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	var level entity.EducationLevel
	if err := ec.db.First(&level, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "education level not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	level.Name = name
	if err := ec.db.Save(&level).Error; err != nil {
		ctx.JSON(resolveDBStatus(err), gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": level})
}

func (ec *EducationAdminController) DeleteEducationLevel(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := ec.db.Delete(&entity.EducationLevel{}, id).Error; err != nil {
		ctx.JSON(resolveDeleteStatus(err), gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// ===== School Types =====

func (ec *EducationAdminController) ListSchoolTypes(ctx *gin.Context) {
	var items []entity.SchoolType
	if err := ec.db.Order("name asc").Find(&items).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": items})
}

func (ec *EducationAdminController) CreateSchoolType(ctx *gin.Context) {
	var payload struct {
		Name string `json:"name"`
	}
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	name := strings.TrimSpace(payload.Name)
	if name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	item := entity.SchoolType{Name: name}
	if err := ec.db.Create(&item).Error; err != nil {
		ctx.JSON(resolveDBStatus(err), gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, gin.H{"data": item})
}

func (ec *EducationAdminController) UpdateSchoolType(ctx *gin.Context) {
	id := ctx.Param("id")
	var payload struct {
		Name string `json:"name"`
	}
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	name := strings.TrimSpace(payload.Name)
	if name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	var item entity.SchoolType
	if err := ec.db.First(&item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "school type not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	item.Name = name
	if err := ec.db.Save(&item).Error; err != nil {
		ctx.JSON(resolveDBStatus(err), gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": item})
}

func (ec *EducationAdminController) DeleteSchoolType(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := ec.db.Delete(&entity.SchoolType{}, id).Error; err != nil {
		ctx.JSON(resolveDeleteStatus(err), gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// ===== Curriculum Types =====

func (ec *EducationAdminController) ListCurriculumTypes(ctx *gin.Context) {
	schoolTypeID := parseIntWithDefault(ctx.Query("school_type_id"), 0)

	q := ec.db.Preload("SchoolType").Order("name asc")
	if schoolTypeID > 0 {
		q = q.Where("school_type_id = ? OR school_type_id IS NULL", schoolTypeID)
	}

	var items []entity.CurriculumType
	if err := q.Find(&items).Error; err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": items})
}

func (ec *EducationAdminController) CreateCurriculumType(ctx *gin.Context) {
	var payload struct {
		Name         string `json:"name"`
		SchoolTypeID *uint  `json:"school_type_id"`
	}
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	name := strings.TrimSpace(payload.Name)
	if name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	item := entity.CurriculumType{
		Name:         name,
		SchoolTypeID: normalizeOptionalID(payload.SchoolTypeID),
	}

	if err := ec.db.Create(&item).Error; err != nil {
		ctx.JSON(resolveDBStatus(err), gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, gin.H{"data": item})
}

func (ec *EducationAdminController) UpdateCurriculumType(ctx *gin.Context) {
	id := ctx.Param("id")
	var payload struct {
		Name         string `json:"name"`
		SchoolTypeID *uint  `json:"school_type_id"`
	}
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	name := strings.TrimSpace(payload.Name)
	if name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	var item entity.CurriculumType
	if err := ec.db.First(&item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "curriculum type not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	item.Name = name
	item.SchoolTypeID = normalizeOptionalID(payload.SchoolTypeID)
	if err := ec.db.Save(&item).Error; err != nil {
		ctx.JSON(resolveDBStatus(err), gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": item})
}

func (ec *EducationAdminController) DeleteCurriculumType(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := ec.db.Delete(&entity.CurriculumType{}, id).Error; err != nil {
		ctx.JSON(resolveDeleteStatus(err), gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// ===== Schools =====

func (ec *EducationAdminController) ListSchools(ctx *gin.Context) {
	search := strings.TrimSpace(ctx.Query("search"))
	searchLower := strings.ToLower(search)

	limit := parseIntWithDefault(ctx.Query("limit"), 50)
	if limit <= 0 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	offset := parseIntWithDefault(ctx.Query("offset"), 0)
	if offset < 0 {
		offset = 0
	}

	schoolTypeID := parseIntWithDefault(ctx.Query("school_type_id"), 0)
	isProjectBasedParam := strings.TrimSpace(ctx.Query("is_project_based"))
	var filterProject *bool
	if isProjectBasedParam != "" {
		switch strings.ToLower(isProjectBasedParam) {
		case "true", "1":
			t := true
			filterProject = &t
		case "false", "0":
			f := false
			filterProject = &f
		}
	}

	q := ec.db.Model(&entity.School{}).
		Preload("SchoolType").
		Order("name asc").
		Limit(limit).
		Offset(offset)

	if searchLower != "" {
		like := "%" + searchLower + "%"
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
	countQ := ec.db.Model(&entity.School{})
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
	})
}

func (ec *EducationAdminController) CreateSchool(ctx *gin.Context) {
	var payload struct {
		Code           string `json:"code"`
		Name           string `json:"name"`
		SchoolTypeID   uint   `json:"school_type_id"`
		IsProjectBased *bool  `json:"is_project_based"`
	}
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	name := strings.TrimSpace(payload.Name)
	if name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	if payload.SchoolTypeID == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "school_type_id is required"})
		return
	}

	isProject := false
	if payload.IsProjectBased != nil {
		isProject = *payload.IsProjectBased
	}

	item := entity.School{
		Code:           strings.TrimSpace(payload.Code),
		Name:           name,
		SchoolTypeID:   payload.SchoolTypeID,
		IsProjectBased: isProject,
	}

	if err := ec.db.Create(&item).Error; err != nil {
		ctx.JSON(resolveDBStatus(err), gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusCreated, gin.H{"data": item})
}

func (ec *EducationAdminController) UpdateSchool(ctx *gin.Context) {
	id := ctx.Param("id")
	var payload struct {
		Code           string `json:"code"`
		Name           string `json:"name"`
		SchoolTypeID   uint   `json:"school_type_id"`
		IsProjectBased *bool  `json:"is_project_based"`
	}
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	name := strings.TrimSpace(payload.Name)
	if name == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	if payload.SchoolTypeID == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "school_type_id is required"})
		return
	}

	var item entity.School
	if err := ec.db.First(&item, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "school not found"})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	item.Code = strings.TrimSpace(payload.Code)
	item.Name = name
	item.SchoolTypeID = payload.SchoolTypeID
	if payload.IsProjectBased != nil {
		item.IsProjectBased = *payload.IsProjectBased
	}

	if err := ec.db.Save(&item).Error; err != nil {
		ctx.JSON(resolveDBStatus(err), gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"data": item})
}

func (ec *EducationAdminController) DeleteSchool(ctx *gin.Context) {
	id := ctx.Param("id")
	if err := ec.db.Delete(&entity.School{}, id).Error; err != nil {
		ctx.JSON(resolveDeleteStatus(err), gin.H{"error": err.Error()})
		return
	}
	ctx.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// Helpers

func normalizeOptionalID(id *uint) *uint {
	if id == nil || *id == 0 {
		return nil
	}
	return id
}

func resolveDBStatus(err error) int {
	if err == nil {
		return http.StatusOK
	}
	errMsg := strings.ToLower(err.Error())
	if errors.Is(err, gorm.ErrDuplicatedKey) || strings.Contains(errMsg, "duplicate") || strings.Contains(errMsg, "unique") {
		return http.StatusBadRequest
	}
	return http.StatusInternalServerError
}

func resolveDeleteStatus(err error) int {
	if err == nil {
		return http.StatusOK
	}
	errMsg := strings.ToLower(err.Error())
	if strings.Contains(errMsg, "constraint") || strings.Contains(errMsg, "foreign key") {
		return http.StatusBadRequest
	}
	return http.StatusInternalServerError
}
