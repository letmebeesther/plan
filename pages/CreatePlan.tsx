import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, Milestone } from '../types';
import { suggestMilestones } from '../services/geminiService';
import { createPlan } from '../services/planService';
import { Wand2, Loader2, Trash2, Plus, ChevronLeft, CalendarClock } from 'lucide-react';

export const CreatePlan: React.FC = () => {
  const navigate = useNavigate();
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    category: [] as Category[],
    hashtags: '',
    milestones: Array(5).fill({ title: '', dueDate: '' }) as Omit<Milestone, 'id' | 'isCompleted'>[]
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAiSuggest = async () => {
    if (!formData.title || !formData.endDate) return alert("정확한 AI 생성을 위해 제목과 마감일을 먼저 입력해주세요.");
    setLoadingAI(true);
    const milestones = await suggestMilestones(formData.title, formData.description, formData.startDate, formData.endDate);
    
    if (milestones.length > 0) {
        setFormData(prev => ({
            ...prev,
            milestones: milestones.map((m: any) => ({ title: m.title, dueDate: m.dueDate }))
        }));
    } else {
        alert("AI가 마일스톤을 생성하지 못했습니다. 직접 입력해주세요.");
    }
    setLoadingAI(false);
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: '', dueDate: '' }]
    }));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const newMilestones = [...formData.milestones];
    (newMilestones[index] as any)[field] = value;
    setFormData(prev => ({ ...prev, milestones: newMilestones }));
  };

  const removeMilestone = (index: number) => {
    if (formData.milestones.length <= 5) {
      alert("진행 상황을 5단계로 보고해야 하므로 최소 5개의 마일스톤이 필요합니다.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.milestones.length < 5) {
      alert("체계적인 진행 관리를 위해 최소 5개의 마일스톤이 필요합니다.");
      return;
    }

    setSubmitting(true);
    try {
        // Transform milestones to include proper ID and default status
        const finalMilestones = formData.milestones.map((m, idx) => ({
            id: `m${Date.now()}-${idx}`,
            title: m.title,
            dueDate: m.dueDate,
            isCompleted: false
        }));

        const planData = {
            userId: 'current-user-id', // In a real auth app, get from auth context
            user: { 
                id: 'current-user-id', 
                name: '익명 사용자', 
                avatar: `https://picsum.photos/seed/${Date.now()}/100/100`, 
                bio: '새로운 도전자' 
            },
            title: formData.title,
            description: formData.description,
            images: [`https://picsum.photos/seed/${formData.title}/800/400`], // Placeholder image
            categories: formData.category,
            hashtags: formData.hashtags.split(',').map(t => t.trim()).filter(t => t.length > 0),
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            milestones: finalMilestones,
        };

        await createPlan(planData);
        alert("계획이 성공적으로 생성되었습니다! 도전을 응원합니다.");
        navigate('/');
    } catch (error) {
        console.error(error);
        alert("계획 생성 중 오류가 발생했습니다.");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold text-slate-900">새로운 도전 시작하기</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-2">목표 제목</label>
            <input 
              type="text" 
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:outline-none mb-6 bg-slate-50 font-bold text-lg placeholder:font-normal"
              placeholder="예: 3개월 안에 일본어 N3 합격하기"
              required
            />

            <label className="block text-sm font-bold text-slate-700 mb-2">자세한 계획 설명</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:outline-none h-40 resize-none mb-6 bg-slate-50"
              placeholder="무엇을 달성하고 싶으신가요? 구체적인 계획과 다짐을 적어주세요."
              required
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">시작일</label>
                    <input 
                        type="date" 
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-500"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">마감일 (타임리밋)</label>
                    <input 
                        type="datetime-local" 
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-500"
                        required
                    />
                </div>
            </div>
          </div>

          {/* Categories & Tags */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <label className="block text-sm font-bold text-slate-700 mb-2">카테고리 (최대 3개)</label>
            <div className="relative">
                <select 
                    name="category" 
                    className="w-full p-4 border border-slate-200 rounded-xl mb-6 bg-slate-50 appearance-none"
                    onChange={(e) => {
                        if (formData.category.length < 3 && !formData.category.includes(e.target.value as Category)) {
                            setFormData({...formData, category: [...formData.category, e.target.value as Category]})
                        }
                    }}
                >
                    <option value="">카테고리 선택</option>
                    {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="flex flex-wrap gap-2 mb-4">
                    {formData.category.map(c => (
                        <span key={c} className="bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                            {c} 
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, category: formData.category.filter(cat => cat !== c)})}
                                className="ml-2 hover:text-brand-900"
                            ><Trash2 size={14}/></button>
                        </span>
                    ))}
                </div>
            </div>

            <label className="block text-sm font-bold text-slate-700 mb-2">해시태그 (최대 10개, 쉼표 구분)</label>
            <input 
              type="text" 
              name="hashtags"
              value={formData.hashtags}
              onChange={handleInputChange}
              className="w-full p-4 border border-slate-200 rounded-xl bg-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              placeholder="#챌린지, #목표달성, #갓생"
            />
          </div>

          {/* Milestones */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <CalendarClock size={100} />
            </div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <label className="block text-lg font-bold text-slate-800">중간 목표 (마일스톤)</label>
                    <p className="text-xs text-slate-500 mt-1">전체 기간의 1/5 단위로 체크합니다.</p>
                </div>
                <button 
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={loadingAI}
                    className="flex items-center text-sm font-bold text-white bg-gradient-to-r from-brand-500 to-indigo-600 px-4 py-2 rounded-lg hover:shadow-lg transition-all"
                >
                    {loadingAI ? <Loader2 className="animate-spin mr-2" size={16}/> : <Wand2 className="mr-2" size={16}/>}
                    AI 자동 생성
                </button>
            </div>
            
            <div className="space-y-3">
                {formData.milestones.map((ms, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {idx + 1}
                        </div>
                        <div className="flex-1">
                            <input 
                                type="text" 
                                value={ms.title}
                                onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                                placeholder={`중간 목표 ${idx + 1} (예: 챕터 1-3 끝내기)`}
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-medium text-slate-800 placeholder:text-slate-400 mb-1"
                                required
                            />
                            <input 
                                type="date" 
                                value={ms.dueDate}
                                onChange={(e) => updateMilestone(idx, 'dueDate', e.target.value)}
                                className="bg-transparent text-xs text-slate-500 focus:outline-none"
                                required
                            />
                        </div>
                        <button type="button" onClick={() => removeMilestone(idx)} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
            
            <button 
                type="button" 
                onClick={addMilestone}
                className="mt-4 w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50 transition-all flex justify-center items-center font-bold text-sm"
            >
                <Plus size={18} className="mr-1" /> 목표 직접 추가
            </button>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/30 text-lg flex items-center justify-center disabled:opacity-70"
          >
            {submitting ? <Loader2 className="animate-spin mr-2" /> : null}
            도전 시작하기
          </button>
        </form>
      </div>
    </div>
  );
};