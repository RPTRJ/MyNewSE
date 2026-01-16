package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/seed"
)

func main() {
	loadEnv()
	config.ConnectionDatabase()
	seed.SeedCourseGroups()
	seed.SeedProfileReference()
	seed.SeedUsers()
	seed.CurriculumSeed()
	seed.SeedCurriculumRecommendations()
	seed.SeedTemplateBlocks()
	seed.SeedTemplatesSections()
	seed.SeedCategoryTemplates()
	seed.SeedTemplates()
	seed.SeedTypeWorkings()
	seed.SeedActivities()
	seed.SeedColors()
	seed.SeedFonts()
	log.Println("Seed completed successfully")
}

func loadEnv() {
	if os.Getenv("GIN_MODE") == "release" {
		return
	}
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}
}
