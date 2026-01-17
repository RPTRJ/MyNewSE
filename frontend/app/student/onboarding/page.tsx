"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// ============= Interfaces =============
interface UserInterface {
  FirstNameTH: string;
  LastNameTH: string;
  IDNumber: string;
  IDDocTypeID: number | undefined;
  Phone: string;
  Birthday: string;
  Email: string;
  PDPAConsent: boolean;
}

interface EducationInterface {
  SchoolName: string;
  SchoolID: number | undefined;
  EducationLevelID: number;
  SchoolTypeID: number | undefined;
  CurriculumTypeID: number | undefined;
  IsProjectBased: boolean | null;
  Status: string | undefined;
  GraduationYear: number | undefined;
  StartDate: Date | null;
  EndDate: Date | null;
}

interface ReferenceItem {
  id: number;
  name: string;
  schoolTypeId?: number;
  isProjectBased?: boolean;
}

// ============= Main Component =============
export default function StudentOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [nameLanguage, setNameLanguage] = useState<"thai" | "english">("thai");

  // Reference data
  const [educationLevels, setEducationLevels] = useState<ReferenceItem[]>([]);
  const [schoolTypes, setSchoolTypes] = useState<ReferenceItem[]>([]);
  const [curriculumTypes, setCurriculumTypes] = useState<ReferenceItem[]>([]);
  const [schools, setSchools] = useState<ReferenceItem[]>([]);
  const [allowedSchoolTypes, setAllowedSchoolTypes] = useState<ReferenceItem[]>([]);
  
  // Loading states
  const [loadingSchools, setLoadingSchools] = useState(false);

  // Form states
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

  // UI states
  const [schoolQuery, setSchoolQuery] = useState("");
  const [curriculumQuery, setCurriculumQuery] = useState("");
  const [showSchoolList, setShowSchoolList] = useState(false);
  const [showCurriculumList, setShowCurriculumList] = useState(false);
  const [isProjectBasedDisplay, setIsProjectBasedDisplay] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [duplicateError, setDuplicateError] = useState("");
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [showPdpaModal, setShowPdpaModal] = useState(false);

  // Translation helper - must be defined first as other memos depend on it
  const t = useMemo(() => {
    const lang = nameLanguage;
    const isThai = lang === "thai";
    return {
      welcome: isThai ? "ยินดีต้อนรับ" : "Welcome",
      welcomeSubtitle: isThai ? "กรุณากรอกข้อมูลเพื่อเริ่มใช้งาน" : "Please fill in your information to get started",
      selectLanguage: isThai ? "เลือกภาษาในการกรอกชื่อ" : "Select name language",
      thai: "ภาษาไทย",
      english: "English",
      step1Title: isThai ? "ข้อมูลส่วนตัว" : "Personal Information",
      step1Subtitle: isThai ? "กรอกข้อมูลพื้นฐานของคุณ" : "Fill in your basic details",
      step2Title: isThai ? "ข้อมูลการศึกษา" : "Education Information",
      step2Subtitle: isThai ? "กรอกข้อมูลการศึกษาปัจจุบันของคุณ" : "Fill in your current education details",
      documentType: isThai ? "เอกสารยืนยันตัวตน" : "Identity Document",
      idNumber: isThai ? "หมายเลขเอกสาร" : "Document Number",
      firstName: isThai ? "ชื่อ" : "First Name",
      firstNamePlaceholder: isThai ? "กรอกชื่อ (ภาษาไทย)" : "Enter first name",
      lastName: isThai ? "นามสกุล" : "Last Name",
      lastNamePlaceholder: isThai ? "กรอกนามสกุล (ภาษาไทย)" : "Enter last name",
      birthday: isThai ? "วันเกิด" : "Date of Birth",
      phone: isThai ? "เบอร์โทรศัพท์" : "Phone Number",
      phonePlaceholder: "0XXXXXXXXX",
      educationLevel: isThai ? "ระดับการศึกษา" : "Education Level",
      selectEducationLevel: isThai ? "เลือกระดับการศึกษา" : "Select education level",
      schoolType: isThai ? "ประเภทโรงเรียน" : "School Type",
      selectSchoolType: isThai ? "เลือกประเภทโรงเรียน" : "Select school type",
      school: isThai ? "โรงเรียน / สถาบัน" : "School / Institution",
      schoolPlaceholder: isThai ? "ค้นหาชื่อโรงเรียน..." : "Search school name...",
      curriculum: isThai ? "หลักสูตร" : "Curriculum",
      curriculumPlaceholder: isThai ? "ค้นหาหลักสูตร..." : "Search curriculum...",
      pdpaConsent: isThai ? "ฉันยอมรับนโยบายความเป็นส่วนตัว (PDPA)" : "I accept the Privacy Policy (PDPA)",
      next: isThai ? "ถัดไป" : "Next",
      back: isThai ? "ย้อนกลับ" : "Back",
      submit: isThai ? "เสร็จสิ้น" : "Submit",
      // Document type options
      citizenCard: isThai ? "บัตรประชาชน" : "ID Card",
      gcode: "G-Code",
      passport: "Passport",
      // Document field meta
      citizenLabel: isThai ? "เลขบัตรประชาชน *" : "ID Card Number *",
      citizenPlaceholder: isThai ? "กรอกเลขบัตรประชาชน 13 หลัก" : "Enter 13-digit ID number",
      citizenHelper: isThai ? "เลข 13 หลัก (ไม่มีขีด)" : "13 digits (no dashes)",
      gcodeLabel: isThai ? "หมายเลข G-Code *" : "G-Code Number *",
      gcodePlaceholder: isThai ? "กรอก G-Code เช่น G1234567" : "Enter G-Code e.g. G1234567",
      gcodeHelper: isThai ? "ขึ้นต้นด้วย G ตามด้วยตัวเลข 7 หลัก" : "Starts with G followed by 7 digits",
      passportLabel: isThai ? "หมายเลขหนังสือเดินทาง *" : "Passport Number *",
      passportPlaceholder: isThai ? "กรอกหมายเลขหนังสือเดินทาง" : "Enter passport number",
      passportHelper: isThai ? "ตามหมายเลขบนหน้าหนังสือเดินทาง" : "As shown on passport",
      defaultLabel: isThai ? "หมายเลขยืนยันตัวตน *" : "Identity Number *",
      defaultPlaceholder: isThai ? "กรอกเลขยืนยันตัวตน" : "Enter identity number",
      defaultHelper: isThai ? "เลข 13 หลัก (ไม่มีขีด) หรือรหัสตามเอกสารที่เลือก" : "13 digits (no dashes) or code as per selected document",
      // Validation errors
      errorFirstName: isThai ? "กรุณากรอกชื่อ" : "Please enter first name",
      errorLastName: isThai ? "กรุณากรอกนามสกุล" : "Please enter last name",
      errorDocType: isThai ? "กรุณาเลือกประเภทเอกสาร" : "Please select document type",
      errorIdNumber: isThai ? "กรุณากรอกหมายเลขเอกสาร" : "Please enter document number",
      errorPhone: isThai ? "กรุณากรอกเบอร์โทรศัพท์" : "Please enter phone number",
      errorPhoneFormat: isThai ? "เบอร์โทรศัพท์ไม่ถูกต้อง (0XXXXXXXXX)" : "Invalid phone number (0XXXXXXXXX)",
      errorCitizenId: isThai ? "เลขบัตรประชาชนต้องมี 13 หลัก" : "ID card number must be 13 digits",
      errorGcode: isThai ? "G-Code ต้องขึ้นต้นด้วย G ตามด้วยตัวเลข 7 หลัก" : "G-Code must start with G followed by 7 digits",
      errorEducationLevel: isThai ? "กรุณาเลือกระดับการศึกษา" : "Please select education level",
      errorSchoolName: isThai ? "กรุณาเลือกหรือกรอกชื่อโรงเรียน" : "Please select or enter school name",
      errorPdpa: isThai ? "กรุณายินยอม PDPA" : "Please accept PDPA consent",
      // UI messages
      checking: isThai ? "กำลังตรวจสอบ..." : "Checking...",
      pleaseWait: isThai ? "กรุณารอสักครู่ ระบบกำลังตรวจสอบข้อมูล..." : "Please wait, system is verifying data...",
      selectEducationFirst: isThai ? "กรุณาเลือกระดับการศึกษาก่อน" : "Please select education level first",
      selectSchoolTypeFirst: isThai ? "กรุณาเลือกประเภทโรงเรียนก่อน" : "Please select school type first",
      loadingSchools: isThai ? "กำลังโหลดรายชื่อโรงเรียน..." : "Loading schools...",
      schoolsFound: (count: number) => isThai 
        ? `พบ ${count} โรงเรียน - ค้นหาแล้วเลือกจากระบบ หรือพิมพ์ชื่อเองได้`
        : `Found ${count} schools - search and select from list, or type your own`,
      noSchoolFound: isThai ? "ไม่พบโรงเรียนที่ค้นหา - คุณสามารถพิมพ์ชื่อเองได้" : "No school found - you can type your own",
      selectBirthday: isThai ? "เลือกวันเกิด" : "Select date of birth",
      searchSchool: isThai ? "ค้นหาหรือพิมพ์ชื่อโรงเรียน" : "Search or type school name",
      projectBased: isThai ? "โครงการพิเศษ (Project Based)" : "Project Based",
      regular: isThai ? "ปกติ" : "Regular",
      format: isThai ? "รูปแบบ:" : "Format:",
      cannotSavePersonal: isThai ? "ไม่สามารถบันทึกข้อมูลส่วนตัวได้" : "Cannot save personal information",
      cannotSaveEducation: isThai ? "ไม่สามารถบันทึกข้อมูลการศึกษาได้" : "Cannot save education information",
      cannotSaveGeneral: isThai ? "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง" : "Cannot save data. Please try again.",
      idAlreadyUsed: isThai ? "หมายเลขนี้ถูกใช้งานแล้ว" : "This number is already in use",
      // PDPA
      pdpaConsentPrefix: isThai ? "ฉันยอมรับ" : "I accept the",
      pdpaLink: isThai ? "นโยบายความเป็นส่วนตัว (PDPA)" : "Privacy Policy (PDPA)",
      pdpaModalTitle: isThai ? "นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)" : "Personal Data Protection Policy (PDPA)",
      pdpaModalClose: isThai ? "ปิด" : "Close",
      pdpaContent: isThai ? `
นโยบายคุ้มครองข้อมูลส่วนบุคคล

บริษัทฯ ตระหนักถึงความสำคัญของการคุ้มครองข้อมูลส่วนบุคคลของท่าน และมุ่งมั่นที่จะปฏิบัติตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ("พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล") อย่างเคร่งครัด

1. ข้อมูลส่วนบุคคลที่เก็บรวบรวม
เราจะเก็บรวบรวมข้อมูลส่วนบุคคลของท่านเท่าที่จำเป็น ได้แก่:
• ชื่อ-นามสกุล
• เลขประจำตัวประชาชน / G-Code / หมายเลขหนังสือเดินทาง
• วันเดือนปีเกิด
• หมายเลขโทรศัพท์
• ข้อมูลการศึกษา

2. วัตถุประสงค์ในการประมวลผลข้อมูล
เราประมวลผลข้อมูลส่วนบุคคลของท่านเพื่อ:
• การลงทะเบียนและยืนยันตัวตน
• การให้บริการตามที่ท่านร้องขอ
• การติดต่อสื่อสารเกี่ยวกับบริการ
• การปรับปรุงคุณภาพการให้บริการ

3. การเปิดเผยข้อมูลส่วนบุคคล
เราจะไม่เปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลภายนอก เว้นแต่:
• ได้รับความยินยอมจากท่าน
• เป็นการปฏิบัติตามกฎหมาย
• เพื่อประโยชน์โดยชอบด้วยกฎหมาย

4. การรักษาความปลอดภัยของข้อมูล
เรามีมาตรการรักษาความปลอดภัยที่เหมาะสมเพื่อป้องกันการสูญหาย การเข้าถึง การใช้ การเปลี่ยนแปลง หรือการเปิดเผยข้อมูลส่วนบุคคลโดยไม่ได้รับอนุญาต

5. สิทธิของเจ้าของข้อมูล
ท่านมีสิทธิ:
• ขอเข้าถึงและขอรับสำเนาข้อมูลส่วนบุคคล
• ขอแก้ไขข้อมูลให้ถูกต้อง
• ขอลบหรือทำลายข้อมูล
• ขอระงับการใช้ข้อมูล
• คัดค้านการประมวลผลข้อมูล
• ขอให้โอนย้ายข้อมูล
• ถอนความยินยอม

6. การติดต่อ
หากท่านมีคำถามหรือข้อสงสัยเกี่ยวกับนโยบายนี้ กรุณาติดต่อเจ้าหน้าที่คุ้มครองข้อมูลส่วนบุคคลของเรา

การกดยอมรับถือว่าท่านได้อ่านและเข้าใจนโยบายคุ้มครองข้อมูลส่วนบุคคลฉบับนี้แล้ว
      ` : `
Personal Data Protection Policy

We recognize the importance of protecting your personal data and are committed to strictly complying with the Personal Data Protection Act B.E. 2562 (2019) ("PDPA").

1. Personal Data Collected
We collect only necessary personal data, including:
• Full name
• National ID / G-Code / Passport number
• Date of birth
• Phone number
• Educational information

2. Purposes of Data Processing
We process your personal data for:
• Registration and identity verification
• Providing requested services
• Service-related communications
• Improving service quality

3. Disclosure of Personal Data
We will not disclose your personal data to third parties except:
• With your consent
• As required by law
• For legitimate interests

4. Data Security
We implement appropriate security measures to prevent loss, unauthorized access, use, alteration, or disclosure of personal data.

5. Data Subject Rights
You have the right to:
• Access and obtain copies of your personal data
• Request correction of data
• Request deletion or destruction of data
• Request restriction of data processing
• Object to data processing
• Request data portability
• Withdraw consent

6. Contact
If you have questions about this policy, please contact our Data Protection Officer.

By accepting, you acknowledge that you have read and understood this Personal Data Protection Policy.
      `,
    };
  }, [nameLanguage]);

  // Document type options
  const docTypeOptions = useMemo(() => [
    { id: 1, key: "citizen", label: t.citizenCard, value: "บัตรประชาชน" },
    { id: 2, key: "gcode", label: t.gcode, value: "G-Code" },
    { id: 3, key: "passport", label: t.passport, value: "Passport" },
  ], [t]);

  const docTypeIdByKey: Record<string, number> = {
    citizen: 1,
    gcode: 2,
    passport: 3,
  };

  const docFieldMeta: Record<string, { label: string; placeholder: string; helper: string }> = useMemo(() => ({
    citizen: {
      label: t.citizenLabel,
      placeholder: t.citizenPlaceholder,
      helper: t.citizenHelper,
    },
    gcode: {
      label: t.gcodeLabel,
      placeholder: t.gcodePlaceholder,
      helper: t.gcodeHelper,
    },
    passport: {
      label: t.passportLabel,
      placeholder: t.passportPlaceholder,
      helper: t.passportHelper,
    },
    default: {
      label: t.defaultLabel,
      placeholder: t.defaultPlaceholder,
      helper: t.defaultHelper,
    },
  }), [t]);

  // ============= Helper Functions =============
  const mapItems = (items: any[]): ReferenceItem[] =>
    items.map((item) => ({
      id: item.ID || item.id,
      name: item.name || item.Name,
      schoolTypeId: item.school_type_id || item.SchoolTypeID,
      isProjectBased: item.is_project_based || item.IsProjectBased,
    }));

  // ============= Load Initial Reference Data (ไม่รวม schools) =============
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      console.log("No token found");
      return;
    }

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const fetchReferenceData = async () => {
      try {
        console.log("Fetching reference data...");
        const [levelsRes, schoolTypesRes, curriculumTypesRes] = await Promise.all([
          fetch(`${API_URL}/reference/education-levels`, { headers }),
          fetch(`${API_URL}/reference/school-types`, { headers }),
          fetch(`${API_URL}/reference/curriculum-types`, { headers }),
        ]);

        const levelsData = await levelsRes.json();
        const schoolTypesData = await schoolTypesRes.json();
        const curriculumTypesData = await curriculumTypesRes.json();

        const mappedLevels = mapItems(levelsData.items || []).sort((a, b) => a.id - b.id);
        const mappedSchoolTypes = mapItems(schoolTypesData.items || []).sort((a, b) => a.id - b.id);
        const mappedCurriculum = mapItems(curriculumTypesData.items || []).sort((a, b) => a.id - b.id);

        console.log("=== Reference Data Loaded ===");
        console.log("Education Levels:", mappedLevels.length);
        console.log("School Types:", mappedSchoolTypes.length);
        console.log("Curriculum Types:", mappedCurriculum.length);

        setEducationLevels(mappedLevels);
        setSchoolTypes(mappedSchoolTypes);
        setCurriculumTypes(mappedCurriculum);
      } catch (error) {
        console.error("Error fetching reference data:", error);
      }
    };

    fetchReferenceData();
  }, []);

  // ============= LAZY LOAD SCHOOLS เมื่อเลือก SchoolTypeID =============
  useEffect(() => {
    if (!eduForm.SchoolTypeID) {
      setSchools([]);
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const fetchSchools = async () => {
      setLoadingSchools(true);
      try {
        // โหลด schools ตาม school_type_id ที่เลือก พร้อม limit สูงๆ
        const url = `${API_URL}/reference/schools?school_type_id=${eduForm.SchoolTypeID}&limit=200`;
        console.log(`Fetching schools for school_type_id: ${eduForm.SchoolTypeID}`);
        
        const res = await fetch(url, { headers });
        const data = await res.json();
        
        const mappedSchools = mapItems(data.items || []).sort((a, b) => 
          a.name.localeCompare(b.name, 'th')
        );
        
        console.log(`Loaded ${mappedSchools.length} schools for type ${eduForm.SchoolTypeID}`);
        if (mappedSchools.length > 0) {
          console.log("Sample schools:", mappedSchools.slice(0, 3).map(s => s.name));
        }
        
        setSchools(mappedSchools);
      } catch (error) {
        console.error("Error fetching schools:", error);
        setSchools([]);
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchools();
  }, [eduForm.SchoolTypeID]);

  // ============= Load Curriculum Types เมื่อเลือก SchoolTypeID =============
  useEffect(() => {
    if (!eduForm.SchoolTypeID) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    console.log(`Fetching curriculum for school_type_id: ${eduForm.SchoolTypeID}`);

    fetch(`${API_URL}/reference/curriculum-types?school_type_id=${eduForm.SchoolTypeID}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        const mapped = mapItems(data.items || []).sort((a, b) => a.id - b.id);
        console.log(`Curriculum Types (${mapped.length}):`, mapped.map((c) => c.name));
        setCurriculumTypes(mapped);
      })
      .catch((error) => {
        console.error("Error fetching curriculum:", error);
      });
  }, [eduForm.SchoolTypeID]);

  // ============= Filter Allowed School Types ตาม Education Level =============
  useEffect(() => {
    if (!educationLevels.length) {
      setAllowedSchoolTypes(schoolTypes);
      return;
    }

    const selectedLevel = educationLevels.find((level) => level.id === eduForm.EducationLevelID);

    if (!selectedLevel) {
      setAllowedSchoolTypes(schoolTypes);
      return;
    }

    let filtered: ReferenceItem[] = [];

    // มัธยมปลาย
    if (selectedLevel.name === "มัธยมศึกษาตอนปลาย (ม.4-ม.6)") {
      filtered = schoolTypes.filter((st) =>
        ["โรงเรียนรัฐบาล", "โรงเรียนเอกชน", "โรงเรียนสาธิต", "โรงเรียนนานาชาติ"].includes(st.name)
      );
    }
    // อาชีวศึกษา
    else if (selectedLevel.name === "อาชีวศึกษา (ปวช.)" || selectedLevel.name === "อาชีวศึกษา (ปวส.)") {
      filtered = schoolTypes.filter((st) => st.name === "อาชีวศึกษา (วิทยาลัย/เทคนิค)");
    }
    // GED
    else if (selectedLevel.name === "GED") {
      filtered = schoolTypes.filter((st) =>
        ["โรงเรียนนานาชาติ", "ต่างประเทศ", "Homeschool"].includes(st.name)
      );
    } else {
      filtered = schoolTypes;
    }

    const finalFiltered = filtered.length > 0 ? filtered : schoolTypes;

    console.log(`Education Level: ${selectedLevel.name}`);
    console.log(`Allowed School Types (${finalFiltered.length}):`, finalFiltered.map((st) => st.name));

    setAllowedSchoolTypes(finalFiltered);
  }, [eduForm.EducationLevelID, educationLevels, schoolTypes]);

  // ============= Handle Education Level Change =============
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
    setSchools([]); // Clear schools
  };

  // ============= Handle School Type Change =============
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

  // ============= Handle School Selection =============
  const handleSelectSchool = (school: ReferenceItem) => {
    setSchoolQuery(school.name);
    setEduForm((prev) => ({
      ...prev,
      SchoolID: school.id,
      SchoolName: school.name,
      SchoolTypeID: school.schoolTypeId || prev.SchoolTypeID,
      IsProjectBased: school.isProjectBased ?? prev.IsProjectBased,
      CurriculumTypeID: undefined,
    }));
    setShowSchoolList(false);
    setCurriculumQuery("");

    if (school.isProjectBased !== undefined) {
      setIsProjectBasedDisplay(school.isProjectBased as boolean | null);
    } else {
      setIsProjectBasedDisplay(null);
    }
  };

  // ============= Handle School Query Change =============
  const handleSchoolChange = (value: string) => {
    setSchoolQuery(value);
    setEduForm((prev) => ({
      ...prev,
      SchoolName: value,
      SchoolID: undefined,
      CurriculumTypeID: undefined,
    }));
    setIsProjectBasedDisplay(null);
    setCurriculumQuery("");
  };

  // ============= Handle Curriculum Selection =============
  const handleSelectCurriculum = (curriculum: ReferenceItem) => {
    setCurriculumQuery(curriculum.name);
    setEduForm((prev) => ({
      ...prev,
      CurriculumTypeID: curriculum.id,
    }));
    setShowCurriculumList(false);
  };

  // ============= Handle Curriculum Query Change =============
  const handleCurriculumChange = (value: string) => {
    setCurriculumQuery(value);
    setEduForm((prev) => ({
      ...prev,
      CurriculumTypeID: undefined,
    }));
  };

  // ============= Filtered Schools (client-side filter by query) =============
  const filteredSchools = useMemo(() => {
    let list = schools;

    if (schoolQuery.trim()) {
      list = list.filter((school) =>
        school.name.toLowerCase().includes(schoolQuery.toLowerCase())
      );
    }

    console.log(`Filtered Schools: ${list.length} (from ${schools.length} total)`);
    return list;
  }, [schools, schoolQuery]);

  // ============= Filtered Curriculums =============
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

    if (curriculumQuery) {
      list = list.filter((curriculum) =>
        curriculum.name.toLowerCase().includes(curriculumQuery.toLowerCase())
      );
    }

    return list;
  }, [curriculumTypes, curriculumQuery, eduForm.SchoolTypeID]);

  // ============= Handle User Form Change =============
  const handleUserChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  // ============= Check ID Duplicate =============
  const checkIDDuplicate = useCallback(async (idNumber: string, idTypeName: string) => {
    if (!idNumber || !idTypeName) {
      setDuplicateError("");
      return;
    }

    const selectedDoc = docTypeOptions.find((d) => d.value === idTypeName);
    const selectedDocKey = selectedDoc?.key || "";

    if (selectedDocKey === "citizen" && !/^\d{13}$/.test(idNumber)) return;
    if (selectedDocKey === "gcode" && !/^[Gg]\d{7}$/.test(idNumber)) return;
    if (selectedDocKey === "passport" && !/^[A-Za-z0-9]{6,15}$/.test(idNumber)) return;

    setIsCheckingDuplicate(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const response = await fetch(
        `${API_URL}/users/me/check-id?id_number=${encodeURIComponent(idNumber)}&id_type_name=${encodeURIComponent(idTypeName)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setDuplicateError(data.error || t.idAlreadyUsed);
        }
      } else {
        setDuplicateError("");
      }
    } catch (error) {
      console.error("Error checking duplicate:", error);
    } finally {
      setIsCheckingDuplicate(false);
    }
  }, []);

  // Debounce check duplicate
  useEffect(() => {
    const selectedDocType = docTypeOptions.find((d) => d.id === userForm.IDDocTypeID);
    if (!selectedDocType || !userForm.IDNumber) {
      setDuplicateError("");
      return;
    }

    const timer = setTimeout(() => {
      checkIDDuplicate(userForm.IDNumber, selectedDocType.value);
    }, 500);

    return () => clearTimeout(timer);
  }, [userForm.IDNumber, userForm.IDDocTypeID, checkIDDuplicate]);

  // ============= Validation =============
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userForm.FirstNameTH?.trim()) newErrors.FirstNameTH = t.errorFirstName;
    if (!userForm.LastNameTH?.trim()) newErrors.LastNameTH = t.errorLastName;
    if (!userForm.IDDocTypeID) newErrors.IDDocTypeID = t.errorDocType;
    if (!userForm.IDNumber?.trim()) newErrors.IDNumber = t.errorIdNumber;
    if (!userForm.Phone?.trim()) newErrors.Phone = t.errorPhone;

    // Validate phone format
    if (userForm.Phone && !/^0\d{9}$/.test(userForm.Phone)) {
      newErrors.Phone = t.errorPhoneFormat;
    }

    // Validate ID Number format
    const selectedDocKey = Object.keys(docTypeIdByKey).find(
      (key) => docTypeIdByKey[key] === userForm.IDDocTypeID
    );
    if (selectedDocKey === "citizen" && userForm.IDNumber && !/^\d{13}$/.test(userForm.IDNumber)) {
      newErrors.IDNumber = t.errorCitizenId;
    }
    if (selectedDocKey === "gcode" && userForm.IDNumber && !/^[Gg]\d{7}$/.test(userForm.IDNumber)) {
      newErrors.IDNumber = t.errorGcode;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!eduForm.EducationLevelID) newErrors.EducationLevelID = t.errorEducationLevel;
    if (!eduForm.SchoolName?.trim() && !eduForm.SchoolID)
      newErrors.SchoolName = t.errorSchoolName;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============= Navigation Handlers =============
  const handleNext = () => {
    if (step === 1) {
      if (isCheckingDuplicate) {
        alert(t.pleaseWait);
        return;
      }

      if (duplicateError) {
        return;
      }

      if (validateStep1()) {
        setStep(2);
      }
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  // ============= Submit Handler =============
  const handleSubmit = async () => {
    if (!validateStep2()) return;
    if (!userForm.PDPAConsent) {
      setErrors((prev) => ({ ...prev, PDPAConsent: t.errorPdpa }));
      return;
    }

    const useThai = nameLanguage === "thai";
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const selectedDocType = docTypeOptions.find((d) => d.id === userForm.IDDocTypeID);

      // Update user info
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
        throw new Error(errorData.error || t.cannotSavePersonal);
      }

      // Update education info
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
        throw new Error(errorData.error || t.cannotSaveEducation);
      }

      // Update local storage
      const userData = await userResponse.json().catch(() => ({}));
      if (userData.data) {
        localStorage.setItem("user", JSON.stringify(userData.data));
      }

      router.replace("/student/home");
    } catch (err) {
      console.error("submit onboarding failed", err);
      const errorMessage = err instanceof Error ? err.message : t.cannotSaveGeneral;
      setErrors((prev) => ({ ...prev, submit: errorMessage }));
      alert(errorMessage);
    }
  };

  // ============= Get Doc Metadata =============
  const selectedDocKey: string =
    (Object.keys(docTypeIdByKey) as Array<keyof typeof docTypeIdByKey>).find(
      (key) => docTypeIdByKey[key] === userForm.IDDocTypeID
    ) ?? "default";
  const docMeta = docFieldMeta[selectedDocKey] || docFieldMeta.default;

  // ============= Render =============
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{t.welcome}</h1>
            <p className="mt-2 text-orange-100 text-sm">{t.welcomeSubtitle}</p>
            <div className="mt-6 flex justify-center items-center gap-3">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  step >= 1 ? "bg-white text-orange-600" : "bg-orange-400 text-orange-100"
                }`}
              >
                1
              </div>
              <div className={`w-16 h-1 rounded-full ${step >= 2 ? "bg-white" : "bg-orange-400"}`}></div>
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
                  step >= 2 ? "bg-white text-orange-600" : "bg-orange-400 text-orange-100"
                }`}
              >
                2
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Language Selection */}
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
                      🇹🇭 {t.thai}
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
                      🇬🇧 {t.english}
                    </button>
                  </div>
                </div>

                {/* Step Title */}
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{t.step1Title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t.step1Subtitle}</p>
                </div>

                {/* Document Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t.documentType} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {docTypeOptions.map((doc) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setUserForm((prev) => ({ ...prev, IDDocTypeID: doc.id, IDNumber: "" }))}
                        className={`py-2 px-3 rounded-lg border-2 text-xs font-medium transition-all ${
                          userForm.IDDocTypeID === doc.id
                            ? "border-orange-500 bg-orange-50 text-orange-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {doc.label}
                      </button>
                    ))}
                  </div>
                  {errors.IDDocTypeID && <p className="text-sm text-red-500 mt-1">{errors.IDDocTypeID}</p>}
                </div>

                {/* ID Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{docMeta.label}</label>
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
                    placeholder={docMeta.placeholder}
                  />
                  <p className="text-xs text-gray-500 mt-1">{docMeta.helper}</p>
                  {errors.IDNumber && <p className="text-sm text-red-500 mt-1">{errors.IDNumber}</p>}
                  {duplicateError && <p className="text-sm text-red-500 mt-1">{duplicateError}</p>}
                  {isCheckingDuplicate && (
                    <p className="text-sm text-orange-500 mt-1">{t.checking}</p>
                  )}
                </div>

                {/* Name Fields */}
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

                {/* Birthday */}
                <div>
                  <label htmlFor="birthday-input" className="block text-sm font-medium text-gray-700 mb-2">{t.birthday}</label>
                  <input
                    id="birthday-input"
                    type="date"
                    name="Birthday"
                    title={t.selectBirthday}
                    aria-label={t.selectBirthday}
                    value={userForm.Birthday}
                    onChange={handleUserChange}
                    className="w-full py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-900 focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                {/* Phone */}
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

                {/* Next Button */}
                <button
                  onClick={handleNext}
                  className="w-full py-3 px-6 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors shadow-lg shadow-orange-500/30"
                >
                  {t.next}
                </button>
              </div>
            )}

            {/* STEP 2: Education Info */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{t.step2Title}</h2>
                  <p className="text-sm text-gray-500 mt-1">{t.step2Subtitle}</p>
                </div>

                {/* Step 1: Education Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-xs font-bold mr-2">
                      1
                    </span>
                    {t.educationLevel} <span className="text-red-500">*</span>
                  </label>
                  <select
                    title={t.selectEducationLevel}
                    aria-label={t.selectEducationLevel}
                    value={eduForm.EducationLevelID || ""}
                    onChange={(e) => handleEducationLevelChange(Number(e.target.value))}
                    className={`w-full py-3 px-4 rounded-xl border-2 text-gray-900 focus:outline-none focus:ring-0 transition-colors ${
                      errors.EducationLevelID ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-orange-500"
                    }`}
                  >
                    <option value="">{t.selectEducationLevel}</option>
                    {educationLevels.map((level) => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                  {errors.EducationLevelID && (
                    <p className="text-sm text-red-500 mt-1">{errors.EducationLevelID}</p>
                  )}
                </div>

                {/* Step 2: School Type */}
                <div className={!eduForm.EducationLevelID ? "opacity-50 pointer-events-none" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2 ${
                        eduForm.EducationLevelID ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-500"
                      }`}
                    >
                      2
                    </span>
                    {t.schoolType}
                  </label>
                  <select
                    title={t.selectSchoolType}
                    aria-label={t.selectSchoolType}
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
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                  {!eduForm.EducationLevelID && (
                    <p className="text-xs text-gray-400 mt-1">{t.selectEducationFirst}</p>
                  )}
                </div>

                {/* Step 3: School Search */}
                <div className={!eduForm.SchoolTypeID ? "opacity-50 pointer-events-none" : ""}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2 ${
                        eduForm.SchoolTypeID ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-500"
                      }`}
                    >
                      3
                    </span>
                    {t.school} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      title={t.searchSchool}
                      aria-label={t.searchSchool}
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
                    {/* Loading indicator */}
                    {loadingSchools && eduForm.SchoolTypeID && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin h-5 w-5 border-2 border-orange-500 border-t-transparent rounded-full"></div>
                      </div>
                    )}
                    {/* Dropdown */}
                    {showSchoolList && filteredSchools.length > 0 && eduForm.SchoolTypeID && !loadingSchools && (
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
                    {/* No results message */}
                    {showSchoolList && filteredSchools.length === 0 && eduForm.SchoolTypeID && !loadingSchools && schoolQuery && (
                      <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl p-4 text-center text-sm text-gray-500">
                        {t.noSchoolFound}
                      </div>
                    )}
                  </div>
                  {eduForm.SchoolTypeID ? (
                    <p className="text-xs text-gray-500 mt-1">
                      {loadingSchools ? t.loadingSchools : t.schoolsFound(schools.length)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">{t.selectSchoolTypeFirst}</p>
                  )}
                  {errors.SchoolName && <p className="text-sm text-red-500 mt-1">{errors.SchoolName}</p>}
                </div>

                {/* Step 4: Curriculum */}
                {filteredCurriculums.length > 0 && (
                  <div className={!eduForm.SchoolTypeID ? "opacity-50 pointer-events-none" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold mr-2 ${
                          eduForm.SchoolTypeID ? "bg-orange-500 text-white" : "bg-gray-300 text-gray-500"
                        }`}
                      >
                        4
                      </span>
                      {t.curriculum}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={curriculumQuery}
                        onChange={(e) => handleCurriculumChange(e.target.value)}
                        onFocus={() => setShowCurriculumList(true)}
                        onBlur={() => setTimeout(() => setShowCurriculumList(false), 200)}
                        disabled={!eduForm.SchoolTypeID}
                        className={`w-full py-3 px-4 rounded-xl border-2 placeholder-gray-400 focus:outline-none focus:ring-0 transition-colors ${
                          !eduForm.SchoolTypeID
                            ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "border-gray-200 focus:border-orange-500 text-gray-900"
                        }`}
                        placeholder={t.curriculumPlaceholder}
                        autoComplete="off"
                      />
                      {showCurriculumList && filteredCurriculums.length > 0 && eduForm.SchoolTypeID && (
                        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                          {filteredCurriculums.map((curriculum, idx) => (
                            <button
                              type="button"
                              key={`curriculum-${curriculum.id}-${idx}`}
                              onMouseDown={() => handleSelectCurriculum(curriculum)}
                              className="w-full text-left px-4 py-3 hover:bg-orange-50 text-sm text-gray-700 border-b border-gray-50 last:border-b-0"
                            >
                              {curriculum.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Project Based (for vocational) */}
                {isProjectBasedDisplay !== null && (
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">{t.format}</span>{" "}
                      {isProjectBasedDisplay ? t.projectBased : t.regular}
                    </p>
                  </div>
                )}

                {/* PDPA Consent */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                  <input
                    type="checkbox"
                    id="pdpa"
                    title={t.pdpaLink}
                    aria-label={t.pdpaLink}
                    checked={userForm.PDPAConsent}
                    onChange={(e) => setUserForm((prev) => ({ ...prev, PDPAConsent: e.target.checked }))}
                    className="mt-1 w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">
                    {t.pdpaConsentPrefix}{" "}
                    <button
                      type="button"
                      onClick={() => setShowPdpaModal(true)}
                      className="text-orange-500 underline hover:text-orange-600 font-medium"
                    >
                      {t.pdpaLink}
                    </button>
                  </span>
                </div>
                {errors.PDPAConsent && <p className="text-sm text-red-500">{errors.PDPAConsent}</p>}

                {/* PDPA Modal */}
                {showPdpaModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
                      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">{t.pdpaModalTitle}</h3>
                        <button
                          type="button"
                          onClick={() => setShowPdpaModal(false)}
                          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                        >
                          ×
                        </button>
                      </div>
                      <div className="px-6 py-4 overflow-y-auto flex-1">
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
                          {t.pdpaContent}
                        </div>
                      </div>
                      <div className="px-6 py-4 border-t border-gray-200">
                        <button
                          type="button"
                          onClick={() => setShowPdpaModal(false)}
                          className="w-full py-2 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors"
                        >
                          {t.pdpaModalClose}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons */}
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

                {errors.submit && (
                  <p className="text-sm text-red-500 text-center mt-2">{errors.submit}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}