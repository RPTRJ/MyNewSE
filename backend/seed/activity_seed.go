package seed

import (
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

func SeedActivities() {
	SeedLevelActivities()
	SeedRewards()
	SeedTypeActivities()
}

func SeedLevelActivities() {
	db := config.GetDB()
	if skipIfSeededDefault(db, &entity.LevelActivity{}, "level_activities") {
		return
	}
	levels := []string{
		"ระดับเขต",
		"ระดับอำเภอ",
		"ระดับจังหวัด",
		"ระดับภูมิภาค",
		"ระดับประเทศ",
		"ระดับโลก",
	}

	for _, name := range levels {
		var level entity.LevelActivity
		if err := db.Where("level_name = ?", name).First(&level).Error; err != nil {
			level.LevelName = name
			if err := db.Create(&level).Error; err != nil {
				log.Printf("failed to seed level_activity %s: %v\n", name, err)
			} else {
				log.Printf("seeded level_activity: %s\n", name)
			}
		}
	}
}

func SeedRewards() {
	db := config.GetDB()
	if skipIfSeededDefault(db, &entity.Reward{}, "rewards") {
		return
	}
	rewards := []string{
		"รางวัลเข้าร่วม",
		"รางวัลชมเชย",
		"รางวัลรองชนะเลิศอันดับ 2",
		"รางวัลรองชนะเลิศอันดับ 1",
		"รางวัลชนะเลิศ",
	}

	for _, name := range rewards {
		var reward entity.Reward
		// Note: The JSON tag in entity/reward.go is `level_name` but database column defaults to field name (snake case) usually.
		// However, we query by the struct field name via GORM.
		if err := db.Where("reward_name = ?", name).First(&reward).Error; err != nil {
			reward.Reward_Name = name
			if err := db.Create(&reward).Error; err != nil {
				log.Printf("failed to seed reward %s: %v\n", name, err)
			} else {
				log.Printf("seeded reward: %s\n", name)
			}
		}
	}
}

func SeedTypeActivities() {
	db := config.GetDB()
	if skipIfSeededDefault(db, &entity.TypeActivity{}, "type_activities") {
		return
	}
	types := []string{
		"ค่ายวิชาการ",
		"ศิลปะหัตถกรรม",
		"วิทยาศาตร์",
		"คอมพิวเตอร์",
		"ศิลปะ",
		"วิศวกรรมศาสตร์",
	}

	for _, name := range types {
		var typeActivity entity.TypeActivity
		if err := db.Where("type_name = ?", name).First(&typeActivity).Error; err != nil {
			typeActivity.TypeName = name
			if err := db.Create(&typeActivity).Error; err != nil {
				log.Printf("failed to seed type_activity %s: %v\n", name, err)
			} else {
				log.Printf("seeded type_activity: %s\n", name)
			}
		}
	}
}
