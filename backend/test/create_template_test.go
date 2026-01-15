package test

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	. "github.com/onsi/gomega"
	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/controller"
)

var once sync.Once

// ฟังก์ชันช่วยสำหรับตั้งค่า database ทดสอบ (เรียกแค่ครั้งเดียว)
func setupTestDB() {
	once.Do(func() {
		// โหลด .env file
		if err := godotenv.Load("../.env"); err != nil {
			log.Println("Warning: .env file not found, using environment variables")
		}
		// เชื่อมต่อ database
		config.ConnectionDatabase()
	})
}

// ฟังก์ชันช่วยสร้าง router สำหรับทดสอบ
func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.POST("/templates", controller.CreateTemplate)
	return router
}

// ฟังก์ชันช่วยส่ง request ทดสอบ
func sendRequest(router *gin.Engine, body map[string]interface{}) *httptest.ResponseRecorder {
	jsonData, _ := json.Marshal(body)
	req, _ := http.NewRequest("POST", "/templates", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	return w
}

// ทดสอบสร้าง template สำเร็จ
func TestCreateTemplateSuccess(t *testing.T) {
	g := NewWithT(t)
	setupTestDB()
	router := setupRouter()

	body := map[string]interface{}{
		"template_name":        "Professional Portfolio",
		"category_template_id": 1,
		"description":          "A professional template",
		"thumbnail":            "http://localhost:8080/uploads/test.jpg",
		"section_ids":          []uint{1, 2},
	}

	w := sendRequest(router, body)

	g.Expect(w.Code).To(Equal(http.StatusCreated))
}

// ทดสอบไม่เลือก section
func TestCreateTemplateMissingSections(t *testing.T) {
	g := NewWithT(t)
	setupTestDB()
	router := setupRouter()

	body := map[string]interface{}{
		"template_name":        "Test Template",
		"category_template_id": 1,
		"section_ids":          []uint{},
	}

	w := sendRequest(router, body)
	g.Expect(w.Code).To(Equal(http.StatusBadRequest))
}

// ทดสอบเลือก section แค่ 1 รายการ
func TestCreateTemplateOnlyOneSection(t *testing.T) {
	g := NewWithT(t)
	setupTestDB()
	router := setupRouter()

	body := map[string]interface{}{
		"template_name":        "Test Template",
		"category_template_id": 1,
		"section_ids":          []uint{1},
	}

	w := sendRequest(router, body)
	g.Expect(w.Code).To(Equal(http.StatusBadRequest))
}
