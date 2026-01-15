package test

import (
	"testing"
	"fmt"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
)

func TestScoreCriteriaValidation(t *testing.T) {
	govalidator.SetFieldsRequiredByDefault(false)

	t.Run("Valid ScoreCriteria", func(t *testing.T) {
		g := NewGomegaWithT(t)

		criteria := entity.ScoreCriteria{
			Criteria_Number: 1,
			Criteria_Name:   "Technical Skills",
			Max_Score:       100.0,
			Score:           85.0,
			Weight_Percent:  30.0,
			Comment:         "Strong technical ability",
			Order_index:     1,
			ScorecardID:     1,
		}

		ok, err := govalidator.ValidateStruct(&criteria)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Criteria_Number is required", func(t *testing.T) {
		g := NewGomegaWithT(t)

		criteria := entity.ScoreCriteria{
			Criteria_Number: 0,
			Criteria_Name:   "Technical Skills",
			Max_Score:       100.0,
			Score:           80.0,
			Weight_Percent:  30.0,
			Order_index:     1,
			ScorecardID:     1,
		}

		ok, err := govalidator.ValidateStruct(&criteria)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Criteria_Name is required", func(t *testing.T) {
		g := NewGomegaWithT(t)

		criteria := entity.ScoreCriteria{
			Criteria_Number: 1,
			Criteria_Name:   "",
			Max_Score:       100.0,
			Score:           80.0,
			Weight_Percent:  30.0,
			Order_index:     1,
			ScorecardID:     1,
		}

		ok, err := govalidator.ValidateStruct(&criteria)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Max_Score must be positive", func(t *testing.T) {
		g := NewGomegaWithT(t)

		criteria := entity.ScoreCriteria{
			Criteria_Number: 1,
			Criteria_Name:   "Technical Skills",
			Max_Score:       0,
			Score:           50.0,
			Weight_Percent:  30.0,
			Order_index:     1,
			ScorecardID:     1,
		}

		ok, err := govalidator.ValidateStruct(&criteria)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Score must be non-negative", func(t *testing.T) {
		g := NewGomegaWithT(t)

		criteria := entity.ScoreCriteria{
			Criteria_Number: 1,
			Criteria_Name:   "Technical Skills",
			Max_Score:       100.0,
			Score:           -10.0,
			Weight_Percent:  30.0,
			Order_index:     1,
			ScorecardID:     1,
		}

		ok, err := govalidator.ValidateStruct(&criteria)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
		g.Expect(criteria.Score).To(BeNumerically("<", 0))
	})

	t.Run("Weight_Percent must be between 0 and 100", func(t *testing.T) {
		g := NewGomegaWithT(t)

		criteria := entity.ScoreCriteria{
			Criteria_Number: 1,
			Criteria_Name:   "Technical Skills",
			Max_Score:       100.0,
			Score:           80.0,
			Weight_Percent:  150.0,
			Order_index:     1,
			ScorecardID:     1,
		}

		ok, err := govalidator.ValidateStruct(&criteria)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Comment is optional", func(t *testing.T) {
		g := NewGomegaWithT(t)

		criteria := entity.ScoreCriteria{
			Criteria_Number: 1,
			Criteria_Name:   "Technical Skills",
			Max_Score:       100.0,
			Score:           80.0,
			Weight_Percent:  30.0,
			Comment:         "",
			Order_index:     1,
			ScorecardID:     1,
		}

		ok, err := govalidator.ValidateStruct(&criteria)
		fmt.Println(err)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Order_index must be positive", func(t *testing.T) {
		g := NewGomegaWithT(t)

		criteria := entity.ScoreCriteria{
			Criteria_Number: 1,
			Criteria_Name:   "Technical Skills",
			Max_Score:       100.0,
			Score:           80.0,
			Weight_Percent:  30.0,
			Order_index:     0,
			ScorecardID:     1,
		}

		ok, err := govalidator.ValidateStruct(&criteria)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("ScorecardID is required", func(t *testing.T) {
		g := NewGomegaWithT(t)

		criteria := entity.ScoreCriteria{
			Criteria_Number: 1,
			Criteria_Name:   "Technical Skills",
			Max_Score:       100.0,
			Score:           80.0,
			Weight_Percent:  30.0,
			Order_index:     1,
			ScorecardID:     0,
		}

		ok, err := govalidator.ValidateStruct(&criteria)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})
}
