'use client';
import { useState, useEffect } from 'react';
import { ChevronDown, CheckCircle, Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { Mail, Phone, Calendar, MapPin, GraduationCap, Briefcase, Award } from 'lucide-react';
import submissionService from '@/services/submission';
import { fetchMyProfile, fetchUserProfileByTeacher } from '@/services/profile';
import {getActivitiesByUser} from '@/services/activity';

import { getWorkings } from '@/services/working';

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
  const [activities, setActivities] = useState<any[]>([]);
  const [workings, setWorkings] = useState<any[]>([]);
  const [status, setStatus] = useState('under_review');
  const isLocked = status === 'approved';

  const sections = [
    { id: 'introduction', label: 'ข้อมูลส่วนตัว', icon: '📄' },
    { id: 'workings', label: 'คลังผลงาน', icon: '📋' },
    { id: 'activities', label: 'กิจกรรม', icon: '🎨' },
  ];

  useEffect(() => {
    if (params?.id) {
      loadData(Number(params.id));
    }
  }, [params]);

  useEffect(() => {
  if (!scorecard?.score_criteria) return;

  const total = scorecard.score_criteria.reduce((sum: number, c: any) => {
    return sum + (c.score * c.weight_percent) / 100;
  }, 0);

  setScorecard((prev: any) => ({
    ...prev,
    total_score: Number(total.toFixed(2)),
    }));
  }, [scorecard?.score_criteria]);


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
      
      // Load activities
      try {
        const activitiesData = await getActivitiesByUser(studentId);
        setActivities(activitiesData);
      } catch (err) {
        console.error('Error loading activities:', err);
      }
      
      // Load workings
      try {
        const workingsData = await getWorkings();
        setWorkings(workingsData.filter((w: any) => w.user_id === studentId));
      } catch (err) {
        console.error('Error loading workings:', err);
      }
      
    } catch (err) {
      console.error('Error loading data:', err);
      alert('ไม่สามารถโหลดข้อมูลได้: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
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


  const handleSave = async () => {
    setSaving(true);
    try {
      // 1️⃣ บันทึก/อัพเดต Feedback
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

      // 2️⃣ บันทึก/อัพเดต Scorecard
      if (scorecard.ID) {
        await submissionService.updateScorecard(scorecard.ID, {
          general_comment: scorecard.general_comment,
          score_criteria: scorecard.score_criteria, // ✅ ใช้ชื่อเดิม service จะแปลงให้
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
            comment: c.comment || '', // กัน undefined
            order_index: c.order_index,
          })),
        });
        setScorecard(savedScorecard);
      }

      // 3️⃣ อัพเดต status
      await submissionService.updateSubmissionStatus(submission.ID, status);

      alert('บันทึกสำเร็จ!');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };


  const handleApprove = async () => {
    if (!confirm('ยืนยันการอนุมัติ? หลังจากนี้จะไม่สามารถแก้คะแนนได้')) return;
    try {
      await submissionService.updateSubmissionStatus(submission.ID, 'approved');
      setStatus('approved');
      alert('อนุมัติสำเร็จ!');
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  const handleRequestRevision = async () => {
    try {
      await submissionService.updateSubmissionStatus(submission.ID, 'revision_requested');
      setStatus('revision_requested');
      alert('ส่งคำขอแก้ไขแล้ว');
    } catch (err) {
      alert('เกิดข้อผิดพลาด');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-10">
        <nav className="flex items-center gap-2 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeSection === section.id
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

      <div className="flex-1 flex overflow-hidden mr-96">
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl">
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

           <div className="bg-white rounded-2xl shadow-lg p-8">
              {activeSection === 'introduction' && profile && (
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
              )}

              {activeSection === 'workings' && (
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <Briefcase className="text-indigo-600" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">คลังผลงาน</h3>
                  </div>
                  <div className="space-y-6">
                    {workings.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Briefcase className="mx-auto mb-3 text-gray-400" size={48} />
                        <p>ยังไม่มีผลงาน</p>
                      </div>
                    ) : (
                      workings.map((work) => (
                        <div key={work.ID} className="p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl hover:shadow-xl hover:border-indigo-300 transition-all duration-300">
                          <h4 className="text-xl font-bold text-gray-900 mb-3">{work.working_name}</h4>
                          <p className="text-gray-700 mb-4 leading-relaxed">{work.working_detail?.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                              <MapPin size={16} className="text-blue-600" />
                              <span>{work.working_detail?.institution}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
                              <Calendar size={16} className="text-purple-600" />
                              <span>
                                {work.working_detail?.working_at 
                                  ? new Date(work.working_detail.working_at).toLocaleDateString('th-TH', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })
                                  : '-'}
                              </span>
                            </div>
                          </div>
                          {work.working_detail?.images && work.working_detail.images.length > 0 && (
                            <div className="flex gap-3 flex-wrap">
                              {work.working_detail.images.map((img: any, idx: number) => (
                                <img 
                                  key={idx} 
                                  src={img.working_image_url} 
                                  alt="" 
                                  className="w-32 h-32 object-cover rounded-xl shadow-md hover:scale-105 transition-transform cursor-pointer border-2 border-gray-200"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'activities' && (
                <div>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="p-3 bg-amber-100 rounded-xl">
                      <Award className="text-amber-600" size={24} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">กิจกรรม</h3>
                  </div>
                  <div className="space-y-6">
                    {activities.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <Award className="mx-auto mb-3 text-gray-400" size={48} />
                        <p>ยังไม่มีกิจกรรม</p>
                      </div>
                    ) : (
                      activities.map((activity) => (
                        <div key={activity.ID} className="p-6 bg-gradient-to-br from-white to-gray-50 border-2 border-gray-200 rounded-2xl hover:shadow-xl hover:border-amber-300 transition-all duration-300">
                          <div className="flex items-start justify-between mb-3 gap-4">
                            <h4 className="text-xl font-bold text-gray-900 flex-1">{activity.activity_name}</h4>
                            {activity.reward && (
                              <span className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-semibold rounded-full shadow-md whitespace-nowrap">
                                🏆 {activity.reward.level_name}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 mb-4 leading-relaxed">{activity.activity_detail?.description}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                              <MapPin size={16} className="text-blue-600" />
                              <span>{activity.activity_detail?.institution}</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg">
                              <Calendar size={16} className="text-purple-600" />
                              <span>
                                {activity.activity_detail?.activity_at 
                                  ? new Date(activity.activity_detail.activity_at).toLocaleDateString('th-TH', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })
                                  : '-'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        <aside className="fixed right-8 top-[155px] bottom-4 w-96 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          <div className="flex gap-4 px-6 pt-6 pb-3 border-b border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={() => setActiveTab('general')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'general'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              General Feedback
            </button>
            <button
              onClick={() => setActiveTab('scorecard')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'scorecard'
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
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                  <div className="relative">
                    <select 
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="revision_requested">Revision Requested</option>
                      <option value="approved">Approved</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Overall Comment</label>
                  <textarea
                    disabled={isLocked}
                    value={feedback.overall_comment}
                    onChange={(e) => setFeedback((prev: any) => ({ ...prev, overall_comment: e.target.value }))}
                    placeholder="ความเห็นโดยรวม..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-24"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Strengths</label>
                  <textarea
                    disabled={isLocked}
                    value={feedback.strengths}
                    onChange={(e) => setFeedback((prev: any) => ({ ...prev, strengths: e.target.value }))}
                    placeholder="จุดแข็ง..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Areas for Improvement</label>
                  <textarea
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
                        {((scorecard.total_score / scorecard.max_score) * 100).toFixed(1)}%
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
                        <label className="block text-xs text-gray-600 mb-2">
                          Score (max: {Criteria.max_score})
                        </label>
                        <input
                          disabled={isLocked}
                          type="number"
                          min="0"
                          max={Criteria.max_score}
                          step="0.5"
                          value={Criteria.score}
                          onChange={(e) =>updateScoreCriteria(Criteria.criteria_number, Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-2">Comment</label>
                        <textarea
                          disabled={isLocked}
                          value={Criteria.comment}
                          onChange={(e) =>updateScoreCriteriaComment(Criteria.criteria_number, e.target.value)}
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
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
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