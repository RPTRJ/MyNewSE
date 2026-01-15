package seed

import (
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

func SeedTemplates() {
	db := config.GetDB()

	if skipIfSeededDefault(db, &entity.Templates{}, "templates") {
		return
	}

	// ดึง sections ที่มีอยู่
	var sections []entity.TemplatesSection
	db.Find(&sections)

	if len(sections) == 0 {
		log.Println("No sections found, skipping template seeding")
		return
	}

	// สร้าง map สำหรับหา section ID ตามชื่อ
	sectionMap := make(map[string]uint)
	for _, s := range sections {
		sectionMap[s.SectionName] = s.ID
	}
	//ดึงข้อมูล categories ที่มีอยู่
	var categories []entity.CategoryTemplate
	if err := db.Find(&categories).Error; err != nil {
		log.Printf("Error fetching categories: %v", err)
		return
	}

	// map สำหรับหา category ID ตามชื่อ
	categoryMap := make(map[string]uint)
	for _, c := range categories {
		categoryMap[c.CategoryName] = c.ID
	}

	templates := []struct {
		Name         string
		Category     string
		Description  string
		Thumbnail    string
		SectionNames []string
	}{
		{
			Name:        "Professional Portfolio",
			Category:    "Professional",
			Description: "เทมเพลตสำหรับสร้างพอร์ตโฟลิโอแบบมืออาชีพ",
			Thumbnail:   "https://example.com/thumbnails/professional-portfolio.jpg",
			SectionNames: []string{
				"Profile Left",
				"ผลงาน",
			},
		},
		{
			Name:        "Simple Profile",
			Category:    "Basic",
			Description: "เทมเพลตโปรไฟล์แบบเรียบง่าย",
			Thumbnail:   "https://example.com/thumbnails/simple-profile.jpg",
			SectionNames: []string{
				"Profile Right",
				"แนะนำตัว เพิ่มเติม",
				"ผลงาน",
			},
		},
		{
			Name:        "Creative Portfolio",
			Category:    "Creative",
			Description: "เทมเพลตสำหรับพอร์ตโฟลิโอแนวสร้างสรรค์",
			Thumbnail:   "https://example.com/thumbnails/creative-portfolio.jpg",
			SectionNames: []string{
				"Profile Left",
				"ผลงาน",
			},
		},
	}

	for _, t := range templates {
		catID, ok := categoryMap[t.Category]
		if !ok {
			log.Printf("Category '%s' not found for template '%s', skipping", t.Category, t.Name)
			continue
		}

		var existing entity.Templates
		if err := db.Where("template_name = ?", t.Name).First(&existing).Error; err != nil {
			// สร้าง template ใหม่
			template := entity.Templates{
				TemplateName:       t.Name,
				CategoryTemplateID: catID,
				Description:        t.Description,
				Thumbnail:          t.Thumbnail,
			}
			if err := db.Create(&template).Error; err != nil {
				log.Printf("Error seeding template %s: %v", t.Name, err)
				continue
			}

			// สร้างความสัมพันธ์ template-sections
			createdSections := 0
			for i, sectionName := range t.SectionNames {
				if sectionID, ok := sectionMap[sectionName]; ok {
					ts := entity.TemplateSectionLink{
						TemplatesID:        template.ID,
						TemplatesSectionID: sectionID,
						OrderIndex:         uint(i),
					}
					if err := db.Create(&ts).Error; err != nil {
						log.Printf("Error creating template_section: %v", err)
					} else {
						createdSections++
					}
				} else {
					log.Printf("Section '%s' not found in templates_sections", sectionName)
				}
			}
			log.Printf("Seeded template: %s (%d/%d sections)", t.Name, createdSections, len(t.SectionNames))
		} else {
			log.Printf("- Template already exists: %s", t.Name)
		}
	}
}

func SeedCategoryTemplates() {
	db := config.GetDB()
	if skipIfSeededDefault(db, &entity.CategoryTemplate{}, "category_templates") {
		return
	}
	categories := []string{
		"Professional",
		"Basic",
		"Creative",
		"Academic",
		"minimalist",
		"modern",
	}

	for _, catName := range categories {
		var existing entity.CategoryTemplate
		if err := db.Where("category_name = ?", catName).First(&existing).Error; err != nil {
			category := entity.CategoryTemplate{
				CategoryName: catName,
			}
			if err := db.Create(&category).Error; err != nil {
				log.Printf("Error seeding category %s: %v", catName, err)
				continue
			}
			log.Printf("Created category: %s", catName)
		} else {
			log.Printf("- Category already exists: %s", catName)
		}
	}
}
