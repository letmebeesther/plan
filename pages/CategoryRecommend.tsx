
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, Plan } from '../types';
import { getPlansByCategory, getTopTagsByCategory } from '../services/planService';
import { PlanCard } from '../components/PlanCard';
import { Flame, Lightbulb, ExternalLink, Sparkles, ChevronRight, Tag } from 'lucide-react';

// Mock Ads Data
const CATEGORY_ADS = {
  [Category.FITNESS]: {
    title: "프리미엄 단백질 보충제 30% 할인",
    description: "근성장을 위한 최고의 선택. 지금 바로 시작하세요!",
    image: "https://picsum.photos/seed/protein/600/200",
    link: "#"
  },
  [Category.STUDY]: {
    title: "집중력 향상 노이즈 캔슬링 헤드폰",
    description: "공부에만 집중할 수 있는 환경을 만들어드립니다.",
    image: "https://picsum.photos/seed/headphone/600/200",
    link: "#"
  },
  [Category.CAREER]: {
    title: "IT 현직자 멘토링 코스",
    description: "실무 경험을 가장 빠르게 배우는 방법. 커리어 점프업!",
    image: "https://picsum.photos/seed/career/600/200",
    link: "#"
  },
  [Category.HOBBY]: {
    title: "원데이 클래스 수강권 패키지",
    description: "지루한 일상에 특별한 취미를 더해보세요.",
    image: "https://picsum.photos/seed/hobby/600/200",
    link: "#"
  },
  [Category.LIFESTYLE]: {
    title: "친환경 미니멀 라이프 스타터 킷",
    description: "지구를 생각하는 당신을 위한 첫걸음.",
    image: "https://picsum.photos/seed/lifestyle/600/200",
    link: "#"
  }
};

// Mock Recommended Challenges
const RECOMMENDED_CHALLENGES = {
  [Category.FITNESS]: [
    { title: "30일 플랭크 챌린지", desc: "하루 1분부터 시작해서 코어 근육을 단련하세요." },
    { title: "런데이 8주 30분 달리기", desc: "초보자도 할 수 있는 인터벌 러닝 프로그램." },
    { title: "매일 물 2L 마시기", desc: "피부와 건강을 위한 가장 쉬운 습관." }
  ],
  [Category.STUDY]: [
    { title: "영어 단어 1000개 암기", desc: "하루 30개씩 꾸준히 외워서 30일 완성." },
    { title: "매일 경제 기사 읽기", desc: "세상을 보는 눈을 키우는 아침 루틴." },
    { title: "자격증 필기 기출 10회독", desc: "합격의 지름길은 기출 반복입니다." }
  ],
  [Category.CAREER]: [
    { title: "1일 1커밋 챌린지", desc: "개발자라면 잔디 심기부터 시작해보세요." },
    { title: "포트폴리오 웹사이트 만들기", desc: "나만의 브랜드를 알리는 첫 걸음." },
    { title: "비즈니스 영어 이메일 정복", desc: "글로벌 업무를 위한 필수 표현 익히기." }
  ],
  [Category.HOBBY]: [
    { title: "한 달 동안 책 4권 읽기", desc: "일주일에 한 권, 마음의 양식을 쌓으세요." },
    { title: "매일 그림 하나 그리기", desc: "아이패드 드로잉 기초부터 시작하기." },
    { title: "나만의 요리 레시피북 만들기", desc: "자취생을 위한 초간단 요리 도전." }
  ],
  [Category.LIFESTYLE]: [
    { title: "미라클 모닝 (새벽 6시 기상)", desc: "아침 시간을 활용해 하루를 주도하세요." },
    { title: "하루 10분 명상하기", desc: "복잡한 머릿속을 비우는 힐링 타임." },
    { title: "일주일 지출 기록하기 (가계부)", desc: "소비 습관을 점검하고 절약 시작하기." }
  ]
};

export const CategoryRecommend: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<Category>(Category.FITNESS);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [topTags, setTopTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
        // 1. Load Plans
        const categoryPlans = await getPlansByCategory(selectedCategory);
        setPlans(categoryPlans);

        // 2. Load Top Tags
        const tags = await getTopTagsByCategory(selectedCategory);
        setTopTags(tags);
        
        // 3. Reset selected tag on category change
        setSelectedTag(null);
    };

    fetchData();
  }, [selectedCategory]);

  const handleChallengeClick = (title: string, desc: string) => {
      navigate('/create', { 
          state: { 
              title: title, 
              category: selectedCategory,
              description: desc 
          } 
      });
  };

  const currentAd = CATEGORY_ADS[selectedCategory];

  // Filter plans based on selected tag
  const displayedPlans = selectedTag 
    ? plans.filter(p => p.hashtags.some(h => h.includes(selectedTag)))
    : plans;

  return (
    <div className="pb-24 min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 pt-8 md:pt-24 pb-0">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex items-center mb-4">
                 <Flame className="text-brand-600 mr-2" size={24} />
                 <h1 className="text-xl font-bold text-slate-900">새로운 도전</h1>
            </div>
            
            {/* Horizontal Category Scroll */}
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-4">
                {Object.values(Category).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                            selectedCategory === cat
                            ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-600'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Sub-category (Tags) Scroll */}
            <div className="border-t border-slate-100 py-3 flex items-center space-x-2 overflow-x-auto scrollbar-hide">
                <span className="text-xs font-bold text-slate-400 flex-shrink-0 mr-2 flex items-center">
                    <Tag size={12} className="mr-1" /> 인기 키워드
                </span>
                {topTags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                        className={`flex-shrink-0 px-3 py-1 rounded-md text-xs font-bold transition-all ${
                            selectedTag === tag
                            ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-300'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                        }`}
                    >
                        #{tag}
                    </button>
                ))}
            </div>
          </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
          
          {/* Section 1: Recommended Challenge Templates (Visible regardless of tag selection) */}
          <section>
              <div className="flex items-center mb-3">
                  <Sparkles className="text-yellow-500 mr-2 fill-yellow-500" size={20} />
                  <h2 className="text-lg font-bold text-slate-800">이런 도전 어때요?</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {RECOMMENDED_CHALLENGES[selectedCategory].map((item, idx) => (
                      <div 
                        key={idx} 
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group"
                        onClick={() => handleChallengeClick(item.title, item.desc)}
                      >
                          <h3 className="font-bold text-slate-800 mb-2 group-hover:text-brand-600">{item.title}</h3>
                          <p className="text-xs text-slate-500 mb-4 h-8">{item.desc}</p>
                          <div className="flex items-center text-brand-600 text-xs font-bold">
                              도전하기 <ChevronRight size={14} />
                          </div>
                      </div>
                  ))}
              </div>
          </section>

          {/* Section 2: Sponsored Ad */}
          <section className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 relative group cursor-pointer">
              <div className="absolute top-3 right-3 bg-black/30 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded font-medium z-10">
                  Sponsored
              </div>
              <div className="md:flex">
                  <div className="md:w-1/3 h-32 md:h-auto relative">
                      <img src={currentAd.image} alt="Ad" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent md:bg-none opacity-60"></div>
                  </div>
                  <div className="p-5 md:w-2/3 flex flex-col justify-center">
                      <h3 className="font-bold text-lg text-slate-900 mb-1">{currentAd.title}</h3>
                      <p className="text-sm text-slate-500 mb-3">{currentAd.description}</p>
                      <div className="flex items-center text-slate-400 text-xs">
                          자세히 보기 <ExternalLink size={12} className="ml-1" />
                      </div>
                  </div>
              </div>
          </section>

          {/* Section 3: User Success Stories & Plans */}
          <section>
              <div className="flex items-center mb-4">
                  <Lightbulb className="text-indigo-500 mr-2 fill-indigo-100" size={20} />
                  <h2 className="text-lg font-bold text-slate-800">
                      {selectedTag ? `'${selectedTag}' 관련 사례` : `${selectedCategory} 분야의 실제 사례`}
                  </h2>
              </div>
              
              {displayedPlans.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {displayedPlans.map(plan => (
                          <PlanCard key={plan.id} plan={plan} />
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed text-slate-400">
                      {selectedTag 
                        ? `'${selectedTag}' 태그가 포함된 도전이 아직 없습니다.` 
                        : '아직 이 카테고리의 도전이 없습니다.'}
                      <br/>
                      첫 번째 주인공이 되어보세요!
                  </div>
              )}
          </section>

      </main>
    </div>
  );
};
