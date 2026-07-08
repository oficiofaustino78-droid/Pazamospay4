import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc,
  addDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { User, Product, Order, ChatMessage, SecurityLog } from './types';
import config from './firebase-applet-config.json';

// Inicializar Firebase
const app = initializeApp(config);

// Inicializar Firestore com o ID de base de dados específico do applet se fornecido
export const db = getFirestore(app, config.firestoreDatabaseId);

// --- COLECÇÕES ---
const USERS_COLL = 'users';
const PRODUCTS_COLL = 'products';
const ORDERS_COLL = 'orders';
const MESSAGES_COLL = 'messages';
const LOGS_COLL = 'logs';

/**
 * Converte data de Timestamp do Firebase ou string para Date object
 */
function toDate(val: any): Date {
  if (!val) return new Date();
  if (typeof val.toDate === 'function') return val.toDate();
  return new Date(val);
}

// --- UTILIZADORES ---
export async function getUsers(): Promise<User[]> {
  try {
    const q = collection(db, USERS_COLL);
    const snap = await getDocs(q);
    const users: User[] = [];
    snap.forEach((d) => {
      const data = d.data();
      users.push({
        id: d.id,
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        password: data.password || '',
        avatar: data.avatar || '',
        shopName: data.shopName || '',
        province: data.province || '',
        district: data.district || '',
        trustedSellerIds: data.trustedSellerIds || [],
        cartItemIds: data.cartItemIds || [],
        notifications: (data.notifications || []).map((n: any) => ({
          ...n,
          timestamp: toDate(n.timestamp)
        })),
        rating: data.rating || 5.0,
        isVip: data.isVip || false,
        balance: data.balance ?? 0,
        transactions: data.transactions || [],
        securityLogs: data.securityLogs || [],
        blocked: !!data.blocked,
        userType: data.userType || 'BUYER',
        verificationStatus: data.verificationStatus || 'NONE',
        rejectionReason: data.rejectionReason || '',
        verificationData: data.verificationData || undefined
      });
    });
    return users;
  } catch (error) {
    console.error('Erro ao buscar utilizadores do Firestore:', error);
    return [];
  }
}

export async function saveUser(user: User): Promise<void> {
  try {
    const ref = doc(db, USERS_COLL, user.id);
    await setDoc(ref, {
      ...user,
      notifications: user.notifications.map(n => ({
        ...n,
        timestamp: n.timestamp instanceof Date ? n.timestamp.toISOString() : n.timestamp
      }))
    }, { merge: true });
  } catch (error) {
    console.error(`Erro ao guardar utilizador ${user.id} no Firestore:`, error);
  }
}

// --- PRODUTOS ---
export async function getProducts(): Promise<Product[]> {
  try {
    const q = collection(db, PRODUCTS_COLL);
    const snap = await getDocs(q);
    const products: Product[] = [];
    snap.forEach((d) => {
      const data = d.data();
      products.push({
        id: d.id,
        name: data.name || '',
        price: Number(data.price) || 0,
        isAvailable: data.isAvailable !== false,
        province: data.province || '',
        district: data.district || '',
        neighborhood: data.neighborhood || '',
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        isVip: data.isVip || false,
        seller: data.seller || {
          id: 'unknown',
          name: 'Vendedor Anónimo',
          avatar: 'https://i.pravatar.cc/150',
          rating: 5.0,
          reviewsCount: 0,
          phone: '',
          location: '',
          isVip: false
        }
      });
    });
    return products;
  } catch (error) {
    console.error('Erro ao buscar produtos do Firestore:', error);
    return [];
  }
}

export async function saveProduct(product: Product): Promise<void> {
  try {
    const ref = doc(db, PRODUCTS_COLL, product.id);
    await setDoc(ref, product, { merge: true });
  } catch (error) {
    console.error(`Erro ao guardar produto ${product.id} no Firestore:`, error);
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    const ref = doc(db, PRODUCTS_COLL, productId);
    await deleteDoc(ref);
  } catch (error) {
    console.error(`Erro ao apagar produto ${productId} do Firestore:`, error);
  }
}

// --- ORDENS (COMPRAS / VENDAS) ---
export async function getOrders(): Promise<Order[]> {
  try {
    const q = collection(db, ORDERS_COLL);
    const snap = await getDocs(q);
    const orders: Order[] = [];
    snap.forEach((d) => {
      const data = d.data();
      orders.push({
        id: d.id,
        productId: data.productId || '',
        productName: data.productName || '',
        productImage: data.productImage || '',
        price: Number(data.price) || 0,
        buyerId: data.buyerId || '',
        buyerName: data.buyerName || '',
        buyerPhone: data.buyerPhone || '',
        buyerProvince: data.buyerProvince || '',
        buyerNeighborhood: data.buyerNeighborhood || '',
        sellerId: data.sellerId || '',
        status: data.status || 'PENDING',
        timestamp: toDate(data.timestamp)
      });
    });
    return orders;
  } catch (error) {
    console.error('Erro ao buscar ordens do Firestore:', error);
    return [];
  }
}

export async function saveOrder(order: Order): Promise<void> {
  try {
    const ref = doc(db, ORDERS_COLL, order.id);
    await setDoc(ref, {
      ...order,
      timestamp: order.timestamp instanceof Date ? order.timestamp.toISOString() : order.timestamp
    }, { merge: true });
  } catch (error) {
    console.error(`Erro ao guardar ordem ${order.id} no Firestore:`, error);
  }
}

// --- MENSAGENS DE CHAT ---
export async function getMessages(): Promise<ChatMessage[]> {
  try {
    const q = collection(db, MESSAGES_COLL);
    const snap = await getDocs(q);
    const messages: ChatMessage[] = [];
    snap.forEach((d) => {
      const data = d.data();
      messages.push({
        id: d.id,
        senderId: data.senderId || '',
        receiverId: data.receiverId || '',
        productId: data.productId || '',
        text: data.text || '',
        order: data.order ? {
          ...data.order,
          timestamp: toDate(data.order.timestamp)
        } : undefined,
        timestamp: toDate(data.timestamp)
      });
    });
    return messages;
  } catch (error) {
    console.error('Erro ao buscar mensagens do Firestore:', error);
    return [];
  }
}

export async function saveMessage(msg: ChatMessage): Promise<void> {
  try {
    const ref = doc(db, MESSAGES_COLL, msg.id);
    await setDoc(ref, {
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp,
      order: msg.order ? {
        ...msg.order,
        timestamp: msg.order.timestamp instanceof Date ? msg.order.timestamp.toISOString() : msg.order.timestamp
      } : null
    }, { merge: true });
  } catch (error) {
    console.error(`Erro ao guardar mensagem ${msg.id} no Firestore:`, error);
  }
}

// --- AUDITORIA / LOGS GLOBAIS DO SISTEMA ---
export interface GlobalLog extends SecurityLog {
  userId: string;
  userName: string;
}

export async function getSystemLogs(): Promise<GlobalLog[]> {
  try {
    const q = collection(db, LOGS_COLL);
    const snap = await getDocs(q);
    const logs: GlobalLog[] = [];
    snap.forEach((d) => {
      const data = d.data();
      logs.push({
        id: d.id,
        action: data.action || 'ADMIN_ACTION',
        details: data.details || '',
        timestamp: data.timestamp || new Date().toISOString(),
        ipAddress: data.ipAddress || '197.249.12.83',
        device: data.device || 'System',
        userId: data.userId || 'system',
        userName: data.userName || 'Sistema'
      });
    });
    // Ordenar por data decrescente
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Erro ao buscar logs globais:', error);
    return [];
  }
}

export async function addSystemLog(userId: string, userName: string, action: SecurityLog['action'], details: string): Promise<GlobalLog> {
  const newLog: GlobalLog = {
    id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
    action,
    details,
    timestamp: new Date().toISOString(),
    ipAddress: '197.249.12.83 (Maputo, MZ)',
    device: navigator.userAgent.includes('Mobile') ? 'Smartphone / Browser Mobile' : 'Computador Desktop / Chrome',
    userId,
    userName
  };

  try {
    const ref = doc(db, LOGS_COLL, newLog.id);
    await setDoc(ref, newLog);
  } catch (error) {
    console.error('Erro ao guardar log global:', error);
  }
  
  return newLog;
}
