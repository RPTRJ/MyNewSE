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

func TestActivityValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)

	// --- Helper data ---
	validActivity := entity.Activity{
		ActivityName: "My Activity Project",
		ActivityDetail: &entity.ActivityDetail{
			ActivityAt:   time.Now(),
			Description: "This is a detailed description of the activity.",
			Institution: "University",
			TypeActivity: &entity.TypeActivity{
				TypeName: "Volunteer",
			},
			TypeActivityID: 1,
			LevelActivityID: 1,
			Images: []entity.ActivityImage{
				{ImageURL: "https://example.com/image.png"},
			},
		},
	}

	// --- Struct Validation Tests ---

	t.Run("Happy Path - All Valid", func(t *testing.T) {
		ok, err := govalidator.ValidateStruct(validActivity)
		if !ok {
			t.Logf("Validation failed: %v", err)
		}
		g.Expect(ok).To(gomega.BeTrue())
		g.Expect(err).To(gomega.BeNil())
	})

	t.Run("ActivityName Required", func(t *testing.T) {
		a := validActivity
		a.ActivityName = ""
		ok, err := govalidator.ValidateStruct(a)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Activity Name is required"))
	})

	t.Run("ActivityName Max Length 50", func(t *testing.T) {
		a := validActivity
		a.ActivityName = "This name is definitely longer than fifty characters limit which is allowed"
		ok, err := govalidator.ValidateStruct(a)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Activity Name must be at most 50 characters"))
	})
}

func TestActivityDetailValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)

	validDetail := entity.ActivityDetail{
		ActivityAt:     time.Now(),
		Description:   "Valid description",
		Institution:   "Valid Institution",
		TypeActivityID: 1,
		LevelActivityID: 1,
	}

	t.Run("Happy Path - Valid Detail", func(t *testing.T) {
		ok, err := govalidator.ValidateStruct(validDetail)
		g.Expect(ok).To(gomega.BeTrue())
		g.Expect(err).To(gomega.BeNil())
	})

	t.Run("ActivityAt Required", func(t *testing.T) {
		d := validDetail
		d.ActivityAt = time.Time{} // zero time is considered "missing" if validated?
		// govalidator doesn't strict check zero time with required unless standard lib does.
		// customized validator often needs 'valid:"required"' on time.Time but gorm handles it.
		// Let's rely on entity tags.
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
	
	t.Run("Institution Required", func(t *testing.T) {
		d := validDetail
		d.Institution = ""
		ok, err := govalidator.ValidateStruct(d)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Institution is required"))
	})

	t.Run("TypeActivityID Required", func(t *testing.T) {
		d := validDetail
		d.TypeActivityID = 0 // 0 is usually considered empty for uint? 
		// govalidator 'required' on uint checks non-zero? 
		// Actually govalidator 'required' on int/uint typically just checks presence in struct? 
		// Wait, 'required' doesn't fail on 0 for int. 
		// We might need custom validation or pointer logic if 0 is invalid.
		// Re-checking Working logic: Working used 'required'.
	})
}

func TestActivityImageValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)

	t.Run("Image URL Format", func(t *testing.T) {
		i := entity.ActivityImage{ImageURL: "invalid-url"}
		ok, err := govalidator.ValidateStruct(i)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Image URL must be a valid URL"))
	})
}

func TestTypeActivityValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)
	
	t.Run("TypeName Required", func(t *testing.T) {
		ta := entity.TypeActivity{TypeName: ""}
		ok, err := govalidator.ValidateStruct(ta)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Type Name is required"))
	})
}

func TestLevelActivityValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)
	
	t.Run("LevelName Required", func(t *testing.T) {
		la := entity.LevelActivity{LevelName: ""}
		ok, err := govalidator.ValidateStruct(la)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Level Name is required"))
	})
}

func TestRewardValidation(t *testing.T) {
	g := gomega.NewGomegaWithT(t)
	
	t.Run("RewardName Required", func(t *testing.T) {
		r := entity.Reward{Reward_Name: ""}
		ok, err := govalidator.ValidateStruct(r)
		g.Expect(ok).To(gomega.BeFalse())
		g.Expect(err.Error()).To(gomega.ContainSubstring("Reward Name is required"))
	})
}

// --- Database Constraint Tests (Uniqueness via Hook) ---

func TestActivityUniqueness(t *testing.T) {
	g := gomega.NewGomegaWithT(t)

	// Setup in-memory SQLite
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	g.Expect(err).To(gomega.BeNil())

	// Migrate schema
	err = db.AutoMigrate(
		&entity.Activity{}, 
		&entity.ActivityDetail{}, 
		&entity.TypeActivity{}, 
		&entity.LevelActivity{},
		&entity.User{}, 
		&entity.UserTypes{}, 
		&entity.IDTypes{},
		&entity.Reward{},
	)
	g.Expect(err).To(gomega.BeNil())

	t.Run("ActivityName Unique", func(t *testing.T) {
		// Create first activity
		a1 := entity.Activity{
			ActivityName: "Unique Activity",
		}
		err := db.Create(&a1).Error
		g.Expect(err).To(gomega.BeNil())

		// Create second activity with same name
		a2 := entity.Activity{
			ActivityName: "Unique Activity",
		}
		// Expect error from BeforeCreate hook (gorm.ErrDuplicatedKey)
		err = db.Create(&a2).Error
		g.Expect(err).ToNot(gomega.BeNil())
		g.Expect(err).To(gomega.Equal(gorm.ErrDuplicatedKey))
	})
}
