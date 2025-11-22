import React from 'react';
import { X, ImageIcon, AlertCircle, Calendar } from 'lucide-react';
import { ProgressLog } from '../types';

interface ViewLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: ProgressLog | null;
}

export const ViewLogModal: React.FC<ViewLogModalProps> = ({ isOpen, onClose, log }) => {
  if (!isOpen || !log) return null;

  const questions = {
    q1: "1. 지금까지 힘들었던 것",
    q2: "2. 예측하지 못했던 것",
    q3: "3. 지금까지 이룬 것",
    q4: "4. 무엇 때문에 이뤘다고 생각하는가?",
    q5: "5. 더 발전해야겠다고 생각하는 것",
    q6: "6. 어떻게 해야 더 발전할 수 있을까?",
    q7: "7. 하고 싶은 말"
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div>
                <h3 className="font-bold text-xl text-slate-800">목표 달성 인증 기록</h3>
                <div className="flex items-center mt-1 space-x-2">
                    <span className="text-xs text-white bg-brand-500 px-2 py-0.5 rounded-full font-bold">완료됨</span>
                    <span className="text-xs text-slate-500 font-medium flex items-center">
                        <Calendar size={12} className="mr-1"/> {new Date(log.date).toLocaleDateString()}
                    </span>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400"/></button>
        </div>
        
        <div className="p-6 space-y-8">
            {/* Milestone Title */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <p className="text-xs text-slate-500 font-bold mb-1">마일스톤</p>
                <h4 className="text-lg font-bold text-brand-700">{log.milestoneTitle}</h4>
            </div>

            {/* Evidence Image */}
            <div className="space-y-3">
                <div className="flex items-center text-sm font-bold text-slate-700">
                    <ImageIcon size={16} className="mr-1.5 text-brand-500"/>
                    인증 사진
                </div>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                    <img src={log.image} alt="Proof" className="w-full h-auto max-h-[500px] object-contain mx-auto" />
                </div>
            </div>

            {/* Q&A Section */}
            <div className="space-y-6">
                <div className="flex items-center p-3 bg-indigo-50 rounded-lg text-indigo-800 text-sm font-medium">
                    <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                    작성자의 회고록
                </div>

                {Object.entries(questions).map(([key, question]) => (
                    <div key={key} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                        <p className="font-bold text-slate-500 text-xs mb-2">{question}</p>
                        <p className="text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">
                            {(log.answers as any)[key] || "-"}
                        </p>
                    </div>
                ))}
            </div>
        </div>

        <div className="p-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            <button onClick={onClose} className="w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors">
                닫기
            </button>
        </div>
      </div>
    </div>
  );
};
