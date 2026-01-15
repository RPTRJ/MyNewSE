package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
)

func TestPortfolioSubmissionValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	now := time.Now()

	t.Run("valid portfolio submission", func(t *testing.T) {
		ps := entity.PortfolioSubmission{
			Version:            1,
			Status:             "under_review",
			Submission_at:      now,
			PortfolioID:        1,
			UserID:             1,
		}

		ok, err := govalidator.ValidateStruct(ps)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("version is zero", func(t *testing.T) {
		ps := entity.PortfolioSubmission{
			Version:       0,
			Status:        "under_review",
			Submission_at: now,
			PortfolioID:   1,
			UserID:        1,
		}

		ok, err := govalidator.ValidateStruct(ps)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("version over range", func(t *testing.T) {
		ps := entity.PortfolioSubmission{
			Version:       2000,
			Status:        "under_review",
			Submission_at: now,
			PortfolioID:   1,
			UserID:        1,
		}

		ok, err := govalidator.ValidateStruct(ps)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("status is blank", func(t *testing.T) {
		ps := entity.PortfolioSubmission{
			Version:       1,
			Status:        "",
			Submission_at: now,
			PortfolioID:   1,
			UserID:        1,
		}

		ok, err := govalidator.ValidateStruct(ps)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("status is invalid", func(t *testing.T) {
		ps := entity.PortfolioSubmission{
			Version:       1,
			Status:        "rejected",
			Submission_at: now,
			PortfolioID:   1,
			UserID:        1,
		}

		ok, err := govalidator.ValidateStruct(ps)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("submission_at is zero value", func(t *testing.T) {
		ps := entity.PortfolioSubmission{
			Version:     1,
			Status:      "awaiting",
			PortfolioID: 1,
			UserID:      1,
		}

		ok, err := govalidator.ValidateStruct(ps)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("portfolio id is zero", func(t *testing.T) {
		ps := entity.PortfolioSubmission{
			Version:       1,
			Status:        "awaiting",
			Submission_at: now,
			PortfolioID:   0,
			UserID:        1,
		}

		ok, err := govalidator.ValidateStruct(ps)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("user id is zero", func(t *testing.T) {
		ps := entity.PortfolioSubmission{
			Version:       1,
			Status:        "awaiting",
			Submission_at: now,
			PortfolioID:   1,
			UserID:        0,
		}

		ok, err := govalidator.ValidateStruct(ps)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("reviewed_at and approved_at can be nil", func(t *testing.T) {
		ps := entity.PortfolioSubmission{
			Version:       1,
			Status:        "approved",
			Submission_at: now,
			PortfolioID:   1,
			UserID:        1,
		}

		ok, err := govalidator.ValidateStruct(ps)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
