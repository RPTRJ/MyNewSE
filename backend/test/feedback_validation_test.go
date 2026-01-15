package test

import (
	"testing"
	"time"
	"github.com/sut68/team14/backend/entity"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestFeedbackValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid Feedback", func(t *testing.T) {
		feedback := entity.Feedback{
			Overall_comment:       "Great work overall",
			Strengths:             "Strong technical skills and creativity",
			Areas_for_improvement: "Could improve time management",
			Create_at:             time.Now(),
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(feedback)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Overall_comment is required", func(t *testing.T) {
		feedback := entity.Feedback{
			Overall_comment:       "",
			Strengths:             "Strong technical skills",
			Areas_for_improvement: "Could improve time management",
			Create_at:             time.Now(),
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(feedback)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Overall_comment"))
	})

	t.Run("Strengths is optional", func(t *testing.T) {
		feedback := entity.Feedback{
			Overall_comment:       "Great work overall",
			Strengths:             "",
			Areas_for_improvement: "Could improve time management",
			Create_at:             time.Now(),
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(feedback)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Areas_for_improvement is optional", func(t *testing.T) {
		feedback := entity.Feedback{
			Overall_comment:       "Great work overall",
			Strengths:             "Strong technical skills",
			Areas_for_improvement: "",
			Create_at:             time.Now(),
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(feedback)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Create_at is required", func(t *testing.T) {
		feedback := entity.Feedback{
			Overall_comment:       "Great work overall",
			Strengths:             "Strong technical skills",
			Areas_for_improvement: "Could improve time management",
			Create_at:             time.Time{},
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(feedback)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("PortfolioSubmissionID is required", func(t *testing.T) {
		feedback := entity.Feedback{
			Overall_comment:       "Great work overall",
			Strengths:             "Strong technical skills",
			Areas_for_improvement: "Could improve time management",
			Create_at:             time.Now(),
			PortfolioSubmissionID: 0,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(feedback)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("PortfolioSubmissionID"))
	})

	t.Run("UserID is required", func(t *testing.T) {
		feedback := entity.Feedback{
			Overall_comment:       "Great work overall",
			Strengths:             "Strong technical skills",
			Areas_for_improvement: "Could improve time management",
			Create_at:             time.Now(),
			PortfolioSubmissionID: 1,
			UserID:                0,
		}

		ok, err := govalidator.ValidateStruct(feedback)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("UserID"))
	})

	t.Run("Overall_comment minimum length", func(t *testing.T) {
		feedback := entity.Feedback{
			Overall_comment:       "OK",
			Strengths:             "Strong technical skills",
			Areas_for_improvement: "Could improve time management",
			Create_at:             time.Now(),
			PortfolioSubmissionID: 1,
			UserID:                1,
		}

		ok, err := govalidator.ValidateStruct(feedback)
		g.Expect(ok).NotTo(BeTrue())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Overall_comment"))
	})
}