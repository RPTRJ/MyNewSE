package config

import (
	"fmt"
	"log"
	"os"

	"github.com/sut68/team14/backend/entity"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

func ConnectionDatabase() {
	host := os.Getenv("DB_HOST")
	user := os.Getenv("DB_USER")
	password := os.Getenv("DB_PASSWORD")
	dbname := os.Getenv("DB_NAME")
	port := os.Getenv("DB_PORT")

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Bangkok",
		host, user, password, dbname, port)

	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	db = database

	if os.Getenv("SKIP_MIGRATION") != "true" {
		SetupDatabase()
		log.Println("Connected to database and ran migrations")
	} else {
		log.Println("Connected to database (migrations skipped)")
	}
}

// ====================================================
//
//	เพิ่ม entity ตรงนี้เด้อ
//
// ====================================================
func SetupDatabase() {
	if err := db.AutoMigrate(
		&entity.User{},
		&entity.UserTypes{},
		&entity.IDTypes{},
		&entity.Education{},
		&entity.EducationLevel{},
		&entity.SchoolType{},
		&entity.School{},
		&entity.CurriculumType{},
		&entity.AcademicScore{},
		&entity.GEDScore{},
		&entity.LanguageProficiencyScore{},
		&entity.Activity{},
		&entity.ActivityDetail{},
		&entity.ActivityImage{},
		&entity.TypeActivity{},
		&entity.LevelActivity{},
		&entity.Working{},
		&entity.TypeWorking{},
		&entity.WorkingDetail{},
		&entity.WorkingImage{},
		&entity.WorkingLink{},
		&entity.Font{},
		&entity.Colors{},
		&entity.Templates{},
		&entity.TemplatesSection{},
		&entity.TemplatesBlock{},
		&entity.Portfolio{},
		&entity.PortfolioSection{},
		&entity.PortfolioBlock{},
		&entity.PortfolioWork{},
		&entity.PortfolioActivity{},
		&entity.PortfolioSubmission{},
		&entity.Feedback{},
		&entity.Scorecard{},
		&entity.ScoreCriteria{},
		&entity.Cetagory{},
		&entity.Announcement{},
		&entity.Announcement_Attachment{},
		&entity.Notification{},
		&entity.Admin_Log{},
		&entity.Faculty{},
		&entity.Program{},
		&entity.Curriculum{},
		&entity.DocumentType{},
		&entity.CurriculumRequiredDocument{},
		&entity.CurriculumSkill{},
		&entity.Skill{},
		&entity.CourseGroup{},
		&entity.CourseGroupSkill{},
		&entity.CurriculumCourseGroup{},
		&entity.SectionBlock{},
		&entity.TemplateSectionLink{},
		&entity.Event{},
		&entity.Selection{},
		&entity.PasswordReset{},
	); err != nil {
		log.Fatal("Failed to migrate database:", err)
	}
}

// get
func GetDB() *gorm.DB {
	return db
}

func ConnectionSQLite() {
	database, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect to sqlite database")
	}
	db = database
	SetupDatabase()
}
