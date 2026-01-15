package test

import (
	"strings"
	"testing"

	. "github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/datatypes"
)

// ==================== Portfolio Validation Tests ====================

// validPortfolio returns a valid portfolio for testing
func validPortfolio() entity.Portfolio {
	return entity.Portfolio{
		PortfolioName: "My Portfolio",
		Decription:    "A sample portfolio description",
		Status:        "draft",
		ColorsID:      1,
		FontID:        1,
		UserID:        1,
	}
}

// กรณีกรอกครบทุก field ถูกต้อง - ใช้ Validate() method
func TestPortfolioValidationCompleteValid(t *testing.T) {
	g := NewGomegaWithT(t)
	portfolio := validPortfolio()
	err := portfolio.Validate()
	g.Expect(err).To(BeNil())
}

// ไม่กรอกชื่อ Portfolio
func TestPortfolioValidationPortfolioNameRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	portfolio := validPortfolio()
	portfolio.PortfolioName = ""

	err := portfolio.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("portfolio name"))
}

// กรอกชื่อ Portfolio เกิน 100 ตัวอักษร
func TestPortfolioValidationPortfolioNameTooLong(t *testing.T) {
	g := NewGomegaWithT(t)
	portfolio := validPortfolio()
	portfolio.PortfolioName = strings.Repeat("A", 101) // 101 characters

	err := portfolio.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("100"))
}

// กรอก Decription เกิน 500 ตัวอักษร
func TestPortfolioValidationDecriptionTooLong(t *testing.T) {
	g := NewGomegaWithT(t)
	portfolio := validPortfolio()
	portfolio.Decription = strings.Repeat("A", 501) // 501 characters

	err := portfolio.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("500"))
}

// กรอก Status ไม่ถูกต้อง
func TestPortfolioValidationInvalidStatus(t *testing.T) {
	g := NewGomegaWithT(t)
	portfolio := validPortfolio()
	portfolio.Status = "invalid_status"

	err := portfolio.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Status"))
}

// กรอก Status ถูกต้อง (draft, active, archived)
func TestPortfolioValidationValidStatus(t *testing.T) {
	g := NewGomegaWithT(t)

	statuses := []string{"draft", "active", "archived"}
	for _, status := range statuses {
		portfolio := validPortfolio()
		portfolio.Status = status

		err := portfolio.Validate()
		g.Expect(err).To(BeNil())
	}
}

// ==================== Colors Validation Tests ====================

// validColors returns a valid colors for testing
func validColors() entity.Colors {
	return entity.Colors{
		ColorsName:      "Blue Theme",
		PrimaryColor:    "#3498db",
		SecondaryColor:  "#2ecc71",
		BackgroundColor: "#ffffff",
	}
}

// กรณีกรอกครบทุก field ถูกต้อง
func TestColorsValidationCompleteValid(t *testing.T) {
	g := NewGomegaWithT(t)
	colors := validColors()
	err := colors.Validate()
	g.Expect(err).To(BeNil())
}

// ไม่กรอกชื่อ Colors
func TestColorsValidationColorsNameRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	colors := validColors()
	colors.ColorsName = ""

	err := colors.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Colors name"))
}

// กรอกชื่อ Colors เกิน 50 ตัวอักษร
func TestColorsValidationColorsNameTooLong(t *testing.T) {
	g := NewGomegaWithT(t)
	colors := validColors()
	colors.ColorsName = strings.Repeat("A", 51) // 51 characters

	err := colors.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("50"))
}

// กรอก PrimaryColor ไม่ใช่ Hex format
func TestColorsValidationInvalidPrimaryColor(t *testing.T) {
	g := NewGomegaWithT(t)
	colors := validColors()
	colors.PrimaryColor = "not-a-hex"

	err := colors.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Primary color"))
}

// กรอก SecondaryColor ไม่ใช่ Hex format
func TestColorsValidationInvalidSecondaryColor(t *testing.T) {
	g := NewGomegaWithT(t)
	colors := validColors()
	colors.SecondaryColor = "rgb(255,0,0)"

	err := colors.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Secondary color"))
}

// กรอก BackgroundColor ไม่ใช่ Hex format
func TestColorsValidationInvalidBackgroundColor(t *testing.T) {
	g := NewGomegaWithT(t)
	colors := validColors()
	colors.BackgroundColor = "white"

	err := colors.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("Background color"))
}

// กรอก Hex color ถูกต้องหลายรูปแบบ (#RGB, #RRGGBB, #RRGGBBAA)
func TestColorsValidationValidHexFormats(t *testing.T) {
	g := NewGomegaWithT(t)

	validHexColors := []string{"#fff", "#FFF", "#ffffff", "#FFFFFF", "#ffffffaa", "#FFFFFFAA"}
	for _, hexColor := range validHexColors {
		colors := validColors()
		colors.PrimaryColor = hexColor

		err := colors.Validate()
		g.Expect(err).To(BeNil())
	}
}

// ==================== Font Validation Tests ====================

// validFont returns a valid font for testing
func validFont() entity.Font {
	return entity.Font{
		FontFamily:   "Roboto, sans-serif",
		FontName:     "Roboto",
		FontCategory: "sans-serif",
		IsActive:     true,
	}
}

// กรณีกรอกครบทุก field ถูกต้อง
func TestFontValidationCompleteValid(t *testing.T) {
	g := NewGomegaWithT(t)
	font := validFont()
	err := font.Validate()
	g.Expect(err).To(BeNil())
}

// ไม่กรอก FontFamily
func TestFontValidationFontFamilyRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	font := validFont()
	font.FontFamily = ""

	err := font.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("font family"))
}

// ไม่กรอก FontName
func TestFontValidationFontNameRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	font := validFont()
	font.FontName = ""

	err := font.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("font name"))
}

// กรอก FontFamily เกิน 100 ตัวอักษร
func TestFontValidationFontFamilyTooLong(t *testing.T) {
	g := NewGomegaWithT(t)
	font := validFont()
	font.FontFamily = strings.Repeat("A", 101) // 101 characters

	err := font.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("100"))
}

// กรอก FontCategory ไม่ถูกต้อง
func TestFontValidationInvalidFontCategory(t *testing.T) {
	g := NewGomegaWithT(t)
	font := validFont()
	font.FontCategory = "invalid-category"

	err := font.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("font category"))
}

// กรอก FontCategory ถูกต้อง
func TestFontValidationValidFontCategories(t *testing.T) {
	g := NewGomegaWithT(t)

	categories := []string{"serif", "sans-serif", "monospace", "display", "handwriting"}
	for _, category := range categories {
		font := validFont()
		font.FontCategory = category

		err := font.Validate()
		g.Expect(err).To(BeNil())
	}
}

// กรอก FontURL ไม่ถูกต้อง
func TestFontValidationInvalidFontURL(t *testing.T) {
	g := NewGomegaWithT(t)
	font := validFont()
	font.FontURL = "not-a-valid-url"

	err := font.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("URL"))
}

// กรอก FontURL ถูกต้อง
func TestFontValidationValidFontURL(t *testing.T) {
	g := NewGomegaWithT(t)
	font := validFont()
	font.FontURL = "https://fonts.googleapis.com/css2?family=Roboto"

	err := font.Validate()
	g.Expect(err).To(BeNil())
}

// ==================== PortfolioSection Validation Tests ====================

// validPortfolioSection returns a valid portfolio section for testing
func validPortfolioSection() entity.PortfolioSection {
	return entity.PortfolioSection{
		SectionPortKey: "education",
		SectionTitle:   "Education",
		IsEnabled:      true,
		SectionOrder:   1,
		PortfolioID:    1,
	}
}

// กรณีกรอกครบทุก field ถูกต้อง
func TestPortfolioSectionValidationCompleteValid(t *testing.T) {
	g := NewGomegaWithT(t)
	section := validPortfolioSection()
	err := section.Validate()
	g.Expect(err).To(BeNil())
}

// ไม่กรอก SectionPortKey
func TestPortfolioSectionValidationSectionPortKeyRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	section := validPortfolioSection()
	section.SectionPortKey = ""

	err := section.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("section key"))
}

// ไม่กรอก SectionTitle
func TestPortfolioSectionValidationSectionTitleRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	section := validPortfolioSection()
	section.SectionTitle = ""

	err := section.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("section title"))
}

// กรอก SectionTitle เกิน 200 ตัวอักษร
func TestPortfolioSectionValidationSectionTitleTooLong(t *testing.T) {
	g := NewGomegaWithT(t)
	section := validPortfolioSection()
	section.SectionTitle = strings.Repeat("A", 201) // 201 characters

	err := section.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("200"))
}

// ไม่กรอก PortfolioID
func TestPortfolioSectionValidationPortfolioIDRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	section := validPortfolioSection()
	section.PortfolioID = 0

	err := section.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("portfolio ID"))
}

// กรอก SectionOrder ติดลบ
func TestPortfolioSectionValidationNegativeSectionOrder(t *testing.T) {
	g := NewGomegaWithT(t)
	section := validPortfolioSection()
	section.SectionOrder = -1

	err := section.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("non-negative"))
}

// ==================== PortfolioBlock Validation Tests ====================

// validPortfolioBlock returns a valid portfolio block for testing
func validPortfolioBlock() entity.PortfolioBlock {
	return entity.PortfolioBlock{
		BlockPortType:      "activity",
		BlockOrder:         1,
		PortfolioSectionID: 1,
	}
}

// กรณีกรอกครบทุก field ถูกต้อง
func TestPortfolioBlockValidationCompleteValid(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	err := block.Validate()
	g.Expect(err).To(BeNil())
}

// ไม่กรอก BlockPortType
func TestPortfolioBlockValidationBlockPortTypeRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.BlockPortType = ""

	err := block.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("block type"))
}

// ไม่กรอก PortfolioSectionID
func TestPortfolioBlockValidationPortfolioSectionIDRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.PortfolioSectionID = 0

	err := block.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("portfolio section ID"))
}

// กรอก BlockPortType ถูกต้อง
func TestPortfolioBlockValidationValidBlockTypes(t *testing.T) {
	g := NewGomegaWithT(t)

	validTypes := []string{"activity", "text", "image", "gallery", "education", "skills", "awards", "experience", "contact", "header", "divider", "spacer"}
	for _, blockType := range validTypes {
		block := validPortfolioBlock()
		block.BlockPortType = blockType

		err := block.Validate()
		g.Expect(err).To(BeNil())
	}
}

// กรอก BlockPortType ไม่ถูกต้อง
func TestPortfolioBlockValidationInvalidBlockType(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.BlockPortType = "invalid_type"

	err := block.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("invalid block type"))
}

// กรอก BlockOrder ติดลบ
func TestPortfolioBlockValidationNegativeBlockOrder(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.BlockOrder = -1

	err := block.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("non-negative"))
}

// ==================== BlockStyle and Content Validation Tests ====================

// ทดสอบ BlockStyle validation - valid
func TestPortfolioBlockStyleValidationValid(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.BlockStyle = datatypes.JSON([]byte(`{"background_color": "#ffffff", "text_color": "#000000", "text_align": "center"}`))

	err := block.Validate()
	g.Expect(err).To(BeNil())
}

// ทดสอบ BlockStyle validation - invalid hex color
func TestPortfolioBlockStyleValidationInvalidHexColor(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.BlockStyle = datatypes.JSON([]byte(`{"background_color": "not-hex"}`))

	err := block.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("invalid background color"))
}

// ทดสอบ BlockStyle validation - invalid text align
func TestPortfolioBlockStyleValidationInvalidTextAlign(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.BlockStyle = datatypes.JSON([]byte(`{"text_align": "invalid"}`))

	err := block.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("invalid text alignment"))
}

// ทดสอบ Activity Content validation - valid
func TestPortfolioBlockActivityContentValidationValid(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.BlockPortType = "activity"
	block.Content = datatypes.JSON([]byte(`{"activity_name": "Test Activity", "description": "Test description", "hours": 10}`))

	err := block.Validate()
	g.Expect(err).To(BeNil())
}

// ทดสอบ Activity Content validation - negative hours
func TestPortfolioBlockActivityContentValidationNegativeHours(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.BlockPortType = "activity"
	block.Content = datatypes.JSON([]byte(`{"activity_name": "Test", "hours": -5}`))

	err := block.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("cannot be negative"))
}

// ทดสอบ Text Content validation - valid
func TestPortfolioBlockTextContentValidationValid(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.BlockPortType = "text"
	block.Content = datatypes.JSON([]byte(`{"text": "Hello World", "text_align": "center"}`))

	err := block.Validate()
	g.Expect(err).To(BeNil())
}

// ทดสอบ Text Content validation - invalid text align
func TestPortfolioBlockTextContentValidationInvalidTextAlign(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.BlockPortType = "text"
	block.Content = datatypes.JSON([]byte(`{"text": "Hello", "text_align": "invalid"}`))

	err := block.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("invalid text alignment"))
}

// ทดสอบ Image Content validation - valid
func TestPortfolioBlockImageContentValidationValid(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.BlockPortType = "image"
	block.Content = datatypes.JSON([]byte(`{"image_url": "https://example.com/image.jpg", "alt_text": "Test image"}`))

	err := block.Validate()
	g.Expect(err).To(BeNil())
}

// ทดสอบ Image Content validation - invalid URL
func TestPortfolioBlockImageContentValidationInvalidURL(t *testing.T) {
	g := NewGomegaWithT(t)
	block := validPortfolioBlock()
	block.BlockPortType = "image"
	block.Content = datatypes.JSON([]byte(`{"image_url": "not-a-valid-url"}`))

	err := block.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("invalid image URL"))
}

// ทดสอบ SectionStyle validation - valid
func TestPortfolioSectionStyleValidationValid(t *testing.T) {
	g := NewGomegaWithT(t)
	section := validPortfolioSection()
	section.SectionStyle = datatypes.JSON([]byte(`{"background_color": "#ffffff", "text_color": "#333333"}`))

	err := section.Validate()
	g.Expect(err).To(BeNil())
}

// ทดสอบ SectionStyle validation - invalid hex color
func TestPortfolioSectionStyleValidationInvalidHexColor(t *testing.T) {
	g := NewGomegaWithT(t)
	section := validPortfolioSection()
	section.SectionStyle = datatypes.JSON([]byte(`{"background_color": "red"}`))

	err := section.Validate()
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(ContainSubstring("invalid background color"))
}
