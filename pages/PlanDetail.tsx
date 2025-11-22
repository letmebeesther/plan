
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plan, PlanStatus, ProgressLog } from '../types';
import { Clock, CheckCircle, XCircle, MessageSquare, Share2, AlertTriangle, ChevronLeft, ThumbsUp, ThumbsDown, Loader2, ImageIcon, Lock, Eye, UserPlus, UserCheck } from 'lucide-react';
import { LogModal } from '../components/LogModal';
import { ViewLogModal } from '../components/ViewLogModal';
import { subscribeToPlan, voteForPlan, updateMilestoneStatus, addProgressLog } from '../services/planService';
import { getCurrentUser, toggleFollow, getUserById } from '../services/authService';

export const PlanDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'milestones' | 'logs' | 'comments'>('milestones');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [selectedMilestoneIndex, setSelectedMilestoneIndex] = useState<number | null>(null);
  const [userVote, setUserVote] = useState<'yes' | 'no' | null>(null);
  
  // View Log Modal State
  const [selectedLog, setSelectedLog] = useState<ProgressLog | null>(null);
  const [isViewLogModalOpen, setIsViewLogModalOpen] = useState(false);
  
  // Follow State
  const [isFollowing, setIsFollowing] = useState(false);
  
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!id) return;
    
    // Real-time subscription
    const unsubscribe = subscribeToPlan(id, (updatedPlan) => {
        setPlan(updatedPlan);
        setLoading(false);

        // Check follow status if not owner
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
  const totalVotes = plan.votes.canDoIt + plan.votes.cannotDoIt;
  const yesPercentage = totalVotes > 0 ? Math.round((plan.votes.canDoIt / totalVotes) * 100) : 0;
  
  // OWNERSHIP CHECK: Is the current user the creator of this plan?
  const isOwner = currentUser && plan.userId === currentUser.id;

  const handleVote = async (vote: 'yes' | 'no') => {
    if (userVote) return;
    try {
        await voteForPlan(plan.id, vote);
        setUserVote(vote);
    } catch (e) {
        alert("투표 중 오류가 발생했습니다.");
    }
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

      // 1. If Completed: Show ViewLogModal (Available to Everyone)
      if (milestone.isCompleted) {
          const log = plan.logs?.find(l => l.milestoneTitle === milestone.title);
          if (log) {
              setSelectedLog(log);
              setIsViewLogModalOpen(true);
          } else {
              // Error handling or Legacy data fallback
              if (isOwner) {
                   if(window.confirm("연동된 로그가 없습니다. 완료 상태를 취소하시겠습니까?")) {
                     const updatedMilestones = [...plan.milestones];
                     updatedMilestones[index].isCompleted = false;
                     updateMilestoneStatus(plan.id, updatedMilestones);
                   }
              } else {
                  alert("해당 목표의 상세 로그가 존재하지 않습니다.");
              }
          }
          return;
      }

      // 2. If Not Completed: Show LogModal (Owner Only)
      if (!isOwner) return; 

      setSelectedMilestoneIndex(index);
      setIsLogModalOpen(true);
  };

  const handleLogSubmit = async (data: { image: string, answers: any }) => {
      if (selectedMilestoneIndex === null) return;
      if (!plan) return;

      try {
          const milestoneTitle = plan.milestones[selectedMilestoneIndex].title;
          
          // 1. Add Log
          const newLog = {
              id: `l${Date.now()}`,
              date: new Date().toISOString(),
              milestoneTitle: milestoneTitle,
              image: data.image,
              answers: data.answers
          };
          await addProgressLog(plan.id, newLog);

          // 2. Update Milestone Status
          const updatedMilestones = [...plan.milestones];
          updatedMilestones[selectedMilestoneIndex].isCompleted = true;
          await updateMilestoneStatus(plan.id, updatedMilestones);
          
          setIsLogModalOpen(false);
          setSelectedMilestoneIndex(null);
          // Optionally switch to logs tab, or just stay to see the green check
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
        
        {/* Navigation */}
        <div className="absolute top-4 left-4 z-20">
             <button onClick={() => navigate(-1)} className="p-2 text-white hover:bg-white/20 rounded-full transition-all backdrop-blur-md">
                <ChevronLeft size={24} />
            </button>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-6 text-white z-10">
            <div className="max-w-4xl mx-auto">
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
                        <p className="text-xs text-slate-300 font-light">{new Date(plan.createdAt).toLocaleDateString()} 시작</p>
                    </div>
                </div>
                <h1 className="text-3xl font-bold mb-2 leading-tight">{plan.title}</h1>
                <div className="flex items-center space-x-4 text-sm text-slate-300 mt-3">
                    <span className="flex items-center bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                        <Clock size={14} className="mr-1.5"/> 마감: {new Date(plan.endDate).toLocaleDateString()}
                    </span>
                    <button className="flex items-center hover:text-white transition-colors hover:bg-white/10 px-3 py-1 rounded-full">
                        <Share2 size={16} className="mr-1.5"/> 공유하기
                    </button>
                </div>
            </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 -mt-8 relative z-10">
        
        {/* VOTING SECTION */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-t-4 border-brand-500 overflow-hidden transform transition-all hover:shadow-2xl">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-extrabold text-slate-800 flex items-center">
                    {isVerificationPhase ? (
                        <>
                            <AlertTriangle className="text-amber-500 mr-2 fill-amber-500" /> 최종 검증 투표
                        </>
                    ) : (
                        <>
                            <CheckCircle className="text-brand-500 mr-2 fill-brand-500" /> 성공 예측 투표
                        </>
                    )}
                </h2>
                <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full border border-brand-100">
                    현재 {totalVotes}명 투표 완료
                </span>
            </div>

            <p className="text-slate-600 mb-6 text-base leading-relaxed font-medium">
                {isVerificationPhase 
                    ? "현재 목표 기간이 종료되었습니다! 지난 2일간의 로그와 결과를 확인하고 이 도전이 성공했는지 투표해주세요. 여러분의 한 표가 결과를 결정합니다." 
                    : "이 목표가 달성될 수 있을까요? 작성자의 계획과 중간 진행 상황을 보고 성공 여부를 예측해주세요!"}
            </p>

            {/* Vote Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between text-sm font-bold mb-2">
                    <span className="text-brand-600">성공 {yesPercentage}%</span>
                    <span className="text-slate-400">실패 {100 - yesPercentage}%</span>
                </div>
                <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                    <div 
                        className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-1000 ease-out flex items-center justify-end pr-2 relative"
                        style={{ width: `${yesPercentage}%` }}
                    >
                        {yesPercentage > 0 && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50"></div>}
                    </div>
                    <div className="h-full bg-slate-200 flex-1"></div>
                </div>
            </div>

            {/* Vote Buttons */}
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => handleVote('yes')}
                    disabled={userVote !== null}
                    className={`py-5 rounded-xl font-bold text-lg flex flex-col items-center justify-center transition-all border-2 relative overflow-hidden group ${
                        userVote === 'yes' 
                        ? 'bg-brand-50 border-brand-500 text-brand-700' 
                        : userVote === 'no'
                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600 shadow-sm hover:shadow-md'
                    }`}
                >
                    <ThumbsUp size={32} className={`mb-2 transition-transform group-hover:scale-110 ${userVote === 'yes' ? 'fill-current' : ''}`} />
                    <span>{isVerificationPhase ? '성공 인정!' : '할 수 있다!'}</span>
                </button>

                <button 
                    onClick={() => handleVote('no')}
                    disabled={userVote !== null}
                    className={`py-5 rounded-xl font-bold text-lg flex flex-col items-center justify-center transition-all border-2 relative overflow-hidden group ${
                        userVote === 'no' 
                        ? 'bg-slate-100 border-slate-400 text-slate-600' 
                        : userVote === 'yes'
                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-800 shadow-sm hover:shadow-md'
                    }`}
                >
                    <ThumbsDown size={32} className={`mb-2 transition-transform group-hover:scale-110 ${userVote === 'no' ? 'fill-current' : ''}`} />
                    <span>{isVerificationPhase ? '실패' : '어려울 듯'}</span>
                </button>
            </div>
            {userVote && (
                <div className="mt-4 text-center p-3 bg-green-50 text-green-700 rounded-lg font-bold animate-fade-in text-sm">
                    투표가 완료되었습니다! 작성자에게 큰 힘이 됩니다.
                </div>
            )}
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
                    {plan.milestones.map((m, idx) => (
                        <div key={m.id || idx} className={`relative flex items-center bg-white p-5 rounded-xl border shadow-sm transition-all ${m.isCompleted ? 'border-green-200 bg-green-50/50' : 'border-slate-100'}`}>
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-100 -z-10 h-full last:hidden"></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0 border-2 z-10 ${m.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 text-slate-500 font-bold'}`}>
                                {m.isCompleted ? <CheckCircle size={16} /> : idx + 1}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center mb-1">
                                    <h4 className={`font-bold text-base mr-2 ${m.isCompleted ? 'text-slate-900' : 'text-slate-700'}`}>{m.title}</h4>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                                        (m.weight || 2) === 3 ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                        (m.weight || 2) === 2 ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                        'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}>
                                        {(m.weight || 2) === 3 ? '높음' : (m.weight || 2) === 2 ? '보통' : '낮음'}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400">마감 예정: {m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '미정'}</p>
                            </div>
                            
                            {!isVerificationPhase && (
                                <>
                                    {m.isCompleted ? (
                                         <button 
                                            onClick={(e) => handleMilestoneClick(idx, e)}
                                            className="text-xs border border-green-300 text-green-700 bg-white px-3 py-1.5 rounded-lg hover:bg-green-50 transition-colors font-bold flex items-center"
                                         >
                                            <ImageIcon size={12} className="mr-1"/> 인증 보기
                                         </button>
                                    ) : isOwner ? (
                                         <button 
                                            onClick={(e) => handleMilestoneClick(idx, e)}
                                            className="text-xs border border-brand-200 text-brand-600 bg-white px-3 py-1.5 rounded-lg hover:bg-brand-50 transition-colors font-bold"
                                         >
                                            인증하기
                                         </button>
                                    ) : (
                                         <div className="text-xs px-2 py-1 rounded-md font-bold border flex items-center bg-slate-50 text-slate-400 border-slate-200">
                                            <Lock size={10} className="mr-1"/>잠김
                                         </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="space-y-8">
                    {(!plan.logs || plan.logs.length === 0) ? (
                         <div className="text-center py-16 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                            <MessageSquare className="mx-auto mb-3 opacity-50" size={40} />
                            <p className="font-medium">아직 작성된 진행 기록이 없습니다.</p>
                            <p className="text-xs mt-1 opacity-70">
                                {isOwner ? "마일스톤을 '인증하기' 눌러 기록을 남겨보세요." : "작성자가 아직 기록을 남기지 않았습니다."}
                            </p>
                        </div>
                    ) : (
                        plan.logs
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((log, index) => (
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
                                    <span className="text-xs text-slate-400 font-medium bg-white px-2 py-1 rounded border border-slate-200">
                                        {new Date(log.date).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                <div className="p-6">
                                    {/* Evidence Image */}
                                    <div className="mb-8 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                        <img src={log.image} alt="Authentication Proof" className="w-full max-h-96 object-contain" />
                                        <div className="p-2 bg-slate-100 text-center text-xs text-slate-500 font-medium flex items-center justify-center">
                                            <ImageIcon size={12} className="mr-1"/> 인증 사진
                                        </div>
                                    </div>

                                    {/* Q&A Grid */}
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="space-y-6">
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <p className="font-bold text-slate-500 text-xs mb-1">1. 힘들었던 것</p>
                                                <p className="text-slate-800 font-medium leading-relaxed">{log.answers.q1}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <p className="font-bold text-slate-500 text-xs mb-1">2. 예측하지 못했던 것</p>
                                                <p className="text-slate-800 font-medium leading-relaxed">{log.answers.q2}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <p className="font-bold text-slate-500 text-xs mb-1">3. 지금까지 이룬 것</p>
                                                <p className="text-slate-800 font-medium leading-relaxed">{log.answers.q3}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <p className="font-bold text-slate-500 text-xs mb-1">4. 성공 요인</p>
                                                <p className="text-slate-800 font-medium leading-relaxed">{log.answers.q4}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <p className="font-bold text-slate-500 text-xs mb-1">5. 발전이 필요한 점</p>
                                                <p className="text-slate-800 font-medium leading-relaxed">{log.answers.q5}</p>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <p className="font-bold text-slate-500 text-xs mb-1">6. 해결 및 발전 방안</p>
                                                <p className="text-slate-800 font-medium leading-relaxed">{log.answers.q6}</p>
                                            </div>
                                             <div className="bg-brand-50 p-5 rounded-xl border border-brand-100 relative">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-brand-400 rounded-l-xl"></div>
                                                <p className="font-bold text-brand-800 text-xs mb-2 uppercase tracking-wider">7. 하고 싶은 말</p>
                                                <p className="text-slate-800 italic font-medium text-lg">"{log.answers.q7}"</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
            
             {activeTab === 'comments' && (
                <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
                    <MessageSquare size={48} className="mx-auto mb-4 text-slate-200" />
                    <p className="text-slate-500 font-medium">아직 응원 댓글이 없습니다.</p>
                    <p className="text-sm text-slate-400 mt-1">첫 번째로 작성자를 응원해주세요!</p>
                    <button className="mt-4 text-brand-600 font-bold hover:underline bg-brand-50 px-4 py-2 rounded-lg">댓글 작성하기</button>
                </div>
            )}
        </div>
      </main>

      <LogModal 
        isOpen={isLogModalOpen} 
        onClose={() => {
            setIsLogModalOpen(false);
            setSelectedMilestoneIndex(null);
        }} 
        milestoneTitle={selectedMilestoneIndex !== null ? plan.milestones[selectedMilestoneIndex].title : ''}
        onSubmit={handleLogSubmit}
      />

      <ViewLogModal
        isOpen={isViewLogModalOpen}
        onClose={() => {
            setIsViewLogModalOpen(false);
            setSelectedLog(null);
        }}
        log={selectedLog}
      />
    </div>
  );
};
