package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/router"
	"github.com/sut68/team14/backend/services"
)

func main() {
	loadEnv()

	// Initialize Local Storage
	if err := services.InitLocalStorage(); err != nil {
		log.Printf("Warning: Local Storage not initialized: %v", err)
		log.Println("File uploads will not work!")
	} else {
		log.Println("Local Storage initialized successfully")
	}

	services.StartNotificationScheduler()
	config.ConnectionDatabase()

	r := router.SetupRoutes()
	port := resolvePort()

	log.Printf("Server is running on http://localhost:%s\n", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to run server:", err)
	}
}

func loadEnv() {
	if os.Getenv("GIN_MODE") == "release" {
		return
	}
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}
}

func resolvePort() string {
	if port := os.Getenv("PORT"); port != "" {
		return port
	}
	return "8080"
}
