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
	curriculums []entity.CurriculumType
}

func SeedUsers() {
	db := config.GetDB()

	// 1. Ensure Roles (Student, Teacher, Admin)
	studentTypeID := ensureUserType(db, "Student")
	teacherTypeID := ensureUserType(db, "Teacher")
	adminTypeID := ensureUserType(db, "Admin")

	// Align ID types with onboarding payload values from FE
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
		Completed bool // Whether onboarding (PDPA + profile) is already done
	}

	// 2. Create Users (students: include 1 pending onboarding, 1 TH completed, 1 EN completed)
	users := []seedUser{
		{
			// Student who still needs onboarding (PDPA not given, profile incomplete)
			User: entity.User{
				Email:         "student_pending@example.com",
				Password:      "password123",
				IDNumber:      "PENDING-ONBOARD-001",
				Phone:         "",
				Birthday:      time.Time{},
				AccountTypeID: studentTypeID,
				IDDocTypeID:   idCardTypeID,
			},
			Completed: false,
		},
		{
			// Thai Student - onboarding already done
			User: entity.User{
				FirstNameTH:   "สมชาย",
				LastNameTH:    "รักเรียน",
				Email:         "student_th@example.com",
				Password:      "password123",
				IDNumber:      "1100000000001",
				Phone:         "0810000001",
				Birthday:      parseDate("01-01-2003"),
				AccountTypeID: studentTypeID,
				IDDocTypeID:   idCardTypeID,
			},
			Completed: true,
		},
		{
			// Foreign Student - onboarding already done
			User: entity.User{
				FirstNameEN:   "John",
				LastNameEN:    "Doe",
				Email:         "student_en@example.com",
				Password:      "password123",
				IDNumber:      "1100000000002",
				Phone:         "0810000002",
				Birthday:      parseDate("02-02-2003"),
				AccountTypeID: studentTypeID,
				IDDocTypeID:   passportTypeID,
			},
			Completed: true,
		},

		// --- Teacher ---
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
				IDNumber:      "2100000000002",
				Phone:         "0820000002",
				Birthday:      parseDate("15-08-1982"),
				AccountTypeID: teacherTypeID,
				IDDocTypeID:   passportTypeID,
			},
			Completed: true,
		},

		// --- Admin ---
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
				IDNumber:      "3100000000002",
				Phone:         "0830000002",
				Birthday:      parseDate("12-12-1992"),
				AccountTypeID: adminTypeID,
				IDDocTypeID:   gcodeTypeID,
			},
			Completed: true,
		},
	}

	var skippedUsers []string
	var seededUsers []string

	for i, item := range users {
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
		} else {
			seededUsers = append(seededUsers, user.Email)
		}

		// Seed a sample education record per user (only if references exist)
		if len(refs.levels) > 0 {
			seedEducationForUser(db, user, refs, i)
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
	if err := db.Find(&refs.levels).Error; err != nil {
		log.Printf("failed to load education_levels: %v", err)
	}
	// Ensure at least the basic education levels exist so we can seed education for users
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
	if err := db.Find(&refs.schools).Error; err != nil {
		log.Printf("failed to load schools: %v", err)
	}
	if err := db.Find(&refs.curriculums).Error; err != nil {
		log.Printf("failed to load curriculum_types: %v", err)
	}
	return refs
}

func seedEducationForUser(db *gorm.DB, user entity.User, refs referenceSet, idx int) {
	var existing entity.Education
	if err := db.Where("user_id = ?", user.ID).First(&existing).Error; err == nil {
		return
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Printf("failed to query education for user %s: %v", user.Email, err)
		return
	}

	level := refs.levels[idx%len(refs.levels)]
	edu := entity.Education{
		UserID:           user.ID,
		EducationLevelID: level.ID,
		SchoolName:       "Sample School",
	}

	// Attach a school if available
	if len(refs.schools) > 0 {
		school := refs.schools[idx%len(refs.schools)]
		edu.SchoolID = &school.ID
		edu.SchoolName = school.Name
		edu.SchoolTypeID = &school.SchoolTypeID
		isPB := school.IsProjectBased
		edu.IsProjectBased = &isPB
	}

	// Attach a curriculum type if available
	if len(refs.curriculums) > 0 {
		cur := refs.curriculums[idx%len(refs.curriculums)]
		edu.CurriculumTypeID = &cur.ID
	}

	if err := db.Create(&edu).Error; err != nil {
		log.Printf("failed to seed education for user %s: %v", user.Email, err)
	}
}
