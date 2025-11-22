export enum PlanStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum Category {
  건강 = '건강',
  학습 = '학습',
  취미 = '취미',
  재테크 = '재테크',
  자기계발 = '자기계발',
  운동 = '운동',
  기타 = '기타'
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string;
  isCompleted: boolean;
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
  endDate: string;
  milestones: Milestone[];
  status: PlanStatus;
  subscribers: string[];
  votes: { up: number; down: number };
  createdAt: string;
}