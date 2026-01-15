package seed

import (
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

// SeedCourseGroups inserts sample course groups and their required skills.
func SeedCourseGroups() {
	db := config.GetDB()
	if db == nil {
		log.Println("SeedCourseGroups ERROR: DB is nil")
		return
	}

	// Check if already seeded
	var count int64
	db.Model(&entity.CourseGroup{}).Count(&count)
	if count > 0 {
		log.Printf("course_groups already seeded (%d rows), skipping", count)
		return
	}

	// First, ensure we have skills to link
	skillIDs := ensureSkillsExist(db)

	// Create course groups
	courseGroups := []entity.CourseGroup{
		{
			Name:        "วิชาคำนวณและตรรกะ",
			NameEN:      "Calculation & Logic",
			Description: "กลุ่มวิชาที่เน้นการคิดคำนวณ คณิตศาสตร์ สถิติ อัลกอริทึม และการคิดเชิงตรรกะ",
			Icon:        "calculator",
			IsActive:    true,
		},
		{
			Name:        "วิชาปฏิบัติการ/แลป",
			NameEN:      "Laboratory & Practical",
			Description: "กลุ่มวิชาที่เน้นการลงมือปฏิบัติจริง ทดลองในห้องแลป และการทำโปรเจกต์",
			Icon:        "flask",
			IsActive:    true,
		},
		{
			Name:        "วิชาเขียนโปรแกรม",
			NameEN:      "Programming",
			Description: "กลุ่มวิชาที่เน้นการพัฒนาซอฟต์แวร์ เขียนโค้ด และพัฒนาแอปพลิเคชัน",
			Icon:        "code",
			IsActive:    true,
		},
		{
			Name:        "วิชาทฤษฎีและหลักการ",
			NameEN:      "Theory & Principles",
			Description: "กลุ่มวิชาที่เน้นความเข้าใจทฤษฎี หลักการพื้นฐาน และแนวคิดสำคัญ",
			Icon:        "book",
			IsActive:    true,
		},
		{
			Name:        "วิชาการสื่อสารและนำเสนอ",
			NameEN:      "Communication & Presentation",
			Description: "กลุ่มวิชาที่เน้นการสื่อสาร การนำเสนอผลงาน และการทำงานเป็นทีม",
			Icon:        "users",
			IsActive:    true,
		},
	}

	if err := db.Create(&courseGroups).Error; err != nil {
		log.Println("seed course groups error:", err)
		return
	}

	// Map course groups by name for easy reference
	groupMap := make(map[string]uint)
	for _, g := range courseGroups {
		groupMap[g.Name] = g.ID
	}

	// Link skills to course groups
	courseGroupSkills := []entity.CourseGroupSkill{
		// วิชาคำนวณและตรรกะ
		{CourseGroupID: groupMap["วิชาคำนวณและตรรกะ"], SkillID: skillIDs["math"], Importance: 5, Description: "จำเป็นมากสำหรับการเรียนวิชาคำนวณ"},
		{CourseGroupID: groupMap["วิชาคำนวณและตรรกะ"], SkillID: skillIDs["logic"], Importance: 4, Description: "ช่วยในการวิเคราะห์และแก้โจทย์"},

		// วิชาปฏิบัติการ/แลป
		{CourseGroupID: groupMap["วิชาปฏิบัติการ/แลป"], SkillID: skillIDs["patience"], Importance: 4, Description: "การทดลองต้องใช้ความอดทนและความละเอียด"},
		{CourseGroupID: groupMap["วิชาปฏิบัติการ/แลป"], SkillID: skillIDs["teamwork"], Importance: 3, Description: "มักทำงานเป็นกลุ่มในห้องแลป"},

		// วิชาเขียนโปรแกรม
		{CourseGroupID: groupMap["วิชาเขียนโปรแกรม"], SkillID: skillIDs["logic"], Importance: 5, Description: "พื้นฐานสำคัญของการเขียนโปรแกรม"},
		{CourseGroupID: groupMap["วิชาเขียนโปรแกรม"], SkillID: skillIDs["problem_solving"], Importance: 5, Description: "การเขียนโค้ดคือการแก้ปัญหา"},
		{CourseGroupID: groupMap["วิชาเขียนโปรแกรม"], SkillID: skillIDs["patience"], Importance: 3, Description: "ต้องอดทนกับการ debug"},

		// วิชาทฤษฎีและหลักการ
		{CourseGroupID: groupMap["วิชาทฤษฎีและหลักการ"], SkillID: skillIDs["reading"], Importance: 4, Description: "ต้องอ่านและทำความเข้าใจเนื้อหามาก"},
		{CourseGroupID: groupMap["วิชาทฤษฎีและหลักการ"], SkillID: skillIDs["critical_thinking"], Importance: 4, Description: "ต้องวิเคราะห์และตั้งคำถาม"},

		// วิชาการสื่อสารและนำเสนอ
		{CourseGroupID: groupMap["วิชาการสื่อสารและนำเสนอ"], SkillID: skillIDs["communication"], Importance: 5, Description: "ทักษะหลักของกลุ่มวิชานี้"},
		{CourseGroupID: groupMap["วิชาการสื่อสารและนำเสนอ"], SkillID: skillIDs["teamwork"], Importance: 4, Description: "มักต้องทำงานร่วมกับผู้อื่น"},
	}

	if err := db.Create(&courseGroupSkills).Error; err != nil {
		log.Println("seed course group skills error:", err)
		return
	}

	log.Println("Seed course groups completed")
}

// ensureSkillsExist creates basic skills if they don't exist and returns a map of skill name to ID.
func ensureSkillsExist(db *gorm.DB) map[string]uint {
	skills := []struct {
		Key         string
		SkillNameTH string
		SkillNameEN string
		Category    int
		Description string
	}{
		{"math", "คณิตศาสตร์พื้นฐาน", "Basic Mathematics", 1, "ความเข้าใจในคณิตศาสตร์ระดับมัธยมปลาย"},
		{"logic", "การคิดเชิงตรรกะ", "Logical Thinking", 1, "ความสามารถในการวิเคราะห์และคิดอย่างเป็นระบบ"},
		{"problem_solving", "การแก้ปัญหา", "Problem Solving", 1, "ทักษะในการวิเคราะห์และหาทางออกให้ปัญหา"},
		{"patience", "ความอดทน", "Patience", 2, "ความอดทนและความละเอียดรอบคอบ"},
		{"teamwork", "การทำงานเป็นทีม", "Teamwork", 2, "ความสามารถในการทำงานร่วมกับผู้อื่น"},
		{"communication", "การสื่อสาร", "Communication", 2, "ทักษะการสื่อสารและการนำเสนอ"},
		{"reading", "การอ่านเชิงวิเคราะห์", "Analytical Reading", 3, "ความสามารถในการอ่านและทำความเข้าใจเนื้อหาเชิงลึก"},
		{"critical_thinking", "การคิดวิเคราะห์", "Critical Thinking", 3, "ความสามารถในการตั้งคำถามและวิเคราะห์"},
	}

	result := make(map[string]uint)

	for _, s := range skills {
		var existing entity.Skill
		err := db.Where("skill_name_en = ?", s.SkillNameEN).First(&existing).Error

		if err != nil {
			// Create new skill
			newSkill := entity.Skill{
				SkillNameTH: s.SkillNameTH,
				SkillNameEN: s.SkillNameEN,
				Category:    s.Category,
				Description: s.Description,
			}
			if err := db.Create(&newSkill).Error; err != nil {
				log.Printf("Failed to create skill %s: %v", s.Key, err)
				continue
			}
			result[s.Key] = newSkill.ID
		} else {
			result[s.Key] = existing.ID
		}
	}

	return result
}
