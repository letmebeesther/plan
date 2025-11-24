
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCurrentUser, getUserById, logout, toggleFollow } from '../services/authService';
import { getUserPlans } from '../services/planService';
import { Plan, PlanStatus, User } from '../types';
import { Loader2, AlertCircle, Settings, LogOut, UserPlus, UserCheck, Heart } from 'lucide-react';

export const Profile: React.FC = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const targetUserId = userId || currentUser?.id;
  const isMe = currentUser?.id === targetUserId;

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        if (targetUserId) {
            const user = await getUserById(targetUserId);
            setProfileUser(user);
            
            const fetchedPlans = await getUserPlans(targetUserId);
            setPlans(fetchedPlans);

            if (currentUser && user) {
                setIsFollowing((user.followers || []).includes(currentUser.id));
            }
        }
        setLoading(false);
    };
    fetchData();
  }, [targetUserId, currentUser?.id]);

  const handleFollowToggle = async () => {
      if (!currentUser || !profileUser) return;
      setFollowLoading(true);
      try {
          const newStatus = await toggleFollow(currentUser.id, profileUser.id);
          setIsFollowing(newStatus);
          
          setProfileUser(prev => {
              if (!prev) return null;
              const updatedFollowers = newStatus 
                  ? [...(prev.followers || []), currentUser.id]
                  : (prev.followers || []).filter(id => id !== currentUser.id);
              return { ...prev, followers: updatedFollowers };
          });
      } catch (error) {
          console.error(error);
      } finally {
          setFollowLoading(false);
      }
  };

  const handleLogout = () => {
      if (window.confirm("정말 로그아웃 하시겠습니까?")) {
          logout();
      }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-slate-50"><Loader2 className="animate-spin text-brand-600" size={32} /></div>;
  if (!profileUser) return <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4"><AlertCircle size={48} className="text-slate-300 mb-4" /><h2 className="text-lg font-bold text-slate-700 mb-2">사용자를 찾을 수 없습니다</h2><button onClick={() => navigate('/')} className="text-brand-600 font-bold hover:underline">홈으로 돌아가기</button></div>;

  const totalPlans = plans.length;
  const followerCount = profileUser.followers?.length || 0;
  const followingCount = profileUser.following?.length || 0;
  
  const totalCompletedMilestones = plans.reduce((acc, plan) => {
      return acc + (plan.milestones ? plan.milestones.filter(m => m.isCompleted).length : 0);
  }, 0);
  
  // Calculate Total Likes Received
  const totalLikes = plans.reduce((acc, plan) => acc + (plan.likes || 0), 0);

  const activePlans = plans.filter(p => p.status === PlanStatus.ACTIVE || p.status === PlanStatus.VERIFICATION_PENDING);
  const pastPlans = plans.filter(p => p.status === PlanStatus.COMPLETED_SUCCESS || p.status === PlanStatus.COMPLETED_FAIL || p.status === PlanStatus.FAILED_BY_ABANDONMENT);

  const getProgress = (plan: Plan) => {
     if (!plan.milestones.length) return 0;
     const completed = plan.milestones.filter(m => m.isCompleted).length;
     return Math.round((completed / plan.milestones.length) * 100);
  };

  return (
    <div className="pb-24 min-h-screen bg-slate-50">
      <div className="bg-white pb-6 border-b border-slate-100 shadow-sm">
        <div className="h-32 bg-gradient-to-r from-brand-500 to-indigo-600 relative"></div>
        <div className="max-w-6xl mx-auto px-4 relative">
            <div className="absolute -top-12 p-1 bg-white rounded-full">
                <img src={profileUser.avatar} alt="Profile" className="w-24 h-24 rounded-full border border-slate-100 shadow-md bg-slate-50" />
            </div>
            <div className="pt-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-4 md:mb-0">
                        <h1 className="text-2xl font-bold text-slate-900">{profileUser.name}</h1>
                        <p className="text-slate-500 text-sm font-medium">@{profileUser.id.split('_')[0]}</p>
                        <p className="mt-3 text-slate-700 max-w-lg leading-relaxed text-sm whitespace-pre-wrap">{profileUser.bio}</p>
                    </div>
                    {isMe ? (
                        <div className="flex space-x-2 w-full md:w-auto mt-2 md:mt-0">
                            <button className="flex-1 md:flex-none border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-center">
                                <Settings size={16} className="mr-2"/> 프로필 수정
                            </button>
                            <button onClick={handleLogout} className="flex-1 md:flex-none border border-slate-200 bg-white text-red-500 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center">
                                <LogOut size={16} className="mr-2"/> 로그아웃
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleFollowToggle} disabled={followLoading} className={`w-full md:w-auto px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center shadow-sm mt-2 md:mt-0 ${isFollowing ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200' : 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/30'}`}>
                            {followLoading ? <Loader2 className="animate-spin" size={16} /> : (isFollowing ? <><UserCheck size={16} className="mr-2"/> 팔로잉</> : <><UserPlus size={16} className="mr-2"/> 팔로우</>)}
                        </button>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-5 divide-x divide-slate-100 mt-8 pt-6 border-t border-slate-100">
                <div className="text-center">
                    <span className="block font-bold text-2xl text-slate-900">{totalPlans}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">총 계획</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-2xl text-brand-600">{totalCompletedMilestones}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">완료 목표</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-2xl text-slate-900">{followerCount}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">팔로워</span>
                </div>
                 <div className="text-center">
                    <span className="block font-bold text-2xl text-slate-900">{followingCount}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">팔로잉</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-2xl text-rose-500 flex items-center justify-center"><Heart size={16} className="mr-1 fill-rose-500"/>{totalLikes}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">총 응원</span>
                </div>
            </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
          <section>
            <h2 className="font-bold text-lg mb-4 text-slate-800">진행 중인 계획</h2>
            {activePlans.length > 0 ? (
                <div className="space-y-4">
                    {activePlans.map(plan => {
                        const progress = getProgress(plan);
                        const diff = new Date(plan.endDate).getTime() - new Date().getTime();
                        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
                        return (
                            <div key={plan.id} onClick={() => navigate(`/plan/${plan.id}`)} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group">
                                <div className="flex justify-between mb-2">
                                    <h3 className="font-bold text-lg group-hover:text-brand-600 transition-colors">{plan.title}</h3>
                                    <span className={`text-xs font-mono px-2 py-1 rounded font-bold ${daysLeft <= 3 ? 'bg-red-100 text-red-700' : 'bg-brand-100 text-brand-700'}`}>
                                        {daysLeft > 0 ? `D-${daysLeft}` : '종료 임박'}
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 mb-2 overflow-hidden">
                                    <div className="bg-brand-500 h-2.5 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500 font-medium">
                                    <span>{progress}% 완료</span>
                                    <span>마일스톤 {plan.milestones.filter(m => m.isCompleted).length}/{plan.milestones.length} 달성</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">진행 중인 계획이 없습니다.</div>}
          </section>
          
          <section>
             <h2 className="font-bold text-lg mb-4 text-slate-800">지난 기록</h2>
             {pastPlans.length > 0 ? (
                 <div className="space-y-4">
                     {pastPlans.map(plan => (
                         <div key={plan.id} onClick={() => navigate(`/plan/${plan.id}`)} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 opacity-80 hover:opacity-100 transition-opacity cursor-pointer">
                             <div className="flex justify-between items-center">
                                 <h3 className="font-bold text-slate-700">{plan.title}</h3>
                                 {plan.status === PlanStatus.COMPLETED_SUCCESS ? <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">성공</span> : <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-bold">실패</span>}
                             </div>
                             <p className="text-xs text-slate-400 mt-2">{new Date(plan.startDate).toLocaleDateString()} ~ {new Date(plan.endDate).toLocaleDateString()}</p>
                         </div>
                     ))}
                 </div>
             ) : <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">완료된 계획이 여기에 표시됩니다.</div>}
          </section>
      </div>
    </div>
  );
};
