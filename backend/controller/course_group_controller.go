package controller

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type CourseGroupController struct {
	db *gorm.DB
}

func NewCourseGroupController() *CourseGroupController {
	return &CourseGroupController{
		db: config.GetDB(),
	}
}

// RegisterRoutes registers all course group related routes
func (cgc *CourseGroupController) RegisterRoutes(r *gin.Engine, protected *gin.RouterGroup) {
	// Public routes - สำหรับนักเรียนดูข้อมูล
	public := r.Group("/course-groups")
	{
		public.GET("", cgc.ListCourseGroups)
		public.GET("/:id", cgc.GetCourseGroupByID)
	}

	// Public skills route - สำหรับดูรายการทักษะ
	r.GET("/skills", cgc.ListAllSkills)

	// Protected routes - สำหรับ admin จัดการ
	admin := protected.Group("/admin/course-groups")
	{
		admin.GET("", cgc.ListCourseGroups)
		admin.POST("", cgc.CreateCourseGroup)
		admin.PUT("/:id", cgc.UpdateCourseGroup)
		admin.DELETE("/:id", cgc.DeleteCourseGroup)

		// Course Group Skills
		admin.GET("/:id/skills", cgc.ListCourseGroupSkills)
		admin.POST("/:id/skills", cgc.AddSkillToCourseGroup)
		admin.PUT("/:id/skills/:skillId", cgc.UpdateCourseGroupSkill)
		admin.DELETE("/:id/skills/:skillId", cgc.RemoveSkillFromCourseGroup)
	}

	// Protected skill management routes
	skillAdmin := protected.Group("/admin/skills")
	{
		skillAdmin.GET("", cgc.ListAllSkills)
		skillAdmin.POST("", cgc.CreateSkill)
		skillAdmin.PUT("/:id", cgc.UpdateSkill)
		skillAdmin.DELETE("/:id", cgc.DeleteSkill)
	}
}

// ==================== Payloads ====================

type courseGroupPayload struct {
	Name        string `json:"name" binding:"required"`
	NameEN      string `json:"name_en"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	IsActive    *bool  `json:"is_active"`
}

type courseGroupSkillPayload struct {
	SkillID     uint   `json:"skill_id" binding:"required"`
	Importance  int    `json:"importance"`
	Description string `json:"description"`
}

// ==================== CourseGroup Handlers ====================

// ListCourseGroups returns all course groups with their skills
func (cgc *CourseGroupController) ListCourseGroups(c *gin.Context) {
	var courseGroups []entity.CourseGroup

	query := cgc.db.
		Preload("CourseGroupSkills.Skill").
		Order("id asc")

	// Filter by active status if provided
	switch activeParam := c.Query("active"); activeParam {
	case "true":
		query = query.Where("is_active = ?", true)
	case "false":
		query = query.Where("is_active = ?", false)
	}

	if err := query.Find(&courseGroups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": courseGroups})
}

// GetCourseGroupByID returns a single course group with all related data
func (cgc *CourseGroupController) GetCourseGroupByID(c *gin.Context) {
	id := c.Param("id")

	var courseGroup entity.CourseGroup
	if err := cgc.db.
		Preload("CourseGroupSkills.Skill").
		First(&courseGroup, id).Error; err != nil {

		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "course group not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": courseGroup})
}

// CreateCourseGroup creates a new course group
func (cgc *CourseGroupController) CreateCourseGroup(c *gin.Context) {
	var payload courseGroupPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	isActive := true
	if payload.IsActive != nil {
		isActive = *payload.IsActive
	}

	courseGroup := entity.CourseGroup{
		Name:        strings.TrimSpace(payload.Name),
		NameEN:      strings.TrimSpace(payload.NameEN),
		Description: strings.TrimSpace(payload.Description),
		Icon:        strings.TrimSpace(payload.Icon),
		IsActive:    isActive,
	}

	if err := cgc.db.Create(&courseGroup).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": courseGroup})
}

// UpdateCourseGroup updates an existing course group
func (cgc *CourseGroupController) UpdateCourseGroup(c *gin.Context) {
	id := c.Param("id")

	var courseGroup entity.CourseGroup
	if err := cgc.db.First(&courseGroup, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "course group not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var payload courseGroupPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	courseGroup.Name = strings.TrimSpace(payload.Name)
	courseGroup.NameEN = strings.TrimSpace(payload.NameEN)
	courseGroup.Description = strings.TrimSpace(payload.Description)
	courseGroup.Icon = strings.TrimSpace(payload.Icon)
	if payload.IsActive != nil {
		courseGroup.IsActive = *payload.IsActive
	}

	if err := cgc.db.Save(&courseGroup).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": courseGroup})
}

// DeleteCourseGroup deletes a course group and its related skills
func (cgc *CourseGroupController) DeleteCourseGroup(c *gin.Context) {
	id := c.Param("id")

	err := cgc.db.Transaction(func(tx *gorm.DB) error {
		// Delete related CourseGroupSkills first
		if err := tx.Where("course_group_id = ?", id).Delete(&entity.CourseGroupSkill{}).Error; err != nil {
			return err
		}

		// Delete related CurriculumCourseGroups
		if err := tx.Where("course_group_id = ?", id).Delete(&entity.CurriculumCourseGroup{}).Error; err != nil {
			return err
		}

		// Delete the course group
		if err := tx.Delete(&entity.CourseGroup{}, id).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}

// ==================== CourseGroupSkill Handlers ====================

// ListCourseGroupSkills returns all skills for a course group
func (cgc *CourseGroupController) ListCourseGroupSkills(c *gin.Context) {
	courseGroupID := c.Param("id")

	var skills []entity.CourseGroupSkill
	if err := cgc.db.
		Preload("Skill").
		Where("course_group_id = ?", courseGroupID).
		Order("importance desc").
		Find(&skills).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": skills})
}

// AddSkillToCourseGroup adds a skill to a course group
func (cgc *CourseGroupController) AddSkillToCourseGroup(c *gin.Context) {
	courseGroupID := c.Param("id")

	// Verify course group exists
	var courseGroup entity.CourseGroup
	if err := cgc.db.First(&courseGroup, courseGroupID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "course group not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var payload courseGroupSkillPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify skill exists
	var skill entity.Skill
	if err := cgc.db.First(&skill, payload.SkillID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "skill not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Check if already linked
	var existing entity.CourseGroupSkill
	if err := cgc.db.Where("course_group_id = ? AND skill_id = ?", courseGroup.ID, payload.SkillID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "skill already linked to this course group"})
		return
	}

	// Set default importance if not provided
	importance := payload.Importance
	if importance < 1 || importance > 5 {
		importance = 1
	}

	courseGroupSkill := entity.CourseGroupSkill{
		CourseGroupID: courseGroup.ID,
		SkillID:       payload.SkillID,
		Importance:    importance,
		Description:   strings.TrimSpace(payload.Description),
	}

	if err := cgc.db.Create(&courseGroupSkill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with skill data
	cgc.db.Preload("Skill").First(&courseGroupSkill, courseGroupSkill.ID)

	c.JSON(http.StatusCreated, gin.H{"data": courseGroupSkill})
}

// UpdateCourseGroupSkill updates a course group skill relationship
func (cgc *CourseGroupController) UpdateCourseGroupSkill(c *gin.Context) {
	courseGroupID := c.Param("id")
	skillID := c.Param("skillId")

	var courseGroupSkill entity.CourseGroupSkill
	if err := cgc.db.Where("course_group_id = ? AND skill_id = ?", courseGroupID, skillID).First(&courseGroupSkill).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "course group skill not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var payload courseGroupSkillPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if payload.Importance >= 1 && payload.Importance <= 5 {
		courseGroupSkill.Importance = payload.Importance
	}
	courseGroupSkill.Description = strings.TrimSpace(payload.Description)

	if err := cgc.db.Save(&courseGroupSkill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Reload with skill data
	cgc.db.Preload("Skill").First(&courseGroupSkill, courseGroupSkill.ID)

	c.JSON(http.StatusOK, gin.H{"data": courseGroupSkill})
}

// RemoveSkillFromCourseGroup removes a skill from a course group
func (cgc *CourseGroupController) RemoveSkillFromCourseGroup(c *gin.Context) {
	courseGroupID := c.Param("id")
	skillID := c.Param("skillId")

	result := cgc.db.Where("course_group_id = ? AND skill_id = ?", courseGroupID, skillID).Delete(&entity.CourseGroupSkill{})
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "course group skill not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "removed successfully"})
}

// ==================== Skill Handlers ====================

type skillPayload struct {
	SkillNameTH string `json:"skill_name_th" binding:"required"`
	SkillNameEN string `json:"skill_name_en"`
	Category    int    `json:"category"`
	Description string `json:"description"`
}

// ListAllSkills returns all skills
func (cgc *CourseGroupController) ListAllSkills(c *gin.Context) {
	var skills []entity.Skill
	if err := cgc.db.Order("id asc").Find(&skills).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": skills})
}

// CreateSkill creates a new skill
func (cgc *CourseGroupController) CreateSkill(c *gin.Context) {
	var payload skillPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	skill := entity.Skill{
		SkillNameTH: strings.TrimSpace(payload.SkillNameTH),
		SkillNameEN: strings.TrimSpace(payload.SkillNameEN),
		Category:    payload.Category,
		Description: strings.TrimSpace(payload.Description),
	}

	if err := cgc.db.Create(&skill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": skill})
}

// UpdateSkill updates an existing skill
func (cgc *CourseGroupController) UpdateSkill(c *gin.Context) {
	id := c.Param("id")

	var skill entity.Skill
	if err := cgc.db.First(&skill, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "skill not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var payload skillPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	skill.SkillNameTH = strings.TrimSpace(payload.SkillNameTH)
	skill.SkillNameEN = strings.TrimSpace(payload.SkillNameEN)
	skill.Category = payload.Category
	skill.Description = strings.TrimSpace(payload.Description)

	if err := cgc.db.Save(&skill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": skill})
}

// DeleteSkill deletes a skill
func (cgc *CourseGroupController) DeleteSkill(c *gin.Context) {
	id := c.Param("id")

	// Delete related CourseGroupSkills first
	err := cgc.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("skill_id = ?", id).Delete(&entity.CourseGroupSkill{}).Error; err != nil {
			return err
		}

		if err := tx.Delete(&entity.Skill{}, id).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted successfully"})
}
