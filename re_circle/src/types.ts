export type ListingCategory = 'Clothing' | 'Furniture' | 'Accessories' | 'Home Goods';

export type ListingStatus = 'Available' | 'Claimed';

export interface Listing {
  id: string;
  title: string;
  category: ListingCategory;
  condition: 'New' | 'Excellent' | 'Gently Used' | 'Distressed';
  size?: string;
  price: number;
  description: string;
  image?: string; // base64, ObjectURL, or CSS pattern name
  tag?: 'VINTAGE' | 'RARE' | 'HANDMADE' | 'ESSENTIAL' | 'UNIQUE';
  donorName: string;
  date: string;
  co2Saved: number; // in kg
  status: ListingStatus;
  notes?: string;
}

export interface ImpactMetrics {
  itemsDonated: number;
  co2Saved: number;
  fundsRaised: number;
}

export interface Transaction {
  id: string;
  type: 'funding' | 'purchase' | 'direct_donation';
  amount: number;
  date: string;
  description: string;
  co2Saved?: number;
}

export interface UserAccount {
  email: string;
  balance: number;
  totalCO2Saved: number;
  itemsDonated: number;
  itemsClaimed: number;
  totalContributed: number; // Total amount spent/donated to causes
  transactions: Transaction[];
  currentPlanId?: string; // Active subscription or saving plan id
}

export interface ThriftPlan {
  id: string;
  name: string;
  tagline: string;
  monthlyFee: number;
  co2Multiplier: number;
  perks: string[];
  description: string;
}

export interface ActiveAccount {
  id: string;
  name: string;
  email: string;
  level: number;
  totalCO2Saved: number;
  itemsCircularized: number;
  planId: string; // Active plan
  avatarColor: string;
}

export interface ChatMessage {
  id: string;
  senderId: string; // 'me' or neighbor id
  senderName: string;
  text: string;
  timestamp: string;
}

export interface ContributionGroup {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  targetAmount: number;
  currentAmount: number;
  co2Target: number; // target CO2 savings in kg
  category: 'Composting' | 'Workshop' | 'Forestry' | 'Energy';
  membersCount: number;
  tags: string[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'success' | 'info' | 'alert';
}

