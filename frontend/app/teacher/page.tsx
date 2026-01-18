
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SubmissionService, { PortfolioSubmission } from '@/services/submission';
import style from './page.module.css';
import { Loader2 } from 'lucide-react';
import ScorecardPopup from "@/components/Scorecardpopup";


export default function TeacherPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');
  const [submissions, setSubmissions] = useState<PortfolioSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [submissionData, setSubmissionData] = useState<Map<number, any>>(new Map());
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [scorecardModalState, setScorecardModalState] = useState<{
        isOpen: boolean;
        scorecard: any;
        feedback: any;
        status: string;
        portfolioID: number | null;
    }>({
        isOpen: false,
        scorecard: null,
        feedback: null,
        status: '',
        portfolioID: null
    });
  

  // Fetch submissions from backend
  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await SubmissionService.fetchAllSubmissions();
      setSubmissions(data);
      setError('');
    } catch (err) {
      setError('ไม่สามารถดึงข้อมูลได้');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    awaiting: submissions.filter(s => s.status === 'awaiting_review').length,
    reviewing: submissions.filter(s => s.status === 'under_review').length,
    revisions: submissions.filter(s => s.status === 'revision_requested').length,
    approved: submissions.filter(s => s.status === 'approved').length,
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'awaiting_review': return 'รอการตรวจทาน';
      case 'under_review': return 'กำลังตรวจทาน';
      case 'revision_requested': return 'ขอแก้ไข';
      case 'approved': return 'ตรวจเสร็จแล้ว';
      default: return status;
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesDate = !filterDate ||
      new Date(sub.submission_at).toDateString() === new Date(filterDate).toDateString();
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesDate && matchesStatus;
  }).sort((a, b) => {
    return new Date(b.submission_at).getTime() - new Date(a.submission_at).getTime();
  });
  
  
  const handleStartReview = (id: number): void => {
    router.push(`/teacher/scorecard/${id}`);
  };

  const loadSubmissionDetails = async () => {
    setLoadingSubmissions(true);
    try {
      const map = new Map<number, any>();

      for (const sub of submissions) {
        let scorecard = null;
        let feedback = null;

        try {
          scorecard = await SubmissionService.getScorecardBySubmissionId(sub.ID);
        } catch {}

        try {
          feedback = await SubmissionService.getFeedbackBySubmissionId(sub.ID);
        } catch {}

        map.set(sub.ID, {
          submission: sub,
          scorecard,
          feedback
        });
      }

      setSubmissionData(map);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    if (submissions.length > 0) {
      loadSubmissionDetails();
    }
  }, [submissions]);



  const handleShowScorecard = (submissionId: number) => {
        const data = submissionData.get(submissionId);
        
        if (data) {
            setScorecardModalState({
                isOpen: true,
                scorecard: data.scorecard,
                feedback: data.feedback,
                status: data.submission.status,
                portfolioID: data.submission.portfolio?.ID || null
            });
        }
    };

 useEffect(() => {
  const initApp = async () => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (!token || !userStr) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.type_id !== 2) {
        alert("No permission");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/login");
        return;
      }

      setUserName(
        user.first_name_th && user.last_name_th
          ? `${user.first_name_th} ${user.last_name_th}`
          : `${user.first_name_en} ${user.last_name_en}`
      );
      setIsAuthorized(true);
      
      // ✅ เรียกแค่ครั้งเดียว
      await fetchSubmissions();
    } catch (err) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/login");
    }
  };

  initApp();
}, []); // ✅ dependency ว่าง



  if (!isAuthorized) {
    return null;
  }

  return (
    <div >
      <div className={style.dashboard_container}>
        {/* Main Content */}
          <div className={style.content_wrapper}>
            {/* Header */}
            <div className={style.page_header}>
              <div>
                <h1 className={style.header_title}>ยินดีต้อนรับ อาจารย์ {userName}</h1>
              </div>
            </div>

            {/* Stats Cards */}
            <div className={style.stats_grid}>
              <div className={style.stat_card}>
                <div className={style.stat_label}>จำนวนรอการตรวจทาน</div>
                <div className={`${style.stat_value} ${style.submitted}`}>{stats.awaiting}</div>
              </div>
                <div className={style.stat_card}>
                <div className={style.stat_label}>ตรวจทานแล้วแต่ต้องมีการแก้ไข</div>
                <div className={`${style.stat_value} ${style.revision_requested}`}>{stats.revisions}</div>
              </div>
              <div className={style.stat_card}>
                <div className={style.stat_label}>ตรวจทานและสมบูรณ์แล้ว</div>
                <div className={`${style.stat_value} ${style.ap}`}>{stats.approved}</div>
              </div>
            </div>

            {/* Queue Section */}
            <div className={style.queue_section}>
              <div className={style.queue_header}>
                <h2 className={style.queue_title}>สถานะการตรวจสอบ</h2>
                
                {/* Search and Filters */}
                <div className={style.filters_container}>
                  <div className={style.filter_buttons}>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className={style.custom_date_input}
                    />

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className={style.filter_select}
                    >
                      <option value="all">ทั้งหมด</option>
                      <option value="awaiting_review">รอการตรวจทาน</option>
                      <option value="under_review">กำลังตรวจทาน</option>
                      <option value="revision_requested">ขอแก้ไข</option>
                      <option value="approved">ตรวจเสร็จแล้ว</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className={style.table_container}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>กำลังโหลด...</div>
                ) : error ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>{error}</div>
                ) : (
                  <table className={style.submissions_table}>
                    <thead className={style.table_header}>
                      <tr>
                        <th>Student Name</th>
                        <th>Portfolio Title</th>
                        <th>Submission Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody className={style.table_body}>
                      {filteredSubmissions.map((submission) => (
                        <tr key={submission.ID} className={style.table_row}>
                          <td className={`${style.table_cell} ${style.no_wrap}`}>
                            <div className={style.student_info}>
                              <div className={style.student_avatar}>
                                {submission.user?.first_name_th?.charAt(0) ?? ""}
                                {submission.user?.last_name_th?.charAt(0) ?? ""}
                              </div>
                              <span className={style.student_name}>
                                {submission.user?.first_name_th} {submission.user?.last_name_th}
                              </span>
                            </div>
                          </td>
                          <td className={style.table_cell}>
                            <div className={style.portfolio_title}>{submission.portfolio?.portfolio_name}</div>
                          </td>
                          <td className={`${style.table_cell} ${style.no_wrap}`}>
                            <span className={style.submission_date}>
                              {new Date(submission.submission_at).toLocaleDateString('th-TH')}
                            </span>
                          </td>
                          <td className={`${style.table_cell} ${style.no_wrap}`}>
                            <span className={`${style.status_badge} ${submission.status}`}>
                              {getStatusText(submission.status)}
                            </span>
                          </td>
                          <td className={`${style.table_cell} ${style.no_wrap} ${style.align_right}`}>
                            {submission.status !== 'approved' ? (
                              <button
                                onClick={() => handleStartReview(submission.ID)}
                                className={style.action_button}
                              >
                                Start Review 
                                
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleShowScorecard(submission.ID);
                                }}
                                className={style.action_button}
                              >
                                View Submission
                              </button>  
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
        <ScorecardPopup
          isOpen={scorecardModalState.isOpen}
          onClose={() => setScorecardModalState({
            isOpen: false,
            scorecard: null,
            feedback: null,
            status: '',
            portfolioID: null
          })}
          scorecard={scorecardModalState.scorecard}
          feedback={scorecardModalState.feedback}
          status={scorecardModalState.status} onResubmit={function (): void {
            throw new Error('Function not implemented.');
          } } 
      />
    </div>
  );
}