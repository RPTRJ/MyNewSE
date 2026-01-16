package seed

import (
	"fmt"
	"log"
	"time"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

// Main function สำหรับเรียก Seed นี้
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

	// 1. Seed ข้อมูลคณะและสาขาวิชา
	seedFaculties(db)
	seedPrograms(db)

	// 2. Seed ข้อมูลหลักสูตร (ที่อัปเดตใหม่)
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

	programsData := []struct {
		Name      string
		ShortName string
	}{
		{"วิศวกรรมอิเล็กทรอนิกส์", "EL"},
		{"วิศวกรรมขนส่งและโลจิสติกส์", "TL"},
		{"วิศวกรรมการผลิต", "PM"},
		{"วิศวกรรมคอมพิวเตอร์", "CPE"},
		{"วิศวกรรมพอลิเมอร์", "PEM"},
		{"วิศวกรรมยานยนต์", "AE"},
		{"วิศวกรรมสิ่งแวดล้อม", "ENV"},
		{"วิศวกรรมอุตสาหการ", "IE"},
		{"วิศวกรรมเกษตรและอาหาร", "AFE"},
		{"วิศวกรรมเคมี", "ChE"},
		{"วิศวกรรมเครื่องกล", "ME"},
		{"วิศวกรรมเซรามิก", "CME"},
		{"วิศวกรรมโทรคมนาคม", "TC"},
		{"วิศวกรรมโยธา", "CE"},
		{"วิศวกรรมโลหการ", "MET"},
		{"วิศวกรรมไฟฟ้า", "EE"},
		{"สาขาวิชาเทคโนโลยีธรณี", "GT"},
		{"วิศวกรรมออกแบบผลิตภัณฑ์", "PD"},
		{"วิศวกรรมเมคาทรอนิกส์", "MT"},
		{"วิศวกรรมธรณี", "GE"},
		{"วิศวกรรมอากาศยาน", "AERO"},
	}

	var progs []entity.Program
	for _, p := range programsData {
		progs = append(progs, entity.Program{
			Name:      p.Name,
			ShortName: p.ShortName,
			FacultyID: eng.ID,
		})
	}

	if err := db.Create(&progs).Error; err != nil {
		log.Println("seed programs error:", err)
		return
	}
	log.Println("seed programs completed")
}

// --- ส่วนที่อัปเดตใหม่ ---

// ฟังก์ชันสำหรับ Seed หลักสูตร
func seedCurriculums(db *gorm.DB, userID uint) {
	if skipIfSeededDefault(db, &entity.Curriculum{}, "curriculums") {
		return
	}

	var engFac entity.Faculty
	if err := db.Where("short_name = ?", "ENG").First(&engFac).Error; err != nil {
		log.Println("seed curriculum error: cannot find ENG faculty")
		return
	}

	var programs []entity.Program
	if err := db.Where("faculty_id = ?", engFac.ID).Find(&programs).Error; err != nil {
		log.Println("seed curriculum error: cannot find programs")
		return
	}

	programCodeMap := map[string]string{
		"EL": "25530171102731", "TL": "25540171102078", "PM": "25460171101067",
		"CPE": "25410171100026", "PEM": "25380171100023", "AE": "25480171104096",
		"ENV": "25360171100054", "IE": "25370171100033", "AFE": "25500171100419",
		"ChE": "25360171100019", "ME": "25360171100021", "CME": "25360171100032",
		"TC": "25450171101123", "CE": "25450171101134", "MET": "25370171100022",
		"EE": "25360171100043", "GT": "25380171100034", "PD": "25560171102431",
		"MT": "25490171108259", "GE": "25380171100563", "AERO": "25500171105527",
	}

	// 1. ตั้งค่า StartDate และ EndDate ที่นี่จุดเดียว
	startDate := time.Date(2026, time.January, 15, 0, 0, 0, 0, time.Local)
	endDate := time.Date(2026, time.February, 14, 23, 59, 0, 0, time.Local)
	announceDate := endDate.AddDate(0, 1, 0)

	// 2. สร้างข้อความภาษาไทยอัตโนมัติจากวันที่ด้านบน
	periodThaiString := formatThaiDateRange(startDate, endDate) 

	var curriculums []entity.Curriculum

	for _, prog := range programs {
		if code, ok := programCodeMap[prog.ShortName]; ok {
			curriculums = append(curriculums, entity.Curriculum{
				Code:              code,
				Name:              "PORTFOLIO",
				Description:       "ใบแสดงผลการเรียน/ปพ.1 ,แฟ้มผลงาน",
				Link:              "https://sut.ac.th",
				GPAXMin:           2.50,
				PortfolioMaxPages: 10,
				Status:            "published",
				RoundName:         "Portfolio 1/2569",
				AcademicYear:      "2567",
				
				// ใช้ค่าวันที่เพื่อคำนวณ Status
				StartDate:         startDate,
				EndDate:           endDate,
				AnnouncementDate:  announceDate,
				
				// ใช้ข้อความที่เจนอัตโนมัติมาแสดงผล
				ApplicationPeriod: periodThaiString,
				
				Quota:             50,
				FacultyID:         engFac.ID,
				ProgramID:         prog.ID,
				UserID:            userID,
			})
		}
	}

	if len(curriculums) > 0 {
		if err := db.Create(&curriculums).Error; err != nil {
			log.Println("seed curriculums error:", err)
			return
		}
		log.Println("seed curriculums completed:", len(curriculums), "rows")
	} else {
		log.Println("seed curriculums skipped: no matching programs found")
	}
}

// ฟังก์ชันช่วยแปลงวันที่เป็นภาษาไทย (Ex: "15 มกราคม - 14 กุมภาพันธ์ 2569")
func formatThaiDateRange(start, end time.Time) string {
	thaiMonths := []string{"", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"}

	startDay := start.Day()
	startMonth := thaiMonths[start.Month()]

	endDay := end.Day()
	endMonth := thaiMonths[end.Month()]
	endYear := end.Year() + 543 // แปลง ค.ศ. เป็น พ.ศ.

	// กรณีเดือนเดียวกัน (1 - 15 มกราคม 2569)
	if start.Month() == end.Month() {
		return fmt.Sprintf("%d - %d %s %d", startDay, endDay, endMonth, endYear)
	}
	// กรณีคนละเดือน (15 มกราคม - 14 กุมภาพันธ์ 2569)
	return fmt.Sprintf("%d %s - %d %s %d", startDay, startMonth, endDay, endMonth, endYear)
}

func firstUserID(db *gorm.DB) uint {
	var u entity.User
	if err := db.Order("id asc").First(&u).Error; err != nil {
		log.Printf("CurriculumSeed: cannot find user for FK: %v", err)
		return 0
	}
	return u.ID
}