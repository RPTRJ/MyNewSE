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

	// Create course groups (expanded list)
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
		{
			Name:        "ระบบสารสนเทศและฐานข้อมูล",
			NameEN:      "Information Systems & Databases",
			Description: "ออกแบบ พัฒนา และจัดการฐานข้อมูลและระบบสารสนเทศ",
			Icon:        "folder",
			IsActive:    true,
		},
		{
			Name:        "ออกแบบประสบการณ์ผู้ใช้ (UX)",
			NameEN:      "User Experience (UX) Design",
			Description: "ออกแบบอินเตอร์เฟซ ประสบการณ์ผู้ใช้ และองค์ประกอบการโต้ตอบ",
			Icon:        "book",
			IsActive:    true,
		},
		{
			Name:        "เครือข่ายและความปลอดภัย",
			NameEN:      "Networking & Security",
			Description: "พื้นฐานเครือข่าย คอนฟิกระบบ และแนวปฏิบัติด้านความปลอดภัย",
			Icon:        "folder",
			IsActive:    true,
		},
		{
			Name:        "การวิเคราะห์ข้อมูล",
			NameEN:      "Data Analysis",
			Description: "การเตรียมข้อมูล วิเคราะห์สถิติ และการตีความข้อมูลเชิงลึก",
			Icon:        "calculator",
			IsActive:    true,
		},
		{
			Name:        "การทดสอบและรับประกันคุณภาพ",
			NameEN:      "Testing & QA",
			Description: "เทคนิคการทดสอบซอฟต์แวร์ ระบบอัตโนมัติ และการประกันคุณภาพ",
			Icon:        "code",
			IsActive:    true,
		},
		{
			Name:        "ทักษะวิจัยและการเขียนเชิงวิชาการ",
			NameEN:      "Research & Academic Writing",
			Description: "การออกแบบการทดลอง การรวบรวมข้อมูล และการเขียนรายงานวิจัย",
			Icon:        "book",
			IsActive:    true,
		},
		{
			Name:        "การจัดการโครงการ",
			NameEN:      "Project Management",
			Description: "วางแผน จัดการทรัพยากร และติดตามงานโปรเจกต์",
			Icon:        "users",
			IsActive:    true,
		},
		{
			Name:        "การออกแบบสื่อและกราฟิก",
			NameEN:      "Media & Graphic Design",
			Description: "ออกแบบกราฟิก สื่อโฆษณา และองค์ประกอบภาพสำหรับงานนำเสนอ",
			Icon:        "folder",
			IsActive:    true,
		},
		{
			Name:        "ปฏิบัติการและบำรุงรักษาระบบ",
			NameEN:      "Operations & Maintenance",
			Description: "การดูแลระบบ ปรับปรุง และจัดการการทำงานของบริการต่าง ๆ",
			Icon:        "folder",
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

	// Link skills to course groups (extended mapping)
	courseGroupSkills := []entity.CourseGroupSkill{
		// วิชาคำนวณและตรรกะ
		{CourseGroupID: groupMap["วิชาคำนวณและตรรกะ"], SkillID: skillIDs["math"], Importance: 5, Description: "จำเป็นมากสำหรับการเรียนวิชาคำนวณ"},
		{CourseGroupID: groupMap["วิชาคำนวณและตรรกะ"], SkillID: skillIDs["logic"], Importance: 5, Description: "ช่วยในการวิเคราะห์และแก้โจทย์"},
		{CourseGroupID: groupMap["วิชาคำนวณและตรรกะ"], SkillID: skillIDs["statistics"], Importance: 4, Description: "สถิติเป็นส่วนสำคัญของการวิเคราะห์ข้อมูล"},

		// วิชาปฏิบัติการ/แลป
		{CourseGroupID: groupMap["วิชาปฏิบัติการ/แลป"], SkillID: skillIDs["experimental_design"], Importance: 5, Description: "ออกแบบการทดลองและวัดผล"},
		{CourseGroupID: groupMap["วิชาปฏิบัติการ/แลป"], SkillID: skillIDs["instrumentation"], Importance: 4, Description: "การใช้อุปกรณ์และเครื่องมือวัด"},
		{CourseGroupID: groupMap["วิชาปฏิบัติการ/แลป"], SkillID: skillIDs["patience"], Importance: 4, Description: "การทดลองต้องใช้ความอดทนและความละเอียด"},

		// วิชาเขียนโปรแกรม
		{CourseGroupID: groupMap["วิชาเขียนโปรแกรม"], SkillID: skillIDs["algorithms"], Importance: 5, Description: "พื้นฐานสำคัญของการเขียนโปรแกรม"},
		{CourseGroupID: groupMap["วิชาเขียนโปรแกรม"], SkillID: skillIDs["data_structures"], Importance: 5, Description: "โครงสร้างข้อมูลช่วยให้แก้ปัญหาได้มีประสิทธิภาพ"},
		{CourseGroupID: groupMap["วิชาเขียนโปรแกรม"], SkillID: skillIDs["debugging"], Importance: 4, Description: "ต้องแก้บั๊กและตรวจสอบโค้ด"},
		{CourseGroupID: groupMap["วิชาเขียนโปรแกรม"], SkillID: skillIDs["version_control"], Importance: 4, Description: "ควรใช้ระบบควบคุมเวอร์ชัน"},

		// วิชาทฤษฎีและหลักการ
		{CourseGroupID: groupMap["วิชาทฤษฎีและหลักการ"], SkillID: skillIDs["reading"], Importance: 4, Description: "ต้องอ่านและทำความเข้าใจเนื้อหามาก"},
		{CourseGroupID: groupMap["วิชาทฤษฎีและหลักการ"], SkillID: skillIDs["critical_thinking"], Importance: 5, Description: "ต้องวิเคราะห์และตั้งคำถาม"},

		// วิชาการสื่อสารและนำเสนอ
		{CourseGroupID: groupMap["วิชาการสื่อสารและนำเสนอ"], SkillID: skillIDs["communication"], Importance: 5, Description: "ทักษะหลักของกลุ่มวิชานี้"},
		{CourseGroupID: groupMap["วิชาการสื่อสารและนำเสนอ"], SkillID: skillIDs["public_speaking"], Importance: 4, Description: "การพูดต่อหน้ากลุ่มและการนำเสนอ"},

		// ระบบสารสนเทศและฐานข้อมูล
		{CourseGroupID: groupMap["ระบบสารสนเทศและฐานข้อมูล"], SkillID: skillIDs["database"], Importance: 5, Description: "การออกแบบและจัดการฐานข้อมูล"},
		{CourseGroupID: groupMap["ระบบสารสนเทศและฐานข้อมูล"], SkillID: skillIDs["sql"], Importance: 5, Description: "การใช้งานและเขียนคำสั่ง SQL"},

		// ออกแบบประสบการณ์ผู้ใช้ (UX)
		{CourseGroupID: groupMap["ออกแบบประสบการณ์ผู้ใช้ (UX)"], SkillID: skillIDs["ux_design"], Importance: 5, Description: "ออกแบบ UI/UX และการทดสอบผู้ใช้"},
		{CourseGroupID: groupMap["ออกแบบประสบการณ์ผู้ใช้ (UX)"], SkillID: skillIDs["visual_design"], Importance: 4, Description: "องค์ประกอบกราฟิกและสีสัน"},

		// เครือข่ายและความปลอดภัย
		{CourseGroupID: groupMap["เครือข่ายและความปลอดภัย"], SkillID: skillIDs["networking"], Importance: 5, Description: "พื้นฐานเครือข่ายและการสื่อสารข้อมูล"},
		{CourseGroupID: groupMap["เครือข่ายและความปลอดภัย"], SkillID: skillIDs["security"], Importance: 5, Description: "แนวปฏิบัติด้านความปลอดภัย"},

		// การวิเคราะห์ข้อมูล
		{CourseGroupID: groupMap["การวิเคราะห์ข้อมูล"], SkillID: skillIDs["data_analysis"], Importance: 5, Description: "เตรียมข้อมูล วิเคราะห์ และสรุปผล"},
		{CourseGroupID: groupMap["การวิเคราะห์ข้อมูล"], SkillID: skillIDs["data_visualization"], Importance: 4, Description: "สร้างภาพสรุปข้อมูล"},

		// การทดสอบและรับประกันคุณภาพ
		{CourseGroupID: groupMap["การทดสอบและรับประกันคุณภาพ"], SkillID: skillIDs["testing"], Importance: 5, Description: "การทดสอบหน่วยและการทดสอบระบบ"},
		{CourseGroupID: groupMap["การทดสอบและรับประกันคุณภาพ"], SkillID: skillIDs["automation"], Importance: 4, Description: "การทดสอบอัตโนมัติ"},

		// ทักษะวิจัยและการเขียนเชิงวิชาการ
		{CourseGroupID: groupMap["ทักษะวิจัยและการเขียนเชิงวิชาการ"], SkillID: skillIDs["research"], Importance: 5, Description: "ออกแบบการศึกษาและการเขียนรายงาน"},
		{CourseGroupID: groupMap["ทักษะวิจัยและการเขียนเชิงวิชาการ"], SkillID: skillIDs["academic_writing"], Importance: 5, Description: "เขียนเชิงวิชาการอย่างมีโครงสร้าง"},

		// การจัดการโครงการ
		{CourseGroupID: groupMap["การจัดการโครงการ"], SkillID: skillIDs["project_management"], Importance: 5, Description: "วางแผนและติดตามงานโปรเจกต์"},
		{CourseGroupID: groupMap["การจัดการโครงการ"], SkillID: skillIDs["time_management"], Importance: 4, Description: "บริหารเวลาและเดดไลน์"},

		// การออกแบบสื่อและกราฟิก
		{CourseGroupID: groupMap["การออกแบบสื่อและกราฟิก"], SkillID: skillIDs["visual_design"], Importance: 5, Description: "ทักษะออกแบบกราฟิกและสื่อ"},
		{CourseGroupID: groupMap["การออกแบบสื่อและกราฟิก"], SkillID: skillIDs["presentation"], Importance: 4, Description: "การจัดเตรียมสไลด์และสื่อการสอน"},

		// ปฏิบัติการและบำรุงรักษาระบบ
		{CourseGroupID: groupMap["ปฏิบัติการและบำรุงรักษาระบบ"], SkillID: skillIDs["devops"], Importance: 5, Description: "การดูแลระบบและการบำรุงรักษา"},
		{CourseGroupID: groupMap["ปฏิบัติการและบำรุงรักษาระบบ"], SkillID: skillIDs["monitoring"], Importance: 4, Description: "ติดตามสถานะระบบและการแจ้งเตือน"},
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
		{"algorithms", "อัลกอริทึม", "Algorithms", 1, "การออกแบบและวิเคราะห์ลำดับขั้นตอนการแก้ปัญหา"},
		{"data_structures", "โครงสร้างข้อมูล", "Data Structures", 1, "การจัดเก็บและเข้าถึงข้อมูลอย่างมีประสิทธิภาพ"},
		{"statistics", "สถิติ", "Statistics", 1, "ความรู้พื้นฐานสถิติและการแจกแจงข้อมูล"},
		{"data_analysis", "การวิเคราะห์ข้อมูล", "Data Analysis", 1, "การเตรียมข้อมูล วิเคราะห์ และสรุปผล"},
		{"data_visualization", "การแสดงข้อมูล", "Data Visualization", 3, "การสร้างกราฟและภาพเพื่อสื่อสารข้อมูล"},
		{"reading", "การอ่านเชิงวิเคราะห์", "Analytical Reading", 3, "ความสามารถในการอ่านและทำความเข้าใจเนื้อหาเชิงลึก"},
		{"critical_thinking", "การคิดวิเคราะห์", "Critical Thinking", 3, "ความสามารถในการตั้งคำถามและวิเคราะห์"},
		{"database", "ฐานข้อมูล", "Database", 1, "การออกแบบและจัดการฐานข้อมูล"},
		{"sql", "การใช้ SQL", "SQL", 1, "การเขียนคำสั่งฐานข้อมูลเพื่อดึงและจัดการข้อมูล"},
		{"debugging", "การดีบัก", "Debugging", 2, "การหาสาเหตุและแก้ไขจุดผิดพลาดในโค้ด"},
		{"version_control", "ระบบควบคุมเวอร์ชัน", "Version Control", 2, "การใช้งาน Git และการจัดการเวอร์ชันของซอฟต์แวร์"},
		{"testing", "การทดสอบ", "Testing", 2, "เทคนิคการทดสอบหน่วย การทดสอบระบบ และการประกันคุณภาพ"},
		{"automation", "การทดสอบอัตโนมัติ", "Automation", 2, "การสร้างสคริปต์และเฟรมเวิร์กเพื่อลดงานซ้ำ"},
		{"devops", "การปฏิบัติการและดีพลอย", "DevOps", 2, "แนวปฏิบัติการในการส่งมอบและดูแลระบบ"},
		{"monitoring", "การติดตามระบบ", "Monitoring", 2, "การติดตามประสิทธิภาพและสถานะของระบบ"},
		{"networking", "เครือข่ายคอมพิวเตอร์", "Networking", 1, "พื้นฐานเครือข่ายและโปรโตคอล"},
		{"security", "ความปลอดภัยสารสนเทศ", "Security", 1, "แนวปฏิบัติด้านความปลอดภัยของระบบ"},
		{"experimental_design", "การออกแบบการทดลอง", "Experimental Design", 3, "การออกแบบการทดลองอย่างเป็นระบบ"},
		{"instrumentation", "การใช้อุปกรณ์วัด", "Instrumentation", 2, "การใช้เครื่องมือและอุปกรณ์ในงานทดลอง"},
		{"ux_design", "การออกแบบ UX", "UX Design", 3, "การออกแบบประสบการณ์ผู้ใช้และการทดสอบ"},
		{"visual_design", "การออกแบบภาพ", "Visual Design", 3, "องค์ประกอบกราฟิกและการสื่อสารด้วยภาพ"},
		{"communication", "การสื่อสารเชิงวิชาชีพ", "Communication", 2, "ทักษะการสื่อสารและการนำเสนอ"},
		{"public_speaking", "การพูดในที่สาธารณะ", "Public Speaking", 2, "ทักษะการพูดและการนำเสนอ"},
		{"presentation", "การเตรียมสไลด์/สื่อ", "Presentation", 2, "การเตรียมสื่อการนำเสนอที่มีประสิทธิภาพ"},
		{"research", "ทักษะการวิจัย", "Research", 3, "การออกแบบการศึกษาและการรวบรวมข้อมูล"},
		{"academic_writing", "การเขียนเชิงวิชาการ", "Academic Writing", 3, "การเขียนรายงานและบทความเชิงวิชาการ"},
		{"project_management", "การจัดการโครงการ", "Project Management", 2, "การวางแผนและการติดตามงานโปรเจกต์"},
		{"time_management", "การบริหารเวลา", "Time Management", 2, "การบริหารเวลาอย่างมีประสิทธิภาพ"},
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
