
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { CreatePlan } from './pages/CreatePlan';
import { PlanDetail } from './pages/PlanDetail';
import { Profile } from './pages/Profile';
import { Search } from './pages/Search';

const App: React.FC = () => {
  return (
    <Router>
      <div className="antialiased text-slate-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreatePlan />} />
          <Route path="/plan/:id" element={<PlanDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/search" element={<Search />} />
          <Route path="/categories" element={<Search />} /> 
        </Routes>
        <Navbar />
      </div>
    </Router>
  );
};

export default App;
