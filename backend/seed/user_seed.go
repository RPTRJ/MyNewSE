package seed

import (
	"errors"
	"log"
	"time"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

type referenceSet struct {
	levels      []entity.EducationLevel
	schools     []entity.School
	schoolTypes []entity.SchoolType
	curriculums []entity.CurriculumType
}

func SeedUsers() {
	db := config.GetDB()

	// 1. Ensure Roles (Student, Teacher, Admin)
	studentTypeID := ensureUserType(db, "Student")
	teacherTypeID := ensureUserType(db, "Teacher")
	adminTypeID := ensureUserType(db, "Admin")

	// ID types - ลำดับสำคัญ!
	// 1 = ID Card (บัตรประชาชน - คนไทย)
	// 2 = Passport (หนังสือเดินทาง - ต่างชาติ)
	// 3 = G-Code (รหัส G - ต่างชาติ)
	idCardTypeID := ensureIDType(db, "ID Card")
	passportTypeID := ensureIDType(db, "Passport")
	gcodeTypeID := ensureIDType(db, "G-Code")

	if studentTypeID == 0 || teacherTypeID == 0 || adminTypeID == 0 || idCardTypeID == 0 {
		log.Println("skip seeding users because base reference data missing")
		return
	}

	refs := loadReferenceSet(db)

	parseDate := func(value string) time.Time {
		t, err := time.Parse("02-01-2006", value)
		if err != nil {
			return time.Time{}
		}
		return t
	}

	type seedUser struct {
		entity.User
		Completed   bool   // Whether onboarding (PDPA + profile) is already done
		StudentType string // "thai", "foreign_gcode", "foreign_passport", or empty
	}

	// 2. Create Users
	users := []seedUser{
		// =====================================
		// นักเรียนไทย (ใช้บัตรประชาชน - ID Card)
		// =====================================
		{
			// นักเรียนไทย - ยังไม่ได้ทำ onboarding
			User: entity.User{
				Email:         "student_pending@example.com",
				Password:      "password123",
				IDNumber:      "",
				Phone:         "",
				Birthday:      time.Time{},
				AccountTypeID: studentTypeID,
				IDDocTypeID:   idCardTypeID,
			},
			Completed:   false,
			StudentType: "thai",
		},
		{
			// นักเรียนไทย - ทำ onboarding แล้ว (สมชาย รักเรียน)
			User: entity.User{
				FirstNameTH:   "สมชาย",
				LastNameTH:    "รักเรียน",
				Email:         "student_th@example.com",
				Password:      "password123",
				IDNumber:      "1100000000001", // เลขบัตรประชาชน 13 หลัก
				Phone:         "0810000001",
				Birthday:      parseDate("01-01-2003"),
				AccountTypeID: studentTypeID,
				IDDocTypeID:   idCardTypeID,
			},
			Completed:   true,
			StudentType: "thai",
		},
		{
			// นักเรียนไทย - ทำ onboarding แล้ว (สมหญิง เก่งวิชา)
			User: entity.User{
				FirstNameTH:   "สมหญิง",
				LastNameTH:    "เก่งวิชา",
				Email:         "student_th2@example.com",
				Password:      "password123",
				IDNumber:      "1234567890123", // เลขบัตรประชาชน 13 หลัก
				Phone:         "0891234567",
				Birthday:      parseDate("15-06-2004"),
				AccountTypeID: studentTypeID,
				IDDocTypeID:   idCardTypeID,
			},
			Completed:   true,
			StudentType: "thai",
		},

		// =====================================
		// นักเรียนต่างชาติ (ใช้ G-Code)
		// =====================================
		{
			// นักเรียนต่างชาติ G-Code - ทำ onboarding แล้ว (John Doe)
			User: entity.User{
				FirstNameEN:   "John",
				LastNameEN:    "Doe",
				Email:         "student_en@example.com",
				Password:      "password123",
				IDNumber:      "G1234567", // G-Code: G + 7 หลัก
				Phone:         "0810000002",
				Birthday:      parseDate("02-02-2003"),
				AccountTypeID: studentTypeID,
				IDDocTypeID:   gcodeTypeID, // ใช้ G-Code
			},
			Completed:   true,
			StudentType: "foreign_gcode",
		},
		{
			// นักเรียนต่างชาติ G-Code - ทำ onboarding แล้ว (Emily Johnson)
			User: entity.User{
				FirstNameEN:   "Emily",
				LastNameEN:    "Johnson",
				Email:         "emily.j@example.com",
				Password:      "password123",
				IDNumber:      "G7654321", // G-Code: G + 7 หลัก
				Phone:         "0823456789",
				Birthday:      parseDate("20-03-2004"),
				AccountTypeID: studentTypeID,
				IDDocTypeID:   gcodeTypeID, // ใช้ G-Code
			},
			Completed:   true,
			StudentType: "foreign_gcode",
		},

		// =====================================
		// นักเรียนต่างชาติ (ใช้ Passport)
		// =====================================
		{
			// นักเรียนต่างชาติ Passport - ทำ onboarding แล้ว (Michael Chen)
			User: entity.User{
				FirstNameEN:   "Michael",
				LastNameEN:    "Chen",
				Email:         "michael.chen@example.com",
				Password:      "password123",
				IDNumber:      "AB1234567", // Passport: 6-15 ตัวอักษร/ตัวเลข
				Phone:         "0834567890",
				Birthday:      parseDate("10-08-2003"),
				AccountTypeID: studentTypeID,
				IDDocTypeID:   passportTypeID, // ใช้ Passport
			},
			Completed:   true,
			StudentType: "foreign_passport",
		},

		// =====================================
		// ครู (Teacher)
		// =====================================
		{
			User: entity.User{
				FirstNameTH:   "สมศรี",
				LastNameTH:    "สอนดี",
				Email:         "teacher_th@example.com",
				Password:      "password123",
				IDNumber:      "2100000000001",
				Phone:         "0820000001",
				Birthday:      parseDate("10-05-1980"),
				AccountTypeID: teacherTypeID,
				IDDocTypeID:   idCardTypeID,
			},
			Completed: true,
		},
		{
			User: entity.User{
				FirstNameEN:   "Robert",
				LastNameEN:    "Smith",
				Email:         "teacher_en@example.com",
				Password:      "password123",
				IDNumber:      "US12345678",
				Phone:         "0820000002",
				Birthday:      parseDate("15-08-1982"),
				AccountTypeID: teacherTypeID,
				IDDocTypeID:   passportTypeID,
			},
			Completed: true,
		},

		// =====================================
		// Admin
		// =====================================
		{
			User: entity.User{
				FirstNameTH:   "สมศักดิ์",
				LastNameTH:    "ดูแล",
				Email:         "admin_th@example.com",
				Password:      "password123",
				IDNumber:      "3100000000001",
				Phone:         "0830000001",
				Birthday:      parseDate("01-01-1990"),
				AccountTypeID: adminTypeID,
				IDDocTypeID:   idCardTypeID,
			},
			Completed: true,
		},
		{
			User: entity.User{
				FirstNameEN:   "Alice",
				LastNameEN:    "Wonder",
				Email:         "admin_en@example.com",
				Password:      "password123",
				IDNumber:      "UK98765432",
				Phone:         "0830000002",
				Birthday:      parseDate("12-12-1992"),
				AccountTypeID: adminTypeID,
				IDDocTypeID:   passportTypeID,
			},
			Completed: true,
		},
	}

	var skippedUsers []string
	var seededUsers []string

	for _, item := range users {
		user := item.User

		// Hash password
		hashed, err := config.HashPassword(user.Password)
		if err != nil {
			log.Printf("skip user %s, hash error: %v\n", user.Email, err)
			continue
		}
		user.Password = hashed

		if item.Completed {
			// Post-onboarding state
			user.PDPAConsent = true
			now := time.Now()
			user.PDPAConsentAt = &now
			user.ProfileCompleted = true
		} else {
			// Pre-onboarding state
			user.PDPAConsent = false
			user.PDPAConsentAt = nil
			user.ProfileCompleted = false
		}

		// Create User if not exists
		var existing entity.User
		if err := db.Where("email = ?", user.Email).First(&existing).Error; err == nil {
			skippedUsers = append(skippedUsers, user.Email)
			continue
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("failed to query user %s: %v\n", user.Email, err)
			continue
		}

		if err := db.Create(&user).Error; err != nil {
			log.Printf("failed to seed user %s: %v\n", user.Email, err)
			continue
		}
		seededUsers = append(seededUsers, user.Email)

		// Seed education and scores based on student type
		if item.Completed && item.StudentType != "" {
			seedEducationAndScores(db, user, refs, item.StudentType)
		}
	}

	// Summary logging
	if len(seededUsers) > 0 {
		log.Printf("seeded %d new users\n", len(seededUsers))
	}
	if len(skippedUsers) > 0 {
		log.Printf("%d users already exist, skipping\n", len(skippedUsers))
	}
}

func ensureUserType(db *gorm.DB, name string) uint {
	var userType entity.UserTypes
	if err := db.Where("type_name = ?", name).First(&userType).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("failed to query user type %s: %v\n", name, err)
			return 0
		}
		userType.TypeName = name
		if err := db.Create(&userType).Error; err != nil {
			log.Printf("failed to create user type %s: %v\n", name, err)
			return 0
		}
	}
	return userType.ID
}

func ensureIDType(db *gorm.DB, name string) uint {
	var idType entity.IDTypes
	if err := db.Where("id_name = ?", name).First(&idType).Error; err != nil {
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("failed to query id type %s: %v\n", name, err)
			return 0
		}
		idType.IDName = name
		if err := db.Create(&idType).Error; err != nil {
			log.Printf("failed to create id type %s: %v\n", name, err)
			return 0
		}
	}
	return idType.ID
}

func loadReferenceSet(db *gorm.DB) referenceSet {
	refs := referenceSet{}

	// Load education levels
	if err := db.Find(&refs.levels).Error; err != nil {
		log.Printf("failed to load education_levels: %v", err)
	}

	// Ensure at least the basic education levels exist
	if len(refs.levels) == 0 {
		defaultLevels := []entity.EducationLevel{
			{Name: "มัธยมศึกษาตอนปลาย (ม.4-ม.6)"},
			{Name: "อาชีวศึกษา (ปวช.)"},
			{Name: "อาชีวศึกษา (ปวส.)"},
			{Name: "GED"},
		}
		if err := db.Create(&defaultLevels).Error; err != nil {
			log.Printf("failed to seed default education_levels: %v", err)
		} else {
			refs.levels = defaultLevels
		}
	}

	// Load school types
	if err := db.Find(&refs.schoolTypes).Error; err != nil {
		log.Printf("failed to load school_types: %v", err)
	}

	// Ensure school types exist
	if len(refs.schoolTypes) == 0 {
		defaultSchoolTypes := []entity.SchoolType{
			{Name: "โรงเรียนรัฐบาล"},
			{Name: "โรงเรียนเอกชน"},
			{Name: "โรงเรียนนานาชาติ"},
			{Name: "ต่างประเทศ"},
		}
		if err := db.Create(&defaultSchoolTypes).Error; err != nil {
			log.Printf("failed to seed default school_types: %v", err)
		} else {
			refs.schoolTypes = defaultSchoolTypes
		}
	}

	// Load schools
	if err := db.Find(&refs.schools).Error; err != nil {
		log.Printf("failed to load schools: %v", err)
	}

	// Load curriculum types
	if err := db.Find(&refs.curriculums).Error; err != nil {
		log.Printf("failed to load curriculum_types: %v", err)
	}

	// Ensure curriculum types exist
	if len(refs.curriculums) == 0 {
		defaultCurriculums := []entity.CurriculumType{
			{Name: "สายวิทย์-คณิต"},
			{Name: "สายศิลป์-คำนวณ"},
			{Name: "สายศิลป์-ภาษา"},
		}
		if err := db.Create(&defaultCurriculums).Error; err != nil {
			log.Printf("failed to seed default curriculum_types: %v", err)
		} else {
			refs.curriculums = defaultCurriculums
		}
	}

	return refs
}

func seedEducationAndScores(db *gorm.DB, user entity.User, refs referenceSet, studentType string) {
	// Check if education already exists
	var existingEdu entity.Education
	if err := db.Where("user_id = ?", user.ID).First(&existingEdu).Error; err == nil {
		return // Education already exists
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("failed to query education for user %s: %v", user.Email, err)
		return
	}

	switch studentType {
	case "thai":
		seedThaiStudentData(db, user, refs)
	case "foreign_gcode", "foreign_passport":
		seedForeignStudentData(db, user, refs)
	}
}

func seedThaiStudentData(db *gorm.DB, user entity.User, refs referenceSet) {
	// Find Thai education level (มัธยมศึกษาตอนปลาย or อาชีวศึกษา)
	var levelID uint
	for _, level := range refs.levels {
		if level.Name == "มัธยมศึกษาตอนปลาย (ม.4-ม.6)" || level.Name == "อาชีวศึกษา (ปวช.)" {
			levelID = level.ID
			break
		}
	}
	if levelID == 0 && len(refs.levels) > 0 {
		levelID = refs.levels[0].ID
	}

	// Find Thai school type (โรงเรียนรัฐบาล)
	var schoolTypeID *uint
	for _, st := range refs.schoolTypes {
		if st.Name == "โรงเรียนรัฐบาล" {
			schoolTypeID = &st.ID
			break
		}
	}

	// Find Thai curriculum (สายวิทย์-คณิต)
	var curriculumID *uint
	for _, cur := range refs.curriculums {
		if cur.Name == "สายวิทย์-คณิต" || cur.Name == "สายศิลป์-คำนวณ" {
			curriculumID = &cur.ID
			break
		}
	}

	// Create Education
	edu := entity.Education{
		UserID:           user.ID,
		EducationLevelID: levelID,
		SchoolTypeID:     schoolTypeID,
		SchoolName:       "โรงเรียนสวนกุหลาบวิทยาลัย",
		CurriculumTypeID: curriculumID,
	}

	if err := db.Create(&edu).Error; err != nil {
		log.Printf("failed to seed education for user %s: %v", user.Email, err)
		return
	}

	// Create Academic Score for Thai student
	academicScore := entity.AcademicScore{
		UserID:     user.ID,
		GPAX:       3.75,
		GPAMath:    3.80,
		GPAScience: 3.70,
		GPAThai:    3.65,
		GPAEnglish: 3.85,
		GPASocial:  3.60,
	}

	var existingScore entity.AcademicScore
	if err := db.Where("user_id = ?", user.ID).First(&existingScore).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			if err := db.Create(&academicScore).Error; err != nil {
				log.Printf("failed to seed academic score for user %s: %v", user.Email, err)
			}
		}
	}
}

func seedForeignStudentData(db *gorm.DB, user entity.User, refs referenceSet) {
	// Find GED education level
	var levelID uint
	for _, level := range refs.levels {
		if level.Name == "GED" {
			levelID = level.ID
			break
		}
	}
	if levelID == 0 && len(refs.levels) > 0 {
		levelID = refs.levels[len(refs.levels)-1].ID // Use last one (likely GED)
	}

	// Find foreign school type (ต่างประเทศ)
	var schoolTypeID *uint
	for _, st := range refs.schoolTypes {
		if st.Name == "ต่างประเทศ" || st.Name == "โรงเรียนนานาชาติ" {
			schoolTypeID = &st.ID
			break
		}
	}

	// Create Education
	edu := entity.Education{
		UserID:           user.ID,
		EducationLevelID: levelID,
		SchoolTypeID:     schoolTypeID,
		SchoolName:       "High School - California, USA",
	}

	if err := db.Create(&edu).Error; err != nil {
		log.Printf("failed to seed education for user %s: %v", user.Email, err)
		return
	}

	// Create GED Score for foreign student
	gedScore := entity.GEDScore{
		UserID:       user.ID,
		TotalScore:   660,
		RLAScore:     165,
		MathScore:    170,
		ScienceScore: 160,
		SocialScore:  165,
	}

	var existingScore entity.GEDScore
	if err := db.Where("user_id = ?", user.ID).First(&existingScore).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			if err := db.Create(&gedScore).Error; err != nil {
				log.Printf("failed to seed GED score for user %s: %v", user.Email, err)
			}
		}
	}
}
