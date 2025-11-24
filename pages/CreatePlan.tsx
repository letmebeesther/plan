
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Category, Milestone } from '../types';
import { suggestMilestones, analyzeMilestoneAction } from '../services/geminiService';
import { createPlan } from '../services/planService';
import { getCurrentUser } from '../services/authService';
import { Wand2, Loader2, Trash2, Plus, ChevronLeft, CalendarClock } from 'lucide-react';

export const CreatePlan: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    category: [] as Category[],
    hashtags: '',
    // Initialize with 5 items (Minimum requirement) using Array.from to create distinct objects
    milestones: Array.from({ length: 5 }, () => ({ title: '', dueDate: '', weight: 2 })) as Omit<Milestone, 'id' | 'isCompleted'>[]
  });

  useEffect(() => {
    // Check if there's state passed from navigation (e.g., from Category Recommendations)
    if (location.state) {
        const { title, category, description } = location.state as { title?: string; category?: Category; description?: string };
        setFormData(prev => ({
            ...prev,
            title: title || prev.title,
            description: description || prev.description,
            category: category ? [category] : prev.category
        }));
    }
  }, [location.state]);

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
            milestones: milestones.map((m: any) => ({ 
              title: m.title, 
              dueDate: m.dueDate, 
              weight: m.weight || 2 // Use Suggested weight or default to 2
            }))
        }));
    } else {
        alert("AI가 마일스톤을 생성하지 못했습니다. 직접 입력해주세요.");
    }
    setLoadingAI(false);
  };

  const addMilestone = () => {
    if (formData.milestones.length >= 50) {
        alert("중간 목표는 최대 50개까지만 설정할 수 있습니다.");
        return;
    }
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, { title: '', dueDate: '', weight: 2 }]
    }));
  };

  const updateMilestone = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeMilestone = (index: number) => {
    if (formData.milestones.length <= 5) {
      alert("진행 상황 관리를 위해 최소 5개의 마일스톤이 필요합니다.");
      return;
    }
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = getCurrentUser();
    
    if (!currentUser) {
        alert("로그인이 필요합니다.");
        navigate('/'); // Should trigger login flow in App.tsx
        return;
    }

    if (formData.milestones.length < 5) {
      alert("체계적인 진행 관리를 위해 최소 5개의 마일스톤이 필요합니다.");
      return;
    }
    if (formData.milestones.length > 50) {
      alert("중간 목표는 최대 50개까지만 설정 가능합니다.");
      return;
    }

    setSubmitting(true);
    try {
        // AI Analysis and Transformation
        const analyzedMilestones = await Promise.all(
          formData.milestones.map(async (m, idx) => {
            let analysis = undefined;
            // Only attempt analysis if there is a title
            if (m.title.trim()) {
              try {
                const result = await analyzeMilestoneAction(m.title);
                if (result) {
                  analysis = result;
                }
              } catch (err) {
                console.warn(`Analysis failed for milestone: ${m.title}`);
              }
            }

            return {
              id: `m${Date.now()}-${idx}`,
              title: m.title,
              dueDate: m.dueDate,
              isCompleted: false,
              weight: Number(m.weight) || 2,
              analysis: analysis
            };
          })
        );

        const planData = {
            userId: currentUser.id,
            user: currentUser,
            title: formData.title,
            description: formData.description,
            images: [`https://picsum.photos/seed/${formData.title}/800/400`], // Placeholder image
            categories: formData.category,
            hashtags: formData.hashtags.split(',').map(t => t.trim()).filter(t => t.length > 0),
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            milestones: analyzedMilestones,
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
                    value=""
                >
                    <option value="" disabled>카테고리 선택</option>
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
                    <p className="text-xs text-slate-500 mt-1">전체 기간을 5~50단계로 나누고 중요도를 설정하세요.</p>
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
                    <div key={idx} className="flex flex-col md:flex-row md:items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-brand-200 transition-colors">
                        <div className="flex items-center w-full md:w-auto">
                            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm flex-shrink-0 mr-3">
                                {idx + 1}
                            </div>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 w-full">
                            <div className="md:col-span-7">
                                <input 
                                    type="text" 
                                    value={ms.title}
                                    onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                                    placeholder={`중간 목표 ${idx + 1} (예: 챕터 1-3 끝내기)`}
                                    className="w-full bg-transparent border-b border-transparent focus:border-brand-300 focus:outline-none p-1 text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                    required
                                />
                            </div>
                             <div className="md:col-span-3">
                                <input 
                                    type="date" 
                                    value={ms.dueDate}
                                    onChange={(e) => updateMilestone(idx, 'dueDate', e.target.value)}
                                    className="w-full bg-transparent text-xs text-slate-500 focus:outline-none border-b border-transparent focus:border-brand-300 p-1"
                                    required
                                />
                            </div>
                            <div className="md:col-span-2">
                                <select
                                    value={ms.weight || 2}
                                    onChange={(e) => updateMilestone(idx, 'weight', Number(e.target.value))}
                                    className={`w-full text-xs font-bold p-1 rounded border focus:outline-none ${
                                        (ms.weight || 2) === 3 ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                        (ms.weight || 2) === 2 ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}
                                >
                                    <option value={1}>중요도: 낮음</option>
                                    <option value={2}>중요도: 보통</option>
                                    <option value={3}>중요도: 높음</option>
                                </select>
                            </div>
                        </div>

                        <button type="button" onClick={() => removeMilestone(idx)} className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors self-end md:self-center">
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>
            
            <button 
                type="button" 
                onClick={addMilestone}
                disabled={formData.milestones.length >= 50}
                className={`mt-4 w-full py-3 border-2 border-dashed rounded-xl flex justify-center items-center font-bold text-sm transition-all ${
                    formData.milestones.length >= 50 
                    ? 'border-slate-100 text-slate-300 cursor-not-allowed' 
                    : 'border-slate-200 text-slate-500 hover:border-brand-400 hover:text-brand-500 hover:bg-brand-50'
                }`}
            >
                <Plus size={18} className="mr-1" /> 
                {formData.milestones.length >= 50 ? '최대 개수(50개) 도달' : '목표 직접 추가'}
            </button>
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all shadow-xl shadow-brand-500/30 text-lg flex items-center justify-center disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                AI가 검증 방식을 설계 중...
              </>
            ) : "도전 시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
};
