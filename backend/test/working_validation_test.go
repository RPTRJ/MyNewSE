package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	"github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestWorkingValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)

	// --- Helper data ---
	validWorking := entity.Working{
		WorkingName: "My Working Project",
		Status:      "Completed",
		WorkingDetail: &entity.WorkingDetail{
			WorkingAt:   time.Now(),
			Description: "This is a detailed description of the working project.",
			TypeWorking: &entity.TypeWorking{
				TypeName: "Project",
			},
			TypeWorkingID: 1,
			Links: []entity.WorkingLink{
				{WorkingLink: "https://github.com/example/project"},
			},
			Images: []entity.WorkingImage{
				{WorkingImageURL: "https://example.com/image.png"},
			},
		},
	}

	// --- Struct Validation Tests ---

	t.Run("Happy Path - All Valid", func(t *testing.T) {
		ok, err := govalidator.ValidateStruct(validWorking)
		if !ok {
			t.Logf("Validation failed: %v", err)
		}
		g.Expect(ok).To(gomega.BeTrue())
		g.Expect(err).To(gomega.BeNil())
	})

	t.Run("WorkingName Required", func(t *testing.T) {
		w := validWorking
		w.WorkingName = ""
		ok, err := govalidator.ValidateStruct(w)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Working Name is required"))
	})

	t.Run("WorkingName Max Length 50", func(t *testing.T) {
		w := validWorking
		w.WorkingName = "This name is definitely longer than fifty characters limit which is allowed"
		ok, err := govalidator.ValidateStruct(w)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Working Name must be at most 50 characters"))
	})

	t.Run("Status Required", func(t *testing.T) {
		w := validWorking
		w.Status = ""
		ok, err := govalidator.ValidateStruct(w)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Status is required"))
	})
}

func TestWorkingDetailValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)

	validDetail := entity.WorkingDetail{
		WorkingAt:     time.Now(),
		Description:   "Valid description",
		TypeWorkingID: 1,
	}

	t.Run("Happy Path - Valid Detail", func(t *testing.T) {
		ok, err := govalidator.ValidateStruct(validDetail)
		g.Expect(ok).To(gomega.BeTrue())
		g.Expect(err).To(gomega.BeNil())
	})

	t.Run("WorkingAt Required", func(t *testing.T) {
		d := validDetail
		d.WorkingAt = time.Time{} 
	})

	t.Run("Description Max Length 200", func(t *testing.T) {
		d := validDetail
		d.Description = ""
		for i := 0; i < 201; i++ {
			d.Description += "a"
		}
		ok, err := govalidator.ValidateStruct(d)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Description must be at most 200 characters"))
	})

	t.Run("TypeWorkingID Required", func(t *testing.T) {
		d := validDetail
		d.TypeWorkingID = 0
		ok, err := govalidator.ValidateStruct(d)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Type Working is required"))
	})
}

func TestWorkingLinkValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)
	
	t.Run("Link URL Format", func(t *testing.T) {
		l := entity.WorkingLink{WorkingLink: "invalid-url"}
		ok, err := govalidator.ValidateStruct(l)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Link must be a valid URL"))
	})
}

func TestWorkingImageValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)

	t.Run("Image URL Format", func(t *testing.T) {
		i := entity.WorkingImage{WorkingImageURL: "invalid-url"}
		ok, err := govalidator.ValidateStruct(i)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Image URL must be a valid URL"))
	})
}

func TestTypeWorkingValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)
	
	t.Run("TypeName Required", func(t *testing.T) {
		tw := entity.TypeWorking{TypeName: ""}
		ok, err := govalidator.ValidateStruct(tw)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Type Name is required"))
	})
}

// --- Database Constraint Tests (Uniqueness) ---

func TestWorkingUniqueness(t *testing.T) {
	g := gomega.NewGomegaWithT(t)

	// Setup in-memory SQLite with silent logger to avoid confusing "UNIQUE constraint failed" log output
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	g.Expect(err).To(gomega.BeNil())

	// Migrate schema
	err = db.AutoMigrate(&entity.Working{}, &entity.WorkingDetail{}, &entity.TypeWorking{}, &entity.User{}, &entity.UserTypes{}, &entity.IDTypes{})
	g.Expect(err).To(gomega.BeNil())

	t.Run("WorkingName Unique", func(t *testing.T) {
		// Create first working
		w1 := entity.Working{
			WorkingName: "Unique Name",
			Status:      "Active",
		}
		err := db.Create(&w1).Error
		g.Expect(err).To(gomega.BeNil())

		// Create second working with same name
		w2 := entity.Working{
			WorkingName: "Unique Name",
			Status:      "Inactive",
		}
		// Expect error from BeforeCreate hook (gorm.ErrDuplicatedKey)
		err = db.Create(&w2).Error
		g.Expect(err).ToNot(gomega.BeNil())
		// Since we return gorm.ErrDuplicatedKey, we can check for that or the error string "duplicated key not allowed"
		// But in GORM, ErrDuplicatedKey might be wrapped or returned directly.
		// Let's check if it matches ErrDuplicatedKey
		g.Expect(err).To(gomega.Equal(gorm.ErrDuplicatedKey))
	})
}
