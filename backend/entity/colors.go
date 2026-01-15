package entity

import (
	"errors"
	"regexp"
	"strings"

	"gorm.io/gorm"
)

type Colors struct {
	gorm.Model
	ColorsName      string `json:"colors_name" valid:"required~Colors name is required,stringlength(1|50)~Colors name must be between 1 and 50 characters"`
	PrimaryColor    string `json:"primary_color" valid:"required~Primary color is required"`
	SecondaryColor  string `json:"secondary_color" valid:"required~Secondary color is required"`
	BackgroundColor string `json:"background_color" valid:"required~Background color is required"`
	HexValue        string `json:"hex_value"`

	//FK
	Portfolio []Portfolio `gorm:"foreignKey:ColorsID" json:"portfolio"`
}

// Validate validates the Colors struct
func (c *Colors) Validate() error {
	// Trim whitespace
	c.ColorsName = strings.TrimSpace(c.ColorsName)
	c.PrimaryColor = strings.TrimSpace(c.PrimaryColor)
	c.SecondaryColor = strings.TrimSpace(c.SecondaryColor)
	c.BackgroundColor = strings.TrimSpace(c.BackgroundColor)
	c.HexValue = strings.TrimSpace(c.HexValue)

	// Validate colors name
	if c.ColorsName == "" {
		return errors.New("Colors name cannot be empty")
	}
	if len(c.ColorsName) > 50 {
		return errors.New("Colors name must be between 1 and 50 characters")
	}

	// Validate hex color format for all color fields
	if err := validateHexColorFormat(c.PrimaryColor); err != nil {
		return errors.New("Primary color: " + err.Error())
	}

	if err := validateHexColorFormat(c.SecondaryColor); err != nil {
		return errors.New("Secondary color: " + err.Error())
	}

	if err := validateHexColorFormat(c.BackgroundColor); err != nil {
		return errors.New("Background color: " + err.Error())
	}

	// HexValue is optional but validate if provided
	if c.HexValue != "" {
		if err := validateHexColorFormat(c.HexValue); err != nil {
			return errors.New("hex value: " + err.Error())
		}
	}

	return nil
}

// validateHexColorFormat validates hex color format
func validateHexColorFormat(color string) error {
	if color == "" {
		return errors.New("color is required")
	}

	// Regex for hex color validation (#RGB, #RRGGBB, #RRGGBBAA)
	hexColorRegex := regexp.MustCompile(`^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$`)
	if !hexColorRegex.MatchString(color) {
		return errors.New("invalid hex color format (must be #RGB, #RRGGBB, or #RRGGBBAA)")
	}

	return nil
}

// ValidateColorTheme validates a complete color theme
func ValidateColorTheme(primary, secondary, background string) error {
	if err := validateHexColorFormat(primary); err != nil {
		return errors.New("primary color: " + err.Error())
	}

	if err := validateHexColorFormat(secondary); err != nil {
		return errors.New("secondary color: " + err.Error())
	}

	if err := validateHexColorFormat(background); err != nil {
		return errors.New("background color: " + err.Error())
	}

	// Check color contrast (basic validation)
	if primary == secondary && secondary == background {
		return errors.New("all colors should not be identical for better visibility")
	}

	return nil
}
