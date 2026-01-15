package seed

import (
	"encoding/json"
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/datatypes"
	"gorm.io/gorm"
)

func SeedTemplatesSections() {
	db := config.GetDB()

	if skipIfSeededDefault(db, &entity.TemplatesSection{}, "template_sections") {
		return
	}

	// ดึง blocks ที่มีอยู่
	var blocks []entity.TemplatesBlock
	db.Find(&blocks)

	if len(blocks) == 0 {
		log.Println("No blocks found, skipping section seeding")
		return
	}

	// สร้าง map สำหรับหา block ID ตามชื่อ
	blockMap := make(map[string]uint)
	for _, b := range blocks {
		blockMap[b.BlockName] = b.ID
	}

	sections := []struct {
		Name       string
		Type       string
		Layout     string
		BlockNames []string
	}{
		{
			Name:   "Profile Left",
			Type:   "Profile",
			Layout: "profile_header_left",
			BlockNames: []string{
				"profile_picture",
				"textbox1",
				"textbox2",
			},
		},
		{
			Name:   "ผลงาน",
			Type:   "working",
			Layout: "two_pictures_two_texts",
			BlockNames: []string{
				"picture1",
				"picture1",
				"textbox1",
				"textbox1",
			},
		},
		{
			Name:   "กิจกรรม",
			Type:   "activity",
			Layout: "two_pictures_two_texts",
			BlockNames: []string{
				"picture1",
				"picture1",
				"textbox1",
				"textbox1",
			},
		},
		{
			Name:   "Profile Right",
			Type:   "Profile",
			Layout: "profile_header_right",
			BlockNames: []string{
				"textbox1",
				"textbox2",
				"profile_picture",
			},
		},
		{
			Name: "แนะนำตัว เพิ่มเติม",
			Type: "about me",
			BlockNames: []string{
				"textbox1",
				"textbox1",
				"textbox2",
				"textbox2",
			},
		},
	}

	for _, s := range sections {
		var existing entity.TemplatesSection
		err := db.Where("section_name = ?", s.Name).First(&existing).Error

		var sectionID uint

		if err == gorm.ErrRecordNotFound {
			section := entity.TemplatesSection{
				SectionName: s.Name,
				LayoutType:  s.Layout,
				// SectionType: s.Type,
			}
			if err := db.Create(&section).Error; err != nil {
				log.Printf("Error seeding section %s: %v", s.Name, err)
				continue
			}
			log.Printf("Created section: %s", s.Name)
			sectionID = section.ID

		} else {
			log.Printf("- Section already exists: %s", s.Name)
			sectionID = existing.ID

			db.Where("templates_section_id = ?", sectionID).Delete(&entity.SectionBlock{})
		}

		createBlock := 0
		for i, blockName := range s.BlockNames {
			if blockID, ok := blockMap[blockName]; ok {

				var flexSettings, Position datatypes.JSON
				// กำหนดค่า layout ตามประเภท section
				switch s.Layout {
				case "profile_header_left":
					if i == 0 { // บล็อกรูปโปรไฟล์
						flexSettings, _ = json.Marshal(map[string]string{
							"width":        "200px",
							"height":       "200px",
							"flexShrink":   "0",
							"borderRadius": "50%",
						})
						Position, _ = json.Marshal(map[string]string{
							"float":       "left",
							"marginRight": "20px",
						})
					} else { // บล็อกข้อความ - เรียงลงมาทางขวา
						flexSettings, _ = json.Marshal(map[string]string{
							"marginBottom": "10px",
						})
						Position, _ = json.Marshal(map[string]string{
							"display":  "block",
							"overflow": "hidden",
						})
					}
				case "two_pictures_two_texts":
					if i < 2 { // บล็อกรูปภาพ (2 อันแรก - แถวบน)
						flexSettings, _ = json.Marshal(map[string]string{
							"width":  "48%",
							"margin": "0 1%",
						})
						Position, _ = json.Marshal(map[string]string{
							"display":       "inline-block",
							"verticalAlign": "top",
							"marginBottom":  "20px",
						})
					} else { // บล็อกข้อความ (2 อันหลัง - แถวล่าง)
						flexSettings, _ = json.Marshal(map[string]string{
							"width":  "48%",
							"margin": "0 1%",
						})
						Position, _ = json.Marshal(map[string]string{
							"display":       "inline-block",
							"verticalAlign": "top",
						})
					}
				case "profile_header_right":
					if i == 2 { // บล็อกรูปโปรไฟล์ (อยู่ตำแหน่งที่ 3)
						flexSettings, _ = json.Marshal(map[string]string{
							"width":        "200px",
							"height":       "200px",
							"flexShrink":   "0",
							"borderRadius": "50%",
						})
						Position, _ = json.Marshal(map[string]string{
							"float":      "right",
							"marginLeft": "20px",
							"marginTop":  "-230px",
						})
					} else { // บล็อกข้อความ - เรียงลงมาทางซ้าย
						flexSettings, _ = json.Marshal(map[string]string{
							"width":        "calc(100% - 220px)",
							"marginBottom": "10px",
						})
						Position, _ = json.Marshal(map[string]string{
							"display": "block",
						})
					}
				}

				sb := entity.SectionBlock{
					TemplatesSectionID: sectionID,
					TemplatesBlockID:   blockID,
					OrderIndex:         i,
					LayoutType:         "flex",
					FlexSettings:       flexSettings,
					Position:           Position,
				}
				if err := db.Create(&sb).Error; err != nil {
					log.Printf("Error creating section_block: %v", err)
				} else {
					createBlock++
				}
			} else {
				log.Printf("Block '%s' not found in templates_blocks", blockName)
			}
			log.Printf("Seeded section: %s (%d/%d blocks)", s.Name, createBlock, len(s.BlockNames))
		}

	}
}
