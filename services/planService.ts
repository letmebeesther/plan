
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  getDoc,
  setDoc,
  arrayUnion
} from 'firebase/firestore';
import { Plan, PlanStatus, ProgressLog, Category, GroupChallenge, User, VoteStats } from '../types';
import { ensureAdminExists } from './authService';

// --- DEMO DATA (20 Samples) ---
const DEMO_PLANS: Omit<Plan, 'id'>[] = [
  // Success Stories (5 items)
  {
    userId: 'u_s1',
    user: { id: 'u_s1', name: '김성공', avatar: 'https://picsum.photos/seed/s1/100/100', bio: '작은 성공이 모여 큰 성공을 만든다', followers: [], following: [] },
    title: '한 달 동안 설탕 끊기 도전',
    description: '건강을 위해 가공된 설탕 섭취를 30일간 중단했습니다. 탄산음료, 과자, 초콜릿을 끊고 대체 당을 활용했습니다.',
    images: ['https://picsum.photos/seed/sugar/800/400'],
    categories: [Category.LIFESTYLE, Category.FITNESS],
    hashtags: ['#노슈가', '#건강', '#다이어트'],
    startDate: new Date(Date.now() - 86400000 * 40).toISOString(),
    endDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    status: PlanStatus.COMPLETED_SUCCESS,
    milestones: [
        { id: 'm1', title: '1주차: 음료수 끊기', dueDate: new Date(Date.now() - 86400000 * 35).toISOString(), isCompleted: true, weight: 1 },
        { id: 'm2', title: '2주차: 군것질 끊기', dueDate: new Date(Date.now() - 86400000 * 28).toISOString(), isCompleted: true, weight: 2 },
        { id: 'm3', title: '3주차: 성분표 확인 습관', dueDate: new Date(Date.now() - 86400000 * 21).toISOString(), isCompleted: true, weight: 2 },
        { id: 'm4', title: '4주차: 대체 레시피 활용', dueDate: new Date(Date.now() - 86400000 * 14).toISOString(), isCompleted: true, weight: 2 },
        { id: 'm5', title: '최종: 30일 무설탕 완료', dueDate: new Date(Date.now() - 86400000 * 10).toISOString(), isCompleted: true, weight: 3 },
    ],
    logs: [
        {
            id: 'l1',
            date: new Date(Date.now() - 86400000 * 35).toISOString(),
            milestoneTitle: '1주차: 음료수 끊기',
            image: 'https://images.unsplash.com/photo-1543536448-d209d2d15a1c?auto=format&fit=crop&q=80&w=800',
            answers: { q1: '...', q2: '...', q3: '...', q4: '...', q5: '...', q6: '...', q7: '...' }
        }
    ],
    votes: { star1: 2, star2: 3, star3: 10, star4: 30, star5: 110 },
    likes: 90,
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString()
  },
  {
    userId: 'u_s2',
    user: { id: 'u_s2', name: '박독서', avatar: 'https://picsum.photos/seed/s2/100/100', bio: '책 속에 길이 있다', followers: [], following: [] },
    title: '개발 필독서 3권 완독하기',
    description: '클린 코드, 리팩토링, 디자인 패턴 3권을 완독하고 블로그에 서평을 남기는 것이 목표입니다.',
    images: ['https://picsum.photos/seed/book/800/400'],
    categories: [Category.STUDY, Category.CAREER],
    hashtags: ['#독서', '#개발자', '#성장'],
    startDate: new Date(Date.now() - 86400000 * 60).toISOString(),
    endDate: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: PlanStatus.COMPLETED_SUCCESS,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `ms${i}`, title: `마일스톤 ${i+1}`, dueDate: new Date().toISOString(), isCompleted: true, weight: 2 })),
    logs: [],
    votes: { star1: 1, star2: 0, star3: 5, star4: 15, star5: 70 },
    likes: 65,
    createdAt: new Date(Date.now() - 86400000 * 65).toISOString()
  },
  {
    userId: 'u_s3',
    user: { id: 'u_s3', name: '이새벽', avatar: 'https://picsum.photos/seed/s3/100/100', bio: '아침을 지배하는 자', followers: [], following: [] },
    title: '미라클 모닝 66일 챌린지',
    description: '매일 새벽 5시에 기상하여 명상과 스트레칭으로 하루를 시작합니다.',
    images: ['https://picsum.photos/seed/morning/800/400'],
    categories: [Category.LIFESTYLE],
    hashtags: ['#미라클모닝', '#습관', '#새벽'],
    startDate: new Date(Date.now() - 86400000 * 70).toISOString(),
    endDate: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: PlanStatus.COMPLETED_SUCCESS,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `ms${i}`, title: `단계 ${i+1}`, dueDate: new Date().toISOString(), isCompleted: true, weight: 2 })),
    logs: [],
    votes: { star1: 5, star2: 5, star3: 20, star4: 50, star5: 130 },
    likes: 120,
    createdAt: new Date(Date.now() - 86400000 * 75).toISOString()
  },
  {
    userId: 'u_s4',
    user: { id: 'u_s4', name: '최바디', avatar: 'https://picsum.photos/seed/s4/100/100', bio: '건강한 신체에 건전한 정신', followers: [], following: [] },
    title: '체지방 10% 만들기 바디프로필',
    description: '3개월간 철저한 식단과 운동으로 바디프로필 촬영에 성공했습니다.',
    images: ['https://picsum.photos/seed/body/800/400'],
    categories: [Category.FITNESS],
    hashtags: ['#바디프로필', '#헬스', '#식단'],
    startDate: new Date(Date.now() - 86400000 * 100).toISOString(),
    endDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    status: PlanStatus.COMPLETED_SUCCESS,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `ms${i}`, title: `감량 ${i+1}단계`, dueDate: new Date().toISOString(), isCompleted: true, weight: 3 })),
    logs: [],
    votes: { star1: 10, star2: 10, star3: 20, star4: 60, star5: 220 },
    likes: 250,
    createdAt: new Date(Date.now() - 86400000 * 105).toISOString()
  },
  {
    userId: 'u_s5',
    user: { id: 'u_s5', name: '정코딩', avatar: 'https://picsum.photos/seed/s5/100/100', bio: '1일 1커밋', followers: [], following: [] },
    title: '알고리즘 문제 100개 풀기',
    description: '코딩 테스트 대비를 위해 백준/프로그래머스 문제 100개를 풀고 깃허브에 정리했습니다.',
    images: ['https://picsum.photos/seed/code/800/400'],
    categories: [Category.CAREER, Category.STUDY],
    hashtags: ['#코딩테스트', '#알고리즘', '#취업'],
    startDate: new Date(Date.now() - 86400000 * 50).toISOString(),
    endDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: PlanStatus.COMPLETED_SUCCESS,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `ms${i}`, title: `레벨 ${i+1} 달성`, dueDate: new Date().toISOString(), isCompleted: true, weight: 2 })),
    logs: [],
    votes: { star1: 2, star2: 3, star3: 10, star4: 40, star5: 60 },
    likes: 70,
    createdAt: new Date(Date.now() - 86400000 * 55).toISOString()
  },
  // Active Plans (15 items)
  {
    userId: 'u_a1',
    user: { id: 'u_a1', name: '강철수', avatar: 'https://picsum.photos/seed/a1/100/100', bio: '런닝맨', followers: [], following: [] },
    title: '매일 아침 5km 러닝 30일',
    description: '비가 오나 눈이 오나 매일 아침 달립니다. 체력을 기르고 상쾌한 아침을 맞이하고 싶습니다.',
    images: ['https://picsum.photos/seed/run2/800/400'],
    categories: [Category.FITNESS],
    hashtags: ['#러닝', '#오운완', '#유산소'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `${i+1}주차 목표 달성`, dueDate: new Date().toISOString(), isCompleted: i < 2, weight: 2 })),
    logs: [],
    votes: { star1: 1, star2: 2, star3: 5, star4: 10, star5: 30 },
    likes: 20,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    userId: 'u_a2',
    user: { id: 'u_a2', name: '김요가', avatar: 'https://picsum.photos/seed/a2/100/100', bio: '유연한 마음', followers: [], following: [] },
    title: '하루 20분 요가 수련',
    description: '뻣뻣한 몸을 유연하게 만들고 마음의 평화를 찾기 위한 여정입니다.',
    images: ['https://picsum.photos/seed/yoga/800/400'],
    categories: [Category.FITNESS, Category.LIFESTYLE],
    hashtags: ['#요가', '#스트레칭', '#힐링'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 60).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `수련 ${i+1}단계`, dueDate: new Date().toISOString(), isCompleted: i < 1, weight: 2 })),
    logs: [],
    votes: { star1: 0, star2: 1, star3: 5, star4: 5, star5: 20 },
    likes: 15,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    userId: 'u_a3',
    user: { id: 'u_a3', name: '박근육', avatar: 'https://picsum.photos/seed/a3/100/100', bio: '득근득근', followers: [], following: [] },
    title: '3대 500 달성 프로젝트',
    description: '현재 3대 400입니다. 3달 안에 500kg 달성하겠습니다.',
    images: ['https://picsum.photos/seed/gym/800/400'],
    categories: [Category.FITNESS],
    hashtags: ['#헬스', '#웨이트', '#3대500'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 90).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(6).fill(null).map((_, i) => ({ id: `m${i}`, title: `증량 목표 ${i+1}`, dueDate: new Date().toISOString(), isCompleted: false, weight: 3 })),
    logs: [],
    votes: { star1: 5, star2: 10, star3: 20, star4: 40, star5: 60 },
    likes: 50,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    userId: 'u_a4',
    user: { id: 'u_a4', name: '이영어', avatar: 'https://picsum.photos/seed/a4/100/100', bio: '글로벌 인재', followers: [], following: [] },
    title: '토익 900점 돌파하기',
    description: '취업을 위한 필수 관문, 이번 방학에 끝냅니다. 매일 모의고사 1회 풀기!',
    images: ['https://picsum.photos/seed/toeic/800/400'],
    categories: [Category.STUDY],
    hashtags: ['#토익', '#영어', '#취업'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 45).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `점수대별 공략 ${i+1}`, dueDate: new Date().toISOString(), isCompleted: i < 2, weight: 2 })),
    logs: [],
    votes: { star1: 1, star2: 4, star3: 10, star4: 20, star5: 30 },
    likes: 25,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    userId: 'u_a5',
    user: { id: 'u_a5', name: '최일어', avatar: 'https://picsum.photos/seed/a5/100/100', bio: '일본 여행 가자', followers: [], following: [] },
    title: '일본어 회화 기초 떼기',
    description: '애니메이션을 자막 없이 보는 그날까지! 쉐도잉 연습 매일 30분.',
    images: ['https://picsum.photos/seed/japan/800/400'],
    categories: [Category.STUDY, Category.HOBBY],
    hashtags: ['#일본어', '#회화', '#쉐도잉'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 60).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `챕터 ${i+1} 완료`, dueDate: new Date().toISOString(), isCompleted: false, weight: 1 })),
    logs: [],
    votes: { star1: 0, star2: 2, star3: 5, star4: 15, star5: 20 },
    likes: 18,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString()
  },
  {
    userId: 'u_a6',
    user: { id: 'u_a6', name: '정포트', avatar: 'https://picsum.photos/seed/a6/100/100', bio: '디자이너', followers: [], following: [] },
    title: 'UX/UI 포트폴리오 완성',
    description: '이직을 위한 포트폴리오 리뉴얼. 프로젝트 3개 정리하고 웹사이트 배포하기.',
    images: ['https://picsum.photos/seed/uxui/800/400'],
    categories: [Category.CAREER],
    hashtags: ['#포트폴리오', '#디자인', '#이직'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `프로젝트 ${i+1} 정리`, dueDate: new Date().toISOString(), isCompleted: i < 1, weight: 3 })),
    logs: [],
    votes: { star1: 0, star2: 0, star3: 5, star4: 20, star5: 50 },
    likes: 40,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    userId: 'u_a7',
    user: { id: 'u_a7', name: '한마케팅', avatar: 'https://picsum.photos/seed/a7/100/100', bio: '마케터', followers: [], following: [] },
    title: 'GA4 자격증 취득하기',
    description: '데이터 분석 능력을 키우기 위해 GAIQ 시험에 도전합니다.',
    images: ['https://picsum.photos/seed/ga4/800/400'],
    categories: [Category.CAREER, Category.STUDY],
    hashtags: ['#마케팅', '#데이터', '#자격증'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 14).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `모듈 ${i+1} 학습`, dueDate: new Date().toISOString(), isCompleted: false, weight: 2 })),
    logs: [],
    votes: { star1: 0, star2: 1, star3: 5, star4: 10, star5: 10 },
    likes: 10,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString()
  },
  {
    userId: 'u_a8',
    user: { id: 'u_a8', name: '윤피아노', avatar: 'https://picsum.photos/seed/a8/100/100', bio: '음악을 사랑해요', followers: [], following: [] },
    title: '피아노 곡 한 곡 마스터하기',
    description: '이루마의 River Flows in You를 완벽하게 연주하고 영상으로 남기겠습니다.',
    images: ['https://picsum.photos/seed/piano/800/400'],
    categories: [Category.HOBBY],
    hashtags: ['#피아노', '#음악', '#연주'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `구간 ${i+1} 연습`, dueDate: new Date().toISOString(), isCompleted: i < 2, weight: 2 })),
    logs: [],
    votes: { star1: 0, star2: 0, star3: 5, star4: 15, star5: 30 },
    likes: 35,
    createdAt: new Date(Date.now() - 86400000 * 12).toISOString()
  },
  {
    userId: 'u_a9',
    user: { id: 'u_a9', name: '장베이킹', avatar: 'https://picsum.photos/seed/a9/100/100', bio: '빵순이', followers: [], following: [] },
    title: '매주 주말 새로운 빵 굽기',
    description: '베이킹 초보의 도전! 식빵부터 마카롱까지 정복해보겠습니다.',
    images: ['https://picsum.photos/seed/baking/800/400'],
    categories: [Category.HOBBY, Category.LIFESTYLE],
    hashtags: ['#베이킹', '#취미', '#요리'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 60).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(8).fill(null).map((_, i) => ({ id: `m${i}`, title: `레시피 ${i+1} 성공`, dueDate: new Date().toISOString(), isCompleted: i < 3, weight: 1 })),
    logs: [],
    votes: { star1: 1, star2: 1, star3: 5, star4: 20, star5: 40 },
    likes: 45,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString()
  },
  {
    userId: 'u_a10',
    user: { id: 'u_a10', name: '오캠핑', avatar: 'https://picsum.photos/seed/a10/100/100', bio: '자연인', followers: [], following: [] },
    title: '전국 캠핑장 도장깨기',
    description: '주말마다 떠나는 힐링 캠핑. 5군데 명소를 방문하고 기록을 남깁니다.',
    images: ['https://picsum.photos/seed/camping/800/400'],
    categories: [Category.HOBBY, Category.LIFESTYLE],
    hashtags: ['#캠핑', '#여행', '#힐링'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 60).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `캠핑장 ${i+1} 방문`, dueDate: new Date().toISOString(), isCompleted: i < 1, weight: 2 })),
    logs: [],
    votes: { star1: 0, star2: 1, star3: 5, star4: 20, star5: 30 },
    likes: 30,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    userId: 'u_a11',
    user: { id: 'u_a11', name: '신저축', avatar: 'https://picsum.photos/seed/a11/100/100', bio: '티끌 모아 태산', followers: [], following: [] },
    title: '3달 동안 300만원 모으기',
    description: '불필요한 지출을 줄이고 부업을 통해 시드머니를 만듭니다.',
    images: ['https://picsum.photos/seed/money/800/400'],
    categories: [Category.LIFESTYLE],
    hashtags: ['#저축', '#재테크', '#절약'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 90).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `${i+1}00만원 달성`, dueDate: new Date().toISOString(), isCompleted: false, weight: 3 })),
    logs: [],
    votes: { star1: 5, star2: 5, star3: 10, star4: 30, star5: 40 },
    likes: 40,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    userId: 'u_a12',
    user: { id: 'u_a12', name: '권금연', avatar: 'https://picsum.photos/seed/a12/100/100', bio: '건강 챙기자', followers: [], following: [] },
    title: '올해는 꼭 금연 성공',
    description: '나와 가족의 건강을 위해 담배를 끊습니다. 금단현상을 이겨내는 과정을 기록합니다.',
    images: ['https://picsum.photos/seed/smoke/800/400'],
    categories: [Category.LIFESTYLE],
    hashtags: ['#금연', '#건강', '#도전'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 100).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `${i+1}단계 금연 유지`, dueDate: new Date().toISOString(), isCompleted: i < 1, weight: 3 })),
    logs: [],
    votes: { star1: 2, star2: 3, star3: 10, star4: 40, star5: 100 },
    likes: 100,
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString()
  },
  {
    userId: 'u_a13',
    user: { id: 'u_a13', name: '허일기', avatar: 'https://picsum.photos/seed/a13/100/100', bio: '기록하는 삶', followers: [], following: [] },
    title: '매일 감사일기 쓰기',
    description: '하루 3가지 감사한 일을 적으며 긍정적인 마인드를 기릅니다.',
    images: ['https://picsum.photos/seed/diary/800/400'],
    categories: [Category.LIFESTYLE],
    hashtags: ['#일기', '#멘탈관리', '#감사'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `${i+1}주차 완료`, dueDate: new Date().toISOString(), isCompleted: i < 3, weight: 1 })),
    logs: [],
    votes: { star1: 0, star2: 0, star3: 5, star4: 15, star5: 20 },
    likes: 25,
    createdAt: new Date(Date.now() - 86400000 * 20).toISOString()
  },
  {
    userId: 'u_a14',
    user: { id: 'u_a14', name: '서정리', avatar: 'https://picsum.photos/seed/a14/100/100', bio: '심플 라이프', followers: [], following: [] },
    title: '하루 하나 물건 비우기 (미니멀리즘)',
    description: '물건에 집착하지 않고 가벼운 삶을 살기 위해 30일간 비움 챌린지를 합니다.',
    images: ['https://picsum.photos/seed/minimal/800/400'],
    categories: [Category.LIFESTYLE],
    hashtags: ['#미니멀리즘', '#정리', '#청소'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `${i+1}주차 비움 실천`, dueDate: new Date().toISOString(), isCompleted: false, weight: 2 })),
    logs: [],
    votes: { star1: 1, star2: 2, star3: 10, star4: 20, star5: 25 },
    likes: 30,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    userId: 'u_a15',
    user: { id: 'u_a15', name: '남요리', avatar: 'https://picsum.photos/seed/a15/100/100', bio: '집밥 김선생', followers: [], following: [] },
    title: '배달음식 끊고 집밥 해먹기',
    description: '식비 절약과 건강을 위해 일주일 5일 이상 직접 요리합니다.',
    images: ['https://picsum.photos/seed/cook/800/400'],
    categories: [Category.LIFESTYLE, Category.HOBBY],
    hashtags: ['#집밥', '#요리', '#식비절약'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ id: `m${i}`, title: `${i+1}주차 집밥 달성`, dueDate: new Date().toISOString(), isCompleted: i < 1, weight: 2 })),
    logs: [],
    votes: { star1: 2, star2: 3, star3: 10, star4: 35, star5: 45 },
    likes: 60,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString()
  }
];

// Helper to calculate weighted progress
const calculateProgress = (milestones: Plan['milestones']) => {
    if (!milestones || milestones.length === 0) return 0;
    
    const totalWeight = milestones.reduce((sum, m) => sum + (m.weight || 2), 0); 
    if (totalWeight === 0) return 0;

    const completedWeight = milestones
        .filter(m => m.isCompleted)
        .reduce((sum, m) => sum + (m.weight || 2), 0);

    return Math.round((completedWeight / totalWeight) * 100);
};

// Helper to calculate total votes count
const getTotalVotes = (votes: VoteStats) => {
    return votes.star1 + votes.star2 + votes.star3 + votes.star4 + votes.star5;
};

export const initializeDemoData = async () => {
  try {
    // 1. Ensure Admin Account
    await ensureAdminExists();

    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    // 2. Seed Users INDEPENDENTLY
    if (usersSnapshot.size < 5) {
        console.log("Seeding Demo Users...");
        const usersToSeed: Record<string, User> = {};
        DEMO_PLANS.forEach(plan => {
            if (!usersToSeed[plan.userId]) {
                usersToSeed[plan.userId] = plan.user;
            }
        });

        for (const [userId, user] of Object.entries(usersToSeed)) {
            const userDocRef = doc(db, 'users', userId);
            await setDoc(userDocRef, {
                ...user,
                email: `user${userId}@example.com`,
                password: '1234',
                followers: user.followers || [],
                following: user.following || []
            });
        }
        console.log(`Seeded ${Object.keys(usersToSeed).length} Demo Users.`);
    }

    const plansRef = collection(db, 'plans');
    const groupsRef = collection(db, 'groups');
    
    const plansSnapshot = await getDocs(plansRef);
    const groupsSnapshot = await getDocs(groupsRef);
    
    if (plansSnapshot.empty) {
      console.log("Seeding Demo Plans...");
      
      // 3. Create Plans
      const planIds: string[] = [];
      for (const planData of DEMO_PLANS) {
        const docRef = await addDoc(plansRef, { ...planData, createdAt: new Date().toISOString() }); 
        planIds.push(docRef.id);
      }
      console.log(`Created ${planIds.length} demo plans.`);

      // 4. Create Groups
      const demoGroups: Omit<GroupChallenge, 'id'>[] = [
        {
            title: '새벽 러닝 크루 1기',
            description: '혼자 뛰기 힘드셨나요? 함께 달리며 서로의 페이스메이커가 되어주세요!',
            image: 'https://picsum.photos/seed/groupRun/800/400',
            category: Category.FITNESS,
            participants: [
                { user: DEMO_PLANS[5].user, planId: planIds[5], progress: 0, status: PlanStatus.ACTIVE, endDate: DEMO_PLANS[5].endDate }, 
                { user: DEMO_PLANS[7].user, planId: planIds[7], progress: 0, status: PlanStatus.ACTIVE, endDate: DEMO_PLANS[7].endDate } 
            ]
        },
        {
            title: '갓생 살기 프로젝트: 자격증 편',
            description: '각자의 자리에서 자격증 취득을 목표로 달리는 스터디 그룹입니다.',
            image: 'https://picsum.photos/seed/groupStudy/800/400',
            category: Category.STUDY,
            participants: [
                { user: DEMO_PLANS[8].user, planId: planIds[8], progress: 0, status: PlanStatus.ACTIVE, endDate: DEMO_PLANS[8].endDate },
                { user: DEMO_PLANS[11].user, planId: planIds[11], progress: 0, status: PlanStatus.ACTIVE, endDate: DEMO_PLANS[11].endDate }
            ]
        }
      ];

      for (const group of demoGroups) {
          await addDoc(groupsRef, group);
      }
      console.log("Demo Groups created.");
      
    } else {
       // Patch existing plans logic if needed
    }
  } catch (e) {
    console.error("Error initializing demo data:", e);
  }
};

export const createPlan = async (planData: Omit<Plan, 'id' | 'createdAt' | 'votes' | 'likes' | 'logs' | 'status'>) => {
  const newPlanData = {
    ...planData,
    status: PlanStatus.ACTIVE,
    logs: [],
    votes: { star1: 0, star2: 0, star3: 0, star4: 0, star5: 0 },
    likes: 0,
    createdAt: new Date().toISOString()
  };
  
  const docRef = await addDoc(collection(db, 'plans'), newPlanData);
  return docRef.id;
};

export const getPlans = async (sortBy: 'popular' | 'new' = 'new') => {
  const plansRef = collection(db, 'plans');
  const snapshot = await getDocs(plansRef);
  const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));

  if (sortBy === 'new') {
    return plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    return plans.sort((a, b) => {
        const scoreA = a.likes + getTotalVotes(a.votes);
        const scoreB = b.likes + getTotalVotes(b.votes);
        return scoreB - scoreA;
    });
  }
};

export const getUserPlans = async (userId: string): Promise<Plan[]> => {
  const plansRef = collection(db, 'plans');
  const q = query(plansRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
  
  return plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getPlansByCategory = async (category: Category) => {
    const plansRef = collection(db, 'plans');
    const snapshot = await getDocs(plansRef);
    const allPlans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
    
    return allPlans.filter(p => p.categories.includes(category)).sort((a, b) => {
        if (a.status === PlanStatus.COMPLETED_SUCCESS && b.status !== PlanStatus.COMPLETED_SUCCESS) return -1;
        if (b.status === PlanStatus.COMPLETED_SUCCESS && a.status !== PlanStatus.COMPLETED_SUCCESS) return 1;
        return (b.likes + getTotalVotes(b.votes)) - (a.likes + getTotalVotes(a.votes));
    });
};

export const subscribeToAllPlans = (
  sortBy: 'popular' | 'new',
  callback: (plans: Plan[]) => void
) => {
  const q = query(collection(db, 'plans')); 
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const plans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Plan));
    
    if (sortBy === 'new') {
       plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
       plans.sort((a, b) => (b.likes + getTotalVotes(b.votes)) - (a.likes + getTotalVotes(a.votes)));
    }
    callback(plans);
  });
  
  return unsubscribe;
};

export const getPlanById = async (planId: string): Promise<Plan | null> => {
  const docRef = doc(db, 'plans', planId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Plan;
  }
  return null;
};

export const subscribeToPlan = (planId: string, callback: (plan: Plan | null) => void) => {
  const docRef = doc(db, 'plans', planId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Plan);
    } else {
      callback(null);
    }
  });
};

export const voteForPlan = async (planId: string, rating: number) => {
  if (rating < 1 || rating > 5) return;

  const planRef = doc(db, 'plans', planId);
  const planSnap = await getDoc(planRef);
  
  if (planSnap.exists()) {
      const plan = planSnap.data() as Plan;
      const votes = plan.votes || { star1: 0, star2: 0, star3: 0, star4: 0, star5: 0 };
      
      // Type assertion for dynamic access
      const key = `star${rating}` as keyof VoteStats;
      votes[key] = (votes[key] || 0) + 1;
      
      await updateDoc(planRef, { votes });
  }
};

export const updateMilestoneStatus = async (planId: string, milestones: Plan['milestones']) => {
  const planRef = doc(db, 'plans', planId);
  await updateDoc(planRef, { milestones });
};

export const addProgressLog = async (planId: string, log: ProgressLog) => {
  const planRef = doc(db, 'plans', planId);
  await updateDoc(planRef, {
    logs: arrayUnion(log)
  });
};

export const getGroupChallenges = async (): Promise<GroupChallenge[]> => {
  const groupsRef = collection(db, 'groups');
  const snapshot = await getDocs(groupsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GroupChallenge));
};

export const getGroupChallengeById = async (groupId: string): Promise<GroupChallenge | null> => {
  const docRef = doc(db, 'groups', groupId);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as GroupChallenge;
  }
  return null;
};

export const getTopTagsByCategory = async (category: Category): Promise<string[]> => {
  const plans = await getPlansByCategory(category);
  const tagCounts: Record<string, number> = {};

  plans.forEach(p => {
    p.hashtags.forEach(tag => {
      const normalizedTag = tag.replace('#', '').trim();
      if (normalizedTag) {
        tagCounts[normalizedTag] = (tagCounts[normalizedTag] || 0) + 1;
      }
    });
  });

  const sortedTags = Object.entries(tagCounts)
    .sort(([, countA], [, countB]) => countB - countA)
    .map(([tag]) => tag);

  const DEFAULT_TAGS: Record<Category, string[]> = {
    [Category.FITNESS]: ['러닝', '헬스', '요가', '다이어트', '홈트'],
    [Category.STUDY]: ['영어', '자격증', '코딩', '독서', '입시'],
    [Category.CAREER]: ['이직', '포트폴리오', '프로젝트', '외국어', '자소서'],
    [Category.HOBBY]: ['요리', '그림', '악기', '글쓰기', '사진'],
    [Category.LIFESTYLE]: ['미라클모닝', '저축', '금연', '미니멀리즘', '멘탈관리']
  };

  if (sortedTags.length < 3) {
    const defaults = DEFAULT_TAGS[category] || [];
    const merged = new Set([...sortedTags, ...defaults]);
    return Array.from(merged).slice(0, 5);
  }

  return sortedTags.slice(0, 5);
};
