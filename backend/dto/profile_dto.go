package dto

import "time"

type UpdateMeRequest struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
}

// UpdatePersonalInfoRequest is for updating personal info (not onboarding)
type UpdatePersonalInfoRequest struct {
	FirstNameTH string `json:"first_name_th,omitempty"`
	LastNameTH  string `json:"last_name_th,omitempty"`
	FirstNameEN string `json:"first_name_en,omitempty"`
	LastNameEN  string `json:"last_name_en,omitempty"`
	Phone       string `json:"phone,omitempty"`
	Birthday    string `json:"birthday,omitempty"`
}

type UpsertEducationRequest struct {
	EducationLevelID uint       `json:"education_level_id"`
	SchoolID         *uint      `json:"school_id,omitempty"`
	SchoolName       string     `json:"school_name,omitempty"`
	SchoolTypeID     *uint      `json:"school_type_id,omitempty"`
	CurriculumTypeID *uint      `json:"curriculum_type_id,omitempty"`
	IsProjectBased   *bool      `json:"is_project_based,omitempty"`
	Status           string     `json:"status"`
	StartDate        *time.Time `json:"start_date,omitempty"`
	EndDate          *time.Time `json:"end_date,omitempty"`
	GraduationYear   *int       `json:"graduation_year,omitempty"`
}

type UpsertAcademicScoreRequest struct {
	GPAX          float64 `json:"gpax"`
	GPAXSemesters int     `json:"gpax_semesters"`

	GPAMath    float64 `json:"gpa_math"`
	GPAScience float64 `json:"gpa_science"`
	GPAThai    float64 `json:"gpa_thai"`
	GPAEnglish float64 `json:"gpa_english"`
	GPASocial  float64 `json:"gpa_social"`

	TranscriptFilePath string `json:"transcript_file_path"`
}

type UpsertGEDScoreRequest struct {
	TotalScore   int `json:"total_score"`
	RLAScore     int `json:"rla_score"`
	MathScore    int `json:"math_score"`
	ScienceScore int `json:"science_score"`
	SocialScore  int `json:"social_score"`

	CertFilePath string `json:"cert_file_path"`
}

type LanguageScoreItem struct {
	TestType     string     `json:"test_type"`
	Score        string     `json:"score"`
	TestLevel    string     `json:"test_level"`
	SATMath      *int       `json:"sat_math,omitempty"`
	TestDate     *time.Time `json:"test_date,omitempty"`
	CertFilePath string     `json:"cert_file_path"`
}

type ReplaceLanguageScoresRequest struct {
	Items []LanguageScoreItem `json:"items"`
}

type OnboardingStatusResponse struct {
	HasEducation     bool `json:"has_education"`
	HasAcademicScore bool `json:"has_academic_score"`
	HasGEDScore      bool `json:"has_ged_score"`
	HasLanguageScore bool `json:"has_language_score"`
}
