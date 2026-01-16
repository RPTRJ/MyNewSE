package controller

import (
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/sut68/team14/backend/dto"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

var (
	// Compile regex once for better performance
	phoneRegex = regexp.MustCompile(`^\d{9,10}$`)
)

type ProfileController struct {
	DB *gorm.DB
}

func NewProfileController(db *gorm.DB) *ProfileController {
	return &ProfileController{DB: db}
}

// Public Handlers
// GetMe
func (pc *ProfileController) GetMe(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	user, err := pc.getUser(userID)
	if err != nil {
		handleDBError(ctx, err, "user not found")
		return
	}

	profile, err := pc.buildUserProfile(userID, user)
	if err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, profile)
}

// GetUserProfile
func (pc *ProfileController) GetUserProfile(ctx *gin.Context) {
	requesterID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var requester entity.User
	if err := pc.DB.First(&requester, requesterID).Error; err != nil {
		handleDBError(ctx, err, "requester not found")
		return
	}

	//admin เฟื่องเพิ่มอนุญาตให้ครูด้วย
	if requester.AccountTypeID != 3 && requester.AccountTypeID != 2 {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "admin and teacher"})
		return
	}

	targetParam := strings.TrimSpace(ctx.Param("id"))
	targetID, err := strconv.ParseUint(targetParam, 10, 64)
	if err != nil || targetID == 0 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	user, err := pc.getUser(uint(targetID))
	if err != nil {
		handleDBError(ctx, err, "user not found")
		return
	}

	profile, err := pc.buildUserProfile(uint(targetID), user)
	if err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, profile)
}

// Update
func (pc *ProfileController) UpdateMe(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var req dto.UpdateMeRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	if err := pc.validateUpdateMeRequest(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	user, err := pc.getUser(userID)
	if err != nil {
		handleDBError(ctx, err, "user not found")
		return
	}

	pc.updateUserFields(user, &req)

	if err := pc.DB.Save(user).Error; err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"user": user})
}

// UpdatePersonalInfo handles updating personal info for already-onboarded users
func (pc *ProfileController) UpdatePersonalInfo(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var req dto.UpdatePersonalInfoRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	user, err := pc.getUser(userID)
	if err != nil {
		handleDBError(ctx, err, "user not found")
		return
	}

	// Update name fields based on what's provided
	if req.FirstNameTH != "" && req.LastNameTH != "" {
		if !isThaiText(req.FirstNameTH) || !isThaiText(req.LastNameTH) {
			respondError(ctx, http.StatusBadRequest, errors.New("Thai name fields must contain Thai characters only"))
			return
		}
		user.FirstNameTH = strings.TrimSpace(req.FirstNameTH)
		user.LastNameTH = strings.TrimSpace(req.LastNameTH)
		user.FirstNameEN = ""
		user.LastNameEN = ""
	} else if req.FirstNameEN != "" && req.LastNameEN != "" {
		if !isEnglishText(req.FirstNameEN) || !isEnglishText(req.LastNameEN) {
			respondError(ctx, http.StatusBadRequest, errors.New("English name fields must contain English characters only"))
			return
		}
		user.FirstNameEN = strings.TrimSpace(req.FirstNameEN)
		user.LastNameEN = strings.TrimSpace(req.LastNameEN)
		user.FirstNameTH = ""
		user.LastNameTH = ""
	}

	if req.Phone != "" {
		normalized := normalizePhone(req.Phone)
		if !phoneRegex.MatchString(normalized) {
			respondError(ctx, http.StatusBadRequest, errors.New("invalid phone format (must be 9-10 digits)"))
			return
		}
		user.Phone = normalized
	}

	if req.Birthday != "" {
		birthday, err := time.Parse("2006-01-02", req.Birthday)
		if err != nil {
			respondError(ctx, http.StatusBadRequest, errors.New("invalid birthday format (use YYYY-MM-DD)"))
			return
		}
		user.Birthday = birthday
	}

	if err := pc.DB.Save(user).Error; err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"user": user})
}

// UpdateProfileImage
func (pc *ProfileController) UpdateProfileImage(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var req struct {
		ProfileImageURL string `json:"profile_image_url" binding:"required,url"`
	}

	if err := ctx.ShouldBindJSON(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, errors.New("profile_image_url is required and must be a valid URL"))
		return
	}

	user, err := pc.getUser(userID)
	if err != nil {
		handleDBError(ctx, err, "user not found")
		return
	}

	user.ProfileImageURL = strings.TrimSpace(req.ProfileImageURL)

	if err := pc.DB.Save(user).Error; err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"user": user})
}

// UpsertEducation
func (pc *ProfileController) UpsertEducation(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var req dto.UpsertEducationRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	if err := pc.validateEducationRequest(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	edu, err := pc.findOrCreateEducation(userID)
	if err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	pc.updateEducationFields(edu, &req)

	if err := pc.saveRecord(edu); err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"education": edu})
}

// UpsertAcademicScore
func (pc *ProfileController) UpsertAcademicScore(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var req dto.UpsertAcademicScoreRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	if err := pc.validateAcademicScoreRequest(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	score, err := pc.findOrCreateAcademicScore(userID)
	if err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	pc.updateAcademicScoreFields(score, &req)

	if err := pc.saveRecord(score); err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"academic_score": score})
}

// UpsertGEDScore
func (pc *ProfileController) UpsertGEDScore(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var req dto.UpsertGEDScoreRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	if err := pc.validateGEDScoreRequest(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	score, err := pc.findOrCreateGEDScore(userID)
	if err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	pc.updateGEDScoreFields(score, &req)

	if err := pc.saveRecord(score); err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"ged_score": score})
}

// ReplaceLanguageScores
func (pc *ProfileController) ReplaceLanguageScores(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	var req dto.ReplaceLanguageScoresRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	if err := pc.validateLanguageScoreItems(req.Items); err != nil {
		respondError(ctx, http.StatusBadRequest, err)
		return
	}

	if err := pc.replaceLanguageScores(userID, req.Items); err != nil {
		respondError(ctx, http.StatusInternalServerError, err)
		return
	}

	ctx.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetOnboardingStatus
func (pc *ProfileController) GetOnboardingStatus(ctx *gin.Context) {
	userID, err := getAuthUserID(ctx)
	if err != nil {
		respondError(ctx, http.StatusUnauthorized, err)
		return
	}

	status := dto.OnboardingStatusResponse{
		HasEducation:     pc.hasRecords(&entity.Education{}, userID),
		HasAcademicScore: pc.hasRecords(&entity.AcademicScore{}, userID),
		HasGEDScore:      pc.hasRecords(&entity.GEDScore{}, userID),
		HasLanguageScore: pc.hasRecords(&entity.LanguageProficiencyScore{}, userID),
	}

	ctx.JSON(http.StatusOK, status)
}

// Helper fueng add playload
func (pc *ProfileController) getUser(userID uint) (*entity.User, error) {
	var user entity.User
	err := pc.DB.
		Preload("IDDocType").
		Preload("AccountType").
		First(&user, userID).Error
	return &user, err
}

func (pc *ProfileController) buildUserProfile(userID uint, user *entity.User) (gin.H, error) {
	profile := gin.H{"user": user}

	langScores, err := pc.getLanguageScores(userID)
	if err != nil {
		return nil, err
	}
	profile["language_scores"] = langScores

	if edu, err := pc.getEducation(userID); err == nil {
		profile["education"] = edu
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	// ตรวจสอบประเภทเอกสารของ user เพื่อ query เฉพาะคะแนนที่ตรงกับประเภท
	// IDDocTypeID: 2 = G-Code, 3 = Passport (นักเรียนต่างชาติ → ged_score)
	// IDDocTypeID: 1 = บัตรประชาชน หรืออื่นๆ (นักเรียนไทย → academic_score)
	if user.IDDocTypeID == 2 || user.IDDocTypeID == 3 {
		if ged, err := pc.getGEDScore(userID); err == nil {
			profile["ged_score"] = ged
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	} else {
		if acad, err := pc.getAcademicScore(userID); err == nil {
			profile["academic_score"] = acad
		} else if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, err
		}
	}

	return profile, nil
}

func (pc *ProfileController) getLanguageScores(userID uint) ([]entity.LanguageProficiencyScore, error) {
	var scores []entity.LanguageProficiencyScore
	err := pc.DB.Where("user_id = ?", userID).Find(&scores).Error
	if err != nil {
		return nil, err
	}
	return scores, nil
}

func (pc *ProfileController) getEducation(userID uint) (*entity.Education, error) {
	var edu entity.Education
	err := pc.DB.Where("user_id = ?", userID).
		Preload("EducationLevel").
		Preload("School").
		Preload("SchoolType").
		Preload("CurriculumType").
		First(&edu).Error
	return &edu, err
}

func (pc *ProfileController) getAcademicScore(userID uint) (*entity.AcademicScore, error) {
	var score entity.AcademicScore
	err := pc.DB.Where("user_id = ?", userID).First(&score).Error
	return &score, err
}

func (pc *ProfileController) getGEDScore(userID uint) (*entity.GEDScore, error) {
	var score entity.GEDScore
	err := pc.DB.Where("user_id = ?", userID).First(&score).Error
	return &score, err
}

func (pc *ProfileController) findOrCreateEducation(userID uint) (*entity.Education, error) {
	var edu entity.Education
	err := pc.DB.Where("user_id = ?", userID).First(&edu).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &entity.Education{UserID: userID}, nil
	}
	return &edu, err
}

func (pc *ProfileController) findOrCreateAcademicScore(userID uint) (*entity.AcademicScore, error) {
	var score entity.AcademicScore
	err := pc.DB.Where("user_id = ?", userID).First(&score).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &entity.AcademicScore{UserID: userID}, nil
	}
	return &score, err
}

func (pc *ProfileController) findOrCreateGEDScore(userID uint) (*entity.GEDScore, error) {
	var score entity.GEDScore
	err := pc.DB.Where("user_id = ?", userID).First(&score).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return &entity.GEDScore{UserID: userID}, nil
	}
	return &score, err
}

func (pc *ProfileController) saveRecord(record interface{}) error {
	return pc.DB.Save(record).Error
}

func (pc *ProfileController) replaceLanguageScores(userID uint, items []dto.LanguageScoreItem) error {
	return pc.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", userID).Delete(&entity.LanguageProficiencyScore{}).Error; err != nil {
			return err
		}

		if len(items) == 0 {
			return nil
		}

		scores := pc.buildLanguageScores(userID, items)
		return tx.Create(&scores).Error
	})
}

func (pc *ProfileController) buildLanguageScores(userID uint, items []dto.LanguageScoreItem) []entity.LanguageProficiencyScore {
	scores := make([]entity.LanguageProficiencyScore, 0, len(items))

	for i := range items {
		score := entity.LanguageProficiencyScore{
			UserID:       userID,
			TestType:     strings.TrimSpace(items[i].TestType),
			Score:        strings.TrimSpace(items[i].Score),
			TestLevel:    strings.TrimSpace(items[i].TestLevel),
			TestDate:     derefTime(items[i].TestDate),
			CertFilePath: strings.TrimSpace(items[i].CertFilePath),
		}

		if items[i].SATMath != nil {
			score.SATMath = items[i].SATMath
		}

		scores = append(scores, score)
	}

	return scores
}

func (pc *ProfileController) hasRecords(model interface{}, userID uint) bool {
	var count int64
	pc.DB.Model(model).Where("user_id = ?", userID).Count(&count)
	return count > 0
}

// Helper Field Updates
func (pc *ProfileController) updateUserFields(user *entity.User, req *dto.UpdateMeRequest) {
	first := strings.TrimSpace(req.FirstName)
	last := strings.TrimSpace(req.LastName)

	if first != "" && last != "" {
		if isThaiText(first) && isThaiText(last) {
			user.FirstNameTH = first
			user.LastNameTH = last
			user.FirstNameEN = ""
			user.LastNameEN = ""
		} else if isEnglishText(first) && isEnglishText(last) {
			user.FirstNameEN = first
			user.LastNameEN = last
			user.FirstNameTH = ""
			user.LastNameTH = ""
		}
	}

	if req.Phone != "" {
		user.Phone = normalizePhone(req.Phone)
	}
}

func (pc *ProfileController) updateEducationFields(edu *entity.Education, req *dto.UpsertEducationRequest) {
	edu.EducationLevelID = req.EducationLevelID
	edu.SchoolID = req.SchoolID
	edu.SchoolName = strings.TrimSpace(req.SchoolName)
	edu.SchoolTypeID = req.SchoolTypeID
	edu.CurriculumTypeID = req.CurriculumTypeID
	edu.IsProjectBased = req.IsProjectBased

	// Handle new fields
	if req.Status != "" {
		edu.Status = entity.EducationStatus(req.Status)
	}
	if req.StartDate != nil {
		edu.StartDate = req.StartDate
	}
	if req.EndDate != nil {
		edu.EndDate = req.EndDate
	}
	if req.GraduationYear != nil {
		edu.GraduationYear = req.GraduationYear
	}
}

func (pc *ProfileController) updateAcademicScoreFields(score *entity.AcademicScore, req *dto.UpsertAcademicScoreRequest) {
	score.GPAX = req.GPAX
	score.GPAXSemesters = req.GPAXSemesters
	score.GPAMath = req.GPAMath
	score.GPAScience = req.GPAScience
	score.GPAThai = req.GPAThai
	score.GPAEnglish = req.GPAEnglish
	score.GPASocial = req.GPASocial
	score.TranscriptFilePath = strings.TrimSpace(req.TranscriptFilePath)
}

func (pc *ProfileController) updateGEDScoreFields(score *entity.GEDScore, req *dto.UpsertGEDScoreRequest) {
	score.TotalScore = req.TotalScore
	score.RLAScore = req.RLAScore
	score.MathScore = req.MathScore
	score.ScienceScore = req.ScienceScore
	score.SocialScore = req.SocialScore
	score.CertFilePath = strings.TrimSpace(req.CertFilePath)
}

//Helper Validation

func (pc *ProfileController) validateUpdateMeRequest(req *dto.UpdateMeRequest) error {
	first := strings.TrimSpace(req.FirstName)
	last := strings.TrimSpace(req.LastName)
	phone := strings.TrimSpace(req.Phone)

	if (first != "" && last == "") || (first == "" && last != "") {
		return errors.New("first_name and last_name must be provided together")
	}

	if first != "" && last != "" {
		isThai := isThaiText(first) && isThaiText(last)
		isEng := isEnglishText(first) && isEnglishText(last)
		if !isThai && !isEng {
			return errors.New("first_name and last_name must be all Thai or all English")
		}
	}

	if phone != "" {
		normalized := normalizePhone(phone)
		if !phoneRegex.MatchString(normalized) {
			return errors.New("invalid phone format (must be 9-10 digits)")
		}
	}

	if first == "" && last == "" && phone == "" {
		return errors.New("no fields to update")
	}

	return nil
}

func (pc *ProfileController) validateEducationRequest(req *dto.UpsertEducationRequest) error {
	if req.EducationLevelID == 0 {
		return errors.New("education_level_id is required")
	}

	name := strings.TrimSpace(req.SchoolName)
	if req.SchoolID == nil && name == "" {
		return errors.New("school_id or school_name is required")
	}

	if req.Status != "" && !isValidEducationStatus(req.Status) {
		return errors.New("invalid status")
	}

	return nil
}

func (pc *ProfileController) validateAcademicScoreRequest(req *dto.UpsertAcademicScoreRequest) error {
	if req.GPAX < 0 || req.GPAX > 4.00 {
		return errors.New("gpax must be between 0 and 4.00")
	}
	return nil
}

func (pc *ProfileController) validateGEDScoreRequest(req *dto.UpsertGEDScoreRequest) error {
	scores := []int{req.TotalScore, req.RLAScore, req.MathScore, req.ScienceScore, req.SocialScore}
	for _, score := range scores {
		if score < 0 {
			return errors.New("ged scores must not be negative")
		}
	}
	return nil
}

func (pc *ProfileController) validateLanguageScoreItems(items []dto.LanguageScoreItem) error {
	for i := range items {
		if strings.TrimSpace(items[i].TestType) == "" {
			return fmt.Errorf("items[%d].test_type is required", i)
		}
	}
	return nil
}

// Utility
func respondError(ctx *gin.Context, status int, err error) {
	ctx.JSON(status, gin.H{"error": err.Error()})
}

func handleDBError(ctx *gin.Context, err error, msg string) {
	if errors.Is(err, gorm.ErrRecordNotFound) {
		ctx.JSON(http.StatusNotFound, gin.H{"error": msg})
		return
	}
	respondError(ctx, http.StatusInternalServerError, err)
}

func isThaiText(s string) bool {
	for _, r := range s {
		if !unicode.In(r, unicode.Thai, unicode.Space, unicode.Punct) {
			return false
		}
	}
	return true
}

func isEnglishText(s string) bool {
	for _, r := range s {
		if !unicode.In(r, unicode.Latin, unicode.Space, unicode.Punct) && !unicode.IsDigit(r) {
			return false
		}
	}
	return true
}

func normalizePhone(phone string) string {
	return strings.ReplaceAll(strings.ReplaceAll(phone, "-", ""), " ", "")
}

func isValidEducationStatus(status string) bool {
	validStatuses := []string{"current", "graduated", "other"}
	for _, v := range validStatuses {
		if status == v {
			return true
		}
	}
	return false
}

func derefTime(t *time.Time) time.Time {
	if t == nil {
		return time.Time{}
	}
	return *t
}
