package seed

import (
	"fmt"
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
	"gorm.io/gorm"
)

func SeedProfileReference() {
	db := config.GetDB()
	if db == nil {
		log.Println("SeedProfileReference: db is nil")
		return
	}

	if err := db.Transaction(func(tx *gorm.DB) error {
		if err := seedEducationLevels(tx); err != nil {
			return err
		}
		if err := seedSchoolTypes(tx); err != nil {
			return err
		}
		if err := seedCurriculumTypes(tx); err != nil {
			return err
		}
		if err := seedSchools(tx); err != nil {
			return err
		}
		return nil
	}); err != nil {
		log.Printf("SeedProfileReference error: %v\n", err)
		return
	}

	log.Println("SeedProfileReference completed")
}

func seedEducationLevels(tx *gorm.DB) error {
	items := []string{
		"มัธยมศึกษาตอนปลาย (ม.4-ม.6)",
		"อาชีวศึกษา (ปวช.)",
		"อาชีวศึกษา (ปวส.)",
		"GED",
	}

	for _, name := range items {
		var existing entity.EducationLevel
		if err := tx.Where("name = ?", name).First(&existing).Error; err != nil {
			newItem := entity.EducationLevel{Name: name}
			if err := tx.Create(&newItem).Error; err != nil {
				log.Printf("failed to seed EducationLevel %s: %v\n", name, err)
				return err
			} else {
				log.Printf("seeded EducationLevel: %s\n", name)
			}
		}
	}
	return nil
}

func seedSchoolTypes(tx *gorm.DB) error {
	items := []string{
		"โรงเรียนรัฐบาล",
		"โรงเรียนเอกชน",
		"โรงเรียนสาธิต",
		"โรงเรียนนานาชาติ",
		"อาชีวศึกษา (วิทยาลัย/เทคนิค)",
		"กศน.",
		"ต่างประเทศ",
		"Homeschool",
		"อื่นๆ",
	}

	for _, name := range items {
		var existing entity.SchoolType
		if err := tx.Where("name = ?", name).First(&existing).Error; err != nil {
			newItem := entity.SchoolType{Name: name}
			if err := tx.Create(&newItem).Error; err != nil {
				log.Printf("failed to seed SchoolType %s: %v\n", name, err)
				return err
			} else {
				log.Printf("seeded SchoolType: %s\n", name)
			}
		}
	}
	return nil
}

func seedCurriculumTypes(tx *gorm.DB) error {
	// Lookup IDs ของ SchoolType
	typeNameToID := map[string]uint{}
	var st []entity.SchoolType
	if err := tx.Find(&st).Error; err != nil {
		return err
	}
	for _, x := range st {
		typeNameToID[x.Name] = x.ID
	}

	getID := func(name string) *uint {
		if id, ok := typeNameToID[name]; ok && id > 0 {
			return &id
		}
		return nil
	}

	interID := getID("โรงเรียนนานาชาติ")
	vocaID := getID("อาชีวศึกษา (วิทยาลัย/เทคนิค)")

	generalCurriculums := []struct {
		name       string
		schoolType *uint
	}{
		{"สายวิทย์-คณิต", nil},
		{"สายศิลป์-คำนวณ", nil},
		{"สายศิลป์-ภาษา", nil},
		{"สายศิลป์-สังคม", nil},
		{"สายศิลป์-ทั่วไป", nil},
	}

	vocationalCurriculums := []struct {
		name       string
		schoolType *uint
	}{
		{"อุตสาหกรรม (ช่าง)", vocaID},
		{"พาณิชยกรรม/บัญชี", vocaID},
		{"เทคนิคคอมพิวเตอร์/IT", vocaID},
		{"การโรงแรม/ท่องเที่ยว", vocaID},
		{"คหกรรม/อาหาร", vocaID},
	}

	internationalCurriculums := []struct {
		name       string
		schoolType *uint
	}{
		{"GED Track", interID},
		{"IB Track", interID},
		{"A-Level Track", interID},
		{"AP Track", interID},
		{"IGCSE Track", interID},
	}

	// รวมทุก curriculum เข้าด้วยกัน
	allCurriculums := []struct {
		name       string
		schoolType *uint
	}{}
	allCurriculums = append(allCurriculums, generalCurriculums...)
	allCurriculums = append(allCurriculums, vocationalCurriculums...)
	allCurriculums = append(allCurriculums, internationalCurriculums...)

	// Insert curricula
	for _, curr := range allCurriculums {
		var existing entity.CurriculumType

		// Check ด้วย name และ school_type_id
		query := tx.Where("name = ?", curr.name)
		if curr.schoolType != nil {
			query = query.Where("school_type_id = ?", *curr.schoolType)
		} else {
			query = query.Where("school_type_id IS NULL")
		}

		if err := query.First(&existing).Error; err != nil {
			newItem := entity.CurriculumType{
				Name:         curr.name,
				SchoolTypeID: curr.schoolType,
			}
			if err := tx.Create(&newItem).Error; err != nil {
				log.Printf("failed to seed CurriculumType %s: %v\n", curr.name, err)
				return err
			} else {
				schoolTypeName := "ทุกประเภท"
				if curr.schoolType != nil {
					for name, id := range typeNameToID {
						if id == *curr.schoolType {
							schoolTypeName = name
							break
						}
					}
				}
				log.Printf("seeded CurriculumType: %s (SchoolType: %s)\n", curr.name, schoolTypeName)
			}
		}
	}

	return nil
}

func seedSchools(tx *gorm.DB) error {
	typeNameToID := map[string]uint{}
	var st []entity.SchoolType
	if err := tx.Find(&st).Error; err != nil {
		return err
	}
	for _, x := range st {
		typeNameToID[x.Name] = x.ID
	}

	mustID := func(name string) (uint, error) {
		id, ok := typeNameToID[name]
		if !ok || id == 0 {
			return 0, fmt.Errorf("missing SchoolType: %s", name)
		}
		return id, nil
	}

	// Get all required school type IDs
	govID, err := mustID("โรงเรียนรัฐบาล")
	if err != nil {
		return err
	}
	privateID, err := mustID("โรงเรียนเอกชน")
	if err != nil {
		return err
	}
	demoID, err := mustID("โรงเรียนสาธิต")
	if err != nil {
		return err
	}
	interID, err := mustID("โรงเรียนนานาชาติ")
	if err != nil {
		return err
	}
	vocaID, err := mustID("อาชีวศึกษา (วิทยาลัย/เทคนิค)")
	if err != nil {
		return err
	}
	nonFormalID, err := mustID("กศน.")
	if err != nil {
		return err
	}
	foreignID, err := mustID("ต่างประเทศ")
	if err != nil {
		return err
	}
	homeID, err := mustID("Homeschool")
	if err != nil {
		return err
	}
	otherID, err := mustID("อื่นๆ")
	if err != nil {
		return err
	}

	highSchoolGov := []entity.School{
		{Code: "TH-BKK-G001", Name: "โรงเรียนเตรียมอุดมศึกษา", SchoolTypeID: govID},
		{Code: "TH-BKK-G002", Name: "โรงเรียนสวนกุหลาบวิทยาลัย", SchoolTypeID: govID},
		{Code: "TH-BKK-G003", Name: "โรงเรียนสตรีวิทยา", SchoolTypeID: govID},
		{Code: "TH-NAK-G001", Name: "โรงเรียนสุรนารีวิทยา", SchoolTypeID: govID},
		{Code: "TH-CMI-G001", Name: "โรงเรียนยุพราชวิทยาลัย", SchoolTypeID: govID},
	}

	highSchoolPrivate := []entity.School{
		{Code: "TH-BKK-P001", Name: "โรงเรียนอัสสัมชัญ", SchoolTypeID: privateID},
		{Code: "TH-BKK-P002", Name: "โรงเรียนเซนต์โยเซฟคอนเวนต์", SchoolTypeID: privateID},
		{Code: "TH-BKK-P003", Name: "โรงเรียนเซนต์คาเบรียล", SchoolTypeID: privateID},
		{Code: "TH-CNX-P001", Name: "โรงเรียนมงฟอร์ตวิทยาลัย (เชียงใหม่)", SchoolTypeID: privateID},
		{Code: "TH-PKT-P001", Name: "โรงเรียนภูเก็ตวิทยาลัย", SchoolTypeID: privateID},
	}

	highSchoolDemo := []entity.School{
		{Code: "TH-BKK-D001", Name: "โรงเรียนสาธิตจุฬาลงกรณ์มหาวิทยาลัย", SchoolTypeID: demoID},
		{Code: "TH-BKK-D002", Name: "โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ", SchoolTypeID: demoID},
		{Code: "TH-BKK-D003", Name: "โรงเรียนสาธิตมหาวิทยาลัยเกษตรศาสตร์", SchoolTypeID: demoID},
		{Code: "TH-BKK-D004", Name: "โรงเรียนสาธิตมหาวิทยาลัยรังสิต", SchoolTypeID: demoID},
		{Code: "TH-KKN-D001", Name: "โรงเรียนสาธิตมหาวิทยาลัยขอนแก่น", SchoolTypeID: demoID},
	}

	highSchoolInter := []entity.School{
		{Code: "TH-BKK-I001", Name: "Bangkok Patana School", SchoolTypeID: interID},
		{Code: "TH-BKK-I002", Name: "NIST International School", SchoolTypeID: interID},
		{Code: "TH-BKK-I003", Name: "ISB International School Bangkok", SchoolTypeID: interID},
		{Code: "TH-BKK-I004", Name: "KIS International School", SchoolTypeID: interID},
		{Code: "TH-PTY-I001", Name: "Regents International School Pattaya", SchoolTypeID: interID},
	}

	vocationalSchools := []entity.School{
		{Code: "TH-BKK-V001", Name: "วิทยาลัยเทคนิคกรุงเทพ", SchoolTypeID: vocaID},
		{Code: "TH-BKK-V002", Name: "วิทยาลัยการอาชีพดุสิต", SchoolTypeID: vocaID},
		{Code: "TH-NAK-V001", Name: "วิทยาลัยเทคนิคนครราชสีมา", SchoolTypeID: vocaID},
		{Code: "TH-CNX-V001", Name: "วิทยาลัยเทคนิคเชียงใหม่", SchoolTypeID: vocaID},
		{Code: "TH-KBI-V001", Name: "วิทยาลัยอาชีวศึกษากระบี่", SchoolTypeID: vocaID},
	}

	foreignSchools := []entity.School{
		{Code: "US-CA-001", Name: "High School - California, USA", SchoolTypeID: foreignID},
		{Code: "UK-LON-001", Name: "Secondary School - London, UK", SchoolTypeID: foreignID},
		{Code: "AU-SYD-001", Name: "High School - Sydney, Australia", SchoolTypeID: foreignID},
		{Code: "SG-001", Name: "Junior College - Singapore", SchoolTypeID: foreignID},
		{Code: "JP-TKY-001", Name: "High School - Tokyo, Japan", SchoolTypeID: foreignID},
	}

	otherSchools := []entity.School{
		{Code: "TH-NFE-001", Name: "กศน.กรุงเทพมหานคร", SchoolTypeID: nonFormalID},
		{Code: "TH-HSC-001", Name: "Homeschool Thailand Program", SchoolTypeID: homeID},
		{Code: "TH-OTH-001", Name: "โรงเรียนอื่นๆ (ระบุเอง)", SchoolTypeID: otherID},
	}

	items := []entity.School{}
	items = append(items, highSchoolGov...)
	items = append(items, highSchoolPrivate...)
	items = append(items, highSchoolDemo...)
	items = append(items, highSchoolInter...)
	items = append(items, vocationalSchools...)
	items = append(items, foreignSchools...)
	items = append(items, otherSchools...)

	log.Printf("Total schools to seed: %d\n", len(items))

	// Insert - collect skipped items to summarize
	var skippedCount int
	var seededCount int

	for _, school := range items {
		var existing entity.School
		if err := tx.Where("code = ?", school.Code).First(&existing).Error; err != nil {
			if err := tx.Create(&school).Error; err != nil {
				log.Printf("failed to seed School %s: %v\n", school.Code, err)
				return err
			}
			seededCount++
		} else {
			skippedCount++
		}
	}

	if seededCount > 0 {
		log.Printf("seeded %d new schools\n", seededCount)
	}
	if skippedCount > 0 {
		log.Printf("%d schools already exist, skipping\n", skippedCount)
	}

	log.Printf("Completed seeding schools\n")
	return nil
}
