
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ProductCard as ProductCardComponent } from './components/ProductCard';
import { ProductDetail } from './components/ProductDetail';
import { PublishForm } from './components/PublishForm';
import { SellerProfile } from './components/SellerProfile';
import { PayAssistant } from './components/PayAssistant';
import { ChatSystem } from './components/ChatSystem';
import { NotificationPanel } from './components/NotificationPanel';
import { VipGrid } from './components/VipGrid';
import { UserProfile } from './components/UserProfile';
import { PayBlockingModal } from './components/PayBlockingModal';
import { MOCK_PRODUCTS, MOZAMBIQUE_DATA, Logo } from './constants';
import { ViewState, Product, Seller, User, Order, ChatMessage, SecurityLog } from './types';
import { 
  getUsers, 
  saveUser, 
  getProducts, 
  saveProduct, 
  deleteProduct, 
  getOrders, 
  saveOrder, 
  getMessages, 
  saveMessage, 
  getSystemLogs, 
  addSystemLog 
} from './firebase';

type Theme = 'default' | 'noturno' | 'sol';

const App: React.FC = () => {
  // --- Estados de Sessão e Persistência ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('HOME');
  const [theme, setTheme] = useState<Theme>((localStorage.getItem('bazamos_theme') as Theme) || 'default');
  const [isGuestLooking, setIsGuestLooking] = useState(false);
  const [showPersuasionModal, setShowPersuasionModal] = useState(false);
  const [welcomeMode, setWelcomeMode] = useState<'LOGIN' | 'REGISTER' | null>(null);
  const [timeOffline, setTimeOffline] = useState<string>('');
  
  // Estados de Logout e Transição
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [lastUserName, setLastUserName] = useState('');
  const [lastUserFullName, setLastUserFullName] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [transitionMsg, setTransitionMsg] = useState('');
  
  // --- Banco de Dados Sincronizado (Firestore Real-Time) ---
  const [usersDB, setUsersDB] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [dbLogs, setDbLogs] = useState<SecurityLog[]>([]);
  const [firebaseLoaded, setFirebaseLoaded] = useState(false);

  const [savedPhone, setSavedPhone] = useState<string | null>(localStorage.getItem('bazamos_last_phone'));

  // --- Estados de UI ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Estados de rastreio de Chat de Negociação Ativo
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  
  // Formulários
  const [loginPhone, setLoginPhone] = useState(localStorage.getItem('bazamos_last_phone') || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regProvince, setRegProvince] = useState('');
  const [regDistrict, setRegDistrict] = useState('');

  // Sincronização e Auditoria Ativa de Logs de Sistema (Live Firestore)
  const logSystemAction = async (action: string, details: string, userId?: string, userName?: string) => {
    try {
      const uId = userId || currentUser?.id || 'guest';
      const uName = userName || currentUser?.name || 'Visitante';
      await addSystemLog(action, details, uId, uName);
      // Recarregar os logs do sistema
      const freshLogs = await getSystemLogs();
      setDbLogs(freshLogs);
    } catch (err) {
      console.error("Erro ao gravar log no Firestore:", err);
    }
  };

  // Carregar dados mestre do Firebase Firestore (Sincronização Ativa)
  useEffect(() => {
    async function initFirestore() {
      try {
        console.log("A carregar dados do Firestore...");
        
        // 1. Utilizadores
        let loadedUsers = await getUsers();
        setUsersDB(loadedUsers);

        // 2. Produtos
        let loadedProducts = await getProducts();
        setProducts(loadedProducts);

        // 3. Encomendas
        const loadedOrders = await getOrders();
        setOrders(loadedOrders);

        // 4. Mensagens
        const loadedMessages = await getMessages();
        setMessages(loadedMessages);

        // 5. Logs do Sistema
        const loadedLogs = await getSystemLogs();
        setDbLogs(loadedLogs);

        setFirebaseLoaded(true);
      } catch (err) {
        console.error("Erro catastrófico ao iniciar Firebase:", err);
      }
    }
    initFirestore();
  }, []);
  
  // Filtros de Localização
  const [filterProvince, setFilterProvince] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  
  // Estado do SERNIC
  const [showSernicModal, setShowSernicModal] = useState(false);
  const [blockedSellerInfo, setBlockedSellerInfo] = useState<{name: string, phone: string} | null>(null);
  
  // Feedback do Pay
  const [payFeedback, setPayFeedback] = useState<{msg: string, type: 'error' | 'info' | null}>({msg: '', type: null});

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);

  // --- Efeitos ---
  useEffect(() => {
    localStorage.setItem('bazamos_users_db', JSON.stringify(usersDB));
  }, [usersDB]);

  useEffect(() => {
    localStorage.setItem('bazamos_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('bazamos_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const body = document.getElementById('pay-body');
    if (body) {
      body.classList.remove('theme-noturno', 'theme-sol');
      if (theme !== 'default') body.classList.add(`theme-${theme}`);
    }
    localStorage.setItem('bazamos_theme', theme);
  }, [theme]);

  // Bloqueio de navegação sem login
  useEffect(() => {
    if (!isLoggedIn && !isGuestLooking && !showLogoutModal && !showDeleteModal && view !== 'LOGIN' && view !== 'REGISTER' && view !== 'HOME') {
      setView('HOME');
    }
  }, [isLoggedIn, isGuestLooking, showLogoutModal, showDeleteModal, view]);

  // Sincronizar localização do utilizador logado com os filtros de pesquisa
  useEffect(() => {
    if (isLoggedIn && currentUser) {
      setFilterProvince(currentUser.province || '');
      setFilterDistrict(currentUser.district || '');
    } else {
      setFilterProvince('');
      setFilterDistrict('');
    }
  }, [isLoggedIn, currentUser]);

  // --- Lógicas de Autenticação ---
  
  const encodePassword = (pw: string) => btoa(pw);

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} dia(s) e ${hours % 24} hora(s)`;
    if (hours > 0) return `${hours} hora(s) e ${minutes % 60} minuto(s)`;
    return `${minutes} minuto(s)`;
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setPayFeedback({msg: 'A verificar protocolo de segurança...', type: 'info'});

    const user = usersDB.find(u => u.phone === loginPhone);

    if (!user) {
      setPayFeedback({msg: 'Este número de telemóvel não está registado no sistema. Por favor, crie uma nova conta.', type: 'error'});
      return;
    }

    if (user.blocked) {
      setPayFeedback({msg: 'Esta conta foi suspensa por violação de termos e segurança do Bazamos Pay.', type: 'error'});
      return;
    }

    if (user.password !== encodePassword(loginPassword)) {
      setPayFeedback({msg: 'Este número já tem uma conta associada, mas a senha está incorreta. Tente novamente ou recupere a sua senha.', type: 'error'});
      return;
    }

    // Calcular tempo offline
    const lastLogout = localStorage.getItem('bazamos_last_logout');
    if (lastLogout) {
      const diff = Date.now() - parseInt(lastLogout);
      setTimeOffline(diff > 0 ? formatDuration(diff) : 'instantes');
    } else {
      setTimeOffline('algum tempo');
    }

    // Sucesso
    localStorage.setItem('bazamos_last_phone', loginPhone);
    setSavedPhone(loginPhone);
    setCurrentUser(user);
    setIsLoggedIn(true);
    setIsGuestLooking(false);
    setShowPersuasionModal(false);
    setWelcomeMode('LOGIN');
    setView('HOME');
    setPayFeedback({msg: '', type: null});
    setLoginPassword('');
    logSystemAction('LOGIN', `Sessão iniciada com sucesso via telemóvel ${loginPhone}`, user.id, user.name);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação Rigorosa de Nome
    const nameParts = regName.trim().split(/\s+/);
    const fakePatterns = ['asdf', 'test', 'qwerty', 'abcde', '12345', 'aaaa', 'bbbb'];
    const isFake = fakePatterns.some(p => regName.toLowerCase().includes(p));

    if (nameParts.length < 2 || nameParts.length > 3 || nameParts.some(p => p.length < 3) || isFake) {
      setPayFeedback({
        msg: 'Por favor, insira o seu nome completo real (mínimo dois nomes e cada parte com pelo menos 3 letras).',
        type: 'error'
      });
      return;
    }

    const exists = usersDB.some(u => u.phone === regPhone);
    if (exists) {
      setPayFeedback({msg: 'Este número de telefone já possui uma conta. Impossível criar uma nova conta com o mesmo número. Faça login ou recupere a sua conta existente.', type: 'error'});
      return;
    }

    const newUser: User = {
      id: 'u-' + Date.now(),
      name: regName,
      phone: regPhone,
      password: encodePassword(regPassword),
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150`,
      province: regProvince,
      district: regDistrict || 'Bairro Central',
      email: '',
      trustedSellerIds: [],
      cartItemIds: [],
      notifications: [],
      rating: 5.0,
      isVip: false
    };

    try {
      await saveUser(newUser);
      setUsersDB([...usersDB, newUser]);
      localStorage.setItem('bazamos_last_phone', regPhone);
      setSavedPhone(regPhone);
      setCurrentUser(newUser);
      setIsLoggedIn(true);
      setIsGuestLooking(false);
      setShowPersuasionModal(false);
      setWelcomeMode('REGISTER');
      setView('HOME');
      logSystemAction('LOGIN', `Novo utilizador registado e autenticado: ${regName} (${regPhone})`, newUser.id, newUser.name);
    } catch (err) {
      console.error(err);
      setPayFeedback({msg: 'Erro ao registar conta no Firestore. Tente novamente.', type: 'error'});
    }
  };

  const executeLogout = () => {
    const nameToStore = currentUser?.name || 'Utilizador';
    setLastUserName(nameToStore);
    setLastUserFullName(currentUser?.name || '');
    
    if (currentUser) {
      logSystemAction('LOGOUT', `Sessão encerrada com segurança pelo utilizador`, currentUser.id, currentUser.name);
    }

    // Limpar sessão imediatamente
    localStorage.setItem('bazamos_last_logout', Date.now().toString());
    setIsLoggedIn(false);
    setCurrentUser(null);
    setIsGuestLooking(false);
    setShowPersuasionModal(false);
    setWelcomeMode(null);
    setIsMenuOpen(false);
    setShowLogoutConfirm(false);
    setLoginPassword('');
    
    // Abrir modal de logout Consciência Ativa
    setShowLogoutModal(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const interceptAction = (action: () => void) => {
    if (!isLoggedIn) {
      setShowPersuasionModal(true);
      return;
    }
    action();
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.seller && p.seller.blocked) {
        return false;
      }
      if (filterProvince && p.province !== filterProvince) {
        return false;
      }
      if (filterDistrict && p.district !== filterDistrict) {
        return false;
      }
      return true;
    });
  }, [products, filterProvince, filterDistrict]);

  const vipProducts = useMemo(() => {
    return filteredProducts.filter(p => p.isVip);
  }, [filteredProducts]);

  const handleProductClick = (p: Product) => {
    interceptAction(() => {
      setSelectedProduct(p);
      setView('PRODUCT_DETAIL');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const handleSellerClick = (sellerId: string) => {
    interceptAction(() => {
      const seller = products.find(p => p.seller.id === sellerId)?.seller;
      if (seller) {
        setSelectedSeller(seller);
        setView('SELLER_DETAIL');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  };

  const handleToggleTrust = async () => {
    if (!currentUser || !selectedSeller) return;
    const sellerId = selectedSeller.id;
    const alreadyTrusted = currentUser.trustedSellerIds.includes(sellerId);
    let updatedTrustedList = [...currentUser.trustedSellerIds];
    
    if (alreadyTrusted) {
      updatedTrustedList = updatedTrustedList.filter(id => id !== sellerId);
    } else {
      updatedTrustedList.push(sellerId);
    }
    
    const updatedUser = { ...currentUser, trustedSellerIds: updatedTrustedList };
    setCurrentUser(updatedUser);

    // Criar notificação para o usuário confiado
    let trustNotification: Notification | null = null;
    if (!alreadyTrusted) {
      trustNotification = {
        id: 'not-trust-' + Math.random().toString(36).substr(2, 9),
        title: 'Novo Voto de Confiança! 🤝',
        message: `${currentUser.name} agora confia em si e no seu canal comercial.`,
        type: 'TRUST',
        timestamp: new Date(),
        read: false,
        trusterId: currentUser.id
      };
    }

    setUsersDB(usersDB.map(u => {
      if (u.id === currentUser.id) {
        return updatedUser;
      }
      if (u.id === sellerId && trustNotification) {
        return {
          ...u,
          notifications: [trustNotification, ...(u.notifications || [])]
        };
      }
      return u;
    }));
    
    // Atualizar selectedSeller diretamente para refletir em tempo real
    const currentRating = selectedSeller.rating || 4.5;
    const currentReviews = selectedSeller.reviewsCount || 10;
    const newRating = alreadyTrusted ? Math.max(1, parseFloat((currentRating - 0.1).toFixed(1))) : Math.min(5, parseFloat((currentRating + 0.1).toFixed(1)));
    const newReviews = alreadyTrusted ? Math.max(0, currentReviews - 1) : currentReviews + 1;
    
    const updatedSellerObj = { 
      ...selectedSeller, 
      rating: newRating, 
      reviewsCount: newReviews,
      isTrusted: !alreadyTrusted 
    };
    setSelectedSeller(updatedSellerObj);

    // Atualizar produtos deste vendedor se existirem
    const updatedProducts = products.map(p => {
      if (p.seller.id === sellerId) {
        return { ...p, seller: updatedSellerObj };
      }
      return p;
    });
    setProducts(updatedProducts);
    
    setPayFeedback({
      msg: alreadyTrusted ? 'Removido dos vendedores confiáveis.' : 'Sucesso! Confiança registada. O nível de reconhecimento do vendedor foi aumentado pelo Protocolo Pay! ✨',
      type: 'info'
    });
    setTimeout(() => setPayFeedback({msg:'', type:null}), 3000);

    try {
      await saveUser(updatedUser); // Guardar comprador/truster
      
      if (!alreadyTrusted && trustNotification) {
        const trustedSellerUser = usersDB.find(u => u.id === sellerId);
        if (trustedSellerUser) {
          const updatedTrustedSeller = {
            ...trustedSellerUser,
            notifications: [trustNotification, ...(trustedSellerUser.notifications || [])]
          };
          await saveUser(updatedTrustedSeller); // Guardar vendedor confiado
        }
      }
      
      const actionDetails = alreadyTrusted 
        ? `Voto de confiança removido do vendedor ${selectedSeller.name}` 
        : `Voto de confiança concedido ao vendedor ${selectedSeller.name}`;
      logSystemAction('EDIT_PROFILE', actionDetails, currentUser.id, currentUser.name);
    } catch (err) {
      console.error("Erro ao sincronizar voto de confiança no Firestore:", err);
    }
  };

  const handleRateSeller = async (ratingVal: number) => {
    if (!currentUser || !selectedSeller) return;
    const sellerId = selectedSeller.id;
    
    const currentReviews = selectedSeller.reviewsCount || 10;
    const currentRating = selectedSeller.rating || 4.5;
    const updatedSellerObj = { 
      ...selectedSeller, 
      rating: parseFloat(((currentRating * currentReviews + ratingVal) / (currentReviews + 1)).toFixed(1)),
      reviewsCount: currentReviews + 1
    };
    setSelectedSeller(updatedSellerObj);

    const updatedProducts = products.map(p => {
      if (p.seller.id === sellerId) {
        return { ...p, seller: updatedSellerObj };
      }
      return p;
    });
    setProducts(updatedProducts);
    
    setPayFeedback({
      msg: `Obrigado! Avaliou este vendedor com ${ratingVal} estrelas.`,
      type: 'info'
    });
    setTimeout(() => setPayFeedback({msg:'', type:null}), 3000);

    try {
      const dbSeller = usersDB.find(u => u.id === sellerId);
      if (dbSeller) {
        const updatedDbSeller = {
          ...dbSeller,
          rating: updatedSellerObj.rating
        };
        await saveUser(updatedDbSeller); // Firestore Sync
      }
      logSystemAction('EDIT_PROFILE', `Vendedor ${selectedSeller.name} avaliado com ${ratingVal} estrelas`, currentUser.id, currentUser.name);
    } catch (err) {
      console.error("Erro ao guardar avaliação no Firestore:", err);
    }
  };

  const handleReportSeller = async () => {
    if (!currentUser || !selectedSeller) return;
    const sellerId = selectedSeller.id;
    let newComplaintsCount = (selectedSeller.complaintsCount || 0) + 1;
    let isNowBlocked = newComplaintsCount >= 5;
    
    const currentRating = selectedSeller.rating || 4.5;
    const newRating = Math.max(1, parseFloat((currentRating - 0.5).toFixed(1)));
    const updatedSellerObj = { 
      ...selectedSeller, 
      rating: newRating,
      complaintsCount: newComplaintsCount,
      blocked: isNowBlocked
    };
    setSelectedSeller(updatedSellerObj);

    const updatedProducts = products.map(p => {
      if (p.seller.id === sellerId) {
        return { ...p, seller: updatedSellerObj };
      }
      return p;
    });
    
    if (isNowBlocked) {
      const remainingProducts = updatedProducts.filter(p => p.seller.id !== sellerId);
      setProducts(remainingProducts);
      
      setView('HOME');
      setSelectedSeller(null);
      setSelectedProduct(null);
      setBlockedSellerInfo({ name: selectedSeller.name, phone: selectedSeller.phone || '84 999 9999' });
      setShowSernicModal(true);
      
      try {
        const alarm = document.getElementById('alarm-sound') as HTMLAudioElement;
        if (alarm) {
          alarm.volume = 0.5;
          alarm.play();
          setTimeout(() => alarm.pause(), 5000);
        }
      } catch (err) {
        console.log('Fundo de áudio bloqueado pelo navegador até interação', err);
      }
    } else {
      setProducts(updatedProducts);
      setPayFeedback({
        msg: `🚨 Denúncia de golpe registada! O nível de reconhecimento do vendedor foi reduzido. (${newComplaintsCount}/5 denúncias para bloqueio automático e acionamento do SERNIC)`,
        type: 'error'
      });
      setTimeout(() => setPayFeedback({msg: '', type: null}), 4500);
    }

    try {
      const dbSeller = usersDB.find(u => u.id === sellerId);
      if (dbSeller) {
        const updatedDbSeller = {
          ...dbSeller,
          rating: newRating,
          blocked: isNowBlocked
        };
        await saveUser(updatedDbSeller); // Firestore Sync
      }
      logSystemAction('DENUNCIAR', `Denúncia de tentativa de fraude registada contra vendedor ${selectedSeller.name}. Nível de risco aumentado.`, currentUser.id, currentUser.name);
    } catch (err) {
      console.error("Erro ao registar denúncia no Firestore:", err);
    }
  };

  const handleUpdateProfile = async (updatedFields: Partial<User>) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, ...updatedFields };
    setCurrentUser(updatedUser);
    
    // Update in users database
    setUsersDB(usersDB.map(u => u.id === currentUser.id ? updatedUser : u));
    
    // Update seller info of all products published by this user
    const updatedProducts = products.map(p => {
      if (p.seller.id === currentUser.id) {
        return {
          ...p,
          province: updatedFields.province || p.province,
          district: updatedFields.district || p.district,
          seller: {
            ...p.seller,
            name: updatedFields.name || p.seller.name,
            phone: updatedFields.phone || p.seller.phone,
            avatar: updatedFields.avatar || p.seller.avatar,
            location: updatedFields.district ? `${updatedFields.district} (${updatedFields.province})` : p.seller.location
          }
        };
      }
      return p;
    });
    setProducts(updatedProducts);

    try {
      // Salvar no Firebase Firestore
      await saveUser(updatedUser);
      
      if (updatedFields.password) {
        logSystemAction('CHANGE_PASSWORD', `Senha de acesso alterada com sucesso`, currentUser.id, currentUser.name);
      } else {
        logSystemAction('EDIT_PROFILE', `Dados do perfil atualizados com sucesso: ${Object.keys(updatedFields).join(', ')}`, currentUser.id, currentUser.name);
      }
    } catch (err) {
      console.error("Erro ao sincronizar atualização de perfil no Firestore:", err);
    }
  };

  const handleToggleUserBlock = async (userId: string) => {
    try {
      const updatedUsers = usersDB.map(u => {
        if (u.id === userId) {
          const newStatus = !u.blocked;
          const msg = `Estatuto de acesso do utilizador ${u.name} alterado para: ${newStatus ? 'SUSPENSO / BLOQUEADO' : 'ATIVO'}`;
          logSystemAction('ADMIN_ACTION', msg, currentUser?.id, currentUser?.name);
          const updatedUser = { ...u, blocked: newStatus };
          saveUser(updatedUser);
          return updatedUser;
        }
        return u;
      });
      setUsersDB(updatedUsers);
    } catch (err) {
      console.error("Erro ao suspender/ativar utilizador no Firestore:", err);
    }
  };

  const handleUpdateAnyUser = async (userId: string, updatedFields: Partial<User>) => {
    try {
      const updatedUsers = usersDB.map(u => {
        if (u.id === userId) {
          const updatedUser = { ...u, ...updatedFields };
          saveUser(updatedUser);
          
          if (currentUser && currentUser.id === userId) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return u;
      });
      setUsersDB(updatedUsers);
    } catch (err) {
      console.error("Erro ao atualizar utilizador administrado no Firestore:", err);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteProduct(productId);
      setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
      logSystemAction('DELETE_PRODUCT', `Anúncio de produto permanentemente excluído: ID ${productId}`, currentUser?.id, currentUser?.name);
    } catch (err) {
      console.error("Erro ao excluir produto no Firestore:", err);
    }
  };

  const handleSendDeliveryAlert = (product: Product, messageText: string) => {
    const systemMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-alert',
      senderId: 'system',
      text: `🚨 PROTOCOLO DE ALERTA DE DISTÂNCIA ATIVADO: O comprador ${currentUser?.name} está localizado em ${currentUser?.district} (${currentUser?.province}) e solicitou garantias de entrega para este local. Qualquer infração será reportada ao SERNIC.`,
      timestamp: new Date()
    };
    
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: 'me',
      text: messageText,
      timestamp: new Date()
    };
    
    setMessages([systemMsg, userMsg, ...messages]);
    setView('CHAT');
  };

  const handleOrderSubmit = async (orderData: Partial<Order>) => {
    if (!selectedProduct) return;
    const sellerId = selectedProduct.seller.id;
    const buyerId = currentUser?.id || 'u-joao';
    
    const newOrder: Order = {
      id: 'ord-' + Math.random().toString(36).substr(2, 9),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      productImage: selectedProduct.imageUrl,
      price: selectedProduct.price,
      buyerId: buyerId,
      buyerName: orderData.buyerName || currentUser?.name || 'João Silva',
      buyerPhone: orderData.buyerPhone || currentUser?.phone || '840000000',
      buyerProvince: orderData.buyerProvince || currentUser?.province || 'Maputo Cidade',
      buyerNeighborhood: orderData.buyerNeighborhood || currentUser?.district || 'KaMpfumo',
      sellerId: sellerId,
      status: 'PENDING',
      timestamp: new Date()
    };
    
    setOrders([newOrder, ...orders]);
    
    const orderMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: buyerId,
      receiverId: sellerId,
      productId: selectedProduct.id,
      text: `Solicitação de compra enviada com sucesso! Aguardando aceite do vendedor.`,
      order: newOrder,
      timestamp: new Date()
    };
    
    setMessages([orderMessage, ...messages]);
    
    const sellerNotification: Notification = {
      id: 'not-' + Math.random().toString(36).substr(2, 9),
      title: 'Nova Solicitação de Compra! 🛍️',
      message: `${currentUser?.name || 'Um comprador'} solicitou a compra de seu "${selectedProduct.name}" por ${selectedProduct.price.toLocaleString()} MT. Clique para responder.`,
      type: 'ORDER',
      orderId: newOrder.id,
      productId: selectedProduct.id,
      timestamp: new Date(),
      read: false
    };
    
    setUsersDB(prevDB => prevDB.map(u => {
      if (u.id === sellerId) {
        const updatedSeller = {
          ...u,
          notifications: [sellerNotification, ...(u.notifications || [])]
        };
        saveUser(updatedSeller); // Firestore Sync
        return updatedSeller;
      }
      return u;
    }));
    
    setActiveChatUserId(sellerId);
    setActiveProductId(selectedProduct.id);
    setView('CHAT');
    
    setPayFeedback({
      msg: `✨ Solicitação de compra enviada ao vendedor ${selectedProduct.seller.name}! Ele foi notificado.`,
      type: 'info'
    });
    setTimeout(() => setPayFeedback({msg: '', type: null}), 4000);

    try {
      await saveOrder(newOrder);
      await saveMessage(orderMessage);
      logSystemAction('WALLET_TRANSACTION', `Solicitação de compra submetida para o produto "${selectedProduct.name}" (${selectedProduct.price.toLocaleString('pt-PT')} MT)`, buyerId, currentUser?.name);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'ACCEPTED' as const } : o);
    setOrders(updatedOrders);
    
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const buyerId = order.buyerId || 'u-joao';
    const sellerId = currentUser?.id || 's1';
    
    const updatedMessages = messages.map(m => {
      if (m.order && m.order.id === orderId) {
        return {
          ...m,
          order: { ...m.order, status: 'ACCEPTED' as const }
        };
      }
      return m;
    });
    
    const confirmMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: sellerId,
      receiverId: buyerId,
      productId: order.productId,
      text: `✅ O vendedor aceitou a sua solicitação de compra para "${order.productName}"! Combinem os detalhes de entrega aqui no chat de forma segura.`,
      timestamp: new Date()
    };
    
    setMessages([confirmMessage, ...updatedMessages]);
    
    const buyerNotification: Notification = {
      id: 'not-' + Math.random().toString(36).substr(2, 9),
      title: 'Solicitação Aceite! 🎉',
      message: `O vendedor de "${order.productName}" aceitou o seu pedido de compra! Clique para aceder ao canal de negociação.`,
      type: 'ORDER',
      orderId: orderId,
      productId: order.productId,
      timestamp: new Date(),
      read: false
    };
    
    setUsersDB(prevDB => prevDB.map(u => {
      if (u.id === buyerId) {
        const updatedBuyer = {
          ...u,
          notifications: [buyerNotification, ...(u.notifications || [])]
        };
        saveUser(updatedBuyer); // Firestore Sync
        return updatedBuyer;
      }
      return u;
    }));
    
    // Atualizar notificações locais do currentUser também se ele for o comprador (autocompra)
    if (currentUser && currentUser.id === buyerId) {
      setCurrentUser(prevUser => prevUser ? {
        ...prevUser,
        notifications: [buyerNotification, ...(prevUser.notifications || [])]
      } : null);
    }
    
    setPayFeedback({
      msg: '🚀 Negócio Aceite! O comprador foi notificado para combinarem a entrega.',
      type: 'info'
    });
    setTimeout(() => setPayFeedback({msg: '', type: null}), 3500);

    try {
      const acceptedOrder: Order = { ...order, status: 'ACCEPTED' };
      await saveOrder(acceptedOrder);
      await saveMessage(confirmMessage);
      logSystemAction('WALLET_TRANSACTION', `Transação ACEITE e APROVADA: Venda de "${order.productName}" confirmada pelo vendedor`, sellerId, currentUser?.name);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'REJECTED' as const } : o);
    setOrders(updatedOrders);
    
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    const buyerId = order.buyerId || 'u-joao';
    const sellerId = currentUser?.id || 's1';
    
    const updatedMessages = messages.map(m => {
      if (m.order && m.order.id === orderId) {
        return {
          ...m,
          order: { ...m.order, status: 'REJECTED' as const }
        };
      }
      return m;
    });
    
    const rejectMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: sellerId,
      receiverId: buyerId,
      productId: order.productId,
      text: `❌ O vendedor recusou a solicitação de compra para "${order.productName}".`,
      timestamp: new Date()
    };
    
    setMessages([rejectMessage, ...updatedMessages]);
    
    const buyerNotification: Notification = {
      id: 'not-' + Math.random().toString(36).substr(2, 9),
      title: 'Solicitação Recusada ❌',
      message: `Infelizmente, o vendedor recusou o seu pedido de compra para "${order.productName}".`,
      type: 'ORDER',
      orderId: orderId,
      productId: order.productId,
      timestamp: new Date(),
      read: false
    };
    
    setUsersDB(prevDB => prevDB.map(u => {
      if (u.id === buyerId) {
        const updatedBuyer = {
          ...u,
          notifications: [buyerNotification, ...(u.notifications || [])]
        };
        saveUser(updatedBuyer); // Firestore Sync
        return updatedBuyer;
      }
      return u;
    }));
    
    if (currentUser && currentUser.id === buyerId) {
      setCurrentUser(prevUser => prevUser ? {
        ...prevUser,
        notifications: [buyerNotification, ...(prevUser.notifications || [])]
      } : null);
    }
    
    setPayFeedback({
      msg: 'Solicitação recusada.',
      type: 'error'
    });
    setTimeout(() => setPayFeedback({msg: '', type: null}), 3000);

    try {
      const rejectedOrder: Order = { ...order, status: 'REJECTED' };
      await saveOrder(rejectedOrder);
      await saveMessage(rejectMessage);
      logSystemAction('WALLET_TRANSACTION', `Transação RECUSADA / REJEITADA: Compra de "${order.productName}" recusada pelo vendedor`, sellerId, currentUser?.name);
    } catch (err) {
      console.error(err);
    }
  };

  const handleModalOption = (opt: any) => {
    const shortName = lastUserName.split(' ')[0];

    if (opt === 'LOGIN') {
      setView('LOGIN');
      setIsGuestLooking(false);
      setShowPersuasionModal(false);
    } else if (opt === 'REGISTER') {
      setView('REGISTER');
      setIsGuestLooking(false);
      setShowPersuasionModal(false);
    } else if (opt === 'LOOK') {
      setIsGuestLooking(true);
      setShowPersuasionModal(false);
      setView('HOME');
    } else if (opt === 'CLOSE') {
      setWelcomeMode(null);
      setShowLogoutModal(false);
    } else if (opt === 'CREATE_OTHER') {
      setTransitionMsg(`Entendi, ${shortName}! Vou te levar para criar uma nova conta.`);
      setTimeout(() => {
        setTransitionMsg('');
        setShowLogoutModal(false);
        setView('REGISTER');
      }, 1500);
    } else if (opt === 'LOGIN_OTHER') {
      setTransitionMsg(`Perfeito, ${shortName}! Preparando o login noutra conta.`);
      setTimeout(() => {
        setTransitionMsg('');
        setShowLogoutModal(false);
        setView('LOGIN');
      }, 1500);
    } else if (opt === 'DELETE_START') {
      setShowLogoutModal(false);
      setShowDeleteModal(true);
    } else if (opt === 'DELETE_CANCEL') {
      setShowDeleteModal(false);
      setShowLogoutModal(true);
    }
  };

  const handleDeleteAccount = (phone: string, pass: string) => {
    const userToDelete = usersDB.find(u => u.phone === phone && u.password === encodePassword(pass));
    const shortName = lastUserName.split(' ')[0];

    if (userToDelete) {
      const newDB = usersDB.filter(u => u.id !== userToDelete.id);
      setUsersDB(newDB);
      setTransitionMsg(`${shortName}, a tua conta foi eliminada permanentemente. Obrigado por teres usado o Pay.`);
      setTimeout(() => {
        setTransitionMsg('');
        setShowDeleteModal(false);
        setView('HOME');
      }, 3000);
    } else {
      setDeleteError('Dados incorretos. A eliminação falhou por segurança.');
      setTimeout(() => setDeleteError(''), 3000);
    }
  };

  // --- Mensagens Filtradas por Sala (Negócio Específico) ---
  const filteredMessages = useMemo(() => {
    if (!currentUser) return [];
    
    // Se houver chat específico selecionado
    if (activeChatUserId && activeProductId) {
      return messages.filter(m => 
        (m.senderId === currentUser.id && m.receiverId === activeChatUserId && m.productId === activeProductId) ||
        (m.senderId === activeChatUserId && m.receiverId === currentUser.id && m.productId === activeProductId) ||
        (m.senderId === 'system' && m.productId === activeProductId)
      );
    }
    
    // Fallback: mostrar mensagens de qualquer negócio ativo do usuário atual
    const myOrders = orders.filter(o => o.buyerId === currentUser.id || o.sellerId === currentUser.id);
    if (myOrders.length > 0) {
      const latestOrder = myOrders[0];
      const otherId = currentUser.id === latestOrder.sellerId ? latestOrder.buyerId : latestOrder.sellerId;
      return messages.filter(m => 
        (m.senderId === currentUser.id && m.receiverId === otherId && m.productId === latestOrder.productId) ||
        (m.senderId === otherId && m.receiverId === currentUser.id && m.productId === latestOrder.productId) ||
        (m.senderId === 'system' && m.productId === latestOrder.productId)
      );
    }
    
    // Fallback de segurança para mensagens legadas
    return messages.filter(m => 
      !m.receiverId || m.senderId === currentUser.id || m.receiverId === currentUser.id || m.senderId === 'system'
    );
  }, [messages, currentUser, activeChatUserId, activeProductId, orders]);

  const handleSendMessage = async (text: string) => {
    if (!currentUser) return;
    
    let targetUser = activeChatUserId;
    let targetProduct = activeProductId;
    
    // Se não houver chat ativo selecionado, encontrar por ordem
    if (!targetUser || !targetProduct) {
      const myOrders = orders.filter(o => o.buyerId === currentUser.id || o.sellerId === currentUser.id);
      if (myOrders.length > 0) {
        const latestOrder = myOrders[0];
        targetUser = currentUser.id === latestOrder.sellerId ? latestOrder.buyerId : latestOrder.sellerId;
        targetProduct = latestOrder.productId;
      }
    }
    
    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      senderId: currentUser.id,
      receiverId: targetUser || 'system',
      productId: targetProduct || 'general',
      text,
      timestamp: new Date()
    };
    
    setMessages(prev => [newMsg, ...prev]);
    
    // Notificar destinatário
    if (targetUser && targetUser !== 'system') {
      const msgNotification: Notification = {
        id: 'not-' + Math.random().toString(36).substr(2, 9),
        title: 'Nova Mensagem! 💬',
        message: `${currentUser.name} enviou uma mensagem para si.`,
        type: 'MESSAGE',
        orderId: orders.find(o => o.productId === targetProduct && (o.buyerId === currentUser.id || o.sellerId === currentUser.id))?.id,
        productId: targetProduct,
        timestamp: new Date(),
        read: false
      };
      
      setUsersDB(prevDB => prevDB.map(u => {
        if (u.id === targetUser) {
          const updatedTarget = {
            ...u,
            notifications: [msgNotification, ...(u.notifications || [])]
          };
          saveUser(updatedTarget); // Firestore Sync
          return updatedTarget;
        }
        return u;
      }));
    }

    try {
      await saveMessage(newMsg);
      logSystemAction('MESSAGING', `Mensagem enviada com sucesso para o canal do chat de negociação`, currentUser.id, currentUser.name);
    } catch (err) {
      console.error("Erro ao guardar mensagem no Firestore:", err);
    }
  };

  const handleNotificationClick = async (notifId: string) => {
    if (!currentUser) return;
    
    // Marcar como lido nas notificações atuais
    const updatedNotifications = (currentUser.notifications || []).map(n => 
      n.id === notifId ? { ...n, read: true } : n
    );
    const updatedUser = { ...currentUser, notifications: updatedNotifications };
    setCurrentUser(updatedUser);
    
    // Marcar como lido no banco de dados geral
    setUsersDB(prevDB => prevDB.map(u => u.id === currentUser.id ? updatedUser : u));
    
    try {
      await saveUser(updatedUser); // Sincronização Firestore
    } catch (err) {
      console.error("Erro ao marcar notificação como lida no Firestore:", err);
    }
    
    // Redirecionamento com base no tipo de notificação
    const notif = currentUser.notifications.find(n => n.id === notifId);
    if (notif && notif.orderId) {
      const order = orders.find(o => o.id === notif.orderId);
      if (order) {
        const otherUserId = currentUser.id === order.sellerId ? order.buyerId : order.sellerId;
        setActiveChatUserId(otherUserId || null);
        setActiveProductId(order.productId);
        setView('CHAT');
        setShowNotifications(false);
        setPayFeedback({
          msg: `Direcionado para a negociação de "${order.productName}"!`,
          type: 'info'
        });
        setTimeout(() => setPayFeedback({msg: '', type: null}), 3000);
      }
    } else if (notif && notif.productId) {
      // Se tiver produto mas não ordem, abrir chat do produto
      const prod = products.find(p => p.id === notif.productId);
      if (prod) {
        setActiveChatUserId(prod.seller.id);
        setActiveProductId(prod.id);
        setView('CHAT');
        setShowNotifications(false);
      }
    } else if (notif && notif.type === 'TRUST' && notif.trusterId) {
      const truster = usersDB.find(u => u.id === notif.trusterId);
      if (truster) {
        const sellerFromUser = {
          id: truster.id,
          name: truster.name,
          fullName: truster.name,
          avatar: truster.avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150`,
          rating: truster.rating || 5.0,
          reviewsCount: 0,
          phone: truster.phone,
          location: `${truster.district} (${truster.province})`,
          isVip: truster.isVip || false,
          complaintsCount: 0,
          blocked: false
        };
        setSelectedSeller(sellerFromUser);
        setView('SELLER_DETAIL');
        setShowNotifications(false);
        setPayFeedback({
          msg: `A visualizar o perfil de ${truster.name}, que confiou em si! 🤝`,
          type: 'info'
        });
        setTimeout(() => setPayFeedback({msg: '', type: null}), 3500);
      }
    }
  };

  return (
    <div className="min-h-screen">
      {/* FEEDBACK DE TRANSIÇÃO DO PAY (BACKEND SIMULATED) */}
      {transitionMsg && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/85 backdrop-blur-lg animate-fadeIn p-8">
           <div className="bg-[#F9E4B7] p-12 rounded-[3rem] border-4 border-white shadow-[0_50px_100px_rgba(0,0,0,0.5)] text-center max-w-lg transform scale-110">
              <i className="fa-solid fa-wand-magic-sparkles text-green-700 text-5xl mb-8 animate-bounce"></i>
              <p className="font-pay-serif text-3xl text-slate-900 leading-tight italic font-black">"{transitionMsg}"</p>
           </div>
        </div>
      )}

      {/* MODAL BLOQUEADOR INICIAL */}
      {!isLoggedIn && !isGuestLooking && !showLogoutModal && !showDeleteModal && view === 'HOME' && (
        <PayBlockingModal onOptionSelect={handleModalOption} />
      )}

      {/* MODAL DE PERSUASÃO */}
      {showPersuasionModal && (
        <PayBlockingModal onOptionSelect={handleModalOption} persuasionMode={true} />
      )}

      {/* MODAL DE BOAS-VINDAS PÓS AUTH */}
      {welcomeMode && currentUser && (
        <PayBlockingModal 
          onOptionSelect={handleModalOption} 
          isWelcome={true} 
          welcomeType={welcomeMode}
          userName={currentUser.name}
          timeOffline={timeOffline}
          notificationsCount={currentUser.notifications.length}
          messagesCount={messages.filter(m => m.senderId !== 'me').length}
        />
      )}

      {/* MODAL DE LOGOUT (PAY CONSCIÊNCIA ATIVA) */}
      {showLogoutModal && (
        <PayBlockingModal 
          onOptionSelect={handleModalOption}
          isLogout={true}
          userName={lastUserName}
        />
      )}

      {/* SUB-MODAL DE ELIMINAÇÃO */}
      {showDeleteModal && (
        <PayBlockingModal 
          onOptionSelect={handleModalOption}
          isDeleteConfirm={true}
          userName={lastUserFullName}
          onDeleteValidate={handleDeleteAccount}
          deleteError={deleteError}
        />
      )}

      <Header 
        onMenuClick={() => setIsMenuOpen(true)} 
        onProfileClick={() => setView('PROFILE')} 
        onNotificationClick={() => setShowNotifications(true)}
        isLoggedIn={isLoggedIn} 
        user={currentUser} 
      />

      {/* BARRA DE SIMULAÇÃO DE MULTI-CONTAS BAZAMOS PAY */}
      {isLoggedIn && (
        <div className="bg-amber-500 text-slate-950 px-8 py-3 flex flex-wrap items-center justify-between gap-4 text-xs font-black uppercase tracking-wider border-b border-amber-600/20 shadow-sm relative z-[1001] mt-32 md:mt-0">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-gears text-sm text-amber-950 animate-spin" style={{ animationDuration: '6s' }}></i>
            <span>Painel Simulador Pay:</span>
            <span className="bg-amber-950 text-amber-400 py-0.5 px-2 rounded-full text-[8px]">Simulador Multi-Contas ⚙️</span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] text-amber-950 font-bold mr-1">Alterar Usuário:</span>
            
            <button 
              onClick={() => {
                const target = usersDB.find(u => u.phone === '840000000');
                if (target) {
                  setCurrentUser(target);
                  setPayFeedback({ msg: 'Simulando como Comprador: João Silva 🛒', type: 'info' });
                  setTimeout(() => setPayFeedback({msg:'', type:null}), 2500);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-[8px] font-black transition ${currentUser?.phone === '840000000' ? 'bg-amber-950 text-amber-400' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}`}
            >
              João Silva 🛒 (Comprador)
            </button>
            
            <button 
              onClick={() => {
                const target = usersDB.find(u => u.phone === '841234567');
                if (target) {
                  setCurrentUser(target);
                  setPayFeedback({ msg: 'Simulando como Vendedor: Eletro Store 🏪', type: 'info' });
                  setTimeout(() => setPayFeedback({msg:'', type:null}), 2500);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-[8px] font-black transition relative ${currentUser?.phone === '841234567' ? 'bg-amber-950 text-amber-400' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}`}
            >
              Eletro Store 🏪 (Vendedor)
              {usersDB.find(u => u.phone === '841234567')?.notifications?.filter(n => !n.read).length ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
              ) : null}
              {usersDB.find(u => u.phone === '841234567')?.notifications?.filter(n => !n.read).length ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full text-[7px] text-white flex items-center justify-center font-bold">
                  {usersDB.find(u => u.phone === '841234567')?.notifications?.filter(n => !n.read).length}
                </span>
              ) : null}
            </button>

            <button 
              onClick={() => {
                const target = usersDB.find(u => u.phone === '829876543');
                if (target) {
                  setCurrentUser(target);
                  setPayFeedback({ msg: 'Simulando como Vendedor: Nelo Tech 🏪', type: 'info' });
                  setTimeout(() => setPayFeedback({msg:'', type:null}), 2500);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-[8px] font-black transition relative ${currentUser?.phone === '829876543' ? 'bg-amber-950 text-amber-400' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}`}
            >
              Nelo Tech 🏪 (Vendedor)
              {usersDB.find(u => u.phone === '829876543')?.notifications?.filter(n => !n.read).length ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
              ) : null}
              {usersDB.find(u => u.phone === '829876543')?.notifications?.filter(n => !n.read).length ? (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full text-[7px] text-white flex items-center justify-center font-bold">
                  {usersDB.find(u => u.phone === '829876543')?.notifications?.filter(n => !n.read).length}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      )}

      {/* DIÁLOGO DE CONFIRMAÇÃO DE LOGOUT */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-md text-center border-4 border-slate-100">
             <i className="fa-solid fa-door-open text-slate-300 text-5xl mb-8"></i>
             <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Confirmar Saída</h3>
             <p className="text-xs font-bold text-slate-500 leading-relaxed mb-10">
               Tem certeza de que deseja encerrar a sessão (logout)? Após confirmar, terá de fazer login novamente.
             </p>
             <div className="flex flex-col gap-3">
               <button 
                onClick={executeLogout} 
                className="w-full bg-red-600 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-[0.4em] shadow-lg hover:bg-black transition"
               >
                 Confirmar Encerramento
               </button>
               <button 
                onClick={() => setShowLogoutConfirm(false)} 
                className="w-full bg-slate-100 text-slate-400 font-black py-6 rounded-2xl uppercase text-[10px] tracking-[0.4em] hover:bg-slate-200 transition"
               >
                 Cancelar
               </button>
             </div>
          </div>
        </div>
      )}

      {showNotifications && currentUser && (
        <NotificationPanel 
          notifications={currentUser.notifications || []} 
          onClose={() => setShowNotifications(false)} 
          onMarkAsRead={handleNotificationClick}
        />
      )}

      <main className={`pt-32 md:pt-44 pb-24 ${!isLoggedIn ? 'bg-slate-50' : ''}`}>
        
        {/* VIEW: LOGIN */}
        {view === 'LOGIN' && !isLoggedIn && (
          <div className="max-w-xl mx-auto p-10 md:p-16 animate-fadeIn mt-10">
            <div className="bg-white rounded-[3rem] md:rounded-[4rem] shadow-2xl border-4 border-slate-100 p-10 md:p-14">
              <div className="text-center mb-10">
                <i className="fa-solid fa-shield-halved text-green-700 text-5xl mb-6"></i>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Protocolo de Acesso</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">A sua conta está protegida com segurança máxima.</p>
              </div>

              {payFeedback.msg && (
                <div className={`mb-8 p-6 rounded-2xl border-2 font-bold text-xs ${payFeedback.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-blue-50 border-blue-100 text-blue-600'}`}>
                  <i className={`fa-solid ${payFeedback.type === 'error' ? 'fa-triangle-exclamation' : 'fa-info-circle'} mr-3`}></i>
                  {payFeedback.msg}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Número Registado</label>
                  <input 
                    type="tel" 
                    value={loginPhone} 
                    onChange={e => setLoginPhone(e.target.value)} 
                    placeholder="8X 000 0000" 
                    className={`w-full p-6 rounded-2xl bg-slate-50 border-2 font-black text-black outline-none focus:border-green-600 transition ${savedPhone === loginPhone ? 'border-green-200' : 'border-slate-100'}`} 
                    required 
                  />
                  {savedPhone === loginPhone && <p className="text-[8px] font-black text-green-700 uppercase ml-4">Conta reconhecida neste dispositivo</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Senha Segura</label>
                  <input 
                    type="password" 
                    value={loginPassword} 
                    onChange={e => setLoginPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black text-black outline-none focus:border-green-600 transition" 
                    required 
                  />
                </div>
                <button type="submit" className="w-full bg-green-700 text-white font-black py-6 rounded-2xl uppercase tracking-[0.3em] text-[10px] shadow-xl hover:bg-black transition-all">Validar Credenciais</button>
              </form>

              <div className="mt-10 pt-8 border-t text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ainda não tem conta oficial?</p>
                <button onClick={() => { setView('REGISTER'); setPayFeedback({msg: '', type: null}); }} className="text-green-700 font-black uppercase text-[10px] tracking-widest hover:underline">Registar Novo Perfil</button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: REGISTER */}
        {view === 'REGISTER' && !isLoggedIn && (
          <div className="max-w-2xl mx-auto p-10 md:p-16 animate-fadeIn mt-6">
            <div className="bg-white rounded-[3rem] md:rounded-[4rem] shadow-2xl border-4 border-slate-100 p-10 md:p-14">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-center mb-10">Criação de Canal Seguro</h2>
              
              {payFeedback.msg && (
                <div className="mb-8 p-6 rounded-2xl bg-red-50 border-2 border-red-100 text-red-600 font-bold text-xs">
                  <i className="fa-solid fa-triangle-exclamation mr-3"></i>
                  {payFeedback.msg}
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase ml-4 text-slate-400">Nome Completo</label><input type="text" value={regName} onChange={e => setRegName(e.target.value)} placeholder="Ex: João Silva" className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black" required /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase ml-4 text-slate-400">Telemóvel</label><input type="tel" value={regPhone} onChange={e => setRegPhone(e.target.value)} placeholder="84..." className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black" required /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase ml-4 text-slate-400">Definir Senha</label><input type="password" value={regPassword} onChange={e => setRegPassword(e.target.value)} className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black" required /></div>
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase ml-4 text-slate-400">Província</label><select value={regProvince} onChange={e => { setRegProvince(e.target.value); setRegDistrict(''); }} className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black" required><option value="">Selecionar Província</option>{Object.keys(MOZAMBIQUE_DATA).map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                   <div className="space-y-2"><label className="text-[10px] font-black uppercase ml-4 text-slate-400">Distrito</label><select value={regDistrict} onChange={e => setRegDistrict(e.target.value)} className="w-full p-6 rounded-2xl bg-slate-50 border-2 border-slate-100 font-black" required disabled={!regProvince}><option value="">Selecionar Distrito</option>{regProvince && MOZAMBIQUE_DATA[regProvince].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white font-black py-7 rounded-2xl uppercase tracking-[0.4em] text-[10px] shadow-2xl hover:bg-green-700 transition-all mt-6">Ativar Nova Conta</button>
              </form>
              <button onClick={() => { setView('LOGIN'); setPayFeedback({msg: '', type: null}); }} className="w-full mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-black transition">Voltar ao Acesso</button>
            </div>
          </div>
        )}

        {/* --- MERCADO --- */}
        {view === 'HOME' && (
          <div className="animate-fadeIn max-w-7xl mx-auto px-4 md:px-6 space-y-8">
            {/* CABEÇALHO COMPACTO DE FEED COM FILTRO EM PILULAS (MAIS ESPAÇO) */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-700">
                  <i className="fa-solid fa-map-location-dot text-lg"></i>
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-xs text-slate-900">Proximidade</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {filterProvince ? (
                      <span>Região ativa: <strong className="text-slate-700">{filterDistrict ? `${filterDistrict}, ` : ''}{filterProvince}</strong></span>
                    ) : (
                      <span>Exibindo todo o país</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {filterProvince && (
                  <button 
                    onClick={() => {
                      setFilterProvince('');
                      setFilterDistrict('');
                    }}
                    className="bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-xl font-black uppercase text-[8px] tracking-widest flex items-center gap-1.5 transition"
                    title="Remover filtro"
                  >
                    <i className="fa-solid fa-circle-xmark"></i>
                    <span>Ver Todo Moçambique</span>
                  </button>
                )}
                
                <button 
                  onClick={() => setIsMenuOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-black uppercase text-[8px] tracking-widest flex items-center gap-1.5 border border-slate-200 transition"
                >
                  <i className="fa-solid fa-sliders text-green-700"></i>
                  <span>Ajustar Região</span>
                </button>
              </div>
            </div>

            {vipProducts.length > 0 && (
              <VipGrid products={filteredProducts} onProductClick={handleProductClick} onSellerClick={handleSellerClick} />
            )}

            <div className="space-y-6">
              <h2 className="font-black uppercase tracking-tighter text-xl text-slate-900 border-b pb-3 border-slate-100 flex items-center gap-2">
                <i className="fa-solid fa-store text-green-700"></i>
                <span>Artigos Disponíveis</span>
              </h2>

              {filteredProducts.length === 0 ? (
                <div className="text-center p-12 md:p-20 bg-white border border-slate-100 rounded-[3rem] shadow-sm max-w-2xl mx-auto space-y-6 animate-fadeIn">
                  <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-amber-500">
                    <i className="fa-solid fa-map-pin-slash text-3xl"></i>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black uppercase tracking-tight text-lg text-slate-900">Nenhum Artigo Encontrado</h3>
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">
                      Não existem produtos ativos registados em <strong className="text-slate-800">{filterDistrict || 'este distrito'}, {filterProvince || 'esta província'}</strong>.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center pt-2">
                    <button 
                      onClick={() => {
                        setFilterDistrict('');
                      }}
                      className="bg-green-700 text-white hover:bg-green-800 px-6 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest transition"
                    >
                      Ver Toda Província de {filterProvince}
                    </button>
                    <button 
                      onClick={() => {
                        setFilterProvince('');
                        setFilterDistrict('');
                      }}
                      className="bg-slate-900 text-white hover:bg-black px-6 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest transition"
                    >
                      Explorar Todo Moçambique
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:gap-8 lg:gap-12">
                  {filteredProducts.map(p => (
                    <ProductCardComponent key={p.id} product={p} onClick={handleProductClick} onSellerClick={handleSellerClick} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {isLoggedIn && view === 'PROFILE' && currentUser && (
          <UserProfile 
            user={currentUser} 
            onLogout={() => setShowLogoutConfirm(true)} 
            onOpenChat={() => setView('CHAT')} 
            onUpdateProfile={handleUpdateProfile} 
            orders={orders}
            products={products}
            systemLogs={dbLogs}
            allUsers={usersDB}
            onToggleUserBlock={handleToggleUserBlock}
            onUpdateAnyUser={handleUpdateAnyUser}
            onDeleteProduct={handleDeleteProduct}
            onAcceptOrder={handleAcceptOrder}
            onRejectOrder={handleRejectOrder}
          />
        )}

        {isLoggedIn && view === 'CHAT' && (
          <ChatSystem 
            messages={filteredMessages} 
            currentUserId={currentUser?.id}
            onSendMessage={handleSendMessage} 
            onBack={() => setView('HOME')} 
            onAcceptOrder={handleAcceptOrder}
            onRejectOrder={handleRejectOrder}
          />
        )}

        {isLoggedIn && view === 'PUBLISH' && (
          <PublishForm onComplete={async (p) => {
            try {
              await saveProduct(p);
              setProducts([p, ...products]);
              logSystemAction('PUBLISH_PRODUCT', `Novo produto publicado na vitrine: ${p.name} (${p.price.toLocaleString('pt-PT')} MT)`, currentUser?.id, currentUser?.name);
              setView('HOME');
            } catch (err) {
              console.error("Erro ao guardar produto no Firestore:", err);
            }
          }} />
        )}

        {view === 'PRODUCT_DETAIL' && selectedProduct && (
          <ProductDetail 
            product={selectedProduct} 
            isLoggedIn={isLoggedIn}
            currentUser={currentUser}
            onBack={() => setView('HOME')} 
            onOrder={handleOrderSubmit} 
            onChat={() => interceptAction(() => {
              setActiveChatUserId(selectedProduct.seller.id);
              setActiveProductId(selectedProduct.id);
              setView('CHAT');
            })} 
            onSellerView={handleSellerClick} 
            onSendDeliveryAlert={handleSendDeliveryAlert}
          />
        )}

        {view === 'SELLER_DETAIL' && selectedSeller && (
          <SellerProfile 
            seller={selectedSeller} 
            products={products} 
            onProductClick={handleProductClick} 
            onBack={() => setView('HOME')}
            isTrusted={currentUser ? currentUser.trustedSellerIds.includes(selectedSeller.id) : false}
            onToggleTrust={handleToggleTrust}
            onRate={handleRateSeller}
            onReport={handleReportSeller}
          />
        )}

        {isLoggedIn && view === 'ASK_PAY' && (
          <PayAssistant userName={currentUser?.name || ''} province={currentUser?.province || ''} totalUsers={usersDB.length} provinceUsers={usersDB.filter(u => u.province === currentUser?.province).length} onClose={() => setView('HOME')} />
        )}
      </main>

      {/* MENU LATERAL */}
      <div className={`fixed inset-0 bg-slate-950/80 z-[8000] transition-opacity duration-500 backdrop-blur-sm ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)}>
        <aside className={`absolute top-0 left-0 w-80 md:w-96 h-full bg-white shadow-2xl transition-transform duration-500 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="p-10 border-b bg-slate-50 flex justify-between items-center">
            <Logo />
            <button onClick={() => setIsMenuOpen(false)} className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition"><i className="fa-solid fa-xmark text-2xl"></i></button>
          </div>
          
          <nav className="flex-1 p-8 space-y-2 overflow-y-auto">
             <button onClick={() => {setView('HOME'); setIsMenuOpen(false);}} className="w-full text-left p-5 rounded-2xl flex items-center space-x-4 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition"><i className="fa-solid fa-house-chimney opacity-30"></i><span>Painel Principal</span></button>
             <button onClick={() => {interceptAction(() => {setView('PROFILE'); setIsMenuOpen(false);})}} className="w-full text-left p-5 rounded-2xl flex items-center space-x-4 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition"><i className="fa-solid fa-id-card opacity-30"></i><span>Perfil Oficial</span></button>
             <button onClick={() => {interceptAction(() => {setView('PUBLISH'); setIsMenuOpen(false);})}} className="w-full text-left p-5 rounded-2xl flex items-center space-x-4 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition"><i className="fa-solid fa-plus-circle opacity-30 text-green-700"></i><span className="text-green-700">Publicar Artigo</span></button>
             <button onClick={() => {interceptAction(() => {setView('ASK_PAY'); setIsMenuOpen(false);})}} className="w-full text-left p-5 rounded-2xl flex items-center space-x-4 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition"><i className="fa-solid fa-robot opacity-30 text-blue-600"></i><span className="text-blue-600">Assistente Pay</span></button>
             
             {/* FILTRO DE PROXIMIDADE NO PAINEL DE CONTROLE */}
             <div className="pt-6 mt-4 border-t border-slate-100 space-y-4">
               <div className="flex items-center gap-2 text-green-700 ml-4">
                 <i className="fa-solid fa-map-location-dot"></i>
                 <h4 className="text-[9px] font-black uppercase tracking-widest">Filtro de Proximidade</h4>
               </div>
               
               <div className="px-2 space-y-3">
                 <div className="space-y-1">
                   <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1">Província</label>
                   <select 
                     value={filterProvince} 
                     onChange={e => {
                       setFilterProvince(e.target.value);
                       setFilterDistrict('');
                     }}
                     className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-[11px]"
                   >
                     <option value="">Todo Moçambique</option>
                     {Object.keys(MOZAMBIQUE_DATA).map(p => <option key={p} value={p}>{p}</option>)}
                   </select>
                 </div>

                 <div className="space-y-1">
                   <label className="text-[7px] font-black uppercase tracking-widest text-slate-400 ml-1">Distrito</label>
                   <select 
                     value={filterDistrict} 
                     onChange={e => setFilterDistrict(e.target.value)}
                     disabled={!filterProvince}
                     className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-bold text-[11px] disabled:opacity-50"
                   >
                     <option value="">Todos os Distritos</option>
                     {filterProvince && MOZAMBIQUE_DATA[filterProvince].map(d => <option key={d} value={d}>{d}</option>)}
                   </select>
                 </div>

                 {isLoggedIn && currentUser && (
                   <button 
                     onClick={() => {
                       setFilterProvince(currentUser.province);
                       setFilterDistrict(currentUser.district);
                     }}
                     className="w-full bg-green-50 text-green-700 hover:bg-green-100 p-3 rounded-xl font-black uppercase text-[8px] tracking-widest flex items-center justify-center gap-2 border border-green-100 transition"
                   >
                     <i className="fa-solid fa-location-crosshairs"></i>
                     <span>Usar Meu Endereço</span>
                   </button>
                 )}
               </div>
             </div>

             <div className="pt-8 mt-4 border-t border-slate-100">
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 ml-4">Preferências Visuais</p>
               <div className="grid grid-cols-3 gap-3 px-2">
                 {['default', 'noturno', 'sol'].map((t) => (
                   <button key={t} onClick={() => setTheme(t as Theme)} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${theme === t ? 'border-green-700 bg-green-50' : 'border-slate-50 bg-slate-50'}`}>
                     <i className={`fa-solid ${t === 'default' ? 'fa-sun-bright' : t === 'noturno' ? 'fa-moon' : 'fa-brightness'} mb-2`}></i>
                     <span className="text-[7px] font-black uppercase">{t === 'default' ? 'Padrão' : t === 'noturno' ? 'Noite' : 'Sol'}</span>
                   </button>
                 ))}
               </div>
             </div>
          </nav>

          <div className="p-10 border-t bg-slate-50">
            {isLoggedIn ? (
              <button 
                onClick={() => setShowLogoutConfirm(true)} 
                className="w-full text-left p-6 rounded-[1.5rem] flex items-center space-x-5 font-black uppercase text-[10px] tracking-widest text-red-600 bg-red-50 hover:bg-red-100 transition"
              >
                <i className="fa-solid fa-sign-out-alt"></i><span>Encerrar Canal</span>
              </button>
            ) : (
              <button 
                onClick={() => {setView('LOGIN'); setIsMenuOpen(false);}} 
                className="w-full text-left p-6 rounded-[1.5rem] flex items-center space-x-5 font-black uppercase text-[10px] tracking-widest text-green-700 bg-green-50 hover:bg-green-100 transition"
              >
                <i className="fa-solid fa-user-lock"></i><span>Aceder</span>
              </button>
            )}
          </div>
        </aside>
      </div>

       {/* MODAL SERNIC - ALERTA DE SEGURANÇA NACIONAL */}
       {showSernicModal && blockedSellerInfo && (
         <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-red-950/90 backdrop-blur-xl animate-fadeIn">
           <div className="bg-white rounded-[3rem] border-4 border-red-600 shadow-2xl max-w-2xl w-full overflow-hidden relative">
             <div className="bg-red-700 p-8 text-white text-center space-y-2 relative overflow-hidden">
               {/* Efeito de sirene de polícia */}
               <div className="absolute inset-0 bg-red-500 opacity-20 animate-pulse pointer-events-none"></div>
               <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                 <i className="fa-solid fa-handcuffs text-3xl animate-bounce"></i>
               </div>
               <p className="text-[9px] font-black uppercase tracking-[0.3em] text-red-100">República de Moçambique</p>
               <h2 className="text-2xl font-black uppercase tracking-tighter">SERNIC - ALERTA DE FRAUDE DETETADA</h2>
               <p className="text-[8px] font-bold uppercase tracking-widest bg-red-900/40 py-1.5 px-4 rounded-full inline-block">Ação Criminal Imediata</p>
             </div>

             <div className="p-8 md:p-10 space-y-6">
               <div className="space-y-4">
                 <p className="text-xs text-slate-600 font-bold leading-relaxed">
                   O vendedor <strong className="text-red-700 uppercase">{blockedSellerInfo.name}</strong> foi detetado como autor de tentativas de fraude e burlas repetidas (5 denúncias validadas).
                 </p>
                 <div className="p-6 bg-red-50 border border-red-100 rounded-2xl space-y-3">
                   <p className="text-[10px] font-black uppercase text-red-800 tracking-wider">
                     <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                     Protocolo Penal Ativo:
                   </p>
                   <ul className="text-[11px] font-bold text-red-900/80 space-y-1.5 list-disc pl-5">
                     <li>O vendedor foi banido permanentemente de toda a rede comercial Moçambicana.</li>
                     <li>Todas as publicações do infrator foram destruídas automaticamente de forma irreversível.</li>
                     <li>A identidade e o telemóvel registado (<strong className="underline">{blockedSellerInfo.phone}</strong>) foram transmitidos para a central do SERNIC.</li>
                     <li>Investigação oficial aberta sob a Lei dos Crimes Cibernéticos e Fraude Eletrónica de Moçambique.</li>
                   </ul>
                 </div>
               </div>

               {/* Ofício de Acionamento do SERNIC */}
               <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-2xl space-y-2 font-mono text-[9px] text-yellow-950">
                 <p className="font-black text-center border-b border-yellow-300 pb-2 uppercase tracking-widest text-[10px]">Ofício Digital Nº 847/SERNIC/GP/{new Date().getFullYear()}</p>
                 <p><strong>RE:</strong> Mandado de Localização e Identificação de Infrator Comercial.</p>
                 <p><strong>ALVO:</strong> {blockedSellerInfo.name}</p>
                 <p><strong>CONTATO DE ALERTA:</strong> {blockedSellerInfo.phone}</p>
                 <p><strong>COBERTURA DE REDE:</strong> Rastreando última torre celular...</p>
                 <p className="text-slate-400 text-center text-[7px] pt-2 italic">Assinado Eletronicamente por Protocolo Automático de Segurança Pay</p>
               </div>

               <div className="flex gap-3">
                 <button 
                   onClick={() => setShowSernicModal(false)}
                   className="flex-1 bg-red-600 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-lg active:scale-95"
                 >
                   Confirmar & Manter o Mercado Seguro
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Elemento de Áudio Oculto para Alarme SERNIC */}
       <audio id="alarm-sound" src="https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav" preload="auto" />
    </div>
  );
};

export default App;
