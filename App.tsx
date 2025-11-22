
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { CreatePlan } from './pages/CreatePlan';
import { PlanDetail } from './pages/PlanDetail';
import { Profile } from './pages/Profile';
import { Search } from './pages/Search';
import { GroupDetail } from './pages/GroupDetail';
import { CategoryRecommend } from './pages/CategoryRecommend';
import { initializeDemoData } from './services/planService';
import { ArrowUp } from 'lucide-react';
import { SplashScreen } from './pages/SplashScreen';
import { Login } from './pages/Login';
import { getCurrentUser } from './services/authService';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    // Initialize DB with demo data if empty
    initializeDemoData();

    // Check Auth
    const user = getCurrentUser();
    if (user) {
        setIsAuthenticated(true);
    }

    // Splash Timer
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);

    // Scroll event listener
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
        clearTimeout(timer);
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (showSplash) {
      return <SplashScreen />;
  }

  if (!isAuthenticated) {
      return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <div className="antialiased text-slate-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreatePlan />} />
          <Route path="/plan/:id" element={<PlanDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/categories" element={<CategoryRecommend />} /> 
          <Route path="/group/:id" element={<GroupDetail />} />
        </Routes>
        <Navbar />

        {/* Back to Top Button */}
        <button
            onClick={scrollToTop}
            className={`fixed bottom-20 right-4 md:bottom-8 md:right-8 z-40 p-3 rounded-full bg-white text-brand-600 border border-brand-100 shadow-lg hover:shadow-xl hover:bg-brand-50 transition-all duration-300 transform ${
                showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
            }`}
            aria-label="맨 위로 이동"
        >
            <ArrowUp size={24} strokeWidth={2.5} />
        </button>
      </div>
    </Router>
  );
};

export default App;
