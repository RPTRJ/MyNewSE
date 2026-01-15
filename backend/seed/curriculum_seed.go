package seed

import (
	"log"
	"time"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

func CurriculumSeed() {
	db := config.GetDB()

	if db == nil {
		log.Println("CurriculumSeed ERROR: DB is nil")
		return
	}

	seedUserID := firstUserID(db)
	if seedUserID == 0 {
		log.Println("CurriculumSeed skip: no user found to own curriculums (user_id is required)")
		return
	}

	// 1. Seed ข้อมูลคณะและสาขาวิชาก่อน (เพราะหลักสูตรต้องอ้างอิงสิ่งเหล่านี้)
	seedFaculties(db)
	seedPrograms(db)

	// 2. Seed ข้อมูลหลักสูตร
	seedCurriculums(db, seedUserID)
}

func seedFaculties(db *gorm.DB) {
	if skipIfSeededDefault(db, &entity.Faculty{}, "faculties") {
		return
	}

	facs := []entity.Faculty{
		{
			Name:      "สำนักวิชาวิศวกรรมศาสตร์",
			ShortName: "ENG",
		},
		{
			Name:      "สำนักวิชาวิทยาศาสตร์",
			ShortName: "SCI",
		},
	}

	if err := db.Create(&facs).Error; err != nil {
		log.Println("seed faculties error:", err)
		return
	}

	log.Println("seed faculties completed")
}

func seedPrograms(db *gorm.DB) {
	if skipIfSeededDefault(db, &entity.Program{}, "programs") {
		return
	}

	var eng entity.Faculty
	if err := db.Where("short_name = ?", "ENG").First(&eng).Error; err != nil {
		log.Println("cannot find ENG faculty:", err)
		return
	}

	progs := []entity.Program{
		{
			Name:      "วิศวกรรมคอมพิวเตอร์",
			ShortName: "CPE",
			FacultyID: eng.ID,
		},
		{
			Name:      "วิศวกรรมไฟฟ้า",
			ShortName: "EEE",
			FacultyID: eng.ID,
		},
		{
			Name:      "วิศวกรรมเครื่องกล",
			ShortName: "ME",
			FacultyID: eng.ID,
		},
	}

	if err := db.Create(&progs).Error; err != nil {
		log.Println("seed programs error:", err)
		return
	}

	log.Println("seed programs completed")
}

// ฟังก์ชันสำหรับ Seed หลักสูตร
func seedCurriculums(db *gorm.DB, userID uint) {
	if skipIfSeededDefault(db, &entity.Curriculum{}, "curriculums") {
		return
	}

	// ค้นหาข้อมูล Program และ Faculty เพื่อนำมาเชื่อมโยง (Foreign Keys)
	var cpeProg entity.Program
	if err := db.Where("short_name = ?", "CPE").First(&cpeProg).Error; err != nil {
		log.Println("seed curriculum error: cannot find CPE program")
		return
	}

	var engFac entity.Faculty
	if err := db.Where("short_name = ?", "ENG").First(&engFac).Error; err != nil {
		log.Println("seed curriculum error: cannot find ENG faculty")
		return
	}

	// สร้างข้อมูลหลักสูตรตัวอย่าง
	curriculums := []entity.Curriculum{
		{
			Code:              "CPE67",
			Name:              "วิศวกรรมคอมพิวเตอร์ 2567",
			Description:       "หลักสูตรสำหรับนักศึกษาที่สนใจด้านการพัฒนาซอฟต์แวร์, AI และระบบคอมพิวเตอร์",
			Link:              "https://cpe.sut.ac.th",
			GPAXMin:           2.75,
			PortfolioMaxPages: 10,
			Status:            "published", // สถานะ published จะทำให้นักเรียนเห็นทันที
			RoundName:         "Portfolio 1/2567",
			AcademicYear:      "2567",
			StartDate:         time.Now(),                  // วันเปิดรับสมัคร (วันนี้)
			EndDate:           time.Now().AddDate(0, 1, 0), // วันปิดรับสมัคร (อีก 1 เดือน)
			AnnouncementDate:  time.Now().AddDate(0, 1, 15),
			ApplicationPeriod: "1 - 31 มกราคม 2567",
			Quota:             40,

			FacultyID: engFac.ID,
			ProgramID: cpeProg.ID,
			UserID:    userID,
		},
		{
			Code:              "CPE68-Quata",
			Name:              "วิศวกรรมคอมพิวเตอร์ (โควตา) 2568",
			Description:       "รอบโควตาสำหรับนักเรียนเรียนดีจากโรงเรียนเครือข่าย",
			Link:              "https://cpe.sut.ac.th/quota",
			GPAXMin:           3.00,
			PortfolioMaxPages: 10,
			Status:            "draft", // สถานะ draft นักเรียนจะไม่เห็น (เห็นเฉพาะ Admin)
			RoundName:         "Quota 2/2568",
			AcademicYear:      "2568",
			StartDate:         time.Now().AddDate(0, 2, 0),
			EndDate:           time.Now().AddDate(0, 3, 0),
			AnnouncementDate:  time.Now().AddDate(0, 3, 15),
			ApplicationPeriod: "กุมภาพันธ์ 2568",
			Quota:             20,

			FacultyID: engFac.ID,
			ProgramID: cpeProg.ID,
			UserID:    userID,
		},
	}

	if err := db.Create(&curriculums).Error; err != nil {
		log.Println("seed curriculums error:", err)
		return
	}

	log.Println("seed curriculums completed")
}

// firstUserID returns the first user id to satisfy curriculum user_id FK requirement.
func firstUserID(db *gorm.DB) uint {
	var u entity.User
	if err := db.Order("id asc").First(&u).Error; err != nil {
		log.Printf("CurriculumSeed: cannot find user for FK: %v", err)
		return 0
	}
	return u.ID
}
