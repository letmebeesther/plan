
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  arrayUnion, 
  increment,
  query,
  orderBy,
  DocumentSnapshot
} from 'firebase/firestore';
import { Plan, PlanStatus, ProgressLog } from '../types';

const PLANS_COLLECTION = 'plan';

// Helper to convert Firestore data to Plan type
const convertDocToPlan = (docSnap: DocumentSnapshot): Plan => {
  const data = docSnap.data();
  
  if (!data) {
      return { id: docSnap.id } as any; 
  }

  return {
    id: docSnap.id,
    ...data,
    milestones: Array.isArray(data.milestones) ? data.milestones : [],
    logs: Array.isArray(data.logs) ? data.logs : [],
    votes: data.votes || { canDoIt: 0, cannotDoIt: 0 },
    likes: typeof data.likes === 'number' ? data.likes : 0,
    status: data.status || PlanStatus.ACTIVE,
    images: (Array.isArray(data.images) && data.images.length > 0) ? data.images : ['https://picsum.photos/800/400'],
    user: data.user || { name: 'Unknown', avatar: 'https://picsum.photos/100/100', bio: '' },
    categories: Array.isArray(data.categories) ? data.categories : [],
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : [],
    startDate: data.startDate || new Date().toISOString(),
    endDate: data.endDate || new Date(Date.now() + 86400000 * 30).toISOString(),
    title: data.title || '제목 없음',
    description: data.description || '내용 없음',
    createdAt: data.createdAt || new Date().toISOString()
  } as Plan;
};

// Create a new plan
export const createPlan = async (planData: Omit<Plan, 'id' | 'createdAt' | 'votes' | 'likes' | 'logs' | 'status'>) => {
  try {
    if (!db) throw new Error("Database not initialized");
    
    const newPlan = {
      ...planData,
      status: PlanStatus.ACTIVE,
      logs: [],
      votes: { canDoIt: 0, cannotDoIt: 0 },
      likes: 0,
      createdAt: new Date().toISOString()
    };
    
    const docRef = await addDoc(collection(db, PLANS_COLLECTION), newPlan);
    return docRef.id;
  } catch (error: any) {
    console.error("Error creating plan:", error);
    if (error?.code === 'permission-denied') {
       throw new Error("PERMISSION_DENIED");
    }
    throw error;
  }
};

// Get all plans (static fetch)
export const getPlans = async (sortBy: 'popular' | 'new' = 'new') => {
  try {
    if (!db) return [];
    const q = query(collection(db, PLANS_COLLECTION));
    const querySnapshot = await getDocs(q);
    const plans = querySnapshot.docs.map(convertDocToPlan);
    
    if (sortBy === 'new') {
      return plans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else {
      return plans.sort((a, b) => {
        const scoreA = a.likes + a.votes.canDoIt + a.votes.cannotDoIt;
        const scoreB = b.likes + b.votes.canDoIt + b.votes.cannotDoIt;
        return scoreB - scoreA;
      });
    }
  } catch (error) {
    console.error("Error fetching plans:", error);
    return [];
  }
};

// Subscribe to ALL plans for real-time updates
export const subscribeToAllPlans = (
  sortBy: 'popular' | 'new',
  callback: (plans: Plan[]) => void
) => {
  if (!db) {
      callback([]);
      return () => {};
  }
  
  const q = query(collection(db, PLANS_COLLECTION));

  return onSnapshot(q, (snapshot) => {
    const plans = snapshot.docs.map(convertDocToPlan);
    
    if (sortBy === 'new') {
       plans.sort((a, b) => {
           const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
           const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
           return timeB - timeA;
       });
    } else {
       plans.sort((a, b) => {
         const scoreA = a.likes + a.votes.canDoIt + a.votes.cannotDoIt;
         const scoreB = b.likes + b.votes.canDoIt + b.votes.cannotDoIt;
         return scoreB - scoreA;
       });
    }
    callback(plans);
  }, (error) => {
    console.error("Error subscribing to plans:", error);
  });
};

// Get a single plan by ID
export const getPlanById = async (id: string): Promise<Plan | null> => {
  try {
    if (!db) return null;
    const docRef = doc(db, PLANS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return convertDocToPlan(docSnap);
    }
    return null;
  } catch (error) {
    console.error("Error fetching plan:", error);
    return null;
  }
};

// Subscribe to a single plan
export const subscribeToPlan = (id: string, callback: (plan: Plan | null) => void) => {
  if (!db) {
      callback(null);
      return () => {};
  }
  
  const docRef = doc(db, PLANS_COLLECTION, id);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(convertDocToPlan(docSnap));
    } else {
      callback(null);
    }
  }, (error) => {
      console.error("Subscription error:", error);
      callback(null);
  });
};

// Vote for a plan
export const voteForPlan = async (planId: string, voteType: 'yes' | 'no') => {
  try {
    if (!db) throw new Error("DB not init");
    const docRef = doc(db, PLANS_COLLECTION, planId);
    const field = voteType === 'yes' ? 'votes.canDoIt' : 'votes.cannotDoIt';
    
    await updateDoc(docRef, {
      [field]: increment(1)
    });
  } catch (error) {
    console.error("Error voting:", error);
    throw error;
  }
};

// Add a progress log
export const addProgressLog = async (planId: string, log: ProgressLog) => {
  try {
    if (!db) throw new Error("DB not init");
    const docRef = doc(db, PLANS_COLLECTION, planId);
    await updateDoc(docRef, {
      logs: arrayUnion(log)
    });
  } catch (error) {
    console.error("Error adding log:", error);
    throw error;
  }
};

// Update milestone status
export const updateMilestoneStatus = async (planId: string, milestones: Plan['milestones']) => {
  try {
    if (!db) throw new Error("DB not init");
    const docRef = doc(db, PLANS_COLLECTION, planId);
    await updateDoc(docRef, {
      milestones: milestones
    });
  } catch (error) {
    console.error("Error updating milestone:", error);
    throw error;
  }
};