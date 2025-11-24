

export enum PlanStatus {
  ACTIVE = 'ACTIVE',
  VERIFICATION_PENDING = 'VERIFICATION_PENDING', // The 2-day window after deadline
  COMPLETED_SUCCESS = 'COMPLETED_SUCCESS',
  COMPLETED_FAIL = 'COMPLETED_FAIL',
  FAILED_BY_ABANDONMENT = 'FAILED_BY_ABANDONMENT'
}

export enum Category {
  FITNESS = '운동',
  STUDY = '공부',
  CAREER = '커리어',
  HOBBY = '취미',
  LIFESTYLE = '라이프스타일'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  followers: string[]; // User IDs
  following: string[]; // User IDs
  trustScore: number; // 0 to 100 (Calculated: 70% history + 30% face verified)
  isFaceVerified: boolean; // True if face matched profile photo
}

export interface MilestoneAnalysis {
  action_type: string;
  action_tags: string[];
  required_biometrics: string[];
  recommended_evidence: string[];
  notes: string;
}

export type VerificationType = 'PHOTO_TEXT' | 'OFFICIAL_BIOMETRIC';

export interface Milestone {
  id: string;
  title: string;
  dueDate: string; // ISO String
  isCompleted: boolean;
  weight: number; // 1: Low, 2: Medium, 3: High importance
  analysis?: MilestoneAnalysis; // Optional AI analysis
  likes: number; // Max 5 per milestone
  verificationType?: VerificationType; // 20% (PHOTO) or 80% (OFFICIAL) credibility
}

export interface ProgressLog {
  id: string;
  date: string;
  milestoneTitle: string; // Which milestone this log is for
  image: string; // Evidence Photo (Base64 or URL)
  verificationType: VerificationType;
  answers: {
    q1: string; // 힘들었던 것
    q2: string; // 예측하지 못했던 것
    q3: string; // 이룬 것
    q4: string; // 이유
    q5: string; // 발전 필요
    q6: string; // 발전 방법
    q7: string; // 하고 싶은 말
  };
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface Plan {
  id: string;
  userId: string;
  user: User;
  title: string;
  description: string;
  images: string[];
  categories: Category[];
  hashtags: string[];
  startDate: string;
  endDate: string; // The Deadline
  status: PlanStatus;
  milestones: Milestone[];
  logs: ProgressLog[];
  likes: number;
  likedBy: string[]; // User IDs who liked this plan
  createdAt: string;
  verificationVoteStart?: string; // When the 2-day post-deadline vote starts
}

export interface GroupChallenge {
  id: string;
  title: string;
  description: string;
  image: string;
  category: Category;
  participants: {
    user: User;
    planId: string;
    progress: number; // 0-100 (Weighted)
    status: PlanStatus;
    endDate: string;
  }[];
}