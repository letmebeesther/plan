
import React, { useState } from 'react';
import { login, register } from '../services/authService';
import { Flame, ArrowRight, Loader2, Mail, Lock, User, Sparkles } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
        setError("이메일과 비밀번호를 입력해주세요.");
        return;
    }

    if (isSignUp && !name.trim()) {
        setError("닉네임을 입력해주세요.");
        return;
    }

    setLoading(true);
    
    try {
        let result;
        if (isSignUp) {
            result = await register(email, password, name, bio);
        } else {
            result = await login(email, password);
        }

        if (result.success) {
            onLoginSuccess();
        } else {
            setError(result.message || "오류가 발생했습니다.");
        }
    } catch (err) {
        setError("네트워크 오류가 발생했습니다.");
    } finally {
        setLoading(false);
    }
  };

  const toggleMode = () => {
      setIsSignUp(!isSignUp);
      setError(null);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-100 rounded-full opacity-50 blur-3xl"></div>
        <div className="absolute top-40 -left-20 w-40 h-40 bg-indigo-100 rounded-full opacity-50 blur-2xl"></div>

        <div className="flex-1 flex flex-col justify-center px-8 relative z-10 py-10 overflow-y-auto">
            <div className="mb-8 animate-fade-in">
                <div className="bg-brand-50 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-brand-100">
                    <Flame size={32} className="text-brand-600 fill-brand-600" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                    {isSignUp ? "도전을 시작하세요" : "다시 오셨군요!"}
                </h1>
                <p className="text-slate-500 leading-relaxed">
                    {isSignUp 
                        ? "계정을 만들고 당신의 의지를 증명해보세요." 
                        : "당신의 꿈들이 기다리고 있습니다."}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
                {/* Email Field */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">이메일</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-medium text-base"
                            placeholder="name@example.com"
                            required
                        />
                    </div>
                </div>

                {/* Password Field */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">비밀번호</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-medium text-base"
                            placeholder="비밀번호 입력"
                            required
                        />
                    </div>
                </div>

                {/* SignUp Specific Fields */}
                {isSignUp && (
                    <div className="space-y-5 animate-fade-in">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">닉네임</label>
                            <div className="relative">
                                <User className="absolute left-4 top-4 text-slate-400" size={20} />
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-medium text-base"
                                    placeholder="활동명"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">한 줄 각오 (선택)</label>
                            <div className="relative">
                                <Sparkles className="absolute left-4 top-4 text-slate-400" size={20} />
                                <input 
                                    type="text" 
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-medium text-base"
                                    placeholder="나를 표현하는 한 마디"
                                />
                            </div>
                        </div>
                    </div>
                )}
                
                {error && (
                    <div className="bg-red-50 text-red-600 text-sm font-bold p-3 rounded-lg animate-shake">
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-brand-500/30 hover:bg-brand-700 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                >
                    {loading ? <Loader2 className="animate-spin" /> : (
                        <>
                            {isSignUp ? '회원가입 완료' : '로그인'} <ArrowRight size={20} className="ml-2" />
                        </>
                    )}
                </button>
            </form>

            <div className="mt-8 text-center">
                <p className="text-slate-500 text-sm">
                    {isSignUp ? "이미 계정이 있으신가요?" : "아직 계정이 없으신가요?"}
                    <button 
                        onClick={toggleMode}
                        className="ml-2 font-bold text-brand-600 hover:underline focus:outline-none"
                    >
                        {isSignUp ? "로그인하기" : "회원가입하기"}
                    </button>
                </p>
            </div>
        </div>
    </div>
  );
};
