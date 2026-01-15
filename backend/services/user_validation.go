package services

import (
	"errors"
	"strings"
	"unicode"

	"github.com/asaskevich/govalidator"
	"github.com/sut68/team14/backend/entity"
)

var (
	ErrUserRequired         = errors.New("user is required")
	ErrValidationFailed     = errors.New("validation failed")
	ErrMixedLanguageNames   = errors.New("use either Thai names or English names, not both")
	ErrThaiNamesRequired    = errors.New("Thai users must provide names in Thai")
	ErrEnglishNamesRequired = errors.New("Foreign users must provide names in English")
	ErrNameRequired         = errors.New("name is required in Thai or English")
	ErrCitizenIDInvalid     = errors.New("citizen id must be 13 digits")
	ErrGCodeInvalid         = errors.New("G-Code must start with 'G' followed by 7 digits")
	ErrPassportInvalid      = errors.New("passport number must be 6-15 alphanumeric characters")
)

type NameLanguage int

const (
	NameLanguageNone NameLanguage = iota
	NameLanguageThai
	NameLanguageEnglish
	NameLanguageMixed
)

type IDDocType int

const (
	IDDocUnknown IDDocType = iota
	IDDocCitizen
	IDDocGCode
	IDDocPassport
)

func ValidateUser(u *entity.User) error {
	if u == nil {
		return ErrUserRequired
	}

	if ok, err := govalidator.ValidateStruct(u); err != nil {
		return err
	} else if !ok {
		return ErrValidationFailed
	}

	if err := validateIDNumber(u); err != nil {
		return err
	}

	return validateUserNames(u)
}

func ValidateUserForRegistration(u *entity.User) error {
	if u == nil {
		return ErrUserRequired
	}

	email := strings.TrimSpace(u.Email)
	if email == "" {
		return errors.New("Email is required")
	}
	if !govalidator.IsEmail(email) {
		return errors.New("Email is invalid")
	}
	if strings.TrimSpace(u.Password) == "" {
		return errors.New("Password is required")
	}

	lang := detectNameLanguage(u)
	if lang == NameLanguageNone {
		return nil
	}

	return validateUserNames(u)
}

func validateUserNames(u *entity.User) error {
	lang := detectNameLanguage(u)

	switch lang {
	case NameLanguageMixed:
		return ErrMixedLanguageNames
	case NameLanguageThai:
		return validateThaiNames(u.FirstNameTH, u.LastNameTH)
	case NameLanguageEnglish:
		return validateEnglishNames(u.FirstNameEN, u.LastNameEN)
	case NameLanguageNone:
		return ErrNameRequired
	}

	return nil
}

func detectNameLanguage(u *entity.User) NameLanguage {
	hasThai := hasContent(u.FirstNameTH) || hasContent(u.LastNameTH)
	hasEnglish := hasContent(u.FirstNameEN) || hasContent(u.LastNameEN)

	switch {
	case hasThai && hasEnglish:
		return NameLanguageMixed
	case hasThai:
		return NameLanguageThai
	case hasEnglish:
		return NameLanguageEnglish
	default:
		return NameLanguageNone
	}
}

func validateThaiNames(firstName, lastName string) error {
	if !isThaiText(firstName) || !isThaiText(lastName) {
		return ErrThaiNamesRequired
	}
	return nil
}

func validateEnglishNames(firstName, lastName string) error {
	if !isEnglishText(firstName) || !isEnglishText(lastName) {
		return ErrEnglishNamesRequired
	}
	return nil
}

func hasContent(s string) bool {
	return strings.TrimSpace(s) != ""
}

func isThaiText(value string) bool {
	value = strings.TrimSpace(value)
	if value == "" {
		return false
	}

	for _, r := range value {
		if isAllowedWhitespace(r) {
			continue
		}
		if !unicode.In(r, unicode.Thai) {
			return false
		}
	}
	return true
}

func isEnglishText(value string) bool {
	value = strings.TrimSpace(value)
	if value == "" {
		return false
	}

	for _, r := range value {
		if isAllowedWhitespace(r) {
			continue
		}
		if !unicode.In(r, unicode.Latin) || !unicode.IsLetter(r) {
			return false
		}
	}
	return true
}

func isAllowedWhitespace(r rune) bool {
	return r == ' ' || r == '-' || r == '\''
}

func validateIDNumber(u *entity.User) error {
	idNum := strings.TrimSpace(u.IDNumber)
	if idNum == "" {
		return errors.New("ID number is required")
	}

	switch detectIDDocType(u) {
	case IDDocCitizen:
		if !govalidator.StringMatches(idNum, `^\d{13}$`) {
			return ErrCitizenIDInvalid
		}
	case IDDocGCode:
		if !govalidator.StringMatches(idNum, `^[Gg]\d{7}$`) {
			return ErrGCodeInvalid
		}
	case IDDocPassport:
		if !govalidator.StringMatches(idNum, `^[A-Za-z0-9]{6,15}$`) {
			return ErrPassportInvalid
		}
	default:
		if len(idNum) < 4 {
			return errors.New("ID number is too short")
		}
	}

	return nil
}

func detectIDDocType(u *entity.User) IDDocType {
	if u.IDDocType != nil {
		name := strings.ToLower(strings.TrimSpace(u.IDDocType.IDName))
		switch {
		case strings.Contains(name, "citizen") || strings.Contains(name, "id card"):
			return IDDocCitizen
		case strings.Contains(name, "g_code") || strings.Contains(name, "g-code") || strings.Contains(name, "gcode"):
			return IDDocGCode
		case strings.Contains(name, "passport"):
			return IDDocPassport
		}
	}

	switch u.IDDocTypeID {
	case 1:
		return IDDocCitizen
	case 2:
		return IDDocGCode
	case 3:
		return IDDocPassport
	}

	return IDDocUnknown
}
