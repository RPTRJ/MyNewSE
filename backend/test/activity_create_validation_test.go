package test

import (
	"testing"
	"github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func TestActivityCreateValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)

	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	g.Expect(err).To(gomega.BeNil())

	err = db.AutoMigrate(&entity.Activity{})
	g.Expect(err).To(gomega.BeNil())

	t.Run("Should fail when ActivityName is too long", func(t *testing.T) {
		longName := ""
		for i := 0; i < 51; i++ {
			longName += "a"
		}

		activity := entity.Activity{
			ActivityName: longName,
		}

		err := db.Create(&activity).Error
		g.Expect(err).ToNot(gomega.BeNil())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Activity Name must be at most 50 characters"))
	})

	t.Run("Should fail when ActivityName is missing", func(t *testing.T) {
		activity := entity.Activity{
			ActivityName: "",
		}

		err := db.Create(&activity).Error
		g.Expect(err).ToNot(gomega.BeNil())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Activity Name is required"))
	})
}
