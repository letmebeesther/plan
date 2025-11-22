
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plan, PlanStatus } from '../../types';
import { Clock, MessageCircle, CheckCircle2, XCircle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface PlanCardProps {
  plan: Plan;
  minimal?: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, minimal = false }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (plan.status === PlanStatus.COMPLETED_SUCCESS) return "성공";
      if (plan.status === PlanStatus.COMPLETED_FAIL) return "실패";
      if (plan.status === PlanStatus.VERIFICATION_PENDING) return "검증 중";
      
      const diff = new Date(plan.endDate).getTime() - new Date().getTime();
      if (diff <= 0) return "종료됨";
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      return `${days}일 ${hours}시간`;
    };
    
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 60000);
    return () => clearInterval(timer);
  }, [plan.endDate, plan.status]);

  const progress = plan.milestones.length > 0 
    ? Math.round((plan.milestones.filter(m => m.isCompleted).length / plan.milestones.length) * 100) 
    : 0;

  const totalVotes = plan.votes.canDoIt + plan.votes.cannotDoIt;
  const successRate = totalVotes > 0 
    ? Math.round((plan.votes.canDoIt / totalVotes) * 100) 
    : 0;

  return (
    <Link to={`/plan/${plan.id}`} className={`block bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group ${minimal ? 'w-64 flex-shrink-0' : 'w-full'}`}>
      <div className="relative h-40 w-full overflow-hidden">
        <img src={plan.images[0]} alt={plan.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        
        {/* Status Badge */}
        <div className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-md font-bold flex items-center shadow-sm backdrop-blur-md ${
            plan.status === PlanStatus.COMPLETED_SUCCESS ? 'bg-green-500/90' : 
            plan.status === PlanStatus.COMPLETED_FAIL ? 'bg-red-500/90' :
            plan.status === PlanStatus.VERIFICATION_PENDING ? 'bg-amber-500/90' : 'bg-black/60'
        }`}>
          {plan.status === PlanStatus.COMPLETED_SUCCESS ? <CheckCircle2 size={12} className="mr-1" /> : 
           plan.status === PlanStatus.COMPLETED_FAIL ? <XCircle size={12} className="mr-1" /> :
           <Clock size={12} className="mr-1" />}
          {timeLeft}
        </div>

        {/* Profile */}
        <div className="absolute bottom-2 left-2 flex items-center space-x-2 z-20">
           <img src={plan.user.avatar} alt={plan.user.name} className="w-6 h-6 rounded-full border border-white shadow-sm" />
           <span className="text-white text-xs font-medium drop-shadow-md shadow-black">{plan.user.name}</span>
        </div>

        {/* Vote Results Overlay (Yes/No) */}
        <div className="absolute bottom-2 right-2 z-20">
            <div className="flex items-center bg-black/60 backdrop-blur-md rounded-lg overflow-hidden border border-white/10 shadow-lg p-0.5">
                <div className="flex items-center px-2 py-0.5 text-green-400 text-[10px] font-extrabold border-r border-white/20">
                    <ThumbsUp size={10} className="mr-1 fill-green-400" /> {plan.votes.canDoIt}
                </div>
                <div className="flex items-center px-2 py-0.5 text-red-400 text-[10px] font-extrabold">
                    <ThumbsDown size={10} className="mr-1 fill-red-400" /> {plan.votes.cannotDoIt}
                </div>
            </div>
        </div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 z-10"></div>
      </div>
      
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-800 line-clamp-1 text-sm md:text-base flex-1 mr-2">{plan.title}</h3>
        </div>

        {!minimal && <p className="text-slate-500 text-xs line-clamp-2 mb-3">{plan.description}</p>}
        
        <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400">달성률 {progress}%</span>
            <span className={`font-bold ${successRate >= 50 ? 'text-brand-600' : 'text-slate-400'}`}>
                성공예측 {successRate}%
            </span>
        </div>

        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
            {/* Progress Bar */}
            <div className="bg-brand-500 h-full" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="flex items-center justify-between text-slate-400 text-xs mt-3 pt-2 border-t border-slate-50">
          <div className="flex space-x-3">
            <span className="flex items-center"><MessageCircle size={14} className="mr-1" /> {plan.logs.length} 로그</span>
          </div>
           <div className="flex items-center text-slate-500">
              <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold mr-1">투표</span>
              {totalVotes}명
           </div>
        </div>
      </div>
    </Link>
  );
};
