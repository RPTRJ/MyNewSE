"use client";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserInterface } from "@/src/interfaces/IUser";
import { EducationInterface } from "@/src/interfaces/IEducation";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [nameLanguage, setNameLanguage] = useState<"thai" | "english">("thai");
  const [schools, setSchools] = useState<
    {
      id: number;
      name: string;
      schoolTypeId?: number;
      isProjectBased?: boolean;
    }[]
  >([]);
  const [educationLevels, setEducationLevels] = useState<
    { id: number; name: string }[]
  >([]);
  const [schoolTypes, setSchoolTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [curriculumTypes, setCurriculumTypes] = useState<
    { id: number; name: string; schoolTypeId?: number }[]
  >([]);
  const [allowedSchoolTypes, setAllowedSchoolTypes] = useState<
    { id: number; name: string }[]
  >([]);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [showSchoolList, setShowSchoolList] = useState(false);
  const [curriculumQuery, setCurriculumQuery] = useState("");
  const [showCurriculumList, setShowCurriculumList] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  const [isProjectBasedDisplay, setIsProjectBasedDisplay] = useState<
    boolean | null
  >(null);

  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string>("");
  const checkDuplicateTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // i18n translations based on language
  const getTranslations = (lang: "thai" | "english") => ({
    welcome: lang === "thai" ? "ยินดีต้อนรับเข้าสู่ระบบ" : "Welcome",
    welcomeSubtitle: lang === "thai" ? "กรุณากรอกข้อมูลเบื้องต้นเพื่อเริ่มต้นใช้งาน" : "Please fill in your basic information to get started",
    selectLanguage: lang === "thai" ? "เลือกภาษา | Select language" : "เลือกภาษา | Select language",
    languageThai: "ภาษาไทย",
    languageEnglish: "English",
    step1Title: lang === "thai" ? "ข้อมูลส่วนตัว" : "Personal Information",
    step1Subtitle: lang === "thai" ? "กรอกข้อมูลพื้นฐานของคุณ" : "Fill in your basic details",
    step2Title: lang === "thai" ? "ข้อมูลการศึกษา" : "Education Information",
    step2Subtitle: lang === "thai" ? "กรอกข้อมูลการศึกษาปัจจุบันของคุณ" : "Fill in your current education details",
    documentType: lang === "thai" ? "เอกสารยืนยันตัวตน" : "Identity Document",
    citizenId: lang === "thai" ? "บัตรประชาชน" : "Thai ID Card",
    gCode: "G-Code",
    passport: lang === "thai" ? "หนังสือเดินทาง" : "Passport",
    idNumber: lang === "thai" ? "หมายเลขเอกสาร" : "Document Number",
    idNumberPlaceholder: lang === "thai" ? "กรอกหมายเลขเอกสาร" : "Enter document number",
    firstName: lang === "thai" ? "ชื่อ" : "First Name",
    firstNamePlaceholder: lang === "thai" ? "กรอกชื่อ (ภาษาไทย)" : "Enter first name",
    lastName: lang === "thai" ? "นามสกุล" : "Last Name",
    lastNamePlaceholder: lang === "thai" ? "กรอกนามสกุล (ภาษาไทย)" : "Enter last name",
    birthday: lang === "thai" ? "วันเกิด" : "Date of Birth",
    phone: lang === "thai" ? "เบอร์โทรศัพท์" : "Phone Number",
    phonePlaceholder: "0XXXXXXXXX",
    educationLevel: lang === "thai" ? "ระดับการศึกษา" : "Education Level",
    selectEducationLevel: lang === "thai" ? "เลือกระดับการศึกษา" : "Select education level",
    schoolType: lang === "thai" ? "ประเภทโรงเรียน" : "School Type",
    selectSchoolType: lang === "thai" ? "เลือกประเภทโรงเรียน" : "Select school type",
    school: lang === "thai" ? "โรงเรียน / สถาบัน" : "School / Institution",
    schoolPlaceholder: lang === "thai" ? "ค้นหาชื่อโรงเรียน..." : "Search school name...",
    schoolHelper: lang === "thai" ? "ค้นหาแล้วเลือกจากระบบ หรือพิมพ์ชื่อเองได้" : "Search and select from list, or type manually",
    curriculum: lang === "thai" ? "หลักสูตร" : "Curriculum",
    curriculumPlaceholder: lang === "thai" ? "ค้นหาหลักสูตร..." : "Search curriculum...",
    pdpaConsent: lang === "thai" ? "ฉันยอมรับนโยบายความเป็นส่วนตัว (PDPA) และยินยอมให้เก็บรวบรวมข้อมูลส่วนบุคคล" : "I accept the Privacy Policy (PDPA) and consent to the collection of personal data",
    next: lang === "thai" ? "ถัดไป" : "Next",
    back: lang === "thai" ? "ย้อนกลับ" : "Back",
    submit: lang === "thai" ? "เสร็จสิ้น" : "Submit",
    idNumberHelper: {
      citizen: lang === "thai" ? "เลข 13 หลัก (ไม่มีขีด)" : "13 digits (no dashes)",
      gcode: lang === "thai" ? "ขึ้นต้นด้วย G ตามด้วยตัวเลข 7 หลัก" : "Starts with G followed by 7 digits",
      passport: lang === "thai" ? "ตามหมายเลขบนหน้าหนังสือเดินทาง" : "As shown on your passport",
    },
    errors: {
      firstName: lang === "thai" ? "กรุณากรอกชื่อ" : "Please enter first name",
      lastName: lang === "thai" ? "กรุณากรอกนามสกุล" : "Please enter last name",
      idDocType: lang === "thai" ? "กรุณาเลือกประเภทเอกสาร" : "Please select document type",
      idNumber: lang === "thai" ? "กรุณากรอกหมายเลขเอกสาร" : "Please enter document number",
      idNumberCitizen: lang === "thai" ? "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก" : "Thai ID must be 13 digits",
      idNumberGcode: lang === "thai" ? "G-Code ต้องขึ้นต้นด้วย G ตามด้วยตัวเลข 7 หลัก" : "G-Code must start with G followed by 7 digits",
      idNumberPassport: lang === "thai" ? "เลขพาสปอร์ตต้องเป็นตัวอักษร/ตัวเลข 6-15 ตัว" : "Passport number must be 6-15 alphanumeric characters",
      birthday: lang === "thai" ? "กรุณาเลือกวันเกิด" : "Please select date of birth",
      phone: lang === "thai" ? "กรุณากรอกเบอร์โทรศัพท์" : "Please enter phone number",
      educationLevel: lang === "thai" ? "กรุณาเลือกระดับการศึกษา" : "Please select education level",
      school: lang === "thai" ? "กรุณาเลือกหรือกรอกชื่อโรงเรียน" : "Please select or enter school name",
      pdpa: lang === "thai" ? "กรุณายอมรับนโยบาย PDPA" : "Please accept PDPA policy",
      nameThai: lang === "thai" ? "กรอกเป็นภาษาไทยเท่านั้น" : "Thai characters only",
      nameEnglish: lang === "thai" ? "กรอกเป็นภาษาอังกฤษเท่านั้น" : "English characters only",
    },
  });
  const t = getTranslations(nameLanguage);

  const docTypeOptions = [
    { key: "citizen", label: t.citizenId, value: "ID Card", id: 1 },
    { key: "gcode", label: t.gCode, value: "G-Code", id: 2 },
    { key: "passport", label: t.passport, value: "Passport", id: 3 },
  ];
  const docTypeIdByKey: Record<string, number> = {
    citizen: 1,
    gcode: 2,
    passport: 3,
  };
  const docFieldMeta: Record<
    string,
    { label: string; placeholder: string; helper: string }
  > = {
    citizen: {
      label: "เลขบัตรประชาชน *",
      placeholder: "กรอกเลขบัตรประชาชน 13 หลัก",
      helper: "เลข 13 หลัก (ไม่มีขีด)",
    },
    gcode: {
      label: "หมายเลข G-Code *",
      placeholder: "กรอก G-Code เช่น G1234567",
      helper: "ขึ้นต้นด้วย G ตามด้วยตัวเลข 7 หลัก",
    },
    passport: {
      label: "หมายเลขหนังสือเดินทาง *",
      placeholder: "กรอกหมายเลขหนังสือเดินทาง",
      helper: "ตามหมายเลขบนหน้าหนังสือเดินทาง",
    },
    default: {
      label: "หมายเลขยืนยันตัวตน *",
      placeholder: "กรอกเลขยืนยันตัวตน",
      helper: "เลข 13 หลัก (ไม่มีขีด) หรือรหัสตามเอกสารที่เลือก",
    },
  };

  // State 1: ข้อมูลส่วนตัว (User)
  const [userForm, setUserForm] = useState<UserInterface>({
    FirstNameTH: "",
    LastNameTH: "",
    IDNumber: "",
    IDDocTypeID: undefined,
    Phone: "",
    Birthday: "",
    Email: "",
    PDPAConsent: false,
  });

  // State 2: ข้อมูลการศึกษา (Education)
  const [eduForm, setEduForm] = useState<EducationInterface>({
    SchoolName: "",
    SchoolID: undefined,
    EducationLevelID: 0,
    SchoolTypeID: undefined,
    CurriculumTypeID: undefined,
    IsProjectBased: false,
    Status: undefined,
    GraduationYear: undefined,
    StartDate: null,
    EndDate: null,
  });

  useEffect(() => {
    console.log("Current Step:", step);
  }, [step]);

  useEffect(() => {
    console.log("Education Levels Count:", educationLevels.length);
  }, [educationLevels]);

  const checkIDDuplicate = useCallback(
    async (idNumber: string, idTypeName: string) => {
      if (!idNumber || !idTypeName) {
        setDuplicateError("");
        return;
      }

      // ตรวจสอบ format
      const selectedDoc = docTypeOptions.find((d) => d.value === idTypeName);
      const selectedDocKey = selectedDoc?.key || "";

      if (selectedDocKey === "citizen" && !/^\d{13}$/.test(idNumber)) {
        return;
      }
      if (selectedDocKey === "gcode" && !/^[Gg]\d{7}$/.test(idNumber)) {
        return;
      }
      if (
        selectedDocKey === "passport" &&
        !/^[A-Za-z0-9]{6,15}$/.test(idNumber)
      ) {
        return;
      }

      setIsCheckingDuplicate(true);

      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("token")
            : null;

        const response = await fetch(
          `${API_URL}/users/me/check-id?id_number=${encodeURIComponent(
            idNumber
          )}&id_type_name=${encodeURIComponent(idTypeName)}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );

        const data = await response.json();

        if (response.status === 409 || data.is_duplicate) {
          setDuplicateError(data.error || "หมายเลขเอกสารนี้ถูกลงทะเบียนแล้ว");
          setErrors((prev) => ({
            ...prev,
            IDNumber: data.error || "หมายเลขเอกสารนี้ถูกลงทะเบียนแล้ว",
          }));
        } else if (response.ok && data.unique) {
          setDuplicateError("");
          setErrors((prev) => {
            const newErrors = { ...prev };
            if (
              prev.IDNumber === duplicateError ||
              prev.IDNumber?.includes("ถูกลงทะเบียนแล้ว")
            ) {
              delete newErrors.IDNumber;
            }
            return newErrors;
          });
        }
      } catch (error) {
        console.error("Error checking ID duplicate:", error);
      } finally {
        setIsCheckingDuplicate(false);
      }
    },
    [API_URL, duplicateError]
  );

  useEffect(() => {
    if (checkDuplicateTimeoutRef.current) {
      clearTimeout(checkDuplicateTimeoutRef.current);
    }

    if (userForm.IDNumber && userForm.IDNumber.trim() !== "") {
      checkDuplicateTimeoutRef.current = setTimeout(() => {
        const selectedDoc = docTypeOptions.find(
          (d) => d.id === userForm.IDDocTypeID
        );
        if (selectedDoc && userForm.IDNumber) {
          checkIDDuplicate(userForm.IDNumber, selectedDoc.value);
        }
      }, 800);
    } else {
      setDuplicateError("");
    }

    // Cleanup
    return () => {
      if (checkDuplicateTimeoutRef.current) {
        clearTimeout(checkDuplicateTimeoutRef.current);
      }
    };
  }, [userForm.IDNumber, userForm.IDDocTypeID, checkIDDuplicate]);

  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      console.log("No token found");
      return;
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const fetchAll = async () => {
      try {
        console.log("Fetching reference data...");
        const [levelsRes, schoolTypesRes, curriculumTypesRes, schoolsRes] =
          await Promise.all([
            fetch(`${API_URL}/reference/education-levels`, { headers }),
            fetch(`${API_URL}/reference/school-types`, { headers }),
            fetch(`${API_URL}/reference/curriculum-types`, { headers }),
            fetch(`${API_URL}/reference/schools`, { headers }),
          ]);

        const levelsData = await levelsRes.json();
        const schoolTypesData = await schoolTypesRes.json();
        const curriculumTypesData = await curriculumTypesRes.json();
        const schoolsData = await schoolsRes.json();

        const mapItems = (items: any[]) => items.map(item => ({
          id: item.ID || item.id,
          name: item.name,
          schoolTypeId: item.school_type_id || item.SchoolTypeID,
          isProjectBased: item.is_project_based || item.IsProjectBased
        }));

        const mappedLevels = mapItems(levelsData.items || []).sort((a, b) => a.id - b.id);
        const mappedSchoolTypes = mapItems(schoolTypesData.items || []).sort((a, b) => a.id - b.id);
        const mappedCurriculum = mapItems(curriculumTypesData.items || []).sort((a, b) => a.id - b.id);
        const mappedSchools = mapItems(schoolsData.items || []).sort((a, b) => a.name.localeCompare(b.name));

        console.log("=== Reference Data Loaded ===");
        console.log("Education Levels:", mappedLevels.length);
        console.log("School Types:", mappedSchoolTypes.length);
        console.log("Curriculum Types:", mappedCurriculum.length);
        console.log("Schools:", mappedSchools.length);
        
        // Debug school type distribution
        const byType: { [key: string]: number } = {};
        mappedSchools.forEach((s: any) => {
          const typeId = String(s.schoolTypeId || 'unknown');
          byType[typeId] = (byType[typeId] || 0) + 1;
        });
        console.log("Schools by type ID:", byType);
        
        // Find vocational school type
        const vocaType = mappedSchoolTypes.find((st: any) => st.name.includes("อาชีวศึกษา"));
        if (vocaType) {
          console.log(`Vocational school type: "${vocaType.name}" (ID: ${vocaType.id})`);
          const vocaSchools = mappedSchools.filter((s: any) => String(s.schoolTypeId) === String(vocaType.id));
          console.log(`Found ${vocaSchools.length} vocational schools`);
          if (vocaSchools.length > 0) {
            console.log("Sample:", vocaSchools.slice(0, 3).map((s: any) => s.name));
          }
        } else {
          console.log("⚠️ No vocational school type found!");
        }

        setEducationLevels(mappedLevels);
        setSchoolTypes(mappedSchoolTypes);
        setCurriculumTypes(mappedCurriculum);
        setSchools(mappedSchools);
      } catch (error) {
        console.error("Error fetching reference data:", error);
      }
    };

    fetchAll();
  }, [API_URL]);

  useEffect(() => {
    if (!eduForm.SchoolTypeID) return;

    const authToken =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!authToken) return;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };

    console.log(`Fetching curriculum for school_type_id: ${eduForm.SchoolTypeID}`);

    fetch(`${API_URL}/reference/curriculum-types?school_type_id=${eduForm.SchoolTypeID}`, { headers })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const items = data.items || [];
        const mapped = items
          .map((item: any) => ({
            id: item.ID || item.id,
            name: item.name,
            schoolTypeId: item.school_type_id || item.SchoolTypeID,
          }))
          .sort((a: any, b: any) => a.id - b.id);

        console.log(`Curriculum Types (${mapped.length}):`, mapped.map((c: any) => c.name));
        setCurriculumTypes(mapped);
        
        // Reset curriculum selection เมื่อเปลี่ยน SchoolType
        setEduForm((prev) => ({
          ...prev,
          CurriculumTypeID: undefined,
        }));
        setCurriculumQuery("");
      })
      .catch((error) => {
        console.error("Error fetching curriculum:", error);
      });
  }, [eduForm.SchoolTypeID, API_URL]);

  useEffect(() => {
    if (!educationLevels.length) {
      setAllowedSchoolTypes(schoolTypes);
      return;
    }

    const selectedLevel = educationLevels.find(
      (level) => level.id === eduForm.EducationLevelID
    );

    if (!selectedLevel) {
      setAllowedSchoolTypes(schoolTypes);
      return;
    }

    let filtered: { id: number; name: string }[] = [];

    //มัธยมปลาย
    if (selectedLevel.name === "มัธยมศึกษาตอนปลาย (ม.4-ม.6)") {
      filtered = schoolTypes.filter((st) =>
        [
          "โรงเรียนรัฐบาล",
          "โรงเรียนเอกชน",
          "โรงเรียนสาธิต",
          "โรงเรียนนานาชาติ",
        ].includes(st.name)
      );
    }
    //อาชีวศึกษา
    else if (
      selectedLevel.name === "อาชีวศึกษา (ปวช.)" ||
      selectedLevel.name === "อาชีวศึกษา (ปวส.)"
    ) {
      filtered = schoolTypes.filter((st) => st.name === "อาชีวศึกษา (วิทยาลัย/เทคนิค)");
    }
    //GED
    else if (selectedLevel.name === "GED") {
      filtered = schoolTypes.filter((st) =>
        ["โรงเรียนนานาชาติ", "ต่างประเทศ", "Homeschool"].includes(st.name)
      );
    } else {
      filtered = schoolTypes;
    }

    const finalFiltered = filtered.length > 0 ? filtered : schoolTypes;
    
    console.log(`Education Level: ${selectedLevel.name}`);
    console.log(`Allowed School Types (${finalFiltered.length}):`, finalFiltered.map(st => st.name));
    
    setAllowedSchoolTypes(finalFiltered);
  }, [eduForm.EducationLevelID, educationLevels, schoolTypes]);

  // Handle education level change - reset all subsequent fields
  const handleEducationLevelChange = (levelId: number) => {
    const selectedLevel = educationLevels.find((level) => level.id === levelId);

    setEduForm((prev) => ({
      ...prev,
      EducationLevelID: levelId,
      SchoolID: undefined,
      SchoolName: "",
      SchoolTypeID: undefined,
      CurriculumTypeID: undefined,
      IsProjectBased: selectedLevel?.name === "GED" ? null : false,
    }));

    setSchoolQuery("");
    setCurriculumQuery("");
    setIsProjectBasedDisplay(null);
  };

  // Handle school type change - reset subsequent fields (school, curriculum)
  const handleSchoolTypeChange = (typeId: number | undefined) => {
    setEduForm((prev) => ({
      ...prev,
      SchoolTypeID: typeId,
      SchoolID: undefined,
      SchoolName: "",
      CurriculumTypeID: undefined,
    }));
    setSchoolQuery("");
    setCurriculumQuery("");
  };

  // Handle school selection - reset curriculum when school changes
  const handleSelectSchool = (school: {
    id: number;
    name: string;
    schoolTypeId?: number;
    isProjectBased?: boolean;
  }) => {
    setSchoolQuery(school.name);
    setEduForm((prev) => ({
      ...prev,
      SchoolID: school.id,
      SchoolName: school.name,
      SchoolTypeID: school.schoolTypeId || prev.SchoolTypeID,
      IsProjectBased: school.isProjectBased ?? prev.IsProjectBased,
      CurriculumTypeID: undefined, // Reset curriculum when school changes
    }));
    setShowSchoolList(false);
    setCurriculumQuery(""); // Reset curriculum query
    
    if (school.isProjectBased !== undefined) {
      setIsProjectBasedDisplay(school.isProjectBased as boolean | null);
    } else {
      setIsProjectBasedDisplay(null);
    }
  };

  // Handle curriculum selection
  const handleSelectCurriculum = (curriculum: { id: number; name: string }) => {
    setCurriculumQuery(curriculum.name);
    setEduForm((prev) => ({
      ...prev,
      CurriculumTypeID: curriculum.id,
    }));
    setShowCurriculumList(false);
  };

  // Handle school query change
  const handleSchoolChange = (value: string) => {
    setSchoolQuery(value);
    setEduForm((prev) => ({
      ...prev,
      SchoolName: value,
      SchoolID: undefined,
    }));
    setIsProjectBasedDisplay(null);
  };

  // Handle curriculum query change
  const handleCurriculumChange = (value: string) => {
    setCurriculumQuery(value);
    setEduForm((prev) => ({
      ...prev,
      CurriculumTypeID: undefined,
    }));
  };

  // Filtered schools
  const allowedSchoolTypeIds = useMemo(() => allowedSchoolTypes.map((t) => t.id), [allowedSchoolTypes]);

  const filteredSchools = useMemo(() => {
    let list = schools;

    console.log("=== Filtering Schools ===");
    console.log("Total schools:", schools.length);
    console.log("Allowed school type IDs:", allowedSchoolTypeIds);
    console.log("Selected SchoolTypeID from form:", eduForm.SchoolTypeID);

    if (allowedSchoolTypeIds.length) {
      list = list.filter((school) =>
        allowedSchoolTypeIds.some((id) => String(id) === String(school.schoolTypeId))
      );
      console.log("After allowed types filter:", list.length);
    }

    if (eduForm.SchoolTypeID) {
      list = list.filter((school) => String(school.schoolTypeId) === String(eduForm.SchoolTypeID));
      console.log("After specific type filter:", list.length);
    }

    if (schoolQuery.trim()) {
      list = list.filter((school) =>
        school.name.toLowerCase().includes(schoolQuery.toLowerCase())
      );
      console.log("After query filter:", list.length);
    }

    console.log("Final filtered schools:", list.length);
    if (list.length > 0 && list.length <= 5) {
      console.log("School names:", list.map(s => s.name));
    }

    return list;
  }, [schools, schoolQuery, allowedSchoolTypeIds, eduForm.SchoolTypeID]);
  // Filtered curriculums
  const filteredCurriculums = useMemo(() => {
    let list = curriculumTypes;

    if (eduForm.SchoolTypeID) {
      list = list.filter((curriculum) => {
        return (
          curriculum.schoolTypeId === null ||
          curriculum.schoolTypeId === undefined ||
          String(curriculum.schoolTypeId) === String(eduForm.SchoolTypeID)
        );
      });
    }

    // Filter ตาม search query
    if (curriculumQuery) {
      list = list.filter((curriculum) =>
        curriculum.name.toLowerCase().includes(curriculumQuery.toLowerCase())
      );
    }

    console.log(`Filtered Curriculums (${list.length}):`, list.map((c: any) => c.name));

    return list;
  }, [curriculumTypes, curriculumQuery, eduForm.SchoolTypeID]);

  // Get selected doc metadata
  const selectedDocKey: string =
    (Object.keys(docTypeIdByKey) as Array<keyof typeof docTypeIdByKey>).find(
      (key) => docTypeIdByKey[key] === userForm.IDDocTypeID
    ) ?? "default";
  const docMeta = docFieldMeta[selectedDocKey] || docFieldMeta.default;

  const selectedDoc = docTypeOptions.find(
    (d) => d.id === userForm.IDDocTypeID
  );
  const selectedDocLabel = selectedDoc?.label || docMeta.label;
  const selectedDocPlaceholder = selectedDoc ? docMeta.placeholder : "กรอกเลขยืนยันตัวตน";

  // Handle user form change
  const handleUserChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  // Check if IsProjectBased should be shown
  useEffect(() => {
    const selectedLevel = educationLevels.find(
      (level) => level.id === eduForm.EducationLevelID
    );

    if (
      selectedLevel &&
      (selectedLevel.name === "อาชีวศึกษา (ปวช.)" ||
        selectedLevel.name === "อาชีวศึกษา (ปวส.)")
    ) {
      if (isProjectBasedDisplay === null && eduForm.IsProjectBased !== null) {
        setIsProjectBasedDisplay(eduForm.IsProjectBased as boolean);
      }
    } else {
      setIsProjectBasedDisplay(null);
    }
  }, [eduForm.EducationLevelID, educationLevels, eduForm.IsProjectBased]);

  // Reset IsProjectBased when changing away from vocational
  useEffect(() => {
    const selectedLevel = educationLevels.find(
      (level) => level.id === eduForm.EducationLevelID
    );

    if (
      selectedLevel &&
      selectedLevel.name !== "อาชีวศึกษา (ปวช.)" &&
      selectedLevel.name !== "อาชีวศึกษา (ปวส.)"
    ) {
      setEduForm((prev) => ({ ...prev, IsProjectBased: false }));
    }
  }, [eduForm.EducationLevelID, educationLevels]);

  // Clear IsProjectBased display
  useEffect(() => {
    if (isProjectBasedDisplay !== null && !eduForm.IsProjectBased) {
      setIsProjectBasedDisplay(null);
    }
  }, [eduForm.IsProjectBased]);

  // Validate Step 1 with duplicate check
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    const first = userForm.FirstNameTH?.trim() || "";
    const last = userForm.LastNameTH?.trim() || "";
    if (!first) newErrors.FirstNameTH = "กรุณากรอกชื่อ";
    if (!last) newErrors.LastNameTH = "กรุณากรอกนามสกุล";
    if (!userForm.IDDocTypeID) {
      newErrors.IDDocTypeID = "กรุณาเลือกประเภทเอกสารยืนยันตัวตน";
    }
    const idNumber = userForm.IDNumber?.trim() || "";
    if (!idNumber) {
      newErrors.IDNumber = "กรุณากรอกเลขยืนยันตัวตน";
    } else {
      if (selectedDocKey === "citizen" && !/^\d{13}$/.test(idNumber)) {
        newErrors.IDNumber = "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก";
      }
      if (selectedDocKey === "gcode" && !/^[Gg]\d{7}$/.test(idNumber)) {
        newErrors.IDNumber = "G-Code ต้องขึ้นต้นด้วย G ตามด้วยตัวเลข 7 หลัก";
      }
      if (
        selectedDocKey === "passport" &&
        !/^[A-Za-z0-9]{6,15}$/.test(idNumber)
      ) {
        newErrors.IDNumber = "เลขพาสปอร์ตต้องเป็นตัวอักษร/ตัวเลข 6-15 ตัว";
      }

      // ตรวจสอบว่ามี duplicate error หรือไม่
      if (duplicateError) {
        newErrors.IDNumber = duplicateError;
      }
    }
    const isThai = (v: string) => /^[\p{Script=Thai}\s'-]+$/u.test(v);
    const isEng = (v: string) => /^[A-Za-z\s'-]+$/.test(v);
    if (first && last) {
      if (nameLanguage === "thai" && (!isThai(first) || !isThai(last))) {
        newErrors.FirstNameTH = "กรอกเป็นภาษาไทยเท่านั้น";
        newErrors.LastNameTH = "กรอกเป็นภาษาไทยเท่านั้น";
      }
      if (nameLanguage === "english" && (!isEng(first) || !isEng(last))) {
        newErrors.FirstNameTH = "Use English letters only";
        newErrors.LastNameTH = "Use English letters only";
      }
    }
    if (!userForm.Birthday) newErrors.Birthday = "กรุณาเลือกวันเกิด";
    if (!userForm.Phone?.trim()) newErrors.Phone = "กรุณากรอกเบอร์โทรศัพท์";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate Step 2
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!eduForm.EducationLevelID)
      newErrors.EducationLevelID = "กรุณาเลือกระดับการศึกษา";
    if (!eduForm.SchoolName?.trim() && !eduForm.SchoolID)
      newErrors.SchoolName = "กรุณาเลือกหรือกรอกชื่อโรงเรียน";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Next with duplicate check
  const handleNext = () => {
    if (step === 1) {
      // ตรวจสอบว่ากำลังเช็ค duplicate อยู่หรือไม่
      if (isCheckingDuplicate) {
        alert("กรุณารอสักครู่ ระบบกำลังตรวจสอบข้อมูล...");
        return;
      }

      // ตรวจสอบว่ามี duplicate error หรือไม่
      if (duplicateError) {
        return; // ไม่ให้ไปหน้าถัดไป
      }

      if (validateStep1()) {
        console.log("Moving to Step 2");
        setStep(2);
      } else {
        console.log("Validation failed for Step 1");
      }
    }
  };

  const handleBack = () => {
    console.log("Moving back to Step 1");
    setStep(1);
  };

  // Handle Submit
  const handleSubmit = async () => {
    if (!validateStep2()) return;
    if (!userForm.PDPAConsent) {
      setErrors((prev) => ({ ...prev, PDPAConsent: "กรุณายินยอม PDPA" }));
      return;
    }

    const useThai = nameLanguage === "thai";
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const selectedDocType = docTypeOptions.find(d => d.id === userForm.IDDocTypeID);
      
      // อัปเดตข้อมูลผู้ใช้/PDPA/ชื่อ และ ID
      const userResponse = await fetch(`${API_URL}/users/me/onboarding`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          first_name_th: useThai ? userForm.FirstNameTH : "",
          last_name_th: useThai ? userForm.LastNameTH : "",
          first_name_en: useThai ? "" : userForm.FirstNameTH,
          last_name_en: useThai ? "" : userForm.LastNameTH,
          id_number: userForm.IDNumber,
          id_type_name: selectedDocType?.value || docTypeOptions[0].value,
          phone: userForm.Phone,
          birthday: userForm.Birthday || "",
          pdpa_consent: true,
        }),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "ไม่สามารถบันทึกข้อมูลส่วนตัวได้");
      }

      // อัปเดตข้อมูลการศึกษา
      const eduResponse = await fetch(`${API_URL}/users/me/education`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          education_level_id: eduForm.EducationLevelID,
          school_id: eduForm.SchoolID ?? null,
          school_name: eduForm.SchoolID ? undefined : eduForm.SchoolName,
          school_type_id: eduForm.SchoolTypeID ?? null,
          curriculum_type_id: eduForm.CurriculumTypeID ?? null,
          is_project_based: eduForm.IsProjectBased ?? null,
          status: "current",
        }),
      });

      if (!eduResponse.ok) {
        const errorData = await eduResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "ไม่สามารถบันทึกข้อมูลการศึกษาได้");
      }

      // Update local storage user data
      const userData = await userResponse.json().catch(() => ({}));
      if (userData.data) {
        localStorage.setItem("user", JSON.stringify(userData.data));
      }

      router.replace("/student/home");
    } catch (err) {
      console.error("submit onboarding failed", err);
      const errorMessage = err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง";
      setErrors((prev) => ({ ...prev, submit: errorMessage }));
      alert(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{t.welcome}</h1>
            <p className="mt-2 text-orange-100 text-sm">{t.welcomeSubtitle}</p>
            <div className="mt-6 flex justify-center items-center gap-3">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${step >= 1 ? "bg-white text-orange-600" : "bg-orange-400 text-orange-100"}`}>1</div>
              <div className={`w-16 h-1 rounded-full ${step >= 2 ? "bg-white" : "bg-orange-400"}`}></div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${step >= 2 ? "bg-white text-orange-600" : "bg-orange-400 text-orange-100"}`}>2</div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* STEP 1: ข้อมูลส่วนตัว */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Language Selection - Only visible on step 1 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">{t.selectLanguage}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNameLanguage("thai")}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        nameLanguage === "thai"
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {t.languageThai}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNameLanguage("english")}
                      className={`py-3 px-4 rounded-xl border-2 text-sm font-medium transition-all ${
                        nameLanguage === "english"
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {t.languageEnglish}
                    </button>
                  </div>
                </div>

                <div className="border-b border-gray-100 pb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{t.step1Title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t.step1Subtitle}</p>
                </div>

                {/* Document Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t.documentType} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {docTypeOptions.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          setUserForm((prev) => ({
                            ...prev,
                            IDDocTypeID: opt.id,
                          }))
                        }
                        className={`py-3 px-2 rounded-xl border-2 text-center text-sm font-medium transition-all ${
                          opt.id === userForm.IDDocTypeID
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {errors.IDDocTypeID && (
                    <p className="text-sm text-red-500 mt-2">{errors.IDDocTypeID}</p>
                  )}

                  {/* ID Number Input */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.idNumber} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="IDNumber"
                        value={userForm.IDNumber}
                        onChange={handleUserChange}
                        className={`w-full py-3 px-4 rounded-xl border-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors ${
                          errors.IDNumber || duplicateError
                            ? "border-red-400 bg-red-50"
                            : "border-gray-200 focus:border-orange-500"
                        }`}
                        placeholder={t.idNumberPlaceholder}
                      />
                      {isCheckingDuplicate && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <svg className="animate-spin h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{t.idNumberHelper[selectedDocKey as keyof typeof t.idNumberHelper] || t.idNumberHelper.citizen}</p>
                    {(errors.IDNumber || duplicateError) && (
                      <p className="text-sm text-red-500 mt-1">{errors.IDNumber || duplicateError}</p>
                    )}
                  </div>
                </div>

                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.firstName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="FirstNameTH"
                      value={userForm.FirstNameTH}
                      onChange={handleUserChange}
                      className={`w-full py-3 px-4 rounded-xl border-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors ${
                        errors.FirstNameTH ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-orange-500"
                      }`}
                      placeholder={t.firstNamePlaceholder}
                    />
                    {errors.FirstNameTH && <p className="text-sm text-red-500 mt-1">{errors.FirstNameTH}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.lastName} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="LastNameTH"
                      value={userForm.LastNameTH}
                      onChange={handleUserChange}
                      className={`w-full py-3 px-4 rounded-xl border-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors ${
                        errors.LastNameTH ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-orange-500"
                      }`}
                      placeholder={t.lastNamePlaceholder}
                    />
                    {errors.LastNameTH && <p className="text-sm text-red-500 mt-1">{errors.LastNameTH}</p>}
                  </div>
                </div>

                {/* Birthday & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.birthday} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      title="เลือกวันเกิด"
                      aria-label="เลือกวันเกิด"
                      name="Birthday"
                      value={userForm.Birthday}
                      onChange={handleUserChange}
                      className={`w-full py-3 px-4 rounded-xl border-2 text-gray-900 focus:outline-none focus:ring-0 transition-colors ${
                        errors.Birthday ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-orange-500"
                      }`}
                    />
                    {errors.Birthday && <p className="text-sm text-red-500 mt-1">{errors.Birthday}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t.phone} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="Phone"
                      value={userForm.Phone}
                      onChange={handleUserChange}
                      className={`w-full py-3 px-4 rounded-xl border-2 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors ${
                        errors.Phone ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-orange-500"
                      }`}
                      placeholder={t.phonePlaceholder}
                    />
                    {errors.Phone && <p className="text-sm text-red-500 mt-1">{errors.Phone}</p>}
                  </div>
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  className="w-full py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors shadow-lg shadow-orange-500/30"
                >
                  {t.next}
                </button>
              </div>
            )}

          {/* STEP 2: ข้อมูลการศึกษา */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t.step2Title}</h2>
                <p className="text-sm text-gray-500 mt-1">{t.step2Subtitle}</p>
              </div>

              {/* Step 1: Education Level - Always enabled */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold mr-2">1</span>
                  {t.educationLevel} <span className="text-red-500">*</span>
                </label>
                <select
                  title="เลือกระดับการศึกษา"
                  aria-label="เลือกระดับการศึกษา"
                  value={eduForm.EducationLevelID || ""}
                  onChange={(e) => handleEducationLevelChange(Number(e.target.value))}
                  className={`w-full py-3 px-4 rounded-xl border-2 text-gray-900 focus:outline-none focus:ring-0 transition-colors ${
                    errors.EducationLevelID ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-orange-500"
                  }`}
                >
                  <option value="">{t.selectEducationLevel}</option>
                  {educationLevels.map((level) => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
                {errors.EducationLevelID && <p className="text-sm text-red-500 mt-1">{errors.EducationLevelID}</p>}
              </div>

              {/* Step 2: School Type - Locked until Education Level selected */}
              <div className={!eduForm.EducationLevelID ? "opacity-50 pointer-events-none" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2 ${
                    eduForm.EducationLevelID ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-500"
                  }`}>2</span>
                  {t.schoolType}
                </label>
                <select
                  title="เลือกประเภทโรงเรียน"
                  aria-label="เลือกประเภทโรงเรียน"
                  value={eduForm.SchoolTypeID || ""}
                  onChange={(e) => handleSchoolTypeChange(e.target.value ? Number(e.target.value) : undefined)}
                  disabled={!eduForm.EducationLevelID}
                  className={`w-full py-3 px-4 rounded-xl border-2 text-gray-900 focus:outline-none focus:ring-0 transition-colors ${
                    !eduForm.EducationLevelID 
                      ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" 
                      : "border-gray-200 focus:border-orange-500"
                  }`}
                >
                  <option value="">{t.selectSchoolType}</option>
                  {allowedSchoolTypes.map((type) => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
                {!eduForm.EducationLevelID && (
                  <p className="text-xs text-gray-400 mt-1">กรุณาเลือกระดับการศึกษาก่อน</p>
                )}
              </div>

              {/* Step 3: School Search/Select - Locked until School Type selected */}
              <div className={!eduForm.SchoolTypeID ? "opacity-50 pointer-events-none" : ""}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2 ${
                    eduForm.SchoolTypeID ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-500"
                  }`}>3</span>
                  {t.school} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    title="ค้นหาหรือพิมพ์ชื่อโรงเรียน"
                    aria-label="ค้นหาหรือพิมพ์ชื่อโรงเรียน"
                    value={schoolQuery}
                    onChange={(e) => handleSchoolChange(e.target.value)}
                    onFocus={() => setShowSchoolList(true)}
                    onBlur={() => setTimeout(() => setShowSchoolList(false), 200)}
                    disabled={!eduForm.SchoolTypeID}
                    className={`w-full py-3 px-4 rounded-xl border-2 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors ${
                      !eduForm.SchoolTypeID 
                        ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed" 
                        : errors.SchoolName 
                          ? "border-red-400 bg-red-50 text-gray-900" 
                          : "border-gray-200 focus:border-orange-500 text-gray-900"
                    }`}
                    placeholder={t.schoolPlaceholder}
                    autoComplete="off"
                  />
                  {showSchoolList && filteredSchools.length > 0 && eduForm.SchoolTypeID && (
                    <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                      {filteredSchools.map((school, idx) => (
                        <button
                          type="button"
                          key={`school-${school.id}-${idx}`}
                          onMouseDown={() => handleSelectSchool(school)}
                          className="w-full text-left px-4 py-3 hover:bg-orange-50 text-sm text-gray-700 border-b border-gray-50 last:border-b-0"
                        >
                          {school.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {eduForm.SchoolTypeID ? (
                  <p className="text-xs text-gray-500 mt-1">{t.schoolHelper}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">กรุณาเลือกประเภทโรงเรียนก่อน</p>
                )}
                {errors.SchoolName && <p className="text-sm text-red-500 mt-1">{errors.SchoolName}</p>}
              </div>

              {/* Step 4: Curriculum Type (optional) - Locked until School selected */}
              {filteredCurriculums.length > 0 && (
                <div className={!(eduForm.SchoolID || eduForm.SchoolName) ? "opacity-50 pointer-events-none" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2 ${
                      (eduForm.SchoolID || eduForm.SchoolName) ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-500"
                    }`}>4</span>
                    {t.curriculum}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      title="ค้นหาหรือพิมพ์ชื่อหลักสูตร"
                      aria-label="ค้นหาหรือพิมพ์ชื่อหลักสูตร"
                      value={curriculumQuery}
                      onChange={(e) => handleCurriculumChange(e.target.value)}
                      onFocus={() => setShowCurriculumList(true)}
                      onBlur={() => setTimeout(() => setShowCurriculumList(false), 200)}
                      disabled={!(eduForm.SchoolID || eduForm.SchoolName)}
                      className={`w-full py-3 px-4 rounded-xl border-2 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors ${
                        !(eduForm.SchoolID || eduForm.SchoolName)
                          ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "border-gray-200 focus:border-orange-500 text-gray-900"
                      }`}
                      placeholder={t.curriculumPlaceholder}
                      autoComplete="off"
                    />
                    {showCurriculumList && filteredCurriculums.length > 0 && (eduForm.SchoolID || eduForm.SchoolName) && (
                      <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                        {filteredCurriculums.map((curriculum) => (
                          <button
                            type="button"
                            key={curriculum.id}
                            onMouseDown={() => handleSelectCurriculum(curriculum)}
                            className="w-full text-left px-4 py-3 hover:bg-orange-50 text-sm text-gray-700 border-b border-gray-50 last:border-b-0"
                          >
                            {curriculum.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {!(eduForm.SchoolID || eduForm.SchoolName) && (
                    <p className="text-xs text-gray-400 mt-1">กรุณาเลือกโรงเรียนก่อน</p>
                  )}
                </div>
              )}

              {/* PDPA Consent */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    title="ยอมรับนโยบายความเป็นส่วนตัว (PDPA)"
                    aria-label="ยอมรับนโยบายความเป็นส่วนตัว (PDPA)"
                    checked={userForm.PDPAConsent}
                    onChange={(e) =>
                      setUserForm((prev) => ({
                        ...prev,
                        PDPAConsent: e.target.checked,
                      }))
                    }
                    className="mt-0.5 h-5 w-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">{t.pdpaConsent}</span>
                </label>
                {errors.PDPAConsent && <p className="text-sm text-red-500 mt-2">{errors.PDPAConsent}</p>}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleBack}
                  className="flex-1 py-3 px-6 rounded-xl border-2 border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                >
                  {t.back}
                </button>
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors shadow-lg shadow-orange-500/30"
                >
                  {t.submit}
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}