package seed

import (
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

func SeedColors() {
	db := config.GetDB()

	if skipIfSeededDefault(db, &entity.Colors{}, "colors") {
		return
	}

	colors := []entity.Colors{
		{
			ColorsName:      "Sunset Orange",
			PrimaryColor:    "#FF6B35",
			SecondaryColor:  "#E85A2A",
			BackgroundColor: "#FFE5DC",
			HexValue:        "#FF8C5A",
		},
		{
			ColorsName:      "Ocean Blue",
			PrimaryColor:    "#1E90FF",
			SecondaryColor:  "#00BFFF",
			BackgroundColor: "#F0F8FF",
			HexValue:        "#000080",
		},
		{
			ColorsName:      "Forest Green",
			PrimaryColor:    "#228B22",
			SecondaryColor:  "#32CD32",
			BackgroundColor: "#F5FFFA",
			HexValue:        "#006400",
		},
		{
			ColorsName:      "Royal Purple",
			PrimaryColor:    "#800080",
			SecondaryColor:  "#9370DB",
			BackgroundColor: "#F8F0FF",
			HexValue:        "#4B0082",
		},
		{
			ColorsName:      "Sunny Yellow",
			PrimaryColor:    "#FFD700",
			SecondaryColor:  "#FFFF00",
			BackgroundColor: "#FFFFF0",
			HexValue:        "#B8860B",
		},
		{
			ColorsName:      "Candy Pink",
			PrimaryColor:    "#FF69B4",
			SecondaryColor:  "#FFB6C1",
			BackgroundColor: "#FFF0F5",
			HexValue:        "#FF1493",
		},
		{
			ColorsName:      "Midnight Black",
			PrimaryColor:    "#000000",
			SecondaryColor:  "#2F4F4F",
			BackgroundColor: "#1C1C1C",
			HexValue:        "#000000",
		},
		{
			ColorsName:      "Snow White",
			PrimaryColor:    "#FFFFFF",
			SecondaryColor:  "#F5F5F5",
			BackgroundColor: "#FAFAFA",
			HexValue:        "#DCDCDC",
		},
		{
			ColorsName:      "Sky Blue",
			PrimaryColor:    "#87CEEB",
			SecondaryColor:  "#ADD8E6",
			BackgroundColor: "#E0FFFF",
			HexValue:        "#4682B4",
		},
		{
			ColorsName:      "Lavender Purple",
			PrimaryColor:    "#E6E6FA",
			SecondaryColor:  "#D8BFD8",
			BackgroundColor: "#F5F5FF",
			HexValue:        "#B0C4DE",
		},
		{
			ColorsName:      "Burgundy",       
			PrimaryColor:    "#800020",       
			SecondaryColor:  "#A31F34",      
			BackgroundColor: "#FDF4F5",        
			HexValue:        "#800020",        
		},
	}

	for _, c := range colors {
		var existing entity.Colors

		// แก้ตรงนี้: เปลี่ยน "color_name" เป็น "colors_name" ให้ตรงกับชื่อ Field ใน DB
		err := db.Where("colors_name = ?", c.ColorsName).First(&existing).Error

		if err != nil {
			// --- กรณีหาไม่เจอ (Error) -> สร้างใหม่ (Create) ---
			if err := db.Create(&c).Error; err != nil {
				log.Printf("failed to seed color %s: %v\n", c.ColorsName, err)
			} else {
				log.Printf("seeded color: %s\n", c.ColorsName)
			}
		} else {
			// --- กรณีเจอแล้ว (Else) -> อัปเดต (Update) ---
			if err := db.Model(&existing).Updates(c).Error; err != nil {
				log.Printf("failed to update color %s: %v\n", c.ColorsName, err)
			} else {
				log.Printf("updated color: %s\n", c.ColorsName)
			}
		}
	}
}
