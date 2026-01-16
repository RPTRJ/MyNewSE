package controller

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

// GetActivities fetches activities for the user - OPTIMIZED with pagination
// Query params: ?page=1&limit=20&include_images=false
func GetActivities(c *gin.Context) {
	uid, exists := c.Get("user_id")
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

	db := config.GetDB().Model(&entity.Activity{}).Where("user_id = ?", uid.(uint))
	db.Count(&total)

	query := config.GetDB().
		Where("user_id = ?", uid.(uint)).
		Preload("ActivityDetail").
		Preload("ActivityDetail.TypeActivity").
		Preload("ActivityDetail.LevelActivity").
		Preload("Reward")

	// Only preload images if explicitly requested (for detail views)
	if includeImages {
		query = query.Preload("ActivityDetail.Images")
	}

	if err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&activities).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
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

// GetWorkings fetches workings for the user - OPTIMIZED with pagination
// Query params: ?page=1&limit=20&include_images=false
func GetWorkings(c *gin.Context) {
	uid, exists := c.Get("user_id")
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

	var workings []entity.Working
	var total int64

	db := config.GetDB().Model(&entity.Working{}).Where("user_id = ?", uid.(uint))
	db.Count(&total)

	query := config.GetDB().
		Where("user_id = ?", uid.(uint)).
		Preload("WorkingDetail").
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

// CreateTemplate creates a new template
func CreateTemplates(c *gin.Context) {
	var template entity.Templates
	if err := c.ShouldBindJSON(&template); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.GetDB().Create(&template).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": template})
}

// CreatePortfolio creates a new Portfolio (Custom/Empty)
func CreatePortfolio(c *gin.Context) {
	var portfolio entity.Portfolio
	if err := c.ShouldBindJSON(&portfolio); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	uid, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// UserID ที่สร้าง portfolio (ป้องกันการสร้างให้คนอื่น)
	portfolio.UserID = uid.(uint)

	// Default values
	var count int64
	config.GetDB().Model(&entity.Portfolio{}).Where("user_id = ?", uid.(uint)).Count(&count)

	if count == 0 {
		portfolio.Status = "active"
	} else if portfolio.Status == "" {
		portfolio.Status = "draft"
	}

	// ✅ Logic: ถ้า status = "active" (จากการสร้างใหม่หรือเป็นอันแรก) -> ปรับ Portfolio อื่นๆ ของ User นี้ให้เป็น "draft"
	if portfolio.Status == "active" {
		config.GetDB().Model(&entity.Portfolio{}).
			Where("user_id = ?", uid.(uint)).
			Update("status", "draft")
	}

	// Ensure Color exists
	if portfolio.ColorsID == 0 {
		var color entity.Colors
		if err := config.GetDB().First(&color).Error; err == nil {
			portfolio.ColorsID = color.ID
		}
	}
	// Ensure Font exists
	if portfolio.FontID == 0 {
		var font entity.Font
		if err := config.GetDB().First(&font).Error; err == nil {
			portfolio.FontID = font.ID
		}
	}

	// Try to create
	if err := config.GetDB().Create(&portfolio).Error; err != nil {
		fmt.Println("⚠️ CreatePortfolio Error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ✅ สร้าง Section เริ่มต้นให้ Portfolio ใหม่
	defaultSection := entity.PortfolioSection{
		SectionTitle:   "ผลงานของฉัน",
		SectionPortKey: "my_works",
		IsEnabled:      true,
		SectionOrder:   1,
		PortfolioID:    portfolio.ID,
	}
	if err := config.GetDB().Create(&defaultSection).Error; err != nil {
		fmt.Println("⚠️ CreateDefaultSection Error:", err)
		// ไม่ต้อง return error เพราะ portfolio สร้างสำเร็จแล้ว
	}

	// Preload sections เพื่อส่งกลับไปพร้อม portfolio
	config.GetDB().Preload("PortfolioSections").First(&portfolio, portfolio.ID)

	c.JSON(http.StatusCreated, gin.H{"data": portfolio})
}

// UseTemplate creates a new Portfolio based on a Template OR returns existing one
func UseTemplate(c *gin.Context) {
	id := c.Param("id")

	// รับชื่อ portfolio จาก body (optional)
	var input struct {
		PortfolioName string `json:"portfolio_name"`
	}
	c.ShouldBindJSON(&input)

	uidVal, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	userID := uidVal.(uint)

	var template entity.Templates
	if err := config.GetDB().
		Preload("TemplateSectionLinks.TemplatesSection.SectionBlocks.TemplatesBlock").
		First(&template, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Template not found"})
		return
	}

	// Find valid user
	// var user entity.User
	// if err := config.GetDB().First(&user).Error; err != nil {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": "No users found"})
	// 	return
	// }

	// ✅ เช็คว่ามี Portfolio สำหรับ template นี้อยู่แล้วหรือไม่
	// var existingPortfolio entity.Portfolio
	// err := config.GetDB().
	// 	Preload("PortfolioSections.PortfolioBlocks").
	// 	Where("user_id = ? AND template_id = ?", userID, template.ID).
	// 	First(&existingPortfolio).Error

	// if err == nil {
	// 	// ✅ มี Portfolio อยู่แล้ว - ส่งกลับไป
	// 	fmt.Println("✅ Found existing portfolio for template:", template.ID)
	// 	c.JSON(http.StatusOK, gin.H{
	// 		"data":    existingPortfolio,
	// 		"message": "Using existing portfolio with saved sections",
	// 	})
	// 	return
	// }

	// ✅ ไม่มี Portfolio สำหรับ template นี้ - สร้างใหม่
	fmt.Println("🆕 Creating new portfolio for template:", template.ID)

	// ใช้ชื่อจาก input หรือ default
	portfolioName := input.PortfolioName
	if portfolioName == "" {
		portfolioName = "My Portfolio from " + template.TemplateName
	}

	var count int64
	config.GetDB().Model(&entity.Portfolio{}).Where("user_id = ?", userID).Count(&count)

	status := "draft"
	if count == 0 {
		status = "active"
	}

	if status == "active" {
		config.GetDB().Model(&entity.Portfolio{}).Where("user_id = ?", userID).Update("status", "draft")
	}

	portfolio := entity.Portfolio{
		PortfolioName: portfolioName,
		Status:        status,
		TemplateID:    &template.ID,
		UserID:        userID,
	}

	// Ensure Color
	var color entity.Colors
	if err := config.GetDB().First(&color).Error; err != nil {
		color = entity.Colors{
			ColorsName:      "Default",
			PrimaryColor:    "#000000",
			SecondaryColor:  "#FFFFFF",
			BackgroundColor: "#F0F0F0",
			HexValue:        "#000000",
		}
		config.GetDB().Create(&color)
	}
	portfolio.ColorsID = color.ID

	// Ensure Font
	var font entity.Font
	if err := config.GetDB().First(&font).Error; err != nil {
		font = entity.Font{
			FontName:     "Roboto",
			FontFamily:   "Roboto, sans-serif",
			FontCategory: "sans-serif",
			IsActive:     true,
		}
		config.GetDB().Create(&font)
	}
	portfolio.FontID = font.ID

	// Create Portfolio
	if err := config.GetDB().Create(&portfolio).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Copy Sections from Template
	for _, link := range template.TemplateSectionLinks {
		ts := link.TemplatesSection

		ps := entity.PortfolioSection{
			SectionTitle:   ts.SectionName,
			SectionPortKey: ts.SectionName,
			IsEnabled:      true,
			SectionOrder:   int(link.OrderIndex),
			PortfolioID:    portfolio.ID,
		}

		if err := config.GetDB().Create(&ps).Error; err != nil {
			continue
		}

		// Copy Blocks
		for _, sb := range ts.SectionBlocks {
			pb := entity.PortfolioBlock{
				BlockPortType:      sb.TemplatesBlock.BlockType,
				BlockOrder:         sb.OrderIndex,
				PortfolioSectionID: ps.ID,
				Content:            sb.TemplatesBlock.DefaultContent,
			}
			config.GetDB().Create(&pb)
		}
	}

	// ✅ Preload sections และ blocks เพื่อส่งกลับข้อมูลครบถ้วน
	config.GetDB().
		Preload("PortfolioSections.PortfolioBlocks").
		Preload("Colors").
		Preload("Font").
		First(&portfolio, portfolio.ID)

	c.JSON(http.StatusOK, gin.H{
		"data":    portfolio,
		"message": "New portfolio created with template sections",
	})
}

// GetMyPortfolio - ดึง Portfolio ทั้งหมดของ user - OPTIMIZED with pagination
// Query params: ?page=1&limit=10&include_blocks=false
func GetMyPortfolio(c *gin.Context) {
	uid, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := uid.(uint)

	// Pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	includeBlocks := c.DefaultQuery("include_blocks", "true") == "true"

	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}
	offset := (page - 1) * limit

	var portfolios []entity.Portfolio
	var total int64

	config.GetDB().Model(&entity.Portfolio{}).Where("user_id = ?", userID).Count(&total)

	query := config.GetDB().Where("user_id = ?", userID).Preload("Colors").Preload("Font")

	// Only preload sections and blocks if needed (for list view, often not needed)
	if includeBlocks {
		query = query.Preload("PortfolioSections", func(db *gorm.DB) *gorm.DB {
			return db.Order("section_order ASC")
		}).Preload("PortfolioSections.PortfolioBlocks")
	} else {
		// Just load section count without blocks
		query = query.Preload("PortfolioSections")
	}

	if err := query.
		Order("updated_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&portfolios).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":       portfolios,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

// CreatePortfolioSection creates a new section for a portfolio
func CreatePortfolioSection(c *gin.Context) {
	var section entity.PortfolioSection
	if err := c.ShouldBindJSON(&section); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := config.GetDB().Create(&section).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": section})
}

// UpdatePortfolioSection updates a portfolio section
func UpdatePortfolioSection(c *gin.Context) {
	id := c.Param("id")
	var input map[string]interface{}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var section entity.PortfolioSection
	if err := config.GetDB().First(&section, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Section not found"})
		return
	}

	// Filter and validate fields to update
	updates := make(map[string]interface{})
	allowedFields := []string{"section_title", "is_enabled", "section_order", "section_style"}

	for _, field := range allowedFields {
		if val, exists := input[field]; exists {
			updates[field] = val
		}
	}

	// ✅ Update only fields present in the request
	if len(updates) > 0 {
		if err := config.GetDB().Model(&section).Updates(updates).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
	}

	// ✅ Reload data
	config.GetDB().First(&section, id)

	fmt.Println("✅ Section updated:", section.ID, "Updates:", updates)
	c.JSON(http.StatusOK, gin.H{"data": section})
}

// ✅ DeletePortfolioSection - ลบ Section
func DeletePortfolioSection(c *gin.Context) {
	id := c.Param("id")

	// Check if exists
	var section entity.PortfolioSection
	if err := config.GetDB().First(&section, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Section not found"})
		return
	}

	// Delete (Unscoped to remove permanently if needed, or Soft Delete if using gorm.Model)
	if err := config.GetDB().Delete(&section).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Section deleted successfully"})
}

// ✅ CreatePortfolioBlock - สร้าง Block ใหม่
func CreatePortfolioBlock(c *gin.Context) {
	var payload struct {
		PortfolioSectionID uint           `json:"portfolio_section_id"`
		BlockOrder         int            `json:"block_order"`
		Content            datatypes.JSON `json:"content"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	block := entity.PortfolioBlock{
		PortfolioSectionID: payload.PortfolioSectionID,
		BlockOrder:         payload.BlockOrder,
		Content:            payload.Content,
		BlockPortType:      "text", // Default to text for now
	}

	if err := config.GetDB().Create(&block).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": block})
}

// ✅ UpdatePortfolioBlock - แก้ไข Block
func UpdatePortfolioBlock(c *gin.Context) {
	id := c.Param("id")

	var payload struct {
		Content    datatypes.JSON `json:"content"`
		BlockOrder int            `json:"block_order"`
	}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var block entity.PortfolioBlock
	if err := config.GetDB().First(&block, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Block not found"})
		return
	}

	// Update fields
	if payload.Content != nil {
		block.Content = payload.Content
	}
	if payload.BlockOrder > 0 {
		block.BlockOrder = payload.BlockOrder
	}

	if err := config.GetDB().Save(&block).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": block})
}

// ✅ DeletePortfolioBlock - ลบ Block
func DeletePortfolioBlock(c *gin.Context) {
	id := c.Param("id")

	if err := config.GetDB().Delete(&entity.PortfolioBlock{}, id).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Block deleted successfully"})
}

// ✅ UpdatePortfolio - อัปเดตข้อมูล Portfolio (เช่น CoverImage, Name, Description)
func UpdatePortfolio(c *gin.Context) {
	id := c.Param("id")
	var payload map[string]interface{}

	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var portfolio entity.Portfolio
	if err := config.GetDB().First(&portfolio, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	// ✅ Logic: จัดการสถานะ Active ให้มีเพียงอันเดียวเสมอ
	if val, ok := payload["status"]; ok {
		if val == "active" {
			// ถ้าตั้งเป็น active ให้ปลดอันอื่นเป็น draft
			config.GetDB().Model(&entity.Portfolio{}).
				Where("user_id = ? AND id != ?", portfolio.UserID, portfolio.ID).
				Update("status", "draft")
		} else if val == "draft" && portfolio.Status == "active" {
			// ถ้าจะยกเลิก active (เปลี่ยนเป็น draft) ให้หาอันอื่นมา active แทน (ถ้ามี)
			var anotherPortfolio entity.Portfolio
			err := config.GetDB().
				Where("user_id = ? AND id != ?", portfolio.UserID, portfolio.ID).
				Order("updated_at DESC").
				First(&anotherPortfolio).Error
			
			if err == nil {
				config.GetDB().Model(&anotherPortfolio).Update("status", "active")
			} else {
				// ถ้าไม่มีอันอื่นเลย บังคับให้เป็น active ต่อไป (หรือจะยอมให้เป็น draft ก็ได้ตามความต้องการ)
				// ในที่นี้ขออนุญาตให้เป็น active ต่อไปตามกฎ "ถ้ามี 1 อันให้ active"
				payload["status"] = "active"
			}
		}
	}

	if err := config.GetDB().Model(&portfolio).Updates(payload).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": portfolio})
}

// DeletePortfolio - ลบ Portfolio พร้อม Sections และ Blocks ของมัน
func DeletePortfolio(c *gin.Context) {
	id := c.Param("id")

	db := config.GetDB()

	// Check if portfolio exists
	var portfolio entity.Portfolio
	if err := db.First(&portfolio, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
		return
	}

	// Find sections
	var sections []entity.PortfolioSection
	if err := db.Where("portfolio_id = ?", portfolio.ID).Find(&sections).Error; err == nil {
		for _, s := range sections {
			// Delete blocks under section
			db.Where("portfolio_section_id = ?", s.ID).Delete(&entity.PortfolioBlock{})
		}
		// Delete sections
		db.Where("portfolio_id = ?", portfolio.ID).Delete(&entity.PortfolioSection{})
	}

	// Delete portfolio (this will remove the portfolio record)
	if err := db.Delete(&entity.Portfolio{}, portfolio.ID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	fmt.Println("✅ Portfolio deleted:", portfolio.ID)

	// ✅ Logic: หลังจากลบแล้ว ตรวจสอบว่ามีอันที่ Active อยู่ไหม
	var activeCount int64
	db.Model(&entity.Portfolio{}).Where("user_id = ? AND status = ?", portfolio.UserID, "active").Count(&activeCount)
	fmt.Println("ℹ️ Remaining Active Count:", activeCount)

	if activeCount == 0 {
		// ถ้าไม่มีอันไหน Active เลย ให้เลือกอันล่าสุดมา Active (ถ้ามีเหลืออยู่)
		var latestPortfolio entity.Portfolio
		err := db.Where("user_id = ?", portfolio.UserID).Order("updated_at DESC").First(&latestPortfolio).Error
		if err == nil {
			fmt.Println("🔄 Auto-activating portfolio:", latestPortfolio.ID)
			db.Model(&latestPortfolio).Update("status", "active")
		} else {
			fmt.Println("⚠️ No other portfolios found to activate")
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Portfolio deleted successfully"})
}

func GetPortfolioByStatusActive(c *gin.Context) {
	uid, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userID := uid.(uint)
	var portfolio entity.Portfolio
	if err := config.GetDB().
		Preload("PortfolioSections.PortfolioBlocks").
		Preload("Colors").
		Preload("Font").
		Where("user_id = ? AND status = ?", userID, "active").
		First(&portfolio).Error; err != nil {
		// Handle "record not found" - no active portfolio exists
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusOK, gin.H{"data": nil, "message": "No active portfolio found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": portfolio})
}


// GetPortfolioById - ดึง Portfolio ตาม ID (สำหรับ Teacher / Viewer)
// Query params: ?include_blocks=true
func GetPortfolioById(c *gin.Context) {
	// 🔐 ต้อง login เท่านั้น
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	idParam := c.Param("id")
	portfolioID, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid portfolio id"})
		return
	}

	includeBlocks := c.DefaultQuery("include_blocks", "true") == "true"

	var portfolio entity.Portfolio

	query := config.GetDB().
		Preload("Colors").
		Preload("Font")

	// ✅ preload sections & blocks แบบ optional
	if includeBlocks {
		query = query.
			Preload("PortfolioSections", func(db *gorm.DB) *gorm.DB {
				return db.Order("section_order ASC")
			}).
			Preload("PortfolioSections.PortfolioBlocks", func(db *gorm.DB) *gorm.DB {
				return db.Order("block_order ASC")
			})
	} else {
		query = query.Preload("PortfolioSections")
	}

	if err := query.First(&portfolio, portfolioID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Portfolio not found"})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": portfolio})
}
