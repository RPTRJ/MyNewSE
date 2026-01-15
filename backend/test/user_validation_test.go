package test

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"github.com/sut68/team14/backend/entity"
)

// ===== HELPER FUNCTION =====

func validUser() entity.User {
	return entity.User{
		FirstNameTH:     "สมชาย",
		LastNameTH:      "ใจดี",
		Email:           "user@example.com",
		Password:        "secret123",
		ProfileImageURL: "https://example.com/avatar.png",
		IDNumber:        "1234567890123",
		Phone:           "0812345678",
		Birthday:        time.Date(1990, time.January, 1, 0, 0, 0, 0, time.UTC),
		PDPAConsent:     true,
		AccountTypeID:   1,
		IDDocTypeID:     1,
		IDDocType:       &entity.IDTypes{IDName: "citizen_id"},
	}
}

// ===== POSITIVE TEST =====

// Test 1: Valid User (ข้อมูลถูกต้องทั้งหมด)
func TestUserValidPass(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// ===== NEGATIVE TESTS - Email =====

// Test 2: Email Required
func TestUserEmailRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.Email = ""

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Email is required"))
}

// Test 3: Email Invalid Format
func TestUserEmailInvalidFormat(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.Email = "notanemail"

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Email is invalid"))
}

// ===== NEGATIVE TESTS - Password =====

// Test 4: Password Required
func TestUserPasswordRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.Password = ""

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Password is required"))
}

// Test 5: Password Too Short
func TestUserPasswordTooShort(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.Password = "12345" // แค่ 5 ตัว

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Password must be at least 6 characters"))
}

// ===== NEGATIVE TESTS - Phone =====

// Test 6: Phone Required
func TestUserPhoneRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.Phone = ""

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Phone is required"))
}

// Test 7: Phone Invalid Length (Too Short)
func TestUserPhoneTooShort(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.Phone = "081234567" // แค่ 9 หลัก

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Phone must be 10 digits"))
}

// Test 8: Phone Invalid Length (Too Long)
func TestUserPhoneTooLong(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.Phone = "08123456789" // 11 หลัก

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Phone must be 10 digits"))
}

// Test 9: Phone Not Numeric
func TestUserPhoneNotNumeric(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.Phone = "081234567a" // มีตัวอักษรปน

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Phone must be numeric"))
}

// ===== NEGATIVE TESTS - IDNumber =====

// Test 10: IDNumber Required
func TestUserIDNumberRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.IDNumber = ""

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("ID number is required"))
}

// ===== NEGATIVE TESTS - Birthday =====

// Test 11: Birthday Required
func TestUserBirthdayRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.Birthday = time.Time{} // Zero value

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Birthday is required"))
}

// ===== NEGATIVE TESTS - PDPAConsent =====

// Test 12: PDPA Consent Required
func TestUserPDPAConsentRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.PDPAConsent = false

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("PDPA consent is required"))
}

// ===== NEGATIVE TESTS - ProfileImageURL (Optional) =====

// Test 13: ProfileImageURL Invalid URL Format
func TestUserProfileImageURLInvalidFormat(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.ProfileImageURL = "not-a-url" // ไม่ใช่ URL

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Profile image must be a valid URL"))
}

// Test 14: ProfileImageURL Empty (Optional - Should Pass)
func TestUserProfileImageURLEmpty(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.ProfileImageURL = "" // ว่างเปล่า แต่ optional

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// ===== NEGATIVE TESTS - AccountTypeID =====

// Test 15: AccountTypeID Required (Zero Value)
func TestUserAccountTypeIDRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.AccountTypeID = 0

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("Account type is required"))
}

// ===== NEGATIVE TESTS - IDDocTypeID =====

// Test 16: IDDocTypeID Required (Zero Value)
func TestUserIDDocTypeIDRequired(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.IDDocTypeID = 0

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	g.Expect(err.Error()).To(Equal("ID doc type is required"))
}

// ===== POSITIVE TESTS - Optional Fields =====

// Test 17: Optional Fields Empty (Should Pass)
func TestUserOptionalFieldsEmpty(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.FirstNameTH = ""
	user.LastNameTH = ""
	user.FirstNameEN = ""
	user.LastNameEN = ""
	user.ProfileImageURL = ""

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeTrue())
	g.Expect(err).To(BeNil())
}

// ===== MULTIPLE ERRORS TEST =====

// Test 18: Multiple Validation Errors
func TestUserMultipleErrors(t *testing.T) {
	g := NewGomegaWithT(t)
	user := validUser()
	user.Email = ""    // ❌ Email required
	user.Password = "" // ❌ Password required
	user.Phone = ""    // ❌ Phone required

	ok, err := govalidator.ValidateStruct(user)

	g.Expect(ok).To(BeFalse())
	g.Expect(err).ToNot(BeNil())
	// จะ fail ที่ field แรกที่เจอ error
}
