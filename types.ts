
export interface Product {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
  province: string;
  district: string;
  neighborhood: string;
  description: string;
  imageUrl: string;
  isVip: boolean;
  seller: Seller;
}

export interface Seller {
  id: string;
  name: string;
  fullName?: string;
  avatar: string;
  rating: number;
  reviewsCount: number;
  phone: string;
  location: string;
  isVip: boolean;
  isTrusted?: boolean;
  complaintsCount?: number;
  blocked?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'VIP' | 'TRUST' | 'SYSTEM' | 'ORDER' | 'MESSAGE';
  timestamp: Date;
  read: boolean;
  orderId?: string;
  productId?: string;
  trusterId?: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  price?: number;
  buyerId?: string;
  buyerName: string;
  buyerPhone: string;
  buyerProvince: string;
  buyerNeighborhood: string;
  sellerId?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  productId?: string;
  text: string;
  order?: Order;
  timestamp: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  avatar: string;
  shopName?: string;
  province: string;
  district: string;
  trustedSellerIds: string[];
  cartItemIds: string[];
  notifications: Notification[];
  rating?: number;
  isVip?: boolean;
  balance?: number;
  transactions?: WalletTransaction[];
  securityLogs?: SecurityLog[];
  blocked?: boolean;
  userType: 'BUYER' | 'SELLER';
  verificationStatus: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  verificationData?: VerificationData;
}

export interface BusinessData {
  type: 'PERSONAL' | 'STORE';
  name?: string; // Nome completo ou Nome da loja
  ownerName?: string; // Nome do proprietário se for Loja
  phone: string;
  category?: string;
  province: string;
  district: string;
  neighborhood: string;
  reference: string;
}

export interface BIData {
  fullName: string;
  biNumber: string;
  birthDate: string;
  gender: string;
  issueDate: string;
  expiryDate: string;
  nationality: string;
  biFrontImage?: string;
  biBackImage?: string;
}

export interface VerificationData {
  business?: BusinessData;
  bi?: BIData;
  livenessActionsDone?: string[];
  selfieWithBIImage?: string;
  submittedAt?: string;
  gpsCoordinates?: { lat: number; lng: number };
  livenessChecked?: boolean;
  matchScore?: number;
}

export interface WalletTransaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'PAYMENT_RECEIVED' | 'PAYMENT_SENT' | 'REFUND';
  amount: number;
  method: 'M-PESA' | 'E-MOLA' | 'BANK_TRANSFER';
  reference: string;
  status: 'COMPLETED' | 'PENDING' | 'REJECTED';
  timestamp: string;
  description: string;
}

export interface SecurityLog {
  id: string;
  action: 'LOGIN' | 'LOGOUT' | 'PUBLISH_PRODUCT' | 'DELETE_PRODUCT' | 'SEND_MESSAGE' | 'SEND_DELIVERY_ALERT' | 'REPORT_SELLER' | 'EDIT_PROFILE' | 'CHANGE_PASSWORD' | 'WALLET_TRANSACTION' | 'ADMIN_ACTION';
  details: string;
  timestamp: string;
  ipAddress?: string;
  device?: string;
}

export type ViewState = 
  | 'HOME' 
  | 'PUBLISH' 
  | 'PROFILE' 
  | 'EDIT_PROFILE'
  | 'CHAT'
  | 'PRODUCT_DETAIL' 
  | 'SELLER_DETAIL' 
  | 'REGISTER' 
  | 'LOGIN'
  | 'ASK_PAY';
