import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (answers: any, milestoneCompleted: boolean) => void;
}

export const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [answers, setAnswers] = useState({
      q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: ''
  });
  const [milestoneChecked, setMilestoneChecked] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
        onSubmit(answers, milestoneChecked);
    } else {
        alert("제출되었습니다.");
        onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="flex justify-between items-center p-5 border-b border-slate-100 sticky top-0 bg-white z-10">
            <div>
                <h3 className="font-bold text-xl text-slate-800">정기 진행 보고</h3>
                <p className="text-xs text-slate-500">전체 일정의 1/5 지점마다 작성합니다.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24} className="text-slate-400"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-6">
                {questions.map((q) => (
                    <div key={q.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 focus-within:border-brand-300 focus-within:ring-1 focus-within:ring-brand-200 transition-all">
                        <label className="block text-sm font-bold text-slate-700 mb-3">{q.label}</label>
                        <textarea 
                            className="w-full bg-white p-3 border border-slate-200 rounded-lg text-sm focus:outline-none resize-none h-20"
                            placeholder="내용을 솔직하게 기록해주세요."
                            value={(answers as any)[q.id]}
                            onChange={(e) => handleChange(q.id, e.target.value)}
                            required
                        ></textarea>
                    </div>
                ))}
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start cursor-pointer" onClick={() => setMilestoneChecked(!milestoneChecked)}>
                <div className={`mt-0.5 mr-3 w-5 h-5 rounded border flex items-center justify-center transition-colors ${milestoneChecked ? 'bg-amber-500 border-amber-500' : 'bg-white border-amber-300'}`}>
                    {milestoneChecked && <CheckCircle2 className="text-white" size={14} />}
                </div>
                <div className="text-sm text-amber-800 select-none">
                    <strong>중요:</strong> 이번 기간 내에 마일스톤을 달성했나요? <br/>
                    <span className="text-xs opacity-80">제출 후 반드시 체크박스를 클릭하여 완료 처리해야 합니다. 체크하지 않으면 미달성으로 기록됩니다.</span>
                </div>
            </div>

            <div className="pt-2">
                <button type="submit" className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all transform hover:-translate-y-0.5">
                    보고서 제출하기
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};