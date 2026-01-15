package entity

import (
	"encoding/json"
	"errors"
	"strings"

	// "github.com/asaskevich/govalidator"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type PortfolioSection struct {
	gorm.Model
	SectionPortKey string         `json:"section_port_key" valid:"required~Section key is required,stringlength(1|50)~Section key must be between 1 and 50 characters"`
	SectionTitle   string         `json:"section_title" valid:"required~Section title is required,stringlength(1|200)~Section title must be between 1 and 200 characters"`
	IsEnabled      bool           `json:"is_enabled"`
	SectionOrder   int            `json:"section_order" valid:"range(0|100)~Section order must be between 0 and 100"`
	SectionStyle   datatypes.JSON `json:"section_style"`

	// FK
	PortfolioID uint      `json:"portfolio_id" valid:"required~Portfolio ID is required"`
	Portfolio   Portfolio `gorm:"foreignKey:PortfolioID" json:"portfolio"`
	//many to one
	PortfolioBlocks []PortfolioBlock `gorm:"foreignKey:PortfolioSectionID" json:"portfolio_blocks"`
}

// SectionStyleData represents the structure for section styling
type SectionStyleData struct {
	BackgroundColor string `json:"background_color"`
	TextColor       string `json:"text_color"`
	FontSize        string `json:"font_size"`
	Padding         string `json:"padding"`
	Margin          string `json:"margin"`
	BorderRadius    string `json:"border_radius"`
	BoxShadow       string `json:"box_shadow"`
}

// Validate validates the PortfolioSection struct
func (ps *PortfolioSection) Validate() error {
	// Trim whitespace
	ps.SectionPortKey = strings.TrimSpace(ps.SectionPortKey)
	ps.SectionTitle = strings.TrimSpace(ps.SectionTitle)

	// Validate section key
	if ps.SectionPortKey == "" {
		return errors.New("section key cannot be empty")
	}
	if len(ps.SectionPortKey) > 50 {
		return errors.New("section key must be between 1 and 50 characters")
	}

	// Validate section title
	if ps.SectionTitle == "" {
		return errors.New("section title cannot be empty")
	}
	if len(ps.SectionTitle) > 200 {
		return errors.New("section title must be between 1 and 200 characters")
	}

	// Validate section order
	if ps.SectionOrder < 0 {
		return errors.New("section order must be a non-negative integer")
	}

	// Validate portfolio ID
	if ps.PortfolioID == 0 {
		return errors.New("portfolio ID is required")
	}

	// Validate section style JSON if provided
	if ps.SectionStyle != nil && len(ps.SectionStyle) > 0 {
		if err := ps.ValidateSectionStyle(); err != nil {
			return err
		}
	}

	return nil
}

// ValidateSectionStyle validates the section style JSON structure
func (ps *PortfolioSection) ValidateSectionStyle() error {
	if ps.SectionStyle == nil || len(ps.SectionStyle) == 0 {
		return nil
	}

	var styleData SectionStyleData
	if err := json.Unmarshal(ps.SectionStyle, &styleData); err != nil {
		return errors.New("invalid section style JSON format")
	}

	// Validate hex colors if provided
	if styleData.BackgroundColor != "" {
		if !isValidHexColor(styleData.BackgroundColor) {
			return errors.New("invalid background color format, must be valid hex color")
		}
	}

	if styleData.TextColor != "" {
		if !isValidHexColor(styleData.TextColor) {
			return errors.New("invalid text color format, must be valid hex color")
		}
	}

	// Validate font size if provided
	if styleData.FontSize != "" {
		validFontSizes := []string{"xs", "sm", "md", "lg", "xl", "2xl", "3xl"}
		isValid := false
		for _, size := range validFontSizes {
			if styleData.FontSize == size {
				isValid = true
				break
			}
		}
		// Also allow pixel/rem values
		if !isValid && !strings.HasSuffix(styleData.FontSize, "px") && !strings.HasSuffix(styleData.FontSize, "rem") {
			return errors.New("invalid font size format, must be xs, sm, md, lg, xl, 2xl, 3xl or a valid CSS value")
		}
	}

	return nil
}

// ValidateSectionUpdate validates section update data
func (ps *PortfolioSection) ValidateSectionUpdate(db *gorm.DB) error {
	// Validate base fields
	if err := ps.Validate(); err != nil {
		return err
	}

	// Check if portfolio exists
	var portfolio Portfolio
	if err := db.First(&portfolio, ps.PortfolioID).Error; err != nil {
		return errors.New("portfolio not found")
	}

	// Check for duplicate section key within the same portfolio
	var existingSection PortfolioSection
	if err := db.Where("portfolio_id = ? AND section_port_key = ? AND id != ?",
		ps.PortfolioID, ps.SectionPortKey, ps.ID).First(&existingSection).Error; err == nil {
		return errors.New("section key already exists in this portfolio")
	}

	return nil
}

// Helper function to validate hex color
func isValidHexColor(color string) bool {
	if len(color) == 0 {
		return false
	}

	if color[0] != '#' {
		return false
	}

	hexPart := color[1:]
	if len(hexPart) != 3 && len(hexPart) != 6 && len(hexPart) != 8 {
		return false
	}

	for _, c := range hexPart {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}

	return true
}
