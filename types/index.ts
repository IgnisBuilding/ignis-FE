
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Society {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  status: 'active' | 'inactive';
}

export interface Post {
  id: string;
  author: string;
  content: string;
  timestamp: Date;
  likes: number;
  comments: number;
}

export interface Bill {
  id: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue';
}

export interface RentalItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
}