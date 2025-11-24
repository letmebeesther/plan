
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Loader2, X, ChevronLeft, Tag, RotateCcw } from 'lucide-react';
import { Category, Plan } from '../types';
import { subscribeToAllPlans, getTopTagsByCategory } from '../services/planService';
import { PlanCard } from '../components/PlanCard';

export const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sub-category (Tag) Filtering
  const [topTags, setTopTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllPlans('new', (updatedPlans) => {
      setPlans(updatedPlans);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Update tags when category changes
  useEffect(() => {
      if (selectedCategory) {
          getTopTagsByCategory(selectedCategory).then(tags => setTopTags(tags));
      } else {
          setTopTags([]);
      }
      setSelectedTag(null); // Reset tag selection when category changes
  }, [selectedCategory]);

  const filteredPlans = plans.filter(plan => {
    const matchesSearch = searchTerm === '' || 
        plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.hashtags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        
    const matchesCategory = selectedCategory === null || plan.categories.includes(selectedCategory);
    
    // Tag Filter Logic (AND condition)
    const matchesTag = selectedTag === null || plan.hashtags.some(tag => tag.includes(selectedTag));
    
    return matchesSearch && matchesCategory && matchesTag;
  });

  const handleCategoryClick = (cat: Category) => {
    if (selectedCategory === cat) {
        setSelectedCategory(null);
    } else {
        setSelectedCategory(cat);
    }
  };

  const handleGlobalTagClick = (tag: string) => {
      setSearchTerm(tag.replace('#', ''));
  };

  const resetFilters = () => {
      setSelectedCategory(null);
      setSelectedTag(null);
      setSearchTerm('');
  };

  return (
    <div className="pb-24 min-h-screen bg-slate-50 px-4 pt-8 md:pt-20">
        <div className="max-w-md mx-auto">
            <div className="flex items-center mb-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="mr-2 p-2 -ml-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-slate-900">검색</h1>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
                <SearchIcon className="absolute left-4 top-3.5 text-slate-400" size={20} />
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="계획, 태그, 사용자 검색..."
                    className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 focus:outline-none shadow-sm text-base"
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
            
            {/* Global Popular Tags - Always show unless searching */}
            {!searchTerm && (
                <div className="mb-8 animate-fade-in">
                    <h3 className="font-bold text-slate-800 mb-4 text-lg">인기 급상승 태그</h3>
                    <div className="flex flex-wrap gap-2">
                        {['#운동', '#코딩', '#다이어트', '#독서', '#금연', '#미라클모닝', '#저축', '#영어공부'].map(tag => (
                            <button 
                                key={tag} 
                                onClick={() => handleGlobalTagClick(tag)}
                                className="bg-white border border-slate-200 px-4 py-2 rounded-full text-sm text-slate-600 font-medium hover:border-brand-300 hover:text-brand-600 cursor-pointer transition-colors"
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>
            )}
             
            {/* Category Selection */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-slate-800 text-lg">카테고리</h3>
                    {(selectedCategory || selectedTag) && (
                         <button onClick={resetFilters} className="flex items-center text-xs text-slate-500 hover:text-brand-600 font-medium">
                            <RotateCcw size={12} className="mr-1"/> 필터 초기화
                         </button>
                    )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                    {Object.values(Category).map(cat => (
                        <button 
                            key={cat} 
                            onClick={() => handleCategoryClick(cat)}
                            className={`py-2.5 px-2 rounded-xl text-sm font-bold transition-all border ${
                                selectedCategory === cat 
                                ? 'bg-brand-600 text-white border-brand-600 ring-2 ring-brand-200' 
                                : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                            }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Sub-category / Tags (Conditional Render) */}
                {selectedCategory && topTags.length > 0 && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 animate-fade-in">
                        <div className="flex items-center text-xs font-bold text-slate-500 mb-3">
                            <Tag size={12} className="mr-1.5" /> 
                            <span className="text-brand-600 mr-1">{selectedCategory}</span> 인기 키워드
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {topTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                        selectedTag === tag
                                        ? 'bg-brand-100 text-brand-700 border-brand-300'
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                                    }`}
                                >
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="border-t border-slate-200 pt-6">
                 <h3 className="font-bold text-slate-800 mb-4 text-lg flex items-center">
                    검색 결과 
                    <span className="ml-2 text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {loading ? '...' : filteredPlans.length}건
                    </span>
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
                     <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-100 border-dashed">
                         <SearchIcon className="mx-auto mb-3 opacity-30" size={40} />
                         <p className="font-medium">검색 결과가 없습니다.</p>
                         <p className="text-sm mt-1 opacity-70">다른 검색어나 카테고리를 선택해보세요.</p>
                     </div>
                 )}
            </div>
        </div>
    </div>
  );
};
