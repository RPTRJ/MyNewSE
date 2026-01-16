package entity

import (
	"errors"
	"regexp"
	"strings"

	"github.com/asaskevich/govalidator"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type Portfolio struct {
	gorm.Model
	PortfolioName  string         `json:"portfolio_name" valid:"required~Portfolio name is required,stringlength(1|100)~Portfolio name must be between 1 and 100 characters"`
	Decription     string         `json:"decription" valid:"optional,stringlength(0|500)~Description must not exceed 500 characters"`
	Status         string         `json:"status" valid:"required~Status is required,in(draft|active|archived)~Status must be draft, active, or archived"`
	PortfolioStyle datatypes.JSON `json:"portfolio_style"`
	CoverImage     string         `json:"cover_image" valid:"optional"`
	ContentDescription string     `json:"content_description"`

	// FK
	TemplateID *uint     `json:"template_id"`
	Template   Templates `gorm:"foreignKey:TemplateID" json:"template"`
	UserID     uint      `json:"user_id" valid:"required~User ID is required"`
	User       User      `gorm:"foreignKey:UserID" json:"user"`
	ColorsID   uint      `json:"colors_id" valid:"required~Colors ID is required"`
	Colors     Colors    `gorm:"foreignKey:ColorsID" json:"colors"`
	FontID     uint      `json:"font_id" valid:"required~Font ID is required"`
	Font       Font      `gorm:"foreignKey:FontID" json:"font"`

	// one to many
	PortfolioSections []PortfolioSection `gorm:"foreignKey:PortfolioID" json:"portfolio_sections"`
	PortfolioWorks    []PortfolioWork    `gorm:"foreignKey:PortfolioID" json:"portfolio_works"`
	PortfolioSubmission []PortfolioSubmission `gorm:"foreignKey:PortfolioID" json:"Portfolio_submission"`
}

// Validate validates the Portfolio struct
func (p *Portfolio) Validate() error {
	// Trim whitespace
	p.PortfolioName = strings.TrimSpace(p.PortfolioName)
	p.Decription = strings.TrimSpace(p.Decription)
	p.Status = strings.TrimSpace(p.Status)

	// Validate portfolio name
	if p.PortfolioName == "" {
		return errors.New("portfolio name cannot be empty or whitespace only")
	}
	if len(p.PortfolioName) > 100 {
		return errors.New("portfolio name must be between 1 and 100 characters")
	}

	// Validate description length
	if len(p.Decription) > 500 {
		return errors.New("description must not exceed 500 characters")
	}

	// Validate status is required
	if p.Status == "" {
		return errors.New("status is required")
	}

	// Validate status values
	validStatuses := []string{"draft", "active", "archived"}
	isValidStatus := false
	for _, s := range validStatuses {
		if p.Status == s {
			isValidStatus = true
			break
		}
	}
	if !isValidStatus {
		return errors.New("Status must be one of: draft, active, archived")
	}

	// Validate ColorsID exists (must be > 0)
	if p.ColorsID == 0 {
		return errors.New("colors ID is required")
	}

	// Validate FontID exists (must be > 0)
	if p.FontID == 0 {
		return errors.New("font ID is required")
	}

	// Validate cover image URL if provided
	if p.CoverImage != "" {
		if !govalidator.IsURL(p.CoverImage) {
			return errors.New("cover image must be a valid URL")
		}
	}

	return nil
}

// ValidateColorChange validates when user changes portfolio color
func (p *Portfolio) ValidateColorChange(newColorsID uint, db *gorm.DB) error {
	if newColorsID == 0 {
		return errors.New("colors ID is required")
	}

	// Check if color exists in database
	var color Colors
	if err := db.First(&color, newColorsID).Error; err != nil {
		return errors.New("selected color theme does not exist")
	}

	return nil
}

// ValidateFontChange validates when user changes portfolio font
func (p *Portfolio) ValidateFontChange(newFontID uint, db *gorm.DB) error {
	if newFontID == 0 {
		return errors.New("font ID is required")
	}

	// Check if font exists in database
	var font Font
	if err := db.First(&font, newFontID).Error; err != nil {
		return errors.New("selected font does not exist")
	}

	// Check if font is active
	if !font.IsActive {
		return errors.New("selected font is not available")
	}

	return nil
}

// ValidateCoverImage validates cover image URL
func ValidateCoverImage(imageURL string) error {
	if imageURL == "" {
		return nil // Optional field
	}

	trimmedURL := strings.TrimSpace(imageURL)
	if trimmedURL == "" {
		return nil
	}

	// Validate URL format
	if !govalidator.IsURL(trimmedURL) {
		return errors.New("cover image must be a valid URL")
	}

	// Validate image extension
	lowerURL := strings.ToLower(trimmedURL)
	validExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
	isValidImage := false
	for _, ext := range validExtensions {
		if strings.HasSuffix(lowerURL, ext) || strings.Contains(lowerURL, ext+"?") {
			isValidImage = true
			break
		}
	}

	if !isValidImage {
		return errors.New("cover image must be an image file (jpg, jpeg, png, gif, webp, svg)")
	}

	return nil
}

// ValidatePortfolioStyle validates the portfolio style JSON
func ValidatePortfolioStyle(style datatypes.JSON) error {
	if style == nil || len(style) == 0 {
		return nil // Optional field
	}

	// Check if it's valid JSON (basic check)
	styleStr := string(style)
	if styleStr != "" && styleStr != "null" && styleStr != "{}" {
		// Basic validation that it starts with { and ends with }
		if !strings.HasPrefix(styleStr, "{") || !strings.HasSuffix(styleStr, "}") {
			return errors.New("portfolio style must be a valid JSON object")
		}
	}

	return nil
}

// ValidateHexColor validates hex color format
func ValidateHexColor(color string) error {
	if color == "" {
		return nil
	}

	// Regex for hex color validation (#RGB, #RRGGBB, #RRGGBBAA)
	hexColorRegex := regexp.MustCompile(`^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$`)
	if !hexColorRegex.MatchString(color) {
		return errors.New("invalid hex color format (must be #RGB, #RRGGBB, or #RRGGBBAA)")
	}

	return nil
}
