

import React, { useState, useRef } from 'react';
import { X, Camera, Upload, CheckCircle2, AlertCircle, ShieldCheck, FileText } from 'lucide-react';
import { MilestoneAnalysis, VerificationType } from '../types';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneTitle: string;
  milestoneAnalysis?: MilestoneAnalysis;
  onSubmit: (data: { image: string; answers: any; verificationType: VerificationType }) => void;
}

const ACTION_TYPE_MAP: Record<string, string> = {
    movement: "이동/장소",
    exercise: "운동/신체활동",
    eating: "식사/섭취",
    study: "공부/학습",
    social: "소셜/대화",
    creative: "창작 활동",
    relaxation: "휴식/명상",
    experience: "새로운 경험",
    official_record: "공식 기록",
    unknown: "기타"
  };
  
const EVIDENCE_MAP: Record<string, string> = {
    biometric_log: "생체 데이터",
    gps_log: "GPS 위치",
    sensor_behavior_log: "센서 감지",
    digital_work_log: "디지털 로그",
    voice_ai_log: "음성/대화 분석",
    official_verification: "공식 인증서",
    not_applicable: "사진 인증"
};

export const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, milestoneTitle, milestoneAnalysis, onSubmit }) => {
  const [answers, setAnswers] = useState({
      q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [verificationType, setVerificationType] = useState<VerificationType>('PHOTO_TEXT');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const questions = [
    { id: 'q1', label: "1. 지금까지 힘들었던 것" },
    { id: 'q2', label: "2. 예측하지 못했던 것" },
    { id: 'q3', label: "3. 지금까지 이룬 것" },
    { id: 'q4', label: "4. 무엇 때문에 이뤘다고 생각하는가?" },
    { id: 'q5', label: "5. 더 발전해야겠다고 생각하는 것" },
    { id: 'q6', label: "6. 어떻게 해야 더 발전할 수 있을까?" },
    { id: 'q7', label: "7. 하고 싶은 말" }
  ];

  const handleChange = (id: string, value: string) => {
      setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imagePreview) {
        alert("증거 자료를 업로드해주세요!");
        return;
    }

    const allAnswered = Object.values(answers).every(val => (val as string).trim().length > 0);
    if (!allAnswered) {
        alert("7가지 질문에 모두 답변해주세요.");
        return;
    }

    onSubmit({
        image: imagePreview,
        answers,
        verificationType
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div>
                <h3 className="font-bold text-xl text-slate-800">목표 달성 보고서</h3>
                <p className="text-xs text-brand-600 font-bold mt-1">🎯 {milestoneTitle}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {/* AI Verification Guide */}
            {milestoneAnalysis && (
                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center">
                        🤖 AI 인증 가이드
                    </h4>
                    <p className="text-xs text-indigo-800 leading-relaxed font-medium mb-2">
                        {milestoneAnalysis.notes}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {milestoneAnalysis.recommended_evidence.map(e => (
                            <span key={e} className="text-[10px] bg-white text-slate-600 px-2 py-1 rounded border border-slate-200">
                                {EVIDENCE_MAP[e] || e}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Verification Type Selection */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">인증 방식 선택</label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setVerificationType('PHOTO_TEXT')}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                            verificationType === 'PHOTO_TEXT'
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-slate-200 hover:border-brand-300'
                        }`}
                    >
                        <div className="flex items-center mb-1">
                            <FileText size={18} className={verificationType === 'PHOTO_TEXT' ? 'text-brand-600' : 'text-slate-400'} />
                            <span className={`ml-2 text-sm font-bold ${verificationType === 'PHOTO_TEXT' ? 'text-brand-700' : 'text-slate-600'}`}>일반 인증</span>
                        </div>
                        <p className="text-[10px] text-slate-500">글/사진 업로드</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-1">신뢰도 20% 인정</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setVerificationType('OFFICIAL_BIOMETRIC')}
                        className={`p-3 rounded-xl border-2 text-left transition-all ${
                            verificationType === 'OFFICIAL_BIOMETRIC'
                            ? 'border-green-500 bg-green-50'
                            : 'border-slate-200 hover:border-green-300'
                        }`}
                    >
                        <div className="flex items-center mb-1">
                            <ShieldCheck size={18} className={verificationType === 'OFFICIAL_BIOMETRIC' ? 'text-green-600' : 'text-slate-400'} />
                            <span className={`ml-2 text-sm font-bold ${verificationType === 'OFFICIAL_BIOMETRIC' ? 'text-green-700' : 'text-slate-600'}`}>정밀 인증</span>
                        </div>
                        <p className="text-[10px] text-slate-500">생체데이터/공식서류</p>
                        <p className="text-[10px] font-bold text-green-600 mt-1">신뢰도 80% 인정</p>
                    </button>
                </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 flex items-center">
                    <Camera size={16} className="mr-1.5 text-brand-500"/>
                    증거 자료 업로드 (필수)
                </label>
                
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative w-full h-48 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group overflow-hidden ${
                        imagePreview ? 'border-brand-500 bg-slate-50' : 'border-slate-300 hover:border-brand-400 hover:bg-slate-50'
                    }`}
                >
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <>
                            <div className="w-12 h-12 bg-brand-50 text-brand-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Upload size={20} />
                            </div>
                            <p className="text-sm text-slate-500 font-medium">
                                {verificationType === 'OFFICIAL_BIOMETRIC' ? '생체데이터/공식서류 캡쳐본 업로드' : '인증 사진 업로드'}
                            </p>
                        </>
                    )}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                    />
                </div>
            </div>

            {/* Questions Section */}
            <div className="space-y-6">
                <div className="flex items-center p-3 bg-indigo-50 rounded-lg text-indigo-800 text-sm font-medium">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                    다음 7가지 질문에 솔직하게 답변해주세요.
                </div>

                {questions.map((q) => (
                    <div key={q.id} className="space-y-2">
                        <label className="block text-sm font-bold text-slate-800">{q.label}</label>
                        <textarea 
                            className="w-full bg-slate-50 p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 transition-all resize-none h-24"
                            placeholder="내용을 입력해주세요..."
                            value={(answers as any)[q.id]}
                            onChange={(e) => handleChange(q.id, e.target.value)}
                            required
                        ></textarea>
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t border-slate-100">
                <button type="submit" className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-0.5 flex items-center justify-center">
                    <CheckCircle2 className="mr-2" size={20} />
                    작성 완료 및 목표 달성
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">
                    제출하면 마일스톤이 '완료' 상태로 변경됩니다.
                </p>
            </div>
        </form>
      </div>
    </div>
  );
};