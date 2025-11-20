
import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Loader2, X } from 'lucide-react';
import { Category, Plan } from '../types';
import { subscribeToAllPlans } from '../services/planService';
import { PlanCard } from '../components/PlanCard';

export const Search: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllPlans('new', (updatedPlans) => {
      setPlans(updatedPlans);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = searchTerm === '' || 
        plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        
    const matchesCategory = selectedCategory === null || plan.categories.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const handleCategoryClick = (cat: Category) => {
    if (selectedCategory === cat) {
        setSelectedCategory(null);
    } else {
        setSelectedCategory(cat);
    }
  };

  const handleTagClick = (tag: string) => {
      setSearchTerm(tag.replace('#', ''));
  };

  return (
    <div className="pb-24 min-h-screen bg-slate-50 p-4">
        <div className="max-w-md mx-auto pt-4">
            <div className="relative mb-6">
                <SearchIcon className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="계획, 태그, 사용자 검색..."
                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none shadow-sm text-base"
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
                    >
                        <X size={20} />
                    </button>
                )}
            </div>
            
            {/* Tags Section - Only show if no search and no category */}
            {!searchTerm && !selectedCategory && (
                <div className="mb-8 animate-fade-in">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg">인기 급상승 태그</h3>
                    <div className="flex flex-wrap gap-2">
                        {['#운동', '#코딩', '#다이어트', '#독서', '#금연', '#미라클모닝', '#저축', '#영어공부'].map(tag => (
                            <button 
                                key={tag} 
                                onClick={() => handleTagClick(tag)}
                                className="bg-white border border-slate-200 px-4 py-2 rounded-full text-sm text-slate-600 font-medium hover:border-brand-300 hover:text-brand-600 cursor-pointer transition-colors"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
             
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">카테고리</h3>
                    {selectedCategory && (
                         <button onClick={() => setSelectedCategory(null)} className="text-xs text-brand-600 font-bold hover:underline">
                            초기화
                         </button>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {Object.values(Category).map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => handleCategoryClick(cat)}
                            className={`p-3 rounded-xl shadow-sm border text-center font-bold transition-all text-sm ${
                                selectedCategory === cat 
                                ? 'bg-brand-500 text-white border-brand-600 ring-2 ring-brand-200' 
                                : 'bg-white text-slate-700 border-slate-100 hover:bg-brand-50 hover:text-brand-600 hover:border-brand-200'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
                 <h3 className="font-bold text-slate-800 mb-4 text-lg">
                    검색 결과 
                    <span className="text-brand-600 ml-2 text-sm">{loading ? '...' : filteredPlans.length}건</span>
                 </h3>

                 {loading ? (
                     <div className="flex justify-center py-10">
                         <Loader2 className="animate-spin text-brand-600" size={32} />
                     </div>
                 ) : filteredPlans.length > 0 ? (
                     <div className="space-y-4">
                         {filteredPlans.map(plan => (
                             <PlanCard key={plan.id} plan={plan} />
                         ))}
                     </div>
                 ) : (
                     <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-slate-100 border-dashed">
                         <SearchIcon className="mx-auto mb-2 opacity-50" size={32} />
                         <p>검색 결과가 없습니다.</p>
                     </div>
                 )}
            </div>
        </div>
    </div>
  );
};