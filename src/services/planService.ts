
import { Plan, PlanStatus, ProgressLog, Category } from '../types';

// Mock Data Store (In-Memory)
let plans: Plan[] = [
  {
    id: 'p1',
    userId: 'u1',
    user: { id: 'u1', name: '김철수', avatar: 'https://picsum.photos/seed/u1/100/100', bio: '열정맨' },
    title: '30일 동안 매일 아침 러닝하기',
    description: '건강을 위해 매일 아침 6시에 기상하여 5km를 달립니다. 비가 오나 눈이 오나 멈추지 않습니다!',
    images: ['https://picsum.photos/seed/run/800/400'],
    categories: [Category.FITNESS],
    hashtags: ['#러닝', '#오운완', '#미라클모닝'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: [
      { id: 'm1', title: '1주차: 습관 형성하기', dueDate: new Date().toISOString(), isCompleted: true },
      { id: 'm2', title: '2주차: 거리 늘리기', dueDate: new Date().toISOString(), isCompleted: false },
      { id: 'm3', title: '3주차: 페이스 조절', dueDate: new Date().toISOString(), isCompleted: false },
      { id: 'm4', title: '4주차: 마지막 스퍼트', dueDate: new Date().toISOString(), isCompleted: false },
      { id: 'm5', title: '완주 및 기록 측정', dueDate: new Date().toISOString(), isCompleted: false },
    ],
    logs: [],
    votes: { canDoIt: 42, cannotDoIt: 5 },
    likes: 15,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: 'p2',
    userId: 'u2',
    user: { id: 'u2', name: '이영희', avatar: 'https://picsum.photos/seed/u2/100/100', bio: '공부하는 직장인' },
    title: '일본어 JLPT N3 합격하기',
    description: '올해 마지막 시험에 꼭 합격하고 싶습니다. 매일 단어 50개 암기와 문법 1챕터씩 공부할 예정입니다.',
    images: ['https://picsum.photos/seed/study/800/400'],
    categories: [Category.STUDY],
    hashtags: ['#일본어', '#자격증', '#공부'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 60).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: [
        { id: 'm1', title: '기초 단어 마스터', dueDate: new Date().toISOString(), isCompleted: true },
        { id: 'm2', title: '문법 1회독', dueDate: new Date().toISOString(), isCompleted: true },
        { id: 'm3', title: '청해 연습 시작', dueDate: new Date().toISOString(), isCompleted: false },
        { id: 'm4', title: '기출문제 풀이', dueDate: new Date().toISOString(), isCompleted: false },
        { id: 'm5', title: '최종 리허설', dueDate: new Date().toISOString(), isCompleted: false },
    ],
    logs: [
        {
            id: 'l1',
            date: new Date().toISOString(),
            intervalIndex: 1,
            answers: {
                q1: '퇴근 후 공부하는 게 체력적으로 힘들었다.',
                q2: '생각보다 한자가 너무 많아서 당황했다.',
                q3: '단어장 1권을 끝냈다.',
                q4: '지하철 출퇴근 시간을 활용한 덕분이다.',
                q5: '주말에 몰아서 하는 습관을 고쳐야겠다.',
                q6: '평일 아침 시간을 조금 더 활용해보자.',
                q7: '포기하지 말고 끝까지 가보자!'
            }
        }
    ],
    votes: { canDoIt: 88, cannotDoIt: 2 },
    likes: 30,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  }
];

// Simple event emitter to simulate real-time updates
type Listener = () => void;
const listeners: Set<Listener> = new Set();

const notifyListeners = () => {
  listeners.forEach(l => l());
};

export const createPlan = async (planData: Omit<Plan, 'id' | 'createdAt' | 'votes' | 'likes' | 'logs' | 'status'>) => {
  const newPlan: Plan = {
    id: `p${Date.now()}`,
    ...planData,
    status: PlanStatus.ACTIVE,
    logs: [],
    votes: { canDoIt: 0, cannotDoIt: 0 },
    likes: 0,
    createdAt: new Date().toISOString()
  };
  
  plans = [newPlan, ...plans];
  notifyListeners();
  return newPlan.id;
};

export const getPlans = async (sortBy: 'popular' | 'new' = 'new') => {
  const sorted = [...plans];
  if (sortBy === 'new') {
    return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    return sorted.sort((a, b) => {
        const scoreA = a.likes + a.votes.canDoIt + a.votes.cannotDoIt;
        const scoreB = b.likes + b.votes.canDoIt + b.votes.cannotDoIt;
        return scoreB - scoreA;
    });
  }
};

export const subscribeToAllPlans = (
  sortBy: 'popular' | 'new',
  callback: (plans: Plan[]) => void
) => {
  const handler = () => {
    const sorted = [...plans];
    if (sortBy === 'new') {
       sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
       sorted.sort((a, b) => (b.likes + b.votes.canDoIt + b.votes.cannotDoIt) - (a.likes + a.votes.canDoIt + a.votes.cannotDoIt));
    }
    callback(sorted);
  };
  
  listeners.add(handler);
  handler(); // Initial call
  
  return () => {
    listeners.delete(handler);
  };
};

export const getPlanById = async (id: string): Promise<Plan | null> => {
  return plans.find(p => p.id === id) || null;
};

export const subscribeToPlan = (id: string, callback: (plan: Plan | null) => void) => {
  const handler = () => {
    const plan = plans.find(p => p.id === id) || null;
    callback(plan ? { ...plan } : null);
  };
  listeners.add(handler);
  handler();
  return () => listeners.delete(handler);
};

export const voteForPlan = async (planId: string, voteType: 'yes' | 'no') => {
  const plan = plans.find(p => p.id === planId);
  if (plan) {
    if (voteType === 'yes') plan.votes.canDoIt++;
    else plan.votes.cannotDoIt++;
    notifyListeners();
  }
};

export const addProgressLog = async (planId: string, log: ProgressLog) => {
  const plan = plans.find(p => p.id === planId);
  if (plan) {
    plan.logs.push(log);
    notifyListeners();
  }
};

export const updateMilestoneStatus = async (planId: string, milestones: Plan['milestones']) => {
  const plan = plans.find(p => p.id === planId);
  if (plan) {
    plan.milestones = milestones;
    notifyListeners();
  }
};
