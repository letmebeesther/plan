


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
  arrayUnion,
  arrayRemove,
  writeBatch,
  increment
} from 'firebase/firestore';
import { Plan, PlanStatus, ProgressLog, Category, GroupChallenge, User, Milestone } from '../types';
import { ensureAdminExists } from './authService';

// --- HELPER FUNCTIONS ---

export const calculateWeightedProgress = (plan: Plan): number => {
    if (!plan.milestones || plan.milestones.length === 0) return 0;
    const totalWeight = plan.milestones.reduce((sum, m) => sum + (m.weight || 2), 0);
    if (totalWeight === 0) return 0;
    
    // Credibility Weighted Progress?
    // The prompt says "Completed Milestone Criteria: Evidence (20% or 80%)".
    // But also "Goal Achievement Rate: Higher ratio of completed milestones increases rate".
    // To keep the UI intuitive, we calculate progress based on Weight Completion.
    // The "20% vs 80%" is treated as a Credibility/Trust factor displayed separately,
    // or implicit in the final "Success" judgement. 
    // Here we stick to weight-based progress for the bar.
    
    const completedWeight = plan.milestones
      .filter(m => m.isCompleted)
      .reduce((sum, m) => sum + (m.weight || 2), 0);
      
    return Math.round((completedWeight / totalWeight) * 100);
};

export const calculateUserTrustScore = (user: User, userPlans: Plan[]): number => {
    // Rule: 70% based on Goal Achievement Rate (Success History), 30% based on Face Verification.
    
    const completedPlans = userPlans.filter(p => 
        p.status === PlanStatus.COMPLETED_SUCCESS || 
        p.status === PlanStatus.COMPLETED_FAIL ||
        p.status === PlanStatus.FAILED_BY_ABANDONMENT
    );

    // 1. Success Rate Score (Max 70)
    let historyScore = 0;
    if (completedPlans.length > 0) {
        const successCount = completedPlans.filter(p => p.status === PlanStatus.COMPLETED_SUCCESS).length;
        const successRate = successCount / completedPlans.length; // 0.0 to 1.0
        historyScore = Math.round(successRate * 70);
    }

    // 2. Face Verification Score (Max 30)
    const faceScore = user.isFaceVerified ? 30 : 0;

    // Base score for new users with face ID could be 30.
    return historyScore + faceScore;
};

export const calculatePopularityScore = (plan: Plan): number => {
    // Rule:
    // Likes (Plan + Milestones) : 20%
    // Goal Achievement Rate : 40%
    // User Trust Score : 40%

    // 1. Likes Score (Max 20 points)
    // We assume a "high" like count is 50 for normalization purposes.
    const milestoneLikes = plan.milestones.reduce((sum, m) => sum + (m.likes || 0), 0);
    const totalLikes = plan.likes + milestoneLikes;
    const likeScore = Math.min((totalLikes / 50) * 20, 20);

    // 2. Progress Score (Max 40 points)
    const progress = calculateWeightedProgress(plan);
    const progressScore = (progress / 100) * 40;

    // 3. Trust Score (Max 40 points)
    // user.trustScore is 0-100. Map to 0-40.
    const trustScore = (plan.user.trustScore / 100) * 40;

    return Math.round(likeScore + progressScore + trustScore);
};

// --- DEMO DATA ---
const DEMO_PLANS: Omit<Plan, 'id'>[] = [
  // Success Stories
  {
    userId: 'u_s1',
    user: { id: 'u_s1', name: '김성공', avatar: 'https://picsum.photos/seed/s1/100/100', bio: '작은 성공이 모여 큰 성공을 만든다', followers: [], following: [], trustScore: 95, isFaceVerified: true },
    title: '한 달 동안 설탕 끊기 도전',
    description: '건강을 위해 가공된 설탕 섭취를 30일간 중단했습니다. 탄산음료, 과자, 초콜릿을 끊고 대체 당을 활용했습니다.',
    images: ['https://picsum.photos/seed/sugar/800/400'],
    categories: [Category.LIFESTYLE, Category.FITNESS],
    hashtags: ['#노슈가', '#건강', '#다이어트'],
    startDate: new Date(Date.now() - 86400000 * 40).toISOString(),
    endDate: new Date(Date.now() - 86400000 * 10).toISOString(),
    status: PlanStatus.COMPLETED_SUCCESS,
    milestones: [
        { id: 'm1', title: '1주차: 음료수 끊기', dueDate: new Date(Date.now() - 86400000 * 35).toISOString(), isCompleted: true, weight: 1, likes: 5, verificationType: 'PHOTO_TEXT' },
        { id: 'm2', title: '2주차: 군것질 끊기', dueDate: new Date(Date.now() - 86400000 * 28).toISOString(), isCompleted: true, weight: 2, likes: 5, verificationType: 'PHOTO_TEXT' },
        { id: 'm3', title: '3주차: 성분표 확인 습관', dueDate: new Date(Date.now() - 86400000 * 21).toISOString(), isCompleted: true, weight: 2, likes: 4, verificationType: 'OFFICIAL_BIOMETRIC' },
        { id: 'm4', title: '4주차: 대체 레시피 활용', dueDate: new Date(Date.now() - 86400000 * 14).toISOString(), isCompleted: true, weight: 2, likes: 3, verificationType: 'PHOTO_TEXT' },
        { id: 'm5', title: '최종: 30일 무설탕 완료', dueDate: new Date(Date.now() - 86400000 * 10).toISOString(), isCompleted: true, weight: 3, likes: 5, verificationType: 'OFFICIAL_BIOMETRIC' },
    ],
    logs: [
        {
            id: 'l1',
            date: new Date(Date.now() - 86400000 * 10).toISOString(),
            milestoneTitle: '최종: 30일 무설탕 완료',
            image: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80&w=800',
            verificationType: 'OFFICIAL_BIOMETRIC',
            answers: { 
                q1: '초반에 달달한 라떼를 못 마시는 게 가장 힘들었습니다.', 
                q2: '생각보다 편의점에 설탕 없는 음식이 거의 없다는 것에 놀랐습니다.', 
                q3: '피부가 눈에 띄게 좋아졌고, 아침에 일어날 때 개운합니다.', 
                q4: '대체당(알룰로스)을 활용한 홈카페 레시피 덕분입니다.', 
                q5: '앞으로는 과일의 당도 조금 조절해보려 합니다.', 
                q6: '건강한 간식 도시락을 싸가지고 다닐 예정입니다.', 
                q7: '여러분도 딱 2주만 참아보세요. 몸이 달라집니다!' 
            }
        }
    ],
    likes: 155,
    likedBy: [],
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString()
  },
  {
    userId: 'u_a1',
    user: { id: 'u_a1', name: '강철수', avatar: 'https://picsum.photos/seed/a1/100/100', bio: '런닝맨', followers: [], following: [], trustScore: 60, isFaceVerified: false },
    title: '매일 아침 5km 러닝 30일',
    description: '비가 오나 눈이 오나 매일 아침 달립니다.',
    images: ['https://picsum.photos/seed/run2/800/400'],
    categories: [Category.FITNESS],
    hashtags: ['#러닝', '#오운완', '#유산소'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 30).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ 
        id: `m${i}`, 
        title: `${i+1}주차 목표 달성`, 
        dueDate: new Date().toISOString(), 
        isCompleted: i < 2, 
        weight: 2, 
        likes: Math.min(i, 5), 
        verificationType: i < 2 ? 'OFFICIAL_BIOMETRIC' : undefined 
    })),
    logs: [],
    likes: 68,
    likedBy: [],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString()
  },
  {
    userId: 'u_a2',
    user: { id: 'u_a2', name: '김요가', avatar: 'https://picsum.photos/seed/a2/100/100', bio: '유연한 마음', followers: [], following: [], trustScore: 80, isFaceVerified: true },
    title: '하루 20분 요가 수련',
    description: '뻣뻣한 몸을 유연하게 만들고 마음의 평화를 찾기 위한 여정입니다.',
    images: ['https://picsum.photos/seed/yoga/800/400'],
    categories: [Category.FITNESS, Category.LIFESTYLE],
    hashtags: ['#요가', '#스트레칭', '#힐링'],
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 86400000 * 60).toISOString(),
    status: PlanStatus.ACTIVE,
    milestones: Array(5).fill(null).map((_, i) => ({ 
        id: `m${i}`, 
        title: `수련 ${i+1}단계`, 
        dueDate: new Date().toISOString(), 
        isCompleted: i < 1, 
        weight: 2, 
        likes: 0 
    })),
    logs: [],
    likes: 41,
    likedBy: [],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  }
];

export const initializeDemoData = async () => {
  try {
    console.log("Initializing Data...");
    await ensureAdminExists();

    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    if (usersSnapshot.size < 5) {
        console.log("Seeding Demo Users...");
        const usersToSeed: Record<string, User> = {};
        DEMO_PLANS.forEach(plan => {
            if (!usersToSeed[plan.userId]) {
                usersToSeed[plan.userId] = plan.user;
            }
        });

        const batch = writeBatch(db);
        for (const [userId, user] of Object.entries(usersToSeed)) {
            const userDocRef = doc(db, 'users', userId);
            batch.set(userDocRef, {
                ...user,
                email: `user${userId}@example.com`,
                password: '1234',
                followers: user.followers || [],
                following: user.following || []
            });
        }
        await batch.commit();
    }

    const plansRef = collection(db, 'plans');
    
    const plansSnapshot = await getDocs(plansRef);
    
    if (plansSnapshot.empty) {
      console.log("Seeding Demo Plans...");
      const batch = writeBatch(db);
      DEMO_PLANS.forEach((planData) => {
          const newDocRef = doc(plansRef);
          batch.set(newDocRef, { ...planData, createdAt: new Date().toISOString() });
      });
      await batch.commit();
    }
  } catch (e) {
    console.error("Error initializing demo data:", e);
  }
};

export const createPlan = async (planData: Omit<Plan, 'id' | 'createdAt' | 'likes' | 'likedBy' | 'logs' | 'status'>) => {
  const newPlanData = {
    ...planData,
    status: PlanStatus.ACTIVE,
    logs: [],
    likes: 0,
    likedBy: [],
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
    // Popularity logic applied
    return plans.sort((a, b) => calculatePopularityScore(b) - calculatePopularityScore(a));
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
        return calculatePopularityScore(b) - calculatePopularityScore(a);
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
       plans.sort((a, b) => calculatePopularityScore(b) - calculatePopularityScore(a));
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

export const toggleLikePlan = async (planId: string, userId: string) => {
  const planRef = doc(db, 'plans', planId);
  const planSnap = await getDoc(planRef);
  
  if (planSnap.exists()) {
      const plan = planSnap.data() as Plan;
      const likedBy = plan.likedBy || [];
      const isLiked = likedBy.includes(userId);

      if (isLiked) {
        await updateDoc(planRef, {
            likes: increment(-1),
            likedBy: arrayRemove(userId)
        });
      } else {
        await updateDoc(planRef, {
            likes: increment(1),
            likedBy: arrayUnion(userId)
        });
      }
  }
};

export const toggleLikeMilestone = async (planId: string, milestoneIndex: number) => {
    const planRef = doc(db, 'plans', planId);
    const planSnap = await getDoc(planRef);
    
    if (planSnap.exists()) {
        const plan = planSnap.data() as Plan;
        const updatedMilestones = [...plan.milestones];
        
        if (updatedMilestones[milestoneIndex]) {
            const currentLikes = updatedMilestones[milestoneIndex].likes || 0;
            // Max 5 likes per milestone
            if (currentLikes < 5) {
                updatedMilestones[milestoneIndex].likes = currentLikes + 1;
                await updateDoc(planRef, { milestones: updatedMilestones });
            } else {
                // Optional: Allow unlike? For now, just limiting max as per requirement
            }
        }
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
  plans.forEach(p => p.hashtags.forEach(t => {
      const tag = t.replace('#','').trim();
      if(tag) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
  }));
  return Object.entries(tagCounts).sort(([,a],[,b])=>b-a).map(([t])=>t).slice(0,5);
};

export const verifyUserFace = async (userId: string) => {
    // Simulation of face verification
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        isFaceVerified: true,
        // In real app, trigger score recalc here
    });
    // We also need to update the local session if possible, but Profile page handles refreshing
};