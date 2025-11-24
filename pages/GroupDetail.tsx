
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGroupChallengeById } from '../services/planService';
import { GroupChallenge, PlanStatus } from '../types';
import { ChevronLeft, Users, ArrowRight } from 'lucide-react';

export const GroupDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<GroupChallenge | null>(null);

  useEffect(() => {
    if (id) {
      getGroupChallengeById(id).then(data => setGroup(data));
    }
  }, [id]);

  if (!group) return <div className="text-center py-20">Loading...</div>;

  const calculateTimeLeft = (endDate: string) => {
      const diff = new Date(endDate).getTime() - new Date().getTime();
      if (diff <= 0) return "종료";
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      return `D-${days}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="relative h-60 w-full">
        <img src={group.image} alt={group.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute top-4 left-4 z-20">
             <button onClick={() => navigate(-1)} className="p-2 text-white hover:bg-white/20 rounded-full transition-all backdrop-blur-md">
                <ChevronLeft size={24} />
            </button>
        </div>
        <div className="absolute bottom-0 left-0 w-full p-6 text-white z-10">
            <div className="max-w-6xl mx-auto">
                <span className="bg-indigo-500/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md font-bold mb-2 inline-block">
                    {group.category}
                </span>
                <h1 className="text-2xl font-bold mb-2">{group.title}</h1>
                <p className="text-slate-200 text-sm mb-4 line-clamp-2 opacity-90">{group.description}</p>
                <div className="flex items-center text-sm font-bold">
                    <Users size={16} className="mr-1.5" />
                    <span>{group.participants.length}명 참여 중</span>
                </div>
            </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-6 -mt-4 relative z-10">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">참여자 현황</h3>
                  <span className="text-xs text-slate-500">높은 달성률 순</span>
              </div>
              <div className="divide-y divide-slate-100">
                  {group.participants
                    .sort((a, b) => b.progress - a.progress)
                    .map((p, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 flex items-center hover:bg-slate-50 transition-colors group"
                      >
                          {/* Rank/Avatar */}
                          <Link to={`/profile/${p.user.id}`} className="flex items-center mr-4 cursor-pointer">
                              <div className="relative">
                                <img src={p.user.avatar} alt={p.user.name} className="w-12 h-12 rounded-full border border-slate-200" />
                                {idx < 3 && (
                                    <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-white text-white font-bold ${
                                        idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-slate-400' : 'bg-orange-600'
                                    }`}>
                                        {idx + 1}
                                    </div>
                                )}
                              </div>
                          </Link>
                          
                          {/* User Info & Progress */}
                          <div className="flex-1 min-w-0 mr-4">
                              <div className="flex justify-between items-center mb-1">
                                  <Link to={`/profile/${p.user.id}`} className="font-bold text-slate-900 text-sm hover:underline truncate">
                                      {p.user.name}
                                  </Link>
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                      p.status === PlanStatus.COMPLETED_SUCCESS ? 'bg-green-100 text-green-700' :
                                      p.status === PlanStatus.COMPLETED_FAIL ? 'bg-red-100 text-red-700' :
                                      'bg-brand-50 text-brand-600'
                                  }`}>
                                      {calculateTimeLeft(p.endDate)}
                                  </span>
                              </div>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-brand-500 h-full transition-all" 
                                    style={{ width: `${p.progress}%` }}
                                  ></div>
                              </div>
                          </div>

                          {/* Action */}
                          <Link to={`/plan/${p.planId}`} className="flex-shrink-0 text-slate-300 hover:text-brand-600 transition-colors">
                              <ArrowRight size={20} />
                          </Link>
                      </div>
                  ))}
              </div>
              {group.participants.length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                      참여자가 아직 없습니다.
                  </div>
              )}
          </div>

          <div className="mt-6 text-center">
               <button 
                onClick={() => navigate('/create', { state: { title: group.title, category: group.category, description: group.description } })}
                className="bg-brand-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:bg-brand-700 transition-all transform hover:-translate-y-1"
               >
                   이 챌린지에 함께하기
               </button>
          </div>
      </main>
    </div>
  );
};
