package services

import "github.com/sut68/team14/backend/entity"

func IsOnboardingCompleted(u entity.User) bool {
	if !hasPDPAConsent(u) {
		return false
	}

	return u.ProfileCompleted || hasRequiredBasicInfo(u)
}

func hasPDPAConsent(u entity.User) bool {
	return u.PDPAConsent && u.PDPAConsentAt != nil
}

func hasRequiredBasicInfo(u entity.User) bool {
	return hasNames(u) && hasPhone(u)
}

func hasNames(u entity.User) bool {
	hasThai := hasContent(u.FirstNameTH) && hasContent(u.LastNameTH)
	hasEnglish := hasContent(u.FirstNameEN) && hasContent(u.LastNameEN)
	return hasThai || hasEnglish
}

func hasPhone(u entity.User) bool {
	return hasContent(u.Phone)
}
