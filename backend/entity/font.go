package entity

import (
	"errors"
	"strings"

	"github.com/asaskevich/govalidator"
	"gorm.io/gorm"
)

type Font struct {
	gorm.Model
	FontFamily   string `json:"font_family" valid:"required~Font family is required,stringlength(1|100)~Font family must be between 1 and 100 characters"` //ค่า css
	FontName     string `json:"font_name" valid:"required~Font name is required,stringlength(1|100)~Font name must be between 1 and 100 characters"`
	FontCategory string `json:"font_category" valid:"optional"`
	FontVariant  string `json:"font_variant" valid:"optional,stringlength(0|50)~Font variant must not exceed 50 characters"`
	FontURL      string `json:"font_url" valid:"optional,url~Font URL must be a valid URL"`
	IsActive     bool   `json:"is_active"`

	//FK
	Portfolio []Portfolio `gorm:"foreignKey:FontID" json:"portfolio"`
}

// Validate validates the Font struct
func (f *Font) Validate() error {
	// Trim whitespace
	f.FontFamily = strings.TrimSpace(f.FontFamily)
	f.FontName = strings.TrimSpace(f.FontName)
	f.FontCategory = strings.TrimSpace(f.FontCategory)
	f.FontVariant = strings.TrimSpace(f.FontVariant)
	f.FontURL = strings.TrimSpace(f.FontURL)

	// Validate font name
	if f.FontName == "" {
		return errors.New("font name cannot be empty")
	}
	if len(f.FontName) > 100 {
		return errors.New("font name must be between 1 and 100 characters")
	}

	// Validate font family
	if f.FontFamily == "" {
		return errors.New("font family cannot be empty")
	}
	if len(f.FontFamily) > 100 {
		return errors.New("font family must be between 1 and 100 characters")
	}

	// Validate font category if provided
	if f.FontCategory != "" {
		validCategories := []string{"serif", "sans-serif", "monospace", "display", "handwriting"}
		isValid := false
		for _, cat := range validCategories {
			if f.FontCategory == cat {
				isValid = true
				break
			}
		}
		if !isValid {
			return errors.New("font category must be one of: serif, sans-serif, monospace, display, handwriting")
		}
	}

	// Validate font URL if provided
	if f.FontURL != "" {
		if !govalidator.IsURL(f.FontURL) {
			return errors.New("font URL must be a valid URL")
		}

		// Check if URL is from trusted font sources
		trustedSources := []string{
			"fonts.googleapis.com",
			"fonts.gstatic.com",
			"use.typekit.net",
			"fonts.cdnfonts.com",
		}
		isTrusted := false
		lowerURL := strings.ToLower(f.FontURL)
		for _, source := range trustedSources {
			if strings.Contains(lowerURL, source) {
				isTrusted = true
				break
			}
		}
		// Just a warning - don't block non-trusted sources
		if !isTrusted {
			// Allow but could log a warning
		}
	}

	return nil
}

// ValidateFontSelection validates font selection for portfolio
func ValidateFontSelection(fontID uint, db *gorm.DB) (*Font, error) {
	if fontID == 0 {
		return nil, errors.New("font ID is required")
	}

	var font Font
	if err := db.First(&font, fontID).Error; err != nil {
		return nil, errors.New("selected font does not exist")
	}

	if !font.IsActive {
		return nil, errors.New("selected font is not available for use")
	}

	return &font, nil
}
