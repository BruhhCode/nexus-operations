export type UserRole = 'admin' | 'member' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  projectId?: string;
  assigneeId?: string;
  creatorId: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'on-hold' | 'completed' | 'cancelled';
  members: string[];
  driveUrl?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  clientId: string;
  projectId?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: any; // Firestore Timestamp
  roomId: string;
}
