
import React, { useState, useEffect } from 'react';
import { PlanCard } from '../components/PlanCard';
import { Plan, PlanStatus, GroupChallenge } from '../types';
import { Trophy, Flame, ListFilter, Loader2, HelpCircle, X, BookOpen, Users, ChevronRight } from 'lucide-react';
import { subscribeToAllPlans, getGroupChallenges } from '../services/planService';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const [filter, setFilter] = useState<'popular' | 'new'>('popular');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [groups, setGroups] = useState<GroupChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Load Groups Async
    getGroupChallenges().then(data => setGroups(data));

    // Use real-time subscription
    const unsubscribe = subscribeToAllPlans(filter, (updatedPlans) => {
      setPlans(updatedPlans);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [filter]);

  const successPlans = plans.filter(p => p.status === PlanStatus.COMPLETED_SUCCESS);
  const popularPlans = plans.filter(p => p.status === PlanStatus.ACTIVE && (p.votes.canDoIt + p.votes.cannotDoIt > 0)).slice(0, 5);

  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <header className="sticky top-0 bg-white/90 backdrop-blur-md z-40 border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-brand-900 tracking-tight">Plan & Prove</h1>
          <div className="flex items-center space-x-3">
             <button 
               onClick={() => setShowGuide(true)}
               className="text-slate-500 hover:text-brand-600 transition-colors p-1"
             >
                <HelpCircle size={24} />
             </button>
             <div className="w-9 h-9 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                <img src="https://picsum.photos/100/100" alt="Profile" />
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto space-y-8 pt-6">
        
        {/* Honor Hall Section - Show only if there are success stories */}
        {successPlans.length > 0 && (
          <section className="px-4">
              <div className="flex items-center mb-3">
                  <Trophy className="text-yellow-500 mr-2 fill-yellow-500" size={20} />
                  <h2 className="text-lg font-bold text-slate-800">명예의 전당 (성공 사례)</h2>
              </div>
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                  {successPlans.map(plan => (
                      <PlanCard key={plan.id} plan={plan} minimal={true} />
                  ))}
              </div>
          </section>
        )}

        {/* Hot Challenges Section */}
        {popularPlans.length > 0 && (
          <section className="px-4">
              <div className="flex items-center mb-3">
                  <Flame className="text-red-500 mr-2 fill-red-500" size={20} />
                  <h2 className="text-lg font-bold text-slate-800">지금 핫한 도전 (인기글)</h2>
              </div>
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                  {popularPlans.map(plan => (
                      <PlanCard key={plan.id} plan={plan} minimal={true} />
                  ))}
              </div>
          </section>
        )}

        {/* Challenge Together Section (Groups) */}
        {groups.length > 0 && (
          <section className="px-4">
              <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Users className="text-indigo-500 mr-2 fill-indigo-100" size={20} />
                    <h2 className="text-lg font-bold text-slate-800">함께 도전하기</h2>
                  </div>
              </div>
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4">
                  {groups.map(group => (
                      <Link to={`/group/${group.id}`} key={group.id} className="flex-shrink-0 w-72 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group relative">
                           <div className="h-32 relative">
                               <img src={group.image} className="w-full h-full object-cover" alt={group.title} />
                               <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                               <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white text-xs px-2 py-1 rounded-md font-bold">
                                   {group.participants.length}명 참여중
                               </div>
                           </div>
                           <div className="p-4">
                               <h3 className="font-bold text-slate-800 mb-1 truncate">{group.title}</h3>
                               <p className="text-xs text-slate-500 line-clamp-2 mb-3 h-8">{group.description}</p>
                               
                               <div className="flex items-center -space-x-2 mb-3">
                                   {group.participants.slice(0, 4).map((p, i) => (
                                       <img key={i} src={p.user.avatar} className="w-6 h-6 rounded-full border-2 border-white" alt={p.user.name} />
                                   ))}
                                   {group.participants.length > 4 && (
                                       <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-500">
                                           +{group.participants.length - 4}
                                       </div>
                                   )}
                               </div>
                               
                               <div className="flex items-center text-xs font-bold text-indigo-600">
                                   참여하기 <ChevronRight size={14} />
                               </div>
                           </div>
                      </Link>
                  ))}
              </div>
          </section>
        )}

        {/* Main Feed */}
        <section className="px-4">
            <div className="flex items-center justify-between mb-4 sticky top-16 bg-slate-50/95 backdrop-blur py-3 z-30">
                <div className="flex items-center">
                    <ListFilter className="text-slate-500 mr-2" size={20} />
                    <h2 className="text-lg font-bold text-slate-800">탐색</h2>
                </div>
                <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                    <button 
                    onClick={() => setFilter('popular')}
                    className={`px-3 py-1.5 text-xs md:text-sm rounded-md font-bold transition-colors ${filter === 'popular' ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                    인기순
                    </button>
                    <div className="w-[1px] bg-slate-200 my-1 mx-1"></div>
                    <button 
                    onClick={() => setFilter('new')}
                    className={`px-3 py-1.5 text-xs md:text-sm rounded-md font-bold transition-colors ${filter === 'new' ? 'bg-brand-50 text-brand-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                    최신순
                    </button>
                </div>
            </div>

            {loading && plans.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-brand-600" size={40} />
                </div>
            ) : plans.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <p>아직 등록된 계획이 없습니다. 첫 번째 도전을 시작해보세요!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map(plan => (
                    <PlanCard key={plan.id} plan={plan} />
                ))}
                </div>
            )}
            
            {!loading && plans.length > 0 && (
                <div className="text-center mt-10 text-slate-400 text-sm pb-10 font-medium">
                    모든 게시글을 불러왔습니다.
                </div>
            )}
        </section>
      </main>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl">
                <div className="bg-brand-600 p-6 flex justify-between items-center text-white">
                    <div className="flex items-center">
                        <BookOpen className="mr-2" />
                        <h3 className="font-bold text-xl">Plan & Prove 이용 가이드</h3>
                    </div>
                    <button onClick={() => setShowGuide(false)} className="hover:bg-brand-700 p-1 rounded-full"><X size={24}/></button>
                </div>
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="flex items-start">
                        <div className="bg-brand-100 text-brand-600 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4">1</div>
                        <div>
                            <h4 className="font-bold text-slate-800 mb-1">계획 세우기</h4>
                            <p className="text-sm text-slate-600">AI의 도움을 받아 전체 기간을 5단계 마일스톤으로 나눈 구체적인 계획을 생성합니다.</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-brand-100 text-brand-600 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4">2</div>
                        <div>
                            <h4 className="font-bold text-slate-800 mb-1">로그 작성 및 검증</h4>
                            <p className="text-sm text-slate-600">전체 기간의 1/5 지점마다 7가지 질문에 대한 진행 로그를 작성해야 합니다. 이때 마일스톤 달성 여부도 체크합니다.</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-brand-100 text-brand-600 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4">3</div>
                        <div>
                            <h4 className="font-bold text-slate-800 mb-1">커뮤니티 투표</h4>
                            <p className="text-sm text-slate-600">다른 유저들은 당신의 계획과 로그를 보고 '성공 가능성'에 투표합니다. (예/아니오)</p>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <div className="bg-brand-100 text-brand-600 font-bold rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mr-4">4</div>
                        <div>
                            <h4 className="font-bold text-slate-800 mb-1">최종 검증</h4>
                            <p className="text-sm text-slate-600">마감일이 지나면 2일간 '최종 검증 투표'가 열립니다. 여기서 과반수의 인정을 받아야 명예의 전당(성공)에 오릅니다.</p>
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl text-center">
                        <p className="text-sm font-bold text-slate-600">지금 바로 당신의 의지를 증명해보세요!</p>
                        <button onClick={() => setShowGuide(false)} className="mt-3 bg-brand-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-brand-700 transition-colors">확인했습니다</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
