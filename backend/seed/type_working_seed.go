package seed

import (
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

func SeedTypeWorkings() {
	db := config.GetDB()

	if skipIfSeededDefault(db, &entity.TypeWorking{}, "type_workings") {
		return
	}

	typeNames := []string{
		"วิศวกรรม",
		"ศิลปะ",
		"คอมพิวเตอร์",
		"วิทยาศาสตร์",
		// เพิ่มได้ตามใจ
	}

	for _, name := range typeNames {
		var typeWorking entity.TypeWorking

		if err := db.
			Where("type_name = ?", name).
			First(&typeWorking).Error; err != nil {

			typeWorking.TypeName = name

			if err := db.Create(&typeWorking).Error; err != nil {
				log.Printf("failed to seed type_working %s: %v\n", name, err)
			} else {
				log.Printf("seeded type_working: %s\n", name)
			}
		}
	}
}
