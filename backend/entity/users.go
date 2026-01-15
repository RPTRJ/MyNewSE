package entity

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	FirstNameTH      string     `json:"first_name_th" valid:"optional"`
	LastNameTH       string     `json:"last_name_th" valid:"optional"`
	FirstNameEN      string     `json:"first_name_en" valid:"optional"`
	LastNameEN       string     `json:"last_name_en" valid:"optional"`
	Email            string     `json:"email" valid:"required~Email is required,email~Email is invalid"`
	Password         string     `json:"-" valid:"required~Password is required,minstringlength(6)~Password must be at least 6 characters"`
	ProfileImageURL  string     `json:"profile_image_url" valid:"optional,url~Profile image must be a valid URL"`
	IDNumber         string     `json:"id_number" valid:"required~ID number is required"`
	Phone            string     `json:"phone" valid:"required~Phone is required,stringlength(10|10)~Phone must be 10 digits,numeric~Phone must be numeric"`
	Birthday         time.Time  `json:"birthday" valid:"required~Birthday is required"`
	PDPAConsent      bool       `json:"pdpa_consent" valid:"required~PDPA consent is required"`
	PDPAConsentAt    *time.Time `json:"pdpa_consent_at" valid:"optional"`
	ProfileCompleted bool       `json:"profile_completed" gorm:"default:false" valid:"optional"`

	//FK
	AccountTypeID uint       `json:"type_id" valid:"required~Account type is required"`
	AccountType   *UserTypes `gorm:"foreignKey:AccountTypeID" json:"user_type"`
	IDDocTypeID   uint       `json:"id_type" valid:"required~ID doc type is required"`
	IDDocType     *IDTypes   `gorm:"foreignKey:IDDocTypeID" json:"user_id_type"`
}
