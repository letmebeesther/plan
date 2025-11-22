
import React from 'react';
import { Flame } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-brand-600 flex flex-col items-center justify-center z-[100] animate-fade-out">
      <div className="animate-bounce-gentle">
        <div className="bg-white p-4 rounded-3xl shadow-xl mb-4 inline-block">
            <Flame size={64} className="text-brand-600 fill-brand-600" />
        </div>
      </div>
      <h1 className="text-3xl font-extrabold text-white tracking-tight animate-pulse">Plan & Prove</h1>
      <p className="text-brand-100 mt-2 font-medium text-sm">계획하고, 증명하고, 성공하세요</p>
    </div>
  );
};
