
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, Search, User, Flame } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path ? "text-brand-600" : "text-slate-400";

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 pb-safe z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="max-w-4xl mx-auto flex justify-around items-center h-16">
        <Link to="/" className={`flex flex-col items-center ${isActive('/')}`}>
          <Home size={24} />
          <span className="text-[10px] mt-1 font-medium">홈</span>
        </Link>
        <Link to="/search" className={`flex flex-col items-center ${isActive('/search')}`}>
          <Search size={24} />
          <span className="text-[10px] mt-1 font-medium">검색</span>
        </Link>
        <Link to="/create" className={`flex flex-col items-center ${isActive('/create')}`}>
          <PlusSquare size={24} />
          <span className="text-[10px] mt-1 font-medium">새 계획</span>
        </Link>
         <Link to="/categories" className={`flex flex-col items-center ${isActive('/categories')}`}>
          <Flame size={24} />
          <span className="text-[10px] mt-1 font-medium">새로운 도전</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center ${isActive('/profile')}`}>
          <User size={24} />
          <span className="text-[10px] mt-1 font-medium">프로필</span>
        </Link>
      </div>
    </nav>
  );
};
