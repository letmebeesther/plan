
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusSquare, Search, User, Flame } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path || (path !== '/' && location.pathname.startsWith(path)) ? "text-brand-600" : "text-slate-400";
  const iconSize = 22; // Reduced from 24

  return (
    <nav 
      className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)' }}
    >
      <div className="max-w-6xl mx-auto flex justify-around items-center h-12 md:h-14 md:pb-0">
        <Link to="/" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/')}`}>
          <Home size={iconSize} strokeWidth={isActive('/') === "text-brand-600" ? 2.5 : 2} />
          <span className="text-[10px] mt-0.5 font-medium">홈</span>
        </Link>
        <Link to="/search" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/search')}`}>
          <Search size={iconSize} strokeWidth={isActive('/search') === "text-brand-600" ? 2.5 : 2} />
          <span className="text-[10px] mt-0.5 font-medium">검색</span>
        </Link>
        <Link to="/create" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/create')}`}>
          <PlusSquare size={iconSize} strokeWidth={isActive('/create') === "text-brand-600" ? 2.5 : 2} />
          <span className="text-[10px] mt-0.5 font-medium">새 계획</span>
        </Link>
         <Link to="/categories" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/categories')}`}>
          <Flame size={iconSize} strokeWidth={isActive('/categories') === "text-brand-600" ? 2.5 : 2} />
          <span className="text-[10px] mt-0.5 font-medium">새로운 도전</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center justify-center w-full h-full ${isActive('/profile')}`}>
          <User size={iconSize} strokeWidth={isActive('/profile') === "text-brand-600" ? 2.5 : 2} />
          <span className="text-[10px] mt-0.5 font-medium">프로필</span>
        </Link>
      </div>
    </nav>
  );
};
