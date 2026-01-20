package router

import (
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/controller"
	"github.com/sut68/team14/backend/middlewares"
	"github.com/sut68/team14/backend/services"
)

// CacheControlMiddleware adds cache headers for static files
func CacheControlMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Cache static files (uploads) for 1 year
		if strings.HasPrefix(c.Request.URL.Path, "/uploads") {
			c.Header("Cache-Control", "public, max-age=31536000, immutable")
			c.Header("Vary", "Accept-Encoding")
		}
		c.Next()
	}
}

func SetupRoutes() *gin.Engine {

	r := gin.Default()

	// ✅ Enable Gzip Compression - reduces bandwidth significantly
	r.Use(gzip.Gzip(gzip.DefaultCompression))

	// ✅ Cache Control for static files
	r.Use(CacheControlMiddleware())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// --- 🔒 CORS Config (Production Ready) ---
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOriginFunc = func(origin string) bool {
		// 1. อนุญาต Localhost (สำหรับ Dev)
		if strings.HasPrefix(origin, "http://localhost") || strings.HasPrefix(origin, "http://127.0.0.1") {
			return true
		}
		// 2. อนุญาต Local Network (สำหรับ Dev ผ่านวงแลน)
		if strings.HasPrefix(origin, "http://192.168") || strings.HasPrefix(origin, "http://10.") || strings.HasPrefix(origin, "http://172.") {
			return true
		}
		// 3. ✅✅✅ อนุญาตโดเมนจริง (Production) ✅✅✅
		if origin == "https://sutportfolio.online" || origin == "https://www.sutportfolio.online" {
			return true
		}
		
		return false // ❌ บล็อกเว็บอื่นๆ ที่ไม่ได้ระบุ
	}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Authorization", "Accept", "User-Agent", "Cache-Control", "Pragma"}
	corsConfig.ExposeHeaders = []string{"Content-Length"}
	corsConfig.AllowCredentials = true
	corsConfig.MaxAge = 12 * time.Hour
	r.Use(cors.New(corsConfig))

	// Serve static files
	r.Static("/uploads", "./uploads")

	// --- Init Services & Controllers ---
	db := config.GetDB()
	authService := services.NewAuthService(db)
	authController := controller.NewAuthController(authService)
	emailService := services.NewEmailService()
	passwordResetService := services.NewPasswordResetService(db, emailService)
	passwordResetController := controller.NewPasswordResetController(passwordResetService)
	userController := controller.NewUserController()
	curriculumController := controller.NewCurriculumController()
	facultyController := controller.NewFacultyController()
	programController := controller.NewProgramController()
	selectionController := controller.NewSelectionController()
	profileController := controller.NewProfileController(db)
	referenceController := controller.NewReferenceController(db)
	educationAdminController := controller.NewEducationAdminController(db)
	courseGroupController := controller.NewCourseGroupController()

	// --- Public Routes ---
	authController.RegisterRoutes(r)
	passwordResetController.RegisterRoutes(r)
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "pong"})
	})

	// Upload Route (Public)
	uploadController := controller.NewUploadController()
	r.POST("/upload", uploadController.UploadFile)
	r.DELETE("/upload/:filename", uploadController.DeleteFile)

	// WebSocket Route (Public)
	r.GET("/ws", controller.WebSocketHandler)
	
	// Test Notification (Dev Only - ลบออกได้ตอนขึ้น Production จริงๆ หรือจะเก็บไว้เทสก็ได้)
	r.GET("/test-noti", func(c *gin.Context) {
		userIDStr := c.Query("user_id")
		uid, _ := strconv.Atoi(userIDStr)
		services.SendNotificationToUser(uid, map[string]interface{}{
			"notification_title":   "🔔 ทดสอบระบบ",
			"notification_message": "ระบบแจ้งเตือน Real-time ใช้งานได้แล้ว!",
		})
		c.JSON(200, gin.H{"message": "Sent test notification"})
	})

	// --- Protected Routes (ต้อง Login) ---
	protected := r.Group("")
	protected.Use(middlewares.Authorization())
	userController.RegisterSelfRoutes(protected)

	protected.GET("/reference/education-levels", referenceController.GetEducationLevels)
	protected.GET("/reference/school-types", referenceController.GetSchoolTypes)
	protected.GET("/reference/curriculum-types", referenceController.GetCurriculumTypes)
	protected.GET("/reference/schools", referenceController.SearchSchools)

	// --- User Profile (full profile) ---
	protected.GET("/users/me/profile", profileController.GetMe)
	protected.GET("/users/me/onboarding", profileController.GetOnboardingStatus)

	protected.PUT("/users/me", profileController.UpdateMe)
	protected.PUT("/users/me/personal-info", profileController.UpdatePersonalInfo)
	protected.PUT("/users/me/profile-image", profileController.UpdateProfileImage)
	protected.PUT("/users/me/education", profileController.UpsertEducation)
	protected.PUT("/users/me/academic-score", profileController.UpsertAcademicScore)
	protected.PUT("/users/me/ged-score", profileController.UpsertGEDScore)
	protected.PUT("/users/me/language-scores", profileController.ReplaceLanguageScores)

	// --- Onboarded Routes (ต้องผ่านการ Onboard) ---
	protectedOnboarded := protected.Group("")
	protectedOnboarded.Use(middlewares.RequireOnboarding())

	// --- Teacher Protected Routes ---
	teacher := protectedOnboarded.Group("/teacher")
	{
		teacher.GET("/users/:id/profile", profileController.GetUserProfile)
	}

	userController.RegisterRoutes(protectedOnboarded)

	// Register Routes เดิม
	curriculumController.RegisterRoutes(r, protectedOnboarded)
	facultyController.RegisterRoutes(r, protected)
	programController.RegisterRoutes(r, protected)
	courseGroupController.RegisterRoutes(r, protectedOnboarded)

	// Selection & Notification Routes
	r.POST("/selections", selectionController.ToggleSelection)
	r.GET("/selections", selectionController.GetMySelections)
	r.POST("/selections/notify", selectionController.ToggleNotification)
	r.GET("/notifications", selectionController.GetNotifications)
	r.PATCH("/notifications/:id/read", selectionController.MarkAsRead)

	// --- Admin Protected Routes (ย้ายมาไว้ในกลุ่มที่ต้อง Login) ---
	adminProtected := protectedOnboarded.Group("/admin")
	{
		adminProtected.GET("/users/:id/profile", profileController.GetUserProfile)
		// ✅ ย้าย Route สถิติมาไว้ตรงนี้ เพื่อความปลอดภัย
		adminProtected.GET("/curricula/stats", curriculumController.GetSelectionStats)
	}

	// Education reference management (admin)
	educationAdminController.RegisterRoutes(protectedOnboarded)

	// Other Routes (บางอันอาจจะยัง Public อยู่ตามโค้ดเดิม ถ้าต้องการ Protect ให้ย้ายมาใส่ในกลุ่ม protected)
	TemplateBlockRoutes(r)
	TemplateSectionsRoutes(r)
	SectionBlockRoutes(r)
	TemplateRoutes(r)
	CategoryTemplateRoutes(r)

	// ระบบแฟ้มสะสมผลงาน (Portfolio)
	PortfolioRoutes(protected)

	ColorsRoutes(r)
	WorkingRoutes(protected)
	ActivityRoutes(protected)
	FontRoutes(r)

	// Scorecard & Feedback
	RegisterFeedbackRoutes(r, db)
	RegisterPortfolioSubmissionRoutes(r, db)
	RegisterScoreCriteriaRoutes(r, db)
	RegisterScorecardRoutes(r, db)

	// Announcement & Others
	AnnouncementRouter(r)
	CetagoryRouter(r)
	AttachmentRouter(r)
	AdminLogRouter(r)
	RouterNotification(r)

	return r
}