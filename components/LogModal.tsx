import React, { useState, useRef } from 'react';
import { X, Camera, Upload, CheckCircle2, AlertCircle } from 'lucide-react';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneTitle: string;
  onSubmit: (data: { image: string; answers: any }) => void;
}

export const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, milestoneTitle, onSubmit }) => {
  const [answers, setAnswers] = useState({
      q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7: ''
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    
    // Validation
    if (!imagePreview) {
        alert("목표 달성 인증샷을 업로드해주세요!");
        return;
    }

    const allAnswered = Object.values(answers).every(val => (val as string).trim().length > 0);
    if (!allAnswered) {
        alert("7가지 질문에 모두 답변해주세요.");
        return;
    }

    onSubmit({
        image: imagePreview,
        answers
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
            {/* Image Upload Section */}
            <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 flex items-center">
                    <Camera size={16} className="mr-1.5 text-brand-500"/>
                    인증샷 업로드 (필수)
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
                            <p className="text-sm text-slate-500 font-medium">클릭하여 사진 업로드</p>
                            <p className="text-xs text-slate-400 mt-1">목표 달성을 증명할 수 있는 사진</p>
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