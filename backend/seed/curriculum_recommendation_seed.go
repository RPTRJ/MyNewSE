package seed

import (
	"fmt"
	"log"

	"github.com/sut68/team14/backend/config"
	"github.com/sut68/team14/backend/entity"
)

// SeedCurriculumRecommendations links course groups to curricula and writes
// a short recommendation text into each curriculum.description.
func SeedCurriculumRecommendations() {
	db := config.GetDB()
	if db == nil {
		log.Println("SeedCurriculumRecommendations ERROR: DB is nil")
		return
	}

	// load all curricula
	var currs []entity.Curriculum
	if err := db.Preload("Program").Find(&currs).Error; err != nil {
		log.Println("SeedCurriculumRecommendations: cannot load curricula:", err)
		return
	}

	if len(currs) == 0 {
		log.Println("SeedCurriculumRecommendations: no curricula found, skipping")
		return
	}

	// build a name->id map for course groups
	var cgs []entity.CourseGroup
	if err := db.Find(&cgs).Error; err != nil {
		log.Println("SeedCurriculumRecommendations: cannot load course groups:", err)
		return
	}
	cgByName := map[string]uint{}
	for _, cg := range cgs {
		// prefer English NameEN if available
		if cg.NameEN != "" {
			cgByName[cg.NameEN] = cg.ID
		}
		cgByName[cg.Name] = cg.ID
	}

	// mapping program short name -> ordered list of course group name_en
	mapping := map[string][]string{
		// Computer / software oriented
		"CPE": {"Programming", "Information Systems & Databases", "Data Analysis", "Algorithms", "Testing & QA", "Networking & Security"},
		"EL":  {"Calculation & Logic", "Programming", "Laboratory & Practical", "Information Systems & Databases"},
		"ME":  {"Operations & Maintenance", "Testing & QA", "Project Management", "Media & Graphic Design"},
		"AE":  {"Programming", "Laboratory & Practical", "Project Management"},
		"PM":  {"Laboratory & Practical", "Project Management", "Communication & Presentation"},
		"ENV": {"Theory & Principles", "Laboratory & Practical", "Project Management"},
		// default fallback for other programs
	}

	// default groups if program not mapped
	defaultGroups := []string{"Programming", "Data Analysis", "Communication & Presentation", "Laboratory & Practical"}

	// iterate curricula and insert CurriculumCourseGroup rows
	for _, cur := range currs {
		// skip if curriculum already has course groups
		var existingCount int64
		db.Model(&entity.CurriculumCourseGroup{}).Where("curriculum_id = ?", cur.ID).Count(&existingCount)
		if existingCount > 0 {
			log.Printf("SeedCurriculumRecommendations: curriculum %d already has %d groups, skipping\n", cur.ID, existingCount)
			continue
		}

		progShort := ""
		if cur.Program != nil {
			progShort = cur.Program.ShortName
		}

		groups := mapping[progShort]
		if len(groups) == 0 {
			groups = defaultGroups
		}

		var ccgs []entity.CurriculumCourseGroup
		for idx, gname := range groups {
			cgID, ok := cgByName[gname]
			if !ok {
				// try trimmed/alternate names
				log.Printf("SeedCurriculumRecommendations: course group '%s' not found, skipping for curriculum %d\n", gname, cur.ID)
				continue
			}

			desc := fmt.Sprintf("กลุ่มวิชา: %s — ความสำคัญระดับ %d\nแนะนำสำหรับนักเรียนที่สมัครหลักสูตรนี้", gname, 5-((idx)/2))

			ccgs = append(ccgs, entity.CurriculumCourseGroup{
				CurriculumID:     cur.ID,
				CourseGroupID:    cgID,
				CreditPercentage: 0,
				Description:      desc,
			})
		}

		if len(ccgs) > 0 {
			if err := db.Create(&ccgs).Error; err != nil {
				log.Printf("SeedCurriculumRecommendations: cannot create course groups for curriculum %d: %v\n", cur.ID, err)
			} else {
				log.Printf("SeedCurriculumRecommendations: created %d course-group links for curriculum %d\n", len(ccgs), cur.ID)
			}
		}

		// also add a short recommendation summary in curriculum.Description if empty
		if cur.Description == "" {
			rec := buildRecommendationText(groups)
			if err := db.Model(&entity.Curriculum{}).Where("id = ?", cur.ID).Update("description", rec).Error; err != nil {
				log.Printf("SeedCurriculumRecommendations: cannot update curriculum %d description: %v\n", cur.ID, err)
			} else {
				log.Printf("SeedCurriculumRecommendations: updated recommendation for curriculum %d\n", cur.ID)
			}
		}
	}
}

func buildRecommendationText(groups []string) string {
	if len(groups) == 0 {
		return "คำแนะนำ: ควรเตรียมผลงานและเรียนพื้นฐานด้านเทคนิคและการสื่อสาร"
	}
	txt := "คำแนะนำกลุ่มวิชา: "
	for i, g := range groups {
		if i > 0 {
			txt += ", "
		}
		txt += g
	}
	txt += ".\nแนะนำให้นักเรียนเตรียมผลงานและความรู้พื้นฐานในกลุ่มเหล่านี้ก่อนสมัคร"
	return txt
}
