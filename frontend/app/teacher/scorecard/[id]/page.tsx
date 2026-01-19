'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, Phone, Calendar, MapPin, GraduationCap, Briefcase, Award } from 'lucide-react';
import submissionService from '@/services/submission';
import { fetchUserProfileByTeacher } from '@/services/profile';
import { fetchPortfolioById } from '@/services/portfolio';
import {
  AlertSuccess,
  AlertError,
  AlertWarning,
  AlertConfirm
} from "@/utils/alert";

import {
  lightenColor,
  SectionContent,
  ProfileSection
} from '@/src/components/PortfolioContent';

// ===================== Component =====================
const PortfolioReview = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [activeSection, setActiveSection] = useState('introduction');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const params = useParams();
  const submissionId = Number(params.id);

  const [submission, setSubmission] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>({
    overall_comment: '',
    strengths: '',
    areas_for_improvement: '',
  });
  const [scorecard, setScorecard] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [status, setStatus] = useState('under_review');
  const [imageIndices, setImageIndices] = useState<{ [key: string]: number }>({});
  const isLocked = status === 'approved';
  const router = useRouter();

  const sections = [
    { id: 'introduction', label: 'ข้อมูลส่วนตัว', icon: '📄' },
    { id: 'portfolio', label: 'คลังผลงาน', icon: '📁' },
  ];

  useEffect(() => {
    if (params?.id) {
      loadData(Number(params.id));
    }
  }, [params]);

  useEffect(() => {
    if (!scorecard?.score_criteria) return;

    const total = scorecard.score_criteria.reduce((sum: number, c: any) => {
      return sum + (Number(c.score) || 0);
    }, 0);

    const maxTotal = scorecard.score_criteria.reduce((sum: number, c: any) => {
      return sum + (Number(c.max_score) || 0);
    }, 0);

    setScorecard((prev: any) => ({
      ...prev,
      total_score: Number(total.toFixed(2)),
      max_score: maxTotal > 0 ? maxTotal : (prev?.max_score || 100),
    }));
  }, [scorecard?.score_criteria]);

  // Load portfolio font
  useEffect(() => {
    if (portfolio?.font?.font_url) {
      const link = document.createElement('link');
      link.href = portfolio.font.font_url;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
      return () => { document.head.removeChild(link); };
    }
  }, [portfolio]);

  const loadData = async (submissionId: number) => {
    setLoading(true);
    try {
      // Load submission
      const submissionData = await submissionService.fetchSubmissionById(submissionId);
      setSubmission(submissionData);
      setStatus(submissionData.status);

      // Load feedback
      try {
        const feedbackData = await submissionService.getFeedbackBySubmissionId(submissionId);
        setFeedback(feedbackData);
      } catch (err) {
        console.log('No existing feedback:', err);
      }

      // Load scorecard
      try {
        const scorecardData = await submissionService.getScorecardBySubmissionId(submissionId);
        setScorecard(scorecardData);
      } catch (err) {
        console.log('No existing scorecard:', err);
        // Initialize default scorecard
        setScorecard({
          ID: 0,
          total_score: 0,
          max_score: 100,
          general_comment: '',
          portfolio_submission_id: submissionId,
          score_criteria: [
            { ID: 0, criteria_number: 1, criteria_name: 'Research & Analysis', max_score: 25, score: 0, weight_percent: 25, comment: '', order_index: 1, scorecard_id: 0 },
            { ID: 0, criteria_number: 2, criteria_name: 'Design Quality', max_score: 30, score: 0, weight_percent: 30, comment: '', order_index: 2, scorecard_id: 0 },
            { ID: 0, criteria_number: 3, criteria_name: 'User Experience', max_score: 25, score: 0, weight_percent: 25, comment: '', order_index: 3, scorecard_id: 0 },
            { ID: 0, criteria_number: 4, criteria_name: 'Presentation', max_score: 20, score: 0, weight_percent: 20, comment: '', order_index: 4, scorecard_id: 0 }
          ]
        });
      }

      // Load profile
      const token = localStorage.getItem("token") || "";
      const studentId = submissionData.user?.ID;

      try {
        const profileData = await fetchUserProfileByTeacher(token, studentId);
        setProfile(profileData);
      } catch (err) {
        console.error('Error loading profile:', err);
      }

      
      try {
        const portfolioId = submissionData.portfolio?.ID;
        console.log('Loading portfolio with ID:', portfolioId);

        if (portfolioId) {
          const portfolioData = await fetchPortfolioById(portfolioId);
          console.log('Portfolio loaded:', portfolioData);

          if (portfolioData) {
            
            if (portfolioData.portfolio_sections) {
              portfolioData.portfolio_sections.sort((a: any, b: any) =>
                (a.section_order || 0) - (b.section_order || 0)
              );
            }
            setPortfolio(portfolioData);
          } else {
            console.warn('Portfolio data is null or undefined');
          }
        } else {
          console.warn('No portfolio ID found in submission');
        }
      } catch (err) {
        console.error('Error loading portfolio:', err);
        
      }

    } catch (err) {
      console.error('Error loading data:', err);
      AlertError('ไม่สามารถโหลดข้อมูลได้: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleNextImage = (blockId: string, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndices(prev => ({
      ...prev,
      [blockId]: ((prev[blockId] || 0) + 1) % totalImages
    }));
  };

  const handlePrevImage = (blockId: string, totalImages: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageIndices(prev => ({
      ...prev,
      [blockId]: ((prev[blockId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const updateScoreCriteria = (criteria_number: number, score: number) => {
    setScorecard((prev: { score_criteria: any[]; }) => ({
      ...prev,
      score_criteria: prev.score_criteria.map(c =>
        c.criteria_number === criteria_number
          ? { ...c, score: Math.min(score, c.max_score) }
          : c
      )
    }))
  };

  const updateScoreCriteriaComment = (criteria_number: number, comment: string) => {
    setScorecard((prev: any) => ({
      ...prev,
      score_criteria: prev.score_criteria.map((c: any) =>
        c.criteria_number === criteria_number
          ? { ...c, comment }
          : c
      )
    }));
  };

  const validateBeforeSave = () => {
    // 1️⃣ ตรวจ Overall Comment
    if (!feedback.overall_comment || feedback.overall_comment.trim() === '') {
      AlertWarning('กรอกข้อมูลไม่ครบ', 'กรุณากรอก Overall Comment');
      return false;
    }

    // 2️⃣ ตรวจ Scorecard
    if (!scorecard || !scorecard.score_criteria) {
      AlertError('ไม่พบข้อมูล Scorecard');
      return false;
    }

    const unfilledCriteria = scorecard.score_criteria.find(
      (c: any) => c.score === null || c.score === undefined || c.score === 0
    );

    if (unfilledCriteria) {
      AlertWarning('ยังให้คะแนนไม่ครบ', 'กรุณาให้คะแนนทุกหัวข้อ');
      return false;
    }

    return true;
  };


  const handleSave = async () => {
    if (!validateBeforeSave()) return;
    setSaving(true);
    try {
      // Save feedback
      if (feedback.ID) {
        await submissionService.updateFeedback(feedback.ID, {
          overall_comment: feedback.overall_comment,
          strengths: feedback.strengths,
          areas_for_improvement: feedback.areas_for_improvement,
        });
      } else {
        const savedFeedback = await submissionService.createFeedback({
          portfolio_submission_id: submission.ID,
          overall_comment: feedback.overall_comment,
          strengths: feedback.strengths,
          areas_for_improvement: feedback.areas_for_improvement,
        });
        setFeedback(savedFeedback);
      }

      // Save scorecard
      if (scorecard.ID) {
        await submissionService.updateScorecard(scorecard.ID, {
          general_comment: scorecard.general_comment,
          score_criteria: scorecard.score_criteria,
        });
      } else {
        const savedScorecard = await submissionService.createScorecard({
          portfolio_submission_id: submission.ID,
          general_comment: scorecard.general_comment,
          score_criteria: scorecard.score_criteria.map((c: any) => ({
            criteria_number: c.criteria_number,
            criteria_name: c.criteria_name,
            max_score: c.max_score,
            score: c.score,
            weight_percent: c.weight_percent,
            comment: c.comment || '',
            order_index: c.order_index,
          })),
        });
        setScorecard(savedScorecard);
      }

      await AlertSuccess('บันทึกสำเร็จ');
      router.push("/teacher");
      router.refresh();
    } catch (err) {
      console.error(err);
      AlertError('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!validateBeforeSave()) return;
    if (!confirm('ยืนยันการอนุมัติ? หลังจากนี้จะไม่สามารถแก้คะแนนได้')) return;
    try {
      setSaving(true);
      await handleSave();
      await submissionService.updateSubmissionStatus(submission.ID, 'approved');

      setStatus('approved');
      router.push("/teacher");
      router.refresh();
    } catch (err) {
      console.error(err);
      AlertError('เกิดข้อผิดพลาด', 'ไม่สามารถอนุมัติผลงานได้');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!validateBeforeSave()) return;
    try {
      await handleSave();
      await submissionService.updateSubmissionStatus(submission.ID, 'revision_requested');
      setStatus('revision_requested');
      router.push("/teacher");
      router.refresh();
    } catch (err) {
      AlertError('เกิดข้อผิดพลาด', 'ไม่สามารถส่งคำขอแก้ไขได้');
    }
  };

  const renderSectionContent = () => {
    if (!portfolio || !portfolio.portfolio_sections) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <div className="text-4xl mb-4">📦</div>
          <div className="text-lg">ไม่พบข้อมูล Portfolio</div>
        </div>
      );
    }

    // Prepare user data
    const education = profile?.education || {};
    const academic_score = profile?.academic_score || {};
    const schoolName = education.school?.name || education.school_name || "Suranaree University of Technology";
    const majorName = education.curriculum_type?.name || "-";
    const rawGpax = academic_score.GPAX || academic_score.gpax;
    const gpax = rawGpax ? Number(rawGpax).toFixed(2) : "-";

    const currentUser = profile ? {
      firstname: profile.user?.first_name_th || profile.user?.first_name_en || "-",
      lastname: profile.user?.last_name_th || profile.user?.last_name_en || "-",
      major: majorName,
      school: schoolName,
      profile_image: profile.user?.profile_image_url || "",
      gpa: gpax,
      academic_score: academic_score || {},
    } : null;

    // Get enabled sections
    const enabledSections = portfolio.portfolio_sections.filter((s: any) => s.is_enabled !== false);

    // Get activities and workings from portfolio blocks
    const activities: any[] = [];
    const workings: any[] = [];

    enabledSections.forEach((section: any) => {
      const blocks = section.portfolio_blocks || [];
      blocks.forEach((block: any) => {
        const content = typeof block.content === 'string' ? JSON.parse(block.content) : block.content;
        if (content?.data) {
          if (content.type === 'activity') {
            activities.push(content.data);
          } else if (content.type === 'working') {
            workings.push(content.data);
          }
        }
      });
    });

    if (activeSection === 'introduction') {
      // แสดง profile แบบธรรมดา (fallback) เสมอ
      if (profile) {
        return (
          <div className="space-y-8">
            <div className="flex items-start gap-6 pb-6 border-b border-gray-200">
              {profile.user?.profile_image_url && (
                <img
                  src={profile.user.profile_image_url}
                  alt="Profile"
                  className="w-32 h-32 rounded-2xl object-cover shadow-lg ring-4 ring-blue-100"
                />
              )}
              <div className="flex-1">
                <h3 className="text-3xl font-bold text-gray-900 mb-2">
                  {profile.user?.first_name_th} {profile.user?.last_name_th}
                </h3>
                <p className="text-xl text-gray-600 mb-4">
                  {profile.user?.first_name_en} {profile.user?.last_name_en}
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail size={18} className="text-blue-600" />
                    <span className="text-sm">{profile.user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={18} className="text-green-600" />
                    <span className="text-sm">{profile.user?.phone || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={18} className="text-purple-600" />
                    <span className="text-sm">
                      {profile.user?.birthday
                        ? new Date(profile.user.birthday).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {profile.education && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <GraduationCap className="text-blue-600" size={24} />
                  </div>
                  <h4 className="text-2xl font-bold text-gray-900">ข้อมูลการศึกษา</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">ระดับการศึกษา</p>
                    <p className="font-semibold text-gray-900">{profile.education.education_level?.name}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">โรงเรียน</p>
                    <p className="font-semibold text-gray-900">{profile.education.school?.name}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl border border-indigo-200">
                    <p className="text-sm text-gray-600 mb-1">ประเภทโรงเรียน</p>
                    <p className="font-semibold text-gray-900">{profile.education.school_type?.name}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-xl border border-cyan-200">
                    <p className="text-sm text-gray-600 mb-1">แผนการเรียน</p>
                    <p className="font-semibold text-gray-900">{profile.education.curriculum_type?.name}</p>
                  </div>
                </div>
              </div>
            )}

            {profile.academic_score && (
              <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-6">ผลการเรียน</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-6 bg-white border-2 border-purple-200 rounded-xl hover:shadow-lg hover:border-purple-300 transition-all">
                    <p className="text-sm text-gray-600 mb-2">GPAX</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                      {profile.academic_score.gpax}
                    </p>
                  </div>
                  <div className="p-6 bg-white border-2 border-blue-200 rounded-xl hover:shadow-lg hover:border-blue-300 transition-all">
                    <p className="text-sm text-gray-600 mb-2">คณิตศาสตร์</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
                      {profile.academic_score.gpa_math}
                    </p>
                  </div>
                  <div className="p-6 bg-white border-2 border-green-200 rounded-xl hover:shadow-lg hover:border-green-300 transition-all">
                    <p className="text-sm text-gray-600 mb-2">วิทยาศาสตร์</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                      {profile.academic_score.gpa_science}
                    </p>
                  </div>
                  <div className="p-6 bg-white border-2 border-orange-200 rounded-xl hover:shadow-lg hover:border-orange-300 transition-all">
                    <p className="text-sm text-gray-600 mb-2">ภาษาไทย</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                      {profile.academic_score.gpa_thai}
                    </p>
                  </div>
                  <div className="p-6 bg-white border-2 border-indigo-200 rounded-xl hover:shadow-lg hover:border-indigo-300 transition-all">
                    <p className="text-sm text-gray-600 mb-2">ภาษาอังกฤษ</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      {profile.academic_score.gpa_english}
                    </p>
                  </div>
                  <div className="p-6 bg-white border-2 border-amber-200 rounded-xl hover:shadow-lg hover:border-amber-300 transition-all">
                    <p className="text-sm text-gray-600 mb-2">สังคมศึกษา</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                      {profile.academic_score.gpa_social}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <div className="text-4xl mb-4">📦</div>
          <div className="text-lg">ไม่พบข้อมูล Profile</div>
        </div>
      );
    }

    if (activeSection === 'portfolio') {
      // Show full portfolio with all sections and design
      const primaryColor = portfolio?.colors?.primary_color || '#FF6B35';
      const bgColor = portfolio?.colors?.background_color || '#ffffff';
      const fontFam = portfolio?.font?.font_family || 'inherit';

      return (
        <div
          className="space-y-6 p-6 rounded-xl"
          style={{ backgroundColor: bgColor, fontFamily: fontFam }}
        >
          {enabledSections.map((section: any) => {
            const isProfile = section.section_title?.toLowerCase().includes('profile') ||
              section.layout_type?.includes('profile');

            return (
              <div key={section.ID} className="space-y-4">
                {!isProfile && (
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      {section.section_title}
                    </h3>
                    <div className="h-0.5 flex-1 bg-gray-200"></div>
                  </div>
                )}
                <SectionContent
                  section={section}
                  activities={activities}
                  workings={workings}
                  currentUser={currentUser}
                  imageIndices={imageIndices}
                  onNextImage={handleNextImage}
                  onPrevImage={handlePrevImage}
                />
              </div>
            );
          })}
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const backgroundColor = portfolio?.colors?.background_color || '#ffffff';
  const fontFamily = portfolio?.font?.font_family || 'inherit';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
        <nav className="flex items-center gap-2 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeSection === section.id
                ? 'bg-orange-50 text-orange-600'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              <span>{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
        </nav>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 p-6 overflow-y-auto no-scrollbar" style={{ marginRight: '500px' }}>
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Reviewing: {submission?.portfolio?.portfolio_name || 'Portfolio'}
            </h2>
            <p className="text-gray-600">
              By {submission?.user?.first_name_th} {submission?.user?.last_name_th} -
              Submitted on {submission?.submission_at ? new Date(submission.submission_at).toLocaleDateString() : ''} -
              version {submission?.version}
            </p>
          </div>

          <div
            className="bg-white rounded-2xl shadow-lg p-8"
            style={{
              backgroundColor: lightenColor(backgroundColor, 100),
              fontFamily: fontFamily
            }}
          >
            {renderSectionContent()}
          </div>
        </main>

        <aside className="fixed right-7 top-[70px] bottom-4 w-96 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="flex gap-4 px-6 pt-6 pb-3 border-b border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={() => setActiveTab('general')}
              className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'general'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              General Feedback
            </button>
            <button
              onClick={() => setActiveTab('scorecard')}
              className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'scorecard'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Scorecard
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto">
            {activeTab === 'general' && (
              <>
                <div className="mb-6">
                  <label htmlFor="scorecard-status" className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                  <div className="relative">
                    <select
                      id="scorecard-status"
                      name="scorecard-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-label="เลือกสถานะ"
                    >
                      <option value="draft">Draft</option>
                      <option value="revision_requested">Revision Requested</option>
                      <option value="approved">Approved</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="scorecard-overall-comment" className="block text-sm font-semibold text-gray-900 mb-2">Overall Comment</label>
                  <textarea
                    id="scorecard-overall-comment"
                    name="scorecard-overall-comment"
                    disabled={isLocked}
                    value={feedback.overall_comment}
                    onChange={(e) => setFeedback((prev: any) => ({ ...prev, overall_comment: e.target.value }))}
                    placeholder="ความเห็นโดยรวม..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="scorecard-strengths" className="block text-sm font-semibold text-gray-900 mb-2">Strengths</label>
                  <textarea
                    id="scorecard-strengths"
                    name="scorecard-strengths"
                    disabled={isLocked}
                    value={feedback.strengths}
                    onChange={(e) => setFeedback((prev: any) => ({ ...prev, strengths: e.target.value }))}
                    placeholder="จุดแข็ง..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="scorecard-improvement" className="block text-sm font-semibold text-gray-900 mb-2">Areas for Improvement</label>
                  <textarea
                    id="scorecard-improvement"
                    name="scorecard-improvement"
                    disabled={isLocked}
                    value={feedback.areas_for_improvement}
                    onChange={(e) => setFeedback((prev: any) => ({ ...prev, areas_for_improvement: e.target.value }))}
                    placeholder="จุดที่ควรปรับปรุง..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                  />
                </div>
              </>
            )}

            {activeTab === 'scorecard' && scorecard && (
              <>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Total Score</p>
                      <p className="text-4xl font-bold text-gray-900">
                        {scorecard.total_score.toFixed(1)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-gray-600">
                        / {scorecard.max_score}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {scorecard.max_score > 0
                          ? ((scorecard.total_score / scorecard.max_score) * 100).toFixed(1)
                          : '0.0'}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {scorecard.score_criteria?.map((Criteria: any) => (
                    <div key={Criteria.criteria_number} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900">{Criteria.criteria_name}</h4>
                        <span className="text-sm text-gray-600">{Criteria.weight_percent}%</span>
                      </div>

                      <div className="mb-3">
                        <label htmlFor={`criteria-score-${Criteria.criteria_number}`} className="block text-xs text-gray-600 mb-2">
                          Score (max: {Criteria.max_score})
                        </label>
                        <input
                          id={`criteria-score-${Criteria.criteria_number}`}
                          name={`criteria-score-${Criteria.criteria_number}`}
                          disabled={isLocked}
                          type="number"
                          min="0"
                          max={Criteria.max_score}
                          step="0.5"
                          value={Criteria.score === 0 ? '' : Criteria.score}
                          onChange={(e) => updateScoreCriteria(Criteria.criteria_number, e.target.value === '' ? 0 : Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label htmlFor={`criteria-comment-${Criteria.criteria_number}`} className="block text-xs text-gray-600 mb-2">Comment</label>
                        <textarea
                          id={`criteria-comment-${Criteria.criteria_number}`}
                          name={`criteria-comment-${Criteria.criteria_number}`}
                          disabled={isLocked}
                          value={Criteria.comment}
                          onChange={(e) => updateScoreCriteriaComment(Criteria.criteria_number, e.target.value)}
                          placeholder="ความคิดเห็น..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="border-t border-gray-200 p-6 space-y-3 bg-white flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save'}
            </button>
            <button
              onClick={handleApprove}
              disabled={isLocked}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="w-5 h-5" />
              Approve
            </button>
            <button
              onClick={handleRequestRevision}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              Request Revision
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PortfolioReview;