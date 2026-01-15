package test

import (
	"testing"
	"github.com/sut68/team14/backend/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestCetagoryValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid Cetagory", func(t *testing.T) {
		cetagory := entity.Cetagory{
			Cetagory_Name: "General",
		}

		ok, err := govalidator.ValidateStruct(cetagory)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Cetagory_Name is required", func(t *testing.T) {
		cetagory := entity.Cetagory{
			Cetagory_Name: "",
		}

		ok, err := govalidator.ValidateStruct(cetagory)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Cetagory_Name"))
	})

	t.Run("Cetagory_Name minimum length", func(t *testing.T) {
		cetagory := entity.Cetagory{
			Cetagory_Name: "AB",
		}

		ok, err := govalidator.ValidateStruct(cetagory)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Cetagory_Name"))
	})

	t.Run("Cetagory_Name maximum length", func(t *testing.T) {
		longName := "This is a very long category name that exceeds the maximum allowed length for category names in the system and should fail validation"
		cetagory := entity.Cetagory{
			Cetagory_Name: longName,
		}

		ok, err := govalidator.ValidateStruct(cetagory)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Cetagory_Name"))
	})
}