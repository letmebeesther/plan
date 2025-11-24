

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plan, PlanStatus, ProgressLog } from '../types';
import { Clock, CheckCircle, MessageSquare, Share2, AlertTriangle, ChevronLeft, Loader2, ImageIcon, Lock, UserPlus, Heart, ShieldCheck, AlertCircle, X } from 'lucide-react';
import { LogModal } from '../components/LogModal';
import { ViewLogModal } from '../components/ViewLogModal';
import { subscribeToPlan, toggleLikePlan, updateMilestoneStatus, addProgressLog, toggleLikeMilestone } from '../services/planService';
import { getCurrentUser, toggleFollow, getUserById } from '../services/authService';

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

export const PlanDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'milestones' | 'logs' | 'comments'>('milestones');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number | null>(null);
  
  // View Log Modal State
  const [selectedLog, setSelectedLog] = useState<ProgressLog | null>(null);
  const [isViewLogModalOpen, setIsViewLogModalOpen] = useState(false);
  
  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!id) return;
    
    const unsubscribe = subscribeToPlan(id, (updatedPlan) => {
        setPlan(updatedPlan);
        setLoading(false);

        if (updatedPlan && currentUser && updatedPlan.userId !== currentUser.id) {
             getUserById(currentUser.id).then(user => {
                 if (user && user.following) {
                     setIsFollowing(user.following.includes(updatedPlan.userId));
                 }
             });
        }
    });

    return () => unsubscribe();
  }, [id, currentUser?.id]);

  if (loading) {
      return (
        <div className="flex items-center justify-center h-screen bg-slate-50">
            <Loader2 className="animate-spin text-brand-600" size={48} />
        </div>
    );
  }

  if (!plan) return <div>Plan not found</div>;

  const isVerificationPhase = plan.status === PlanStatus.VERIFICATION_PENDING;
  const isOwner = currentUser && plan.userId === currentUser.id;
  const isLiked = currentUser ? (plan.likedBy || []).includes(currentUser.id) : false;
  
  // Deadline & Grace Period Logic
  const now = new Date();
  const endDate = new Date(plan.endDate);
  const timeLeftMs = endDate.getTime() - now.getTime();
  const isExpired = timeLeftMs < 0;
  const gracePeriodEnd = new Date(endDate.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 Days grace for Plan
  const isInGracePeriod = isExpired && now < gracePeriodEnd;

  const handleLike = async () => {
    if (!currentUser) {
        alert("로그인이 필요합니다.");
        return;
    }
    await toggleLikePlan(plan.id, currentUser.id);
  };

  const handleMilestoneLike = async (index: number, e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentUser) return alert("로그인이 필요합니다.");
      const milestone = plan.milestones[index];
      if ((milestone.likes || 0) >= 5) return alert("마일스톤 당 최대 좋아요는 5개입니다.");
      await toggleLikeMilestone(plan.id, index);
  };

  const handleFollowClick = async () => {
      if (!currentUser) {
          alert("로그인이 필요합니다.");
          return;
      }
      const newStatus = await toggleFollow(currentUser.id, plan.userId);
      setIsFollowing(newStatus);
  };

  const handleMilestoneClick = (index: number, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }

      const milestone = plan.milestones[index];

      if (milestone.isCompleted) {
          const log = plan.logs?.find(l => l.milestoneTitle === milestone.title);
          if (log) {
              setSelectedLog(log);
              setIsViewLogModalOpen(true);
          } else {
               alert("해당 목표의 상세 로그가 존재하지 않습니다.");
          }
          return;
      }

      if (!isOwner) return;
      
      // Check Grace Period for Milestone (1 Day)
      const milestoneDueDate = new Date(milestone.dueDate);
      const milestoneGraceEnd = new Date(milestoneDueDate.getTime() + (24 * 60 * 60 * 1000));
      
      if (now > milestoneGraceEnd) {
          alert("유예 기간(1일)이 지나 이 목표는 인증할 수 없습니다.");
          return;
      }

      setSelectedMilestoneIndex(index);
      setIsLogModalOpen(true);
  };

  const handleLogSubmit = async (data: { image: string, answers: any, verificationType: any }) => {
      if (selectedMilestoneIndex === null) return;
      if (!plan) return;

      try {
          const milestone = plan.milestones[selectedMilestoneIndex];
          
          const newLog: ProgressLog = {
              id: `l${Date.now()}`,
              date: new Date().toISOString(),
              milestoneTitle: milestone.title,
              image: data.image,
              answers: data.answers,
              verificationType: data.verificationType
          };
          await addProgressLog(plan.id, newLog);

          const updatedMilestones = [...plan.milestones];
          updatedMilestones[selectedMilestoneIndex].isCompleted = true;
          updatedMilestones[selectedMilestoneIndex].verificationType = data.verificationType;
          
          await updateMilestoneStatus(plan.id, updatedMilestones);
          
          setIsLogModalOpen(false);
          setSelectedMilestoneIndex(null);
      } catch (e) {
          console.error(e);
          alert("저장 중 오류가 발생했습니다.");
      }
  };

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      {/* Header Image & Info */}
      <div className="relative h-72 w-full group">
        <img src={plan.images[0]} alt={plan.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent opacity-90"></div>
        
        <div className="absolute top-4 left-4 z-20">
             <button onClick={() => navigate(-1)} className="p-2 text-white hover:bg-white/20 rounded-full transition-all backdrop-blur-md">
                <ChevronLeft size={24} />
            </button>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 text-white z-10">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center space-x-3 mb-3">
                    <Link to={`/profile/${plan.userId}`}>
                        <img src={plan.user.avatar} alt={plan.user.name} className="w-12 h-12 rounded-full border-2 border-white/30 hover:border-white transition-colors" />
                    </Link>
                    <div className="flex flex-col items-start">
                        <div className="flex items-center">
                            <Link to={`/profile/${plan.userId}`} className="font-bold text-lg hover:underline decoration-white/50 mr-2">
                                {plan.user.name}
                            </Link>
                            {isOwner ? (
                                <span className="text-[10px] bg-brand-500 text-white px-2 py-0.5 rounded-full">ME</span>
                            ) : (
                                <button 
                                    onClick={handleFollowClick}
                                    className={`flex items-center text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                                        isFollowing 
                                        ? 'bg-white/20 text-white hover:bg-white/30' 
                                        : 'bg-brand-600 text-white hover:bg-brand-700'
                                    }`}
                                >
                                    {isFollowing ? '팔로잉' : <><UserPlus size={10} className="mr-1"/>팔로우</>}
                                </button>
                            )}
                        </div>
                        <p className="text-xs text-slate-300 font-light flex items-center">
                            신뢰도 {plan.user.trustScore}% 
                            {plan.user.isFaceVerified && <ShieldCheck size={10} className="ml-1 text-green-400" />}
                        </p>
                    </div>
                </div>
                <h1 className="text-3xl font-bold mb-2 leading-tight">{plan.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-slate-300 mt-3">
                    {isInGracePeriod ? (
                        <span className="flex items-center bg-red-500/90 text-white px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 font-bold animate-pulse">
                            <AlertCircle size={14} className="mr-1.5"/> 종료 유예 기간 (D+2 이내)
                        </span>
                    ) : (
                         <span className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                            <Clock size={14} className="mr-1.5"/> {isExpired ? "종료됨" : `마감: ${new Date(plan.endDate).toLocaleDateString()}`}
                        </span>
                    )}
                   
                    <div className="flex items-center text-rose-300">
                        <Heart size={16} className="mr-1.5 fill-rose-300" /> {plan.likes}
                    </div>
                </div>
                {isInGracePeriod && <p className="text-xs text-red-300 mt-1">* 유예 기간 종료 시 실패 처리됩니다.</p>}
            </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 -mt-8 relative z-10">
        
        {/* Support Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-t-4 border-rose-500 overflow-hidden transform transition-all hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center">
                   <Heart className="text-rose-500 mr-2 fill-rose-500" /> 응원하기
                </h2>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                    현재 {plan.likes}명 응원 중
                </span>
            </div>

            <p className="text-slate-600 mb-6 text-base leading-relaxed font-medium">
                {isVerificationPhase 
                    ? "이 도전이 성공했다고 생각하시나요? 좋아요를 눌러주세요!" 
                    : "이 도전이 성공할 수 있도록 좋아요로 응원해주세요!"}
            </p>

            <button
                onClick={handleLike}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all transform active:scale-95 ${
                    isLiked 
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
            >
                <Heart size={24} className={`mr-2 ${isLiked ? 'fill-white' : ''}`} />
                {isLiked ? "응원 완료!" : "응원하기 (좋아요)"}
            </button>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-100">
            <div className="mb-6">
                 <h3 className="font-bold text-slate-900 mb-2 text-lg">계획 상세</h3>
                 <p className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap">{plan.description}</p>
                 
                 <div className="flex flex-wrap gap-2 mt-6">
                    {plan.categories.map(c => <span key={c} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">{c}</span>)}
                    {plan.hashtags.map(h => <span key={h} className="text-brand-600 text-sm font-medium hover:underline cursor-pointer">{h}</span>)}
                </div>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 sticky top-16 bg-slate-50 z-20 pt-2">
            <button 
                onClick={() => setActiveTab('milestones')}
                className={`flex-1 pb-3 font-bold text-sm transition-colors ${activeTab === 'milestones' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
                중간 목표 ({plan.milestones.length}단계)
            </button>
            <button 
                onClick={() => setActiveTab('logs')}
                className={`flex-1 pb-3 font-bold text-sm transition-colors ${activeTab === 'logs' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
                진행 기록 ({plan.logs?.length || 0})
            </button>
            <button 
                onClick={() => setActiveTab('comments')}
                className={`flex-1 pb-3 font-bold text-sm transition-colors ${activeTab === 'comments' ? 'border-b-2 border-brand-600 text-brand-600' : 'text-slate-500 hover:text-slate-800'}`}
            >
                응원/댓글
            </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[300px]">
            {activeTab === 'milestones' && (
                <div className="space-y-4">
                    {plan.milestones.map((m, idx) => {
                        const msDueDate = new Date(m.dueDate);
                        const msGraceEnd = new Date(msDueDate.getTime() + (24 * 60 * 60 * 1000));
                        const isMsExpired = now > msDueDate;
                        const isMsInGrace = isMsExpired && now < msGraceEnd && !m.isCompleted;
                        const isMsFailed = now > msGraceEnd && !m.isCompleted;

                        return (
                        <div key={m.id || idx} className={`relative flex flex-col bg-white p-5 rounded-xl border shadow-sm transition-all ${m.isCompleted ? 'border-green-200 bg-green-50/50' : isMsFailed ? 'border-red-100 bg-red-50/30' : 'border-slate-100'}`}>
                            <div className="flex items-start w-full">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 border-2 z-10 ${m.isCompleted ? 'bg-green-500 border-green-500 text-white' : isMsFailed ? 'bg-red-100 border-red-200 text-red-400' : 'bg-white border-slate-300 text-slate-500 font-bold'}`}>
                                    {m.isCompleted ? <CheckCircle size={16} /> : isMsFailed ? <X size={16}/> : idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center">
                                            <h4 className={`font-bold text-base mr-2 ${m.isCompleted ? 'text-slate-900' : isMsFailed ? 'text-red-400 line-through' : 'text-slate-700'}`}>{m.title}</h4>
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border mr-2 ${
                                                (m.weight || 2) === 3 ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                (m.weight || 2) === 2 ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                                'bg-slate-100 text-slate-500 border-slate-200'
                                            }`}>
                                                {(m.weight || 2) === 3 ? '높음' : (m.weight || 2) === 2 ? '보통' : '낮음'}
                                            </span>
                                        </div>
                                        <button 
                                            onClick={(e) => handleMilestoneLike(idx, e)}
                                            className={`flex items-center text-xs font-bold px-2 py-1 rounded-full border transition-all ${
                                                (m.likes || 0) >= 5 ? 'bg-rose-100 text-rose-600 border-rose-200' : 'bg-white text-slate-400 border-slate-200 hover:border-rose-300 hover:text-rose-500'
                                            }`}
                                        >
                                            <Heart size={10} className={`mr-1 ${(m.likes || 0) > 0 ? 'fill-rose-500 text-rose-500' : ''}`} /> {m.likes || 0}/5
                                        </button>
                                    </div>
                                    
                                    <div className="flex items-center text-xs text-slate-400 mb-2">
                                        {isMsInGrace && <span className="text-red-500 font-bold mr-2 animate-pulse">! 유예 기간 (1일 남음)</span>}
                                        마감: {msDueDate.toLocaleDateString()}
                                    </div>
                                    
                                    {m.isCompleted && (
                                        <div className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border mb-2 bg-white">
                                            {m.verificationType === 'OFFICIAL_BIOMETRIC' ? (
                                                <span className="text-green-600 flex items-center border-green-100"><ShieldCheck size={10} className="mr-1"/>정밀 인증 (신뢰도 80%)</span>
                                            ) : (
                                                <span className="text-slate-500 flex items-center border-slate-100"><ImageIcon size={10} className="mr-1"/>일반 인증 (신뢰도 20%)</span>
                                            )}
                                        </div>
                                    )}

                                    {m.analysis && !m.isCompleted && (
                                        <div className="pt-2 border-t border-slate-100">
                                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                                    {ACTION_TYPE_MAP[m.analysis.action_type] || m.analysis.action_type}
                                                </span>
                                                {m.analysis.recommended_evidence.map((ev, i) => (
                                                    <span key={i} className="text-[10px] text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded flex items-center">
                                                        {EVIDENCE_MAP[ev] || ev}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons Area */}
                            <div className="ml-12 mt-2">
                                {m.isCompleted ? (
                                     <button 
                                        onClick={(e) => handleMilestoneClick(idx, e)}
                                        className="text-xs border border-green-300 text-green-700 bg-white px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors font-bold flex items-center"
                                     >
                                        <ImageIcon size={12} className="mr-1"/> 인증 보기
                                     </button>
                                ) : isOwner && !isMsFailed ? (
                                     <button 
                                        onClick={(e) => handleMilestoneClick(idx, e)}
                                        className={`text-xs border px-3 py-1.5 rounded-lg transition-colors font-bold w-full md:w-auto flex justify-center ${
                                            isMsInGrace 
                                            ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100' 
                                            : 'bg-white border-brand-200 text-brand-600 hover:bg-brand-50'
                                        }`}
                                     >
                                        {isMsInGrace ? '🚨 유예 기간 내 인증하기' : '인증하기'}
                                     </button>
                                ) : !m.isCompleted && (
                                     <div className="text-xs px-2 py-1 rounded-md font-bold border inline-flex items-center bg-slate-50 text-slate-400 border-slate-200">
                                        {isMsFailed ? '기간 만료 (실패)' : <><Lock size={10} className="mr-1"/>잠김</>}
                                     </div>
                                )}
                            </div>
                        </div>
                    )})}
                </div>
            )}
            
            {/* Logs */}
            {activeTab === 'logs' && (
                <div className="space-y-8">
                     {(!plan.logs || plan.logs.length === 0) ? (
                         <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                            <MessageSquare className="mx-auto mb-3 opacity-50" size={40} />
                            <p className="font-medium">아직 작성된 진행 기록이 없습니다.</p>
                        </div>
                     ) : (
                        plan.logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log, index) => (
                           <div key={log.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                                    <div className="flex items-center">
                                        <span className="bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded mr-3">
                                            #{plan.logs.length - index}
                                        </span>
                                        <div>
                                            <p className="text-xs text-slate-500 font-bold mb-0.5">목표 달성 인증</p>
                                            <p className="text-sm font-bold text-slate-800">{log.milestoneTitle}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-slate-400 font-medium mb-1">
                                            {new Date(log.date).toLocaleDateString()}
                                        </span>
                                        {log.verificationType === 'OFFICIAL_BIOMETRIC' && (
                                            <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-200 flex items-center">
                                                <ShieldCheck size={10} className="mr-0.5"/> 정밀 인증
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="mb-8 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                        <img src={log.image} alt="Authentication Proof" className="w-full max-h-96 object-contain" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {['힘들었던 것', '예측하지 못했던 것', '이룬 것', '성공 요인', '발전이 필요한 점', '해결 방안', '하고 싶은 말'].map((q, i) => (
                                            <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                <p className="font-bold text-slate-500 text-xs mb-2">{i + 1}. {q}</p>
                                                <p className="text-slate-800 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                                                    {(log.answers as any)[`q${i+1}`] || "-"}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                           </div>
                        ))
                     )}
                </div>
            )}

             {/* Comments */}
             {activeTab === 'comments' && (
                <div className="text-center py-20 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                    <MessageSquare className="mx-auto mb-3 opacity-50" size={40} />
                    <p className="font-medium">댓글 기능이 곧 추가될 예정입니다.</p>
                </div>
            )}
        </div>

        {/* Log Modal */}
        {isLogModalOpen && selectedMilestoneIndex !== null && plan.milestones[selectedMilestoneIndex] && (
            <LogModal 
                isOpen={isLogModalOpen}
                onClose={() => setIsLogModalOpen(false)}
                milestoneTitle={plan.milestones[selectedMilestoneIndex].title}
                milestoneAnalysis={plan.milestones[selectedMilestoneIndex].analysis}
                onSubmit={handleLogSubmit}
            />
        )}

        {/* View Log Modal */}
        {isViewLogModalOpen && selectedLog && (
            <ViewLogModal 
                isOpen={isViewLogModalOpen}
                onClose={() => setIsViewLogModalOpen(false)}
                log={selectedLog}
            />
        )}
      </main>
    </div>
  );
};