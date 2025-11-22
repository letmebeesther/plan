
import React from 'react';

export const Profile: React.FC = () => {
  return (
    <div className="pb-24 min-h-screen bg-slate-50">
      <div className="bg-white pb-6 border-b border-slate-100 shadow-sm">
        <div className="h-32 bg-gradient-to-r from-brand-500 to-indigo-600"></div>
        <div className="max-w-4xl mx-auto px-4 relative">
            <div className="absolute -top-12 p-1 bg-white rounded-full">
                <img 
                    src="https://picsum.photos/100/100" 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full border border-slate-100 shadow-md"
                />
            </div>
            <div className="pt-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-4 md:mb-0">
                        <h1 className="text-2xl font-bold text-slate-900">김철수</h1>
                        <p className="text-slate-500 text-sm font-medium">@alexbuilds</p>
                        <p className="mt-3 text-slate-700 max-w-lg leading-relaxed text-sm">
                            풀스택 개발자입니다. 가치 있는 서비스를 만드는 것을 좋아하며 매일 성장하려고 노력합니다.
                        </p>
                    </div>
                    <button className="w-full md:w-auto border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                        프로필 수정
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-3 divide-x divide-slate-100 mt-8 pt-6 border-t border-slate-100">
                <div className="text-center">
                    <span className="block font-bold text-2xl text-slate-900">12</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">총 계획</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-2xl text-green-600">8</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">성공</span>
                </div>
                <div className="text-center">
                    <span className="block font-bold text-2xl text-brand-600">92%</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">신뢰도</span>
                </div>
            </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="font-bold text-lg mb-4 text-slate-800">진행 중인 계획</h2>
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group">
              <div className="flex justify-between mb-2">
                <h3 className="font-bold text-lg group-hover:text-brand-600 transition-colors">30일 만에 SaaS 만들기</h3>
                <span className="text-xs font-mono bg-brand-100 text-brand-700 px-2 py-1 rounded font-bold">D-15</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full mt-3 mb-2 overflow-hidden">
                  <div className="bg-brand-500 h-2.5 rounded-full w-1/3"></div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 font-medium">
                <span>33% 완료</span>
                <span>마일스톤 1/5 달성</span>
              </div>
          </div>
          
          <h2 className="font-bold text-lg mt-8 mb-4 text-slate-800">지난 기록</h2>
           <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
                완료된 계획이 여기에 표시됩니다.
           </div>
      </div>
    </div>
  );
};
