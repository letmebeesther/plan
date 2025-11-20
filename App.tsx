
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { CreatePlan } from './pages/CreatePlan';
import { PlanDetail } from './pages/PlanDetail';
import { Profile } from './pages/Profile';
import { Search } from './pages/Search';
import { firebaseInitialized } from './services/firebase';
import { Database, Settings } from 'lucide-react';

const App: React.FC = () => {
  // Firebase 설정이 안되어있으면 안내 화면 표시
  if (!firebaseInitialized) {
    return (
       <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200">
           <div className="flex justify-center mb-6">
                <div className="bg-red-100 p-4 rounded-full animate-pulse">
                    <Database className="text-red-600" size={48} />
                </div>
           </div>
           <h1 className="text-2xl font-extrabold text-slate-900 mb-2 text-center">Firebase 연결 필요</h1>
           <p className="text-slate-600 mb-8 text-center leading-relaxed">
             만드신 <strong>'plan'</strong> 프로젝트와 앱을 연결하려면<br/>
             고유한 <strong>설정 키(Config)</strong>가 필요합니다.
           </p>
           
           <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-sm text-slate-700 space-y-3 mb-8">
             <p className="font-bold text-slate-900 mb-2 border-b border-slate-200 pb-2 flex items-center">
                <Settings size={16} className="mr-2"/> 설정 방법
             </p>
             <ol className="list-decimal pl-5 space-y-2">
               <li><a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-brand-600 font-bold underline hover:text-brand-800">Firebase 콘솔</a>에 접속하세요.</li>
               <li>생성한 <strong>'plan'</strong> 프로젝트를 클릭하세요.</li>
               <li>좌측 상단 <strong>톱니바퀴(설정) &gt; 프로젝트 설정</strong>으로 이동하세요.</li>
               <li>하단 '내 앱'에서 <strong>웹 앱(&lt;/&gt;)</strong> 아이콘을 클릭해 앱을 등록하세요.</li>
               <li>나타나는 <code>const firebaseConfig = ...</code> 코드를 복사하세요.</li>
               <li>이 프로젝트의 <code>services/firebase.ts</code> 파일에 붙여넣으세요.</li>
             </ol>
           </div>
           
           <div className="text-center">
             <p className="text-xs text-slate-400 font-medium">설정값을 붙여넣고 저장하면 이 화면이 자동으로 사라집니다.</p>
           </div>
        </div>
      </div>
    );
  }

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
