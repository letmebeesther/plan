
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { User } from '../types';

const SESSION_KEY = 'plan_prove_session';

// Admin Account Constant
const ADMIN_USER = {
    id: 'admin_master',
    email: 'admin@planprove.com',
    password: 'admin1234',
    name: '관리자',
    bio: 'Plan & Prove 공식 관리자 계정입니다.',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=c0aede',
    followers: [],
    following: [],
    trustScore: 100,
    isFaceVerified: true
};

// Get current session from LocalStorage (Persists login state only)
export const getCurrentUser = (): User | null => {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return null;
};

// Fetch fresh user data from DB
export const getUserById = async (userId: string): Promise<User | null> => {
    try {
        const docRef = doc(db, 'users', userId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as User;
        }
        return null;
    } catch (e) {
        console.error("Error fetching user:", e);
        return null;
    }
};

// Initialize Admin if not exists
export const ensureAdminExists = async () => {
    const userRef = doc(db, 'users', ADMIN_USER.id);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
        await setDoc(userRef, ADMIN_USER);
        console.log("Admin account created in Firestore.");
    }
};

export const login = async (email: string, password: string): Promise<{ success: boolean; message?: string; user?: User }> => {
  try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
          return { success: false, message: "존재하지 않는 이메일입니다." };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // In a real app, use bcrypt. Plain text for demo.
      if (userData.password !== password) {
          return { success: false, message: "비밀번호가 일치하지 않습니다." };
      }

      // Create session object (safe fields)
      const sessionUser: User = {
          id: userData.id,
          name: userData.name,
          avatar: userData.avatar,
          bio: userData.bio,
          followers: userData.followers || [],
          following: userData.following || [],
          trustScore: userData.trustScore || 0,
          isFaceVerified: userData.isFaceVerified || false
      };
      
      // Save session to local storage
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      
      return { success: true, user: sessionUser };
  } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "로그인 중 오류가 발생했습니다." };
  }
};

export const register = async (email: string, password: string, name: string, bio: string): Promise<{ success: boolean; message?: string; user?: User }> => {
    try {
        const usersRef = collection(db, 'users');
        
        // Check if email exists
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            return { success: false, message: "이미 존재하는 이메일입니다." };
        }

        const newUserId = `user_${Date.now()}`;
        const newUser = {
            id: newUserId,
            email,
            password, 
            name,
            bio: bio || '새로운 도전자',
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
            followers: [],
            following: [],
            trustScore: 0,
            isFaceVerified: false
        };

        // Save to Firestore
        await setDoc(doc(db, 'users', newUserId), newUser);

        // Auto login (Set session)
        const sessionUser: User = {
            id: newUser.id,
            name: newUser.name,
            avatar: newUser.avatar,
            bio: newUser.bio,
            followers: [],
            following: [],
            trustScore: newUser.trustScore,
            isFaceVerified: newUser.isFaceVerified
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));

        return { success: true, user: sessionUser };
    } catch (error) {
        console.error("Register error:", error);
        return { success: false, message: "회원가입 중 오류가 발생했습니다." };
    }
};

export const logout = () => {
  localStorage.removeItem(SESSION_KEY);
  // Dispatch a custom event to notify App component to update state immediately
  window.dispatchEvent(new Event('auth:logout'));
  
  // Force reset URL to home and reload to ensure clean state
  // This addresses issues where the logout button might seem unresponsive
  window.location.hash = '/';
  window.location.reload();
};

export const toggleFollow = async (currentUserId: string, targetUserId: string): Promise<boolean> => {
    try {
        const currentUserRef = doc(db, 'users', currentUserId);
        const targetUserRef = doc(db, 'users', targetUserId);

        // Check if already following
        const currentUserSnap = await getDoc(currentUserRef);
        if (!currentUserSnap.exists()) return false;

        const following = currentUserSnap.data().following || [];
        const isFollowing = following.includes(targetUserId);

        if (isFollowing) {
            // Unfollow
            await updateDoc(currentUserRef, {
                following: arrayRemove(targetUserId)
            });
            await updateDoc(targetUserRef, {
                followers: arrayRemove(currentUserId)
            });
            
            // Update local session
            const session = getCurrentUser();
            if (session) {
                session.following = session.following.filter(id => id !== targetUserId);
                localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            }
            return false;
        } else {
            // Follow
            await updateDoc(currentUserRef, {
                following: arrayUnion(targetUserId)
            });
            await updateDoc(targetUserRef, {
                followers: arrayUnion(currentUserId)
            });

            // Update local session
            const session = getCurrentUser();
            if (session) {
                session.following = [...(session.following || []), targetUserId];
                localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            }
            return true;
        }
    } catch (e) {
        console.error("Follow toggle error", e);
        return false;
    }
};
