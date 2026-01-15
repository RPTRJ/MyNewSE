package seed

import (
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

func FontSeed() {
	db := config.GetDB()
	fonts := []entity.Font{
		{
			FontFamily:   "Roboto, sans-serif",
			FontName:     "Roboto",
			FontCategory: "Sans-serif",
			FontVariant:  "400,700",
			FontURL:      "https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap",
			IsActive:     true,
		},
		{
			FontFamily:   "Open Sans, sans-serif",
			FontName:     "Open Sans",
			FontCategory: "Sans-serif",
			FontVariant:  "400,700",
			FontURL:      "https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap",
			IsActive:     true,
		},
		{
			FontFamily:   "Lato, sans-serif",
			FontName:     "Lato",
			FontCategory: "Sans-serif",
			FontVariant:  "400,700",
			FontURL:      "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap",
			IsActive:     true,
		},
		{
			FontFamily:   "Montserrat, sans-serif",
			FontName:     "Montserrat",
			FontCategory: "Sans-serif",
			FontVariant:  "400,700",
			FontURL:      "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&display=swap",
			IsActive:     true,
		},
		{
			FontFamily:   "Poppins, sans-serif",
			FontName:     "Poppins",
			FontCategory: "Sans-serif",
			FontVariant:  "400,700",
			FontURL:      "https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap",
			IsActive:     true,
		},
		{
			FontFamily:   "'Sarabun', sans-serif",
			FontName:     "Sarabun (TH)",
			FontCategory: "Sans-serif",
			FontVariant:  "300,400,700",
			FontURL:      "https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;700&display=swap",
			IsActive:     true,
		},
		{
			FontFamily:   "'Kanit', sans-serif",
			FontName:     "Kanit (TH)",
			FontCategory: "Sans-serif",
			FontVariant:  "300,400,700",
			FontURL:      "https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;700&display=swap",
			IsActive:     true,
		},

	}
	for _, font := range fonts {
		if err :=db.FirstOrCreate(&font, entity.Font{FontName: font.FontName}).Error; err != nil {
			log.Printf("failed to seed font: %v", err)
		}
	}
}