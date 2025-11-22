
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Plan, PlanStatus, ProgressLog, VoteStats } from '../types';
import { Clock, CheckCircle, MessageSquare, Share2, AlertTriangle, ChevronLeft, Loader2, ImageIcon, Lock, Eye, UserPlus, UserCheck, Star } from 'lucide-react';
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
  const [userRating, setUserRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  
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

  // Calculate Voting Stats
  const votes = plan.votes || { star1: 0, star2: 0, star3: 0, star4: 0, star5: 0 };
  const totalVotes = votes.star1 + votes.star2 + votes.star3 + votes.star4 + votes.star5;
  const sumScore = (votes.star1 * 1) + (votes.star2 * 2) + (votes.star3 * 3) + (votes.star4 * 4) + (votes.star5 * 5);
  const averageRating = totalVotes > 0 ? (sumScore / totalVotes).toFixed(1) : "0.0";

  const handleVote = async (rating: number) => {
    if (userRating) return;
    try {
        await voteForPlan(plan.id, rating);
        setUserRating(rating);
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

      if (milestone.isCompleted) {
          const log = plan.logs?.find(l => l.milestoneTitle === milestone.title);
          if (log) {
              setSelectedLog(log);
              setIsViewLogModalOpen(true);
          } else {
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

      if (!isOwner) return; 

      setSelectedMilestoneIndex(index);
      setIsLogModalOpen(true);
  };

  const handleLogSubmit = async (data: { image: string, answers: any }) => {
      if (selectedMilestoneIndex === null) return;
      if (!plan) return;

      try {
          const milestoneTitle = plan.milestones[selectedMilestoneIndex].title;
          
          const newLog = {
              id: `l${Date.now()}`,
              date: new Date().toISOString(),
              milestoneTitle: milestoneTitle,
              image: data.image,
              answers: data.answers
          };
          await addProgressLog(plan.id, newLog);

          const updatedMilestones = [...plan.milestones];
          updatedMilestones[selectedMilestoneIndex].isCompleted = true;
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
                    현재 {totalVotes}명 참여
                </span>
            </div>

            <p className="text-slate-600 mb-6 text-base leading-relaxed font-medium">
                {isVerificationPhase 
                    ? "이 도전이 성공했나요? 결과를 평가해주세요." 
                    : "이 계획의 성공 가능성을 1점부터 5점까지 평가해주세요!"}
            </p>

            {/* Rating Display */}
            <div className="mb-6 flex flex-col items-center justify-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-end mb-2">
                    <span className="text-4xl font-extrabold text-slate-900 mr-2">{averageRating}</span>
                    <span className="text-slate-400 font-bold mb-1">/ 5.0</span>
                </div>
                <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                            key={star} 
                            size={24} 
                            className={`${Number(averageRating) >= star ? 'text-yellow-400 fill-yellow-400' : Number(averageRating) >= star - 0.5 ? 'text-yellow-400 fill-yellow-400 opacity-50' : 'text-slate-200 fill-slate-200'}`} 
                        />
                    ))}
                </div>
            </div>

            {/* Interactive Star Voting */}
            <div className="flex justify-center space-x-2 md:space-x-4">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        disabled={userRating !== null}
                        onClick={() => handleVote(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="group transition-transform hover:scale-110 focus:outline-none disabled:cursor-default"
                    >
                        <Star 
                            size={40} 
                            className={`transition-colors duration-200 ${
                                (hoverRating || userRating || 0) >= star 
                                ? 'text-yellow-400 fill-yellow-400 drop-shadow-md' 
                                : 'text-slate-200 fill-slate-200'
                            }`}
                        />
                    </button>
                ))}
            </div>

            {userRating && (
                <div className="mt-6 text-center p-3 bg-green-50 text-green-700 rounded-lg font-bold animate-fade-in text-sm">
                    {userRating}점을 주셨습니다! 소중한 의견 감사합니다.
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

        {/* Tabs and Content (Kept largely same, just context) */}
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
            
            {/* Logs and Comments tabs (omitted for brevity, assuming identical logic) */}
            {activeTab === 'logs' && (
                <div className="space-y-8">
                     {/* ... same log display code ... */}
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
                                    <span className="text-xs text-slate-400 font-medium bg-white px-2 py-1 rounded border border-slate-200">
                                        {new Date(log.date).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="p-6">
                                    <div className="mb-8 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                                        <img src={log.image} alt="Authentication Proof" className="w-full max-h-96 object-contain" />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        {['힘들었던 것', '예측하지 못했던 것', '이룬 것', '성공 요인', '발전이 필요한 점', '해결 방안', '하고 싶은 말'].map((q, i) => (
                                            <div key={i} className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                                <p className="font-bold text-slate-500 text-xs mb-1">{i+1}. {q}</p>
                                                <p className="text-slate-800 font-medium leading-relaxed">{(log.answers as any)[`q${i+1}`]}</p>
                                            </div>
                                        ))}
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
                    <button className="mt-4 text-brand-600 font-bold hover:underline bg-brand-50 px-4 py-2 rounded-lg">댓글 작성하기</button>
                </div>
            )}

        </div>
      </main>

      <LogModal 
        isOpen={isLogModalOpen} 
        onClose={() => { setIsLogModalOpen(false); setSelectedMilestoneIndex(null); }} 
        milestoneTitle={selectedMilestoneIndex !== null ? plan.milestones[selectedMilestoneIndex].title : ''}
        onSubmit={handleLogSubmit}
      />

      <ViewLogModal
        isOpen={isViewLogModalOpen}
        onClose={() => { setIsViewLogModalOpen(false); setSelectedLog(null); }}
        log={selectedLog}
      />
    </div>
  );
};
