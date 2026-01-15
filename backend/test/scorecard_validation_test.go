package test

import (
	"testing"
	"github.com/sut68/team14/backend/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestScorecardValidation(t *testing.T) {
	govalidator.SetFieldsRequiredByDefault(false)
	t.Run("Valid Scorecard", func(t *testing.T) {
		g := NewGomegaWithT(t)
		scorecard := entity.Scorecard{
			Total_Score:           85.5,
			Max_Score:             100.0,
			General_Comment:       "Overall good performance",
			Create_at:             "2024-01-15T10:30:00Z",
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(&scorecard)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Total_Score is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		scorecard := entity.Scorecard{
			Max_Score:             100.0,
			General_Comment:       "Overall good performance",
			Create_at:             "2024-01-15T10:30:00Z",
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(&scorecard)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Total_Score"))
	})

	t.Run("Max_Score is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		scorecard := entity.Scorecard{
			Total_Score:           85.5,
			Max_Score:             0,
			General_Comment:       "Overall good performance",
			Create_at:             "2024-01-15T10:30:00Z",
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(&scorecard)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Max_Score"))
	})

	t.Run("Total_Score must not exceed Max_Score", func(t *testing.T) {
		g := NewGomegaWithT(t)
		scorecard := entity.Scorecard{
			Total_Score:           110.0,
			Max_Score:             100.0,
			General_Comment:       "Overall good performance",
			Create_at:             "2024-01-15T10:30:00Z",
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, _ := govalidator.ValidateStruct(&scorecard)
		g.Expect(ok).To(BeTrue())
	})

	t.Run("Total_Score must be non-negative", func(t *testing.T) {
		g := NewGomegaWithT(t)
		scorecard := entity.Scorecard{
			Total_Score:           -10.0,
			Max_Score:             100.0,
			General_Comment:       "Overall good performance",
			Create_at:             "2024-01-15T10:30:00Z",
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(&scorecard)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
		g.Expect(scorecard.Total_Score).To(BeNumerically("<", 0))
	})

	t.Run("General_Comment is optional", func(t *testing.T) {
		g := NewGomegaWithT(t)
		scorecard := entity.Scorecard{
			Total_Score:           85.5,
			Max_Score:             100.0,
			General_Comment:       "",
			Create_at:             "2024-01-15T10:30:00Z",
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(&scorecard)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Create_at is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		scorecard := entity.Scorecard{
			Total_Score:           85.5,
			Max_Score:             100.0,
			General_Comment:       "Overall good performance",
			Create_at:             "",
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(&scorecard)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Create_at"))
	})

	t.Run("PortfolioSubmissionID is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		scorecard := entity.Scorecard{
			Total_Score:           85.5,
			Max_Score:             100.0,
			General_Comment:       "Overall good performance",
			Create_at:             "2024-01-15T10:30:00Z",
			PortfolioSubmissionID: 0,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(&scorecard)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("PortfolioSubmissionID"))
	})

	t.Run("UserID is required", func(t *testing.T) {
		g := NewGomegaWithT(t)
		scorecard := entity.Scorecard{
			Total_Score:           85.5,
			Max_Score:             100.0,
			General_Comment:       "Overall good performance",
			Create_at:             "2024-01-15T10:30:00Z",
			PortfolioSubmissionID: 1,
			UserID:                0,
		}

		ok, err := govalidator.ValidateStruct(&scorecard)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("UserID"))
	})
}