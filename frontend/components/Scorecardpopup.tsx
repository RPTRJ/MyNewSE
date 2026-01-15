// components/ScorecardModal.tsx
import React from 'react';
import { X, Award, TrendingUp, AlertCircle } from 'lucide-react';

interface ScorecardModalProps {
  isOpen: boolean;
  onClose: () => void;
  scorecard: any;
  feedback: any;
  status: string;
  onResubmit: () => void; 
}

const ScorecardPopup: React.FC<ScorecardModalProps> = ({
  isOpen,
  onClose,
  scorecard,
  feedback,
  status,
  onResubmit
}) => {
  if (!isOpen) return null;

  const getStatusConfig = () => {
    switch (status) {
      case 'approved':
        return {
          color: 'green',
          icon: '✓',
          title: 'ยืนยันการตรวจทานแล้ว',
          bgGradient: 'from-green-50 to-emerald-50'
        };
      case 'revision_requested':
        return {
          color: 'amber',
          icon: '🔄',
          title: 'ส่งกลับมาแก้ไข',
          bgGradient: 'from-amber-50 to-orange-50'
        };
      default:
        return {
          color: 'blue',
          icon: '📊',
          title: 'ผลการตรวจทาน',
          bgGradient: 'from-blue-50 to-indigo-50'
        };
    }
  };

  const config = getStatusConfig();
  const percentage = scorecard ? (scorecard.total_score / scorecard.max_score) * 100 : 0;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${config.bgGradient} p-6 border-b border-gray-200 sticky top-0 z-10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full bg-${config.color}-100 flex items-center justify-center text-2xl`}>
                {config.icon}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
                <p className="text-sm text-gray-600 mt-1">รายละเอียดผลการประเมิน</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Score Summary */}
          {scorecard && (
            <div className={`bg-gradient-to-br ${config.bgGradient} rounded-xl p-6 border-2 border-${config.color}-200`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Award className={`text-${config.color}-600`} size={32} />
                  <div>
                    <p className="text-sm text-gray-600">คะแนนรวม</p>
                    <p className="text-4xl font-bold text-gray-900">
                      {scorecard.total_score.toFixed(1)}
                      <span className="text-xl text-gray-500">/{scorecard.max_score}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-5xl font-bold text-${config.color}-600`}>
                    {percentage.toFixed(0)}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">เปอร์เซ็นต์</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full bg-gradient-to-r from-${config.color}-400 to-${config.color}-600 transition-all duration-500`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Criteria Breakdown */}
          {scorecard?.score_criteria && scorecard.score_criteria.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="text-blue-600" size={24} />
                <h3 className="text-xl font-bold text-gray-900">รายละเอียดคะแนนแต่ละหมวด</h3>
              </div>
              <div className="space-y-4">
                {scorecard.score_criteria.map((criteria: any) => {
                  const criteriaPercent = (criteria.score / criteria.max_score) * 100;
                  return (
                    <div key={criteria.ID} className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900">{criteria.criteria_name}</h4>
                          <p className="text-sm text-gray-600">น้ำหนัก {criteria.weight_percent}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {criteria.score}
                            <span className="text-sm text-gray-500">/{criteria.max_score}</span>
                          </p>
                          <p className={`text-sm font-semibold ${criteriaPercent >= 80 ? 'text-green-600' : criteriaPercent >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                            {criteriaPercent.toFixed(0)}%
                          </p>
                        </div>
                      </div>

                      {/* Criteria Progress */}
                      <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                        <div
                          className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                            criteriaPercent >= 80 ? 'bg-green-500' : criteriaPercent >= 60 ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(criteriaPercent, 100)}%` }}
                        />
                      </div>

                      {criteria.comment && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm text-gray-700 italic">"{criteria.comment}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* General Comment */}
          {scorecard?.general_comment && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" size={20} />
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">ความเห็นโดยรวม</h4>
                  <p className="text-gray-700 leading-relaxed">{scorecard.general_comment}</p>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Section */}
          {feedback && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedback.overall_comment && (
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>💬</span> ความเห็นโดยรวม
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{feedback.overall_comment}</p>
                </div>
              )}

              {feedback.strengths && (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>💪</span> จุดแข็ง
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{feedback.strengths}</p>
                </div>
              )}

              {feedback.areas_for_improvement && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4 md:col-span-2">
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    <span>📈</span> จุดที่ควรพัฒนา
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{feedback.areas_for_improvement}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}

        <div className="p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">

            {status === "revision_requested" && (
            <button
                onClick={onResubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
                📤 ส่งตรวจทานอีกครั้ง
            </button>
        )}
          <button
            onClick={onClose}
            className={`w-full bg-${config.color}-600 hover:bg-${config.color}-700 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2`}
          >
            ปิดหน้าต่าง
          </button>

        </div>
      </div>
    </div>
  );
};

export default ScorecardPopup;