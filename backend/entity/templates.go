package entity

import (
	"errors"
	"strings"

	"github.com/asaskevich/govalidator"
	"gorm.io/gorm"
)

type Templates struct {
	gorm.Model
	TemplateName string `json:"template_name" valid:"required~Template name is required,stringlength(1|50)~Template name must be between 1 and 50 characters"`
	Description  string `json:"description" valid:"optional,stringlength(0|100)~Description must not exceed 100 characters "`
	Thumbnail    string `gorm:"type:text" json:"thumbnail" valid:"optional,url~Thumbnail must be a valid URL"`

	//FK
	Portfolio            []Portfolio           `gorm:"foreignKey:TemplateID" json:"portfolio"`
	TemplateSectionLinks []TemplateSectionLink `gorm:"foreignKey:TemplatesID" json:"template_section_links"`
	CategoryTemplateID   uint                  `json:"category_template_id" valid:"required~Category template ID is required"`
	Category             *CategoryTemplate     `gorm:"foreignKey:CategoryTemplateID" json:"category"`
}



// Validate validates the Templates struct
func (t Templates) Validate() error {
	if ok, err := govalidator.ValidateStruct(t); err != nil {
		return err
	} else if !ok {
		return errors.New("validation failed")
	}

	// Trim and validate template name
	trimmedName := strings.TrimSpace(t.TemplateName)
	if trimmedName == "" {
		return errors.New("template name cannot be empty or whitespace only")
	}

	// Validate category template ID
	if t.CategoryTemplateID == 0 {
		return errors.New("Category template ID is required")
	}

	// Validate thumbnail URL format if provided
	if t.Thumbnail != "" {
		trimmedThumbnail := strings.TrimSpace(t.Thumbnail)
		if trimmedThumbnail != "" {
			// ตรวจสอบว่าเป็น URL ที่ถูกต้อง
			if !govalidator.IsURL(trimmedThumbnail) {
				return errors.New("thumbnail must be a valid URL")
			}

			// ตรวจสอบว่าเป็น URL รูปภาพ (เช็คนามสกุลไฟล์)
			lowerURL := strings.ToLower(trimmedThumbnail)
			validExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp", ".ico"}
			isImageURL := false
			for _, ext := range validExtensions {
				if strings.HasSuffix(lowerURL, ext) {
					isImageURL = true
					break
				}
			}

			if !isImageURL {
				return errors.New("thumbnail must be an image URL (jpg, jpeg, png, gif, webp, svg, bmp, ico)")
			}
		}
	}

	return nil
}
