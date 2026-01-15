package seed

import (
	"log"

	"gorm.io/gorm"
)

// skipIfSeeded returns true when the given model already has at least minCount rows.
// It logs the status so callers can transparently report that the data is already present.
func skipIfSeeded(db *gorm.DB, model interface{}, label string, minCount int64) bool {
	var count int64
	if err := db.Model(model).Count(&count).Error; err != nil {
		log.Printf("seed check for %s failed: %v", label, err)
		return false
	}
	if count >= minCount {
		log.Printf("%s already seeded (%d rows), skipping", label, count)
		return true
	}
	return false
}

// skipIfSeededDefault is a convenience wrapper using minCount=1.
func skipIfSeededDefault(db *gorm.DB, model interface{}, label string) bool {
	return skipIfSeeded(db, model, label, 1)
}
