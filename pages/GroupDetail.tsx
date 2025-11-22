
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getGroupChallengeById } from '../services/planService';
import { GroupChallenge } from '../types';
import { ChevronLeft, Users, Clock, ArrowRight } from 'lucide-react';

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
            <div className="max-w-4xl mx-auto">
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

      <main className="max-w-4xl mx-auto px-4 py-6 -mt-4 relative z-10">
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
                                    <div className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border border-white shadow-sm ${
                                        idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-400' : 'bg-orange-400'
                                    }`}>
                                        {idx + 1}
                                    </div>
                                )}
                              </div>
                          </Link>

                          {/* Info & Progress (Click to go to plan) */}
                          <div 
                            onClick={() => navigate(`/plan/${p.planId}`)}
                            className="flex-1 min-w-0 mr-4 cursor-pointer"
                          >
                              <div className="flex justify-between items-end mb-1">
                                  <h4 className="font-bold text-slate-900 text-sm truncate hover:text-brand-600">{p.user.name}</h4>
                                  <span className="text-brand-600 font-bold text-xs">{p.progress}% 달성</span>
                              </div>
                              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-brand-500 rounded-full transition-all duration-1000" 
                                    style={{ width: `${p.progress}%` }}
                                  ></div>
                              </div>
                              <p className="text-xs text-slate-400 mt-1 truncate">{p.user.bio}</p>
                          </div>

                          {/* Countdown & Arrow */}
                          <div 
                            onClick={() => navigate(`/plan/${p.planId}`)}
                            className="flex flex-col items-end flex-shrink-0 pl-2 border-l border-slate-100 cursor-pointer"
                          >
                              <div className="flex items-center text-slate-500 text-xs font-bold mb-1">
                                  <Clock size={12} className="mr-1" />
                                  {calculateTimeLeft(p.endDate)}
                              </div>
                              <ArrowRight size={16} className="text-slate-300 group-hover:text-brand-500 transition-colors" />
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </main>
    </div>
  );
};
