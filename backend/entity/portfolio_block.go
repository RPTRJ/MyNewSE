package entity

import (
	"encoding/json"
	"errors"
	"strings"

	"github.com/asaskevich/govalidator"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type PortfolioBlock struct {
	gorm.Model
	BlockPortType string         `json:"block_port_type" valid:"required~Block type is required,stringlength(1|50)~Block type must be between 1 and 50 characters"`
	BlockOrder    int            `json:"block_order" valid:"range(0|100)~Block order must be between 0 and 100"`
	BlockStyle    datatypes.JSON `json:"block_style"`
	Content       datatypes.JSON `json:"content"`

	// FK
	PortfolioSectionID uint             `json:"portfolio_section_id" valid:"required~Portfolio section ID is required"`
	PortfolioSection   PortfolioSection `gorm:"foreignKey:PortfolioSectionID" json:"portfolio_section"`
}

// BlockStyleData represents the structure for block styling
type BlockStyleData struct {
	BackgroundColor string `json:"background_color"`
	TextColor       string `json:"text_color"`
	FontSize        string `json:"font_size"`
	FontWeight      string `json:"font_weight"`
	TextAlign       string `json:"text_align"`
	Padding         string `json:"padding"`
	Margin          string `json:"margin"`
	BorderRadius    string `json:"border_radius"`
	Width           string `json:"width"`
	Height          string `json:"height"`
}

// ActivityContentData represents activity content structure
type ActivityContentData struct {
	ActivityID   uint   `json:"activity_id"`
	ActivityName string `json:"activity_name"`
	Description  string `json:"description"`
	ImageURL     string `json:"image_url"`
	Date         string `json:"date"`
	Location     string `json:"location"`
	Hours        int    `json:"hours"`
}

// TextContentData represents text content structure
type TextContentData struct {
	Text      string `json:"text"`
	FontSize  string `json:"font_size"`
	FontStyle string `json:"font_style"`
	TextAlign string `json:"text_align"`
}

// ImageContentData represents image content structure
type ImageContentData struct {
	ImageURL string `json:"image_url"`
	AltText  string `json:"alt_text"`
	Caption  string `json:"caption"`
	Width    string `json:"width"`
	Height   string `json:"height"`
}

// Valid block types
var ValidBlockTypes = []string{
	"activity",
	"text",
	"image",
	"gallery",
	"education",
	"skills",
	"awards",
	"experience",
	"contact",
	"header",
	"divider",
	"spacer",
}

// Validate validates the PortfolioBlock struct
func (pb *PortfolioBlock) Validate() error {
	// Trim whitespace
	pb.BlockPortType = strings.TrimSpace(pb.BlockPortType)

	// Validate block type
	if pb.BlockPortType == "" {
		return errors.New("block type cannot be empty")
	}

	// Check if block type is valid
	isValidType := false
	for _, validType := range ValidBlockTypes {
		if pb.BlockPortType == validType {
			isValidType = true
			break
		}
	}
	if !isValidType {
		return errors.New("invalid block type, must be one of: " + strings.Join(ValidBlockTypes, ", "))
	}

	// Validate block order
	if pb.BlockOrder < 0 {
		return errors.New("block order must be a non-negative integer")
	}

	// Validate portfolio section ID
	if pb.PortfolioSectionID == 0 {
		return errors.New("portfolio section ID is required")
	}

	// Validate block style JSON if provided
	if pb.BlockStyle != nil && len(pb.BlockStyle) > 0 {
		if err := pb.ValidateBlockStyle(); err != nil {
			return err
		}
	}

	// Validate content JSON if provided
	if pb.Content != nil && len(pb.Content) > 0 {
		if err := pb.ValidateContent(); err != nil {
			return err
		}
	}

	return nil
}

// ValidateBlockStyle validates the block style JSON structure
func (pb *PortfolioBlock) ValidateBlockStyle() error {
	if pb.BlockStyle == nil || len(pb.BlockStyle) == 0 {
		return nil
	}

	var styleData BlockStyleData
	if err := json.Unmarshal(pb.BlockStyle, &styleData); err != nil {
		return errors.New("invalid block style JSON format")
	}

	// Validate hex colors if provided
	if styleData.BackgroundColor != "" {
		if !isValidBlockHexColor(styleData.BackgroundColor) {
			return errors.New("invalid background color format, must be valid hex color")
		}
	}

	if styleData.TextColor != "" {
		if !isValidBlockHexColor(styleData.TextColor) {
			return errors.New("invalid text color format, must be valid hex color")
		}
	}

	// Validate text align if provided
	if styleData.TextAlign != "" {
		validAligns := []string{"left", "center", "right", "justify"}
		isValid := false
		for _, align := range validAligns {
			if styleData.TextAlign == align {
				isValid = true
				break
			}
		}
		if !isValid {
			return errors.New("invalid text alignment, must be one of: left, center, right, justify")
		}
	}

	// Validate font weight if provided
	if styleData.FontWeight != "" {
		validWeights := []string{"normal", "bold", "lighter", "bolder", "100", "200", "300", "400", "500", "600", "700", "800", "900"}
		isValid := false
		for _, weight := range validWeights {
			if styleData.FontWeight == weight {
				isValid = true
				break
			}
		}
		if !isValid {
			return errors.New("invalid font weight")
		}
	}

	return nil
}

// ValidateContent validates the content JSON based on block type
func (pb *PortfolioBlock) ValidateContent() error {
	if pb.Content == nil || len(pb.Content) == 0 {
		return nil
	}

	switch pb.BlockPortType {
	case "activity":
		return pb.ValidateActivityContent()
	case "text":
		return pb.ValidateTextContent()
	case "image":
		return pb.ValidateImageContent()
	default:
		// For other types, just ensure it's valid JSON
		var raw map[string]interface{}
		if err := json.Unmarshal(pb.Content, &raw); err != nil {
			return errors.New("invalid content JSON format")
		}
	}

	return nil
}

// ValidateActivityContent validates activity content
func (pb *PortfolioBlock) ValidateActivityContent() error {
	// Content can be a single activity or array of activities
	var activities []ActivityContentData
	if err := json.Unmarshal(pb.Content, &activities); err != nil {
		// Try single activity
		var activity ActivityContentData
		if err := json.Unmarshal(pb.Content, &activity); err != nil {
			return errors.New("invalid activity content format")
		}
		activities = []ActivityContentData{activity}
	}

	for i, activity := range activities {
		// Validate activity name
		if activity.ActivityName != "" && len(activity.ActivityName) > 200 {
			return errors.New("activity name must not exceed 200 characters")
		}

		// Validate description
		if activity.Description != "" && len(activity.Description) > 2000 {
			return errors.New("activity description must not exceed 2000 characters")
		}

		// Validate image URL if provided
		if activity.ImageURL != "" {
			if !govalidator.IsURL(activity.ImageURL) {
				return errors.New("invalid image URL in activity " + string(rune(i+1)))
			}
		}

		// Validate hours
		if activity.Hours < 0 {
			return errors.New("activity hours cannot be negative")
		}

		// Validate location length
		if activity.Location != "" && len(activity.Location) > 200 {
			return errors.New("activity location must not exceed 200 characters")
		}
	}

	return nil
}

// ValidateTextContent validates text content
func (pb *PortfolioBlock) ValidateTextContent() error {
	var textContent TextContentData
	if err := json.Unmarshal(pb.Content, &textContent); err != nil {
		return errors.New("invalid text content format")
	}

	// Validate text length
	if textContent.Text != "" && len(textContent.Text) > 10000 {
		return errors.New("text content must not exceed 10000 characters")
	}

	// Validate text align if provided
	if textContent.TextAlign != "" {
		validAligns := []string{"left", "center", "right", "justify"}
		isValid := false
		for _, align := range validAligns {
			if textContent.TextAlign == align {
				isValid = true
				break
			}
		}
		if !isValid {
			return errors.New("invalid text alignment in content")
		}
	}

	return nil
}

// ValidateImageContent validates image content
func (pb *PortfolioBlock) ValidateImageContent() error {
	var imageContent ImageContentData
	if err := json.Unmarshal(pb.Content, &imageContent); err != nil {
		return errors.New("invalid image content format")
	}

	// Validate image URL
	if imageContent.ImageURL != "" {
		if !govalidator.IsURL(imageContent.ImageURL) {
			return errors.New("invalid image URL format")
		}

		// Check for valid image extensions
		lowerURL := strings.ToLower(imageContent.ImageURL)
		validExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"}
		hasValidExt := false
		for _, ext := range validExtensions {
			if strings.Contains(lowerURL, ext) {
				hasValidExt = true
				break
			}
		}
		if !hasValidExt {
			return errors.New("image URL must point to a valid image file (jpg, jpeg, png, gif, webp, svg)")
		}
	}

	// Validate alt text length
	if imageContent.AltText != "" && len(imageContent.AltText) > 200 {
		return errors.New("image alt text must not exceed 200 characters")
	}

	// Validate caption length
	if imageContent.Caption != "" && len(imageContent.Caption) > 500 {
		return errors.New("image caption must not exceed 500 characters")
	}

	return nil
}

// ValidateBlockUpdate validates block update data
func (pb *PortfolioBlock) ValidateBlockUpdate(db *gorm.DB) error {
	// Validate base fields
	if err := pb.Validate(); err != nil {
		return err
	}

	// Check if portfolio section exists
	var section PortfolioSection
	if err := db.First(&section, pb.PortfolioSectionID).Error; err != nil {
		return errors.New("portfolio section not found")
	}

	return nil
}

// Helper function to validate hex color for blocks
func isValidBlockHexColor(color string) bool {
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
