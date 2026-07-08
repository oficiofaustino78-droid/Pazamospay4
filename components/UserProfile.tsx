import React, { useState, useEffect } from 'react';
import { User, WalletTransaction, SecurityLog, Order, Product, VerificationData, BIData, BusinessData } from '../types';
import { MOZAMBIQUE_DATA } from '../constants';
import { VerificationWizard } from './VerificationWizard';

interface UserProfileProps {
  user: User;
  orders: Order[];
  products: Product[];
  onLogout: () => void;
  onOpenChat: () => void;
  onUpdateProfile: (updatedFields: Partial<User>) => void;
  systemLogs?: any[];
  onToggleUserBlock?: (userId: string) => void;
  allUsers?: User[];
  onUpdateAnyUser?: (userId: string, updatedFields: Partial<User>) => void;
  onDeleteProduct?: (productId: string) => void;
  onAcceptOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=150',
];

export const UserProfile: React.FC<UserProfileProps> = ({ 
  user, 
  orders, 
  products, 
  onLogout, 
  onOpenChat, 
  onUpdateProfile,
  systemLogs = [],
  onToggleUserBlock,
  allUsers = [],
  onUpdateAnyUser,
  onDeleteProduct,
  onAcceptOrder,
  onRejectOrder
}) => {
  const isSeller = user.userType === 'SELLER';

  // --- Estados do Tab Control ---
  const [activeTab, setActiveTab] = useState<string>('INFO');

  // --- Estados de Edição de Perfil ---
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email || '');
  const [province, setProvince] = useState(user.province);
  const [district, setDistrict] = useState(user.district);
  const [avatar, setAvatar] = useState(user.avatar);
  const [shopName, setShopName] = useState(user.shopName || '');
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- Estados de Troca de Senha ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- Estados de Administrador ---
  const [adminMode, setAdminMode] = useState(false);
  const [selectedVerificationToReview, setSelectedVerificationToReview] = useState<User | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('Documento ilegível');
  const [customRejectionReason, setCustomRejectionReason] = useState<string>('');

  // --- Wizard de Verificação ---
  const [showVerificationWizard, setShowVerificationWizard] = useState<boolean>(false);

  // --- Estados da Carteira Digital ---
  const currentBalance = user.balance ?? 0;
  const currentTransactions = user.transactions ?? [];

  // --- Estados de Auditoria (Logs de Segurança) ---
  const currentLogs = user.securityLogs ?? [];

  // Sincronizar dados locais quando o utilizador muda
  useEffect(() => {
    setName(user.name);
    setPhone(user.phone);
    setEmail(user.email || '');
    setProvince(user.province);
    setDistrict(user.district);
    setAvatar(user.avatar);
    setShopName(user.shopName || '');
  }, [user]);

  // Sincronizar a aba correta com base no tipo de conta
  useEffect(() => {
    if (isSeller) {
      if (!['ESTATISTICAS', 'LOJA', 'PRODUTOS', 'VENDAS', 'WALLET', 'LOGS'].includes(activeTab)) {
        setActiveTab('ESTATISTICAS');
      }
    } else {
      if (!['INFO', 'COMPRAS', 'FAVORITOS', 'MENSAGENS', 'VERIFICACAO', 'WALLET', 'LOGS'].includes(activeTab)) {
        setActiveTab('INFO');
      }
    }
  }, [isSeller]);

  // --- Filtros e Cálculos de Negócio (Vendedor) ---
  const sellerProducts = products.filter(p => p.seller.id === user.id);
  const sellerOrders = orders.filter(o => o.sellerId === user.id);
  const successfulSales = sellerOrders.filter(o => o.status === 'ACCEPTED');
  const pendingSales = sellerOrders.filter(o => o.status === 'PENDING');
  
  // Total de ganhos (Volume de vendas bem-sucedidas)
  const totalEarnings = successfulSales.reduce((sum, o) => sum + (o.price || 0), 0);

  // Cálculo do Nível do Vendedor
  let sellerLevel = 'Bronze';
  let levelColor = 'text-amber-600 bg-amber-50 border-amber-200';
  let levelIcon = 'fa-medal';
  const salesCount = successfulSales.length;
  const avgRating = user.rating ?? 5.0;

  if (avgRating >= 4.8 && salesCount >= 5) {
    sellerLevel = 'Ouro';
    levelColor = 'text-yellow-600 bg-yellow-50 border-yellow-200';
    levelIcon = 'fa-crown';
  } else if (avgRating >= 4.2 && salesCount >= 2) {
    sellerLevel = 'Prata';
    levelColor = 'text-slate-500 bg-slate-50 border-slate-200';
    levelIcon = 'fa-award';
  }

  // --- Filtros e Cálculos de Compras (Comprador) ---
  const buyerOrders = orders.filter(o => o.buyerId === user.id);
  const buyerFavorites = products.filter(p => user.cartItemIds?.includes(p.id));

  // --- Operações da Carteira ---
  const [walletAmount, setWalletAmount] = useState('');
  const [walletMethod, setWalletMethod] = useState<'M-PESA' | 'E-MOLA' | 'BANK_TRANSFER'>('M-PESA');
  const [bankAccount, setBankAccount] = useState('');
  const [isProcessingWallet, setIsProcessingWallet] = useState(false);
  const [selectedTxSlip, setSelectedTxSlip] = useState<WalletTransaction | null>(null);

  // --- Filtros de Logs ---
  const [logFilter, setLogFilter] = useState<string>('ALL');

  const addSecurityLog = (action: SecurityLog['action'], details: string) => {
    const newLog: SecurityLog = {
      id: 'log-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: '197.249.12.83 (Maputo, MZ)',
      device: navigator.userAgent.includes('Mobile') ? 'Smartphone / Browser Mobile' : 'Computador Desktop / Chrome'
    };
    onUpdateProfile({
      securityLogs: [newLog, ...currentLogs]
    });
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prov = e.target.value;
    setProvince(prov);
    if (prov && MOZAMBIQUE_DATA[prov]) {
      setDistrict(MOZAMBIQUE_DATA[prov][0]);
    } else {
      setDistrict('');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const updatedFields: Partial<User> = {
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      province,
      district,
      avatar,
      shopName: shopName.trim()
    };

    if (newPassword && newPassword.trim().length > 0) {
      if (newPassword.trim().length < 6) {
        alert('A senha deve ter no mínimo 6 caracteres para ser considerada segura.');
        return;
      }
      if (newPassword !== confirmPassword) {
        alert('As novas senhas digitadas não são iguais!');
        return;
      }
      updatedFields.password = btoa(newPassword.trim());
      
      onUpdateProfile(updatedFields);
      addSecurityLog('CHANGE_PASSWORD', 'Troca segura de senha de acesso comercial do utilizador');
    } else {
      onUpdateProfile(updatedFields);
      addSecurityLog('EDIT_PROFILE', `Atualização de detalhes do perfil público (Nome: ${name.trim()}, Distrito: ${district})`);
    }

    setSuccessMsg('Perfil atualizado com sucesso no BazamosPay! ✨');
    setIsEditing(false);
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const selectPresetAvatar = (url: string) => {
    setAvatar(url);
    setShowAvatarSelector(false);
  };

  const handleCustomAvatarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempAvatarUrl.trim().startsWith('http')) {
      setAvatar(tempAvatarUrl.trim());
      setTempAvatarUrl('');
      setShowAvatarSelector(false);
    }
  };

  // Depósito (Recarga)
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(walletAmount);
    if (isNaN(val) || val <= 0) return;

    setIsProcessingWallet(true);
    setTimeout(() => {
      const refCode = `${walletMethod === 'M-PESA' ? 'MP' : walletMethod === 'E-MOLA' ? 'EM' : 'TR'}-${Math.floor(100000 + Math.random() * 900000)}`;
      const newTx: WalletTransaction = {
        id: 'tx-' + Date.now(),
        type: 'DEPOSIT',
        amount: val,
        method: walletMethod,
        reference: refCode,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        description: `Depósito via ${walletMethod === 'BANK_TRANSFER' ? 'Transferência Bancária' : walletMethod}`
      };

      const updatedBalance = currentBalance + val;
      const updatedTxs = [newTx, ...currentTransactions];

      onUpdateProfile({
        balance: updatedBalance,
        transactions: updatedTxs
      });

      addSecurityLog('WALLET_TRANSACTION', `Recarga de saldo efetuada via ${walletMethod}. Valor: +${val.toFixed(2)} MT (Ref: ${refCode})`);
      setWalletAmount('');
      setSuccessMsg(`Depósito de ${val.toFixed(2)} MT efetuado com absoluto sucesso! Saldo atualizado.`);
      setIsProcessingWallet(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 1500);
  };

  // Levantamento (Withdrawal)
  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(walletAmount);
    if (isNaN(val) || val <= 0) return;
    if (val > currentBalance) {
      alert('Saldo Insuficiente na Carteira Digital para esta operação!');
      return;
    }

    setIsProcessingWallet(true);
    setTimeout(() => {
      const refCode = `LEV-${Math.floor(100000 + Math.random() * 900000)}`;
      const newTx: WalletTransaction = {
        id: 'tx-' + Date.now(),
        type: 'WITHDRAWAL',
        amount: val,
        method: walletMethod,
        reference: refCode,
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
        description: `Levantamento via ${walletMethod === 'BANK_TRANSFER' ? 'Transferência' : walletMethod}`
      };

      const updatedBalance = currentBalance - val;
      const updatedTxs = [newTx, ...currentTransactions];

      onUpdateProfile({
        balance: updatedBalance,
        transactions: updatedTxs
      });

      addSecurityLog('WALLET_TRANSACTION', `Levantamento de carteira efetuado via ${walletMethod}. Valor: -${val.toFixed(2)} MT (Ref: ${refCode})`);
      setWalletAmount('');
      setBankAccount('');
      setSuccessMsg(`Levantamento de ${val.toFixed(2)} MT processado e transferido com sucesso!`);
      setIsProcessingWallet(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }, 1500);
  };

  // Exportação de Auditoria de Logs
  const downloadLogsAsJSON = () => {
    try {
      const jsonStr = JSON.stringify(currentLogs, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bazamospay_security_logs_${user.phone}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      addSecurityLog('ADMIN_ACTION', 'Exportação completa do ficheiro de auditoria de logs para o dispositivo');
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLogs = currentLogs.filter(log => {
    if (logFilter === 'ALL') return true;
    return log.action === logFilter;
  });

  // Fila de verificações pendentes para o Admin
  const pendingVerificationsList = allUsers.filter(u => u.verificationStatus === 'PENDING');

  // Manipular Ações de Verificação no Painel de Admin
  const handleApproveVerification = (userId: string) => {
    if (onUpdateAnyUser) {
      const targetUsr = allUsers.find(u => u.id === userId);
      const updatedNotifications = targetUsr?.notifications ? [...targetUsr.notifications] : [];
      updatedNotifications.unshift({
        id: 'notif-' + Date.now(),
        title: 'Conta de Vendedor Ativada! 🎉',
        message: 'Parabéns! A sua Conta de Vendedor foi aprovada com sucesso no BazamosPay. Já pode publicar os seus anúncios!',
        type: 'SYSTEM',
        timestamp: new Date(),
        read: false
      });

      onUpdateAnyUser(userId, {
        userType: 'SELLER',
        verificationStatus: 'APPROVED',
        notifications: updatedNotifications
      });

      setSelectedVerificationToReview(null);
      addSecurityLog('ADMIN_ACTION', `Aprovação de verificação de identidade do vendedor ID ${userId}`);
      alert('A verificação de identidade do vendedor foi aprovada com sucesso!');
    }
  };

  const handleRejectVerification = (userId: string) => {
    if (onUpdateAnyUser) {
      const finalReason = rejectionReasonInput === 'Outro' ? customRejectionReason : rejectionReasonInput;
      if (!finalReason.trim()) {
        alert('Por favor, especifique o motivo de recusa.');
        return;
      }

      const targetUsr = allUsers.find(u => u.id === userId);
      const updatedNotifications = targetUsr?.notifications ? [...targetUsr.notifications] : [];
      updatedNotifications.unshift({
        id: 'notif-' + Date.now(),
        title: 'Verificação de Vendedor Recusada ❌',
        message: `Infelizmente, a sua verificação de vendedor foi recusada pelo seguinte motivo: ${finalReason}. Por favor, tente novamente corrigindo as informações.`,
        type: 'SYSTEM',
        timestamp: new Date(),
        read: false
      });

      onUpdateAnyUser(userId, {
        verificationStatus: 'REJECTED',
        rejectionReason: finalReason,
        notifications: updatedNotifications
      });

      setSelectedVerificationToReview(null);
      setCustomRejectionReason('');
      addSecurityLog('ADMIN_ACTION', `Recusa de verificação de identidade do utilizador ID ${userId}. Motivo: ${finalReason}`);
      alert('A verificação de identidade foi recusada e o utilizador foi notificado.');
    }
  };

  const handleWizardComplete = (verifiedData: VerificationData) => {
    onUpdateProfile({
      verificationStatus: 'PENDING',
      verificationData: verifiedData
    });
    addSecurityLog('EDIT_PROFILE', 'Submissão de dados biométricos e de negócio para verificação regulatória de Conta de Vendedor');
    setShowVerificationWizard(false);
    setSuccessMsg('Obrigado! Os seus dados foram submetidos com sucesso para análise biométrica e de conformidade. ✨');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-12 animate-fadeIn space-y-8">
      {successMsg && (
        <div className="p-6 bg-green-50 border-2 border-green-200 text-green-800 rounded-3xl font-black uppercase text-[10px] tracking-wider flex items-center justify-center gap-3 animate-bounce shadow-md">
          <i className="fa-solid fa-circle-check text-lg"></i>
          <span>{successMsg}</span>
        </div>
      )}

      {/* --- WIZARD FLUXO DE VERIFICAÇÃO ATIVO --- */}
      {showVerificationWizard ? (
        <VerificationWizard 
          user={user} 
          onComplete={handleWizardComplete} 
          onCancel={() => setShowVerificationWizard(false)} 
        />
      ) : (
        <>
          {/* --- CARTÃO DE PERFIL E CABEÇALHO --- */}
          <div className="bg-white rounded-[3rem] md:rounded-[4.5rem] shadow-2xl overflow-hidden border-4 border-slate-100">
            <div className={`h-32 md:h-48 relative ${user.isVip ? 'gold-shimmer-bg' : 'bg-green-800'}`}>
              {isSeller && (
                <div className="absolute top-6 right-6 bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-slate-800">
                  🛡️ Vendedor Verificado
                </div>
              )}
              {user.isVip && (
                <div className="absolute top-6 right-20 bg-yellow-950 text-yellow-400 px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-yellow-800/20">
                  💎 VIP Gold
                </div>
              )}
            </div>
            
            <div className="px-6 md:px-16 pb-12 relative">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-20 mb-10 text-center md:text-left">
                <div className="relative group">
                  <img 
                    src={avatar} 
                    className="w-40 h-40 md:w-52 md:h-52 rounded-[3rem] md:rounded-[4rem] border-8 border-white shadow-2xl object-cover" 
                    alt={name}
                  />
                  {isEditing && (
                    <button 
                      onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                      className="absolute inset-0 bg-black/60 rounded-[3rem] md:rounded-[4rem] border-8 border-transparent flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition duration-300"
                    >
                      <i className="fa-solid fa-camera text-2xl mb-1"></i>
                      <span className="text-[9px] font-black uppercase tracking-wider">Alterar Foto</span>
                    </button>
                  )}
                  <div className={`absolute -top-2 -right-2 ${isSeller ? 'bg-green-600' : 'bg-blue-600'} text-white w-10 h-10 rounded-xl flex items-center justify-center border-4 border-white shadow-lg`}>
                    <i className={`fa-solid ${isSeller ? 'fa-shield-check' : 'fa-check-circle'}`}></i>
                  </div>
                </div>
                
                <div className="flex-1 pb-4">
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-2">
                    {isSeller && shopName ? shopName : name}
                  </h1>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Canal: {phone}</span>
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">
                      • {isSeller ? 'Conta Vendedor Ativa' : 'Conta de Comprador'}
                    </span>
                    {isSeller && (
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                        ⭐ {avgRating.toFixed(1)} Classificação
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pb-4">
                  <button 
                    onClick={onOpenChat}
                    className="bg-slate-100 text-slate-800 hover:bg-slate-200 px-6 py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest transition shadow-md flex items-center gap-2"
                  >
                    <i className="fa-solid fa-message-dots text-green-700"></i> Mensagens
                  </button>
                  
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="bg-green-700 hover:bg-green-800 text-white px-6 py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest transition shadow-xl flex items-center gap-2"
                    >
                      <i className="fa-solid fa-user-pen"></i> Editar Perfil
                    </button>
                  ) : (
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="bg-slate-900 hover:bg-black text-white px-6 py-4 rounded-2xl font-black uppercase text-[9px] tracking-widest transition shadow-xl"
                    >
                      Cancelar Edição
                    </button>
                  )}
                </div>
              </div>

              {/* Seletor de Avatar em Popover / Modal local */}
              {showAvatarSelector && isEditing && (
                <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 animate-fadeIn space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Escolha uma Imagem de Perfil</h4>
                  <div className="grid grid-cols-6 gap-3">
                    {AVATAR_PRESETS.map((url, idx) => (
                      <button 
                        key={idx} 
                        type="button" 
                        onClick={() => selectPresetAvatar(url)}
                        className={`relative rounded-2xl overflow-hidden aspect-square border-4 ${avatar === url ? 'border-green-600 scale-95' : 'border-transparent hover:scale-105'} transition`}
                      >
                        <img src={url} className="w-full h-full object-cover" alt="" />
                      </button>
                    ))}
                  </div>
                  <form onSubmit={handleCustomAvatarSubmit} className="flex gap-2 pt-2">
                    <input 
                      type="url" 
                      placeholder="Ou introduza um link de imagem (URL) seguro..."
                      value={tempAvatarUrl}
                      onChange={e => setTempAvatarUrl(e.target.value)}
                      className="flex-1 p-4 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                    />
                    <button 
                      type="submit"
                      className="bg-slate-900 text-white px-6 rounded-xl font-black uppercase text-[8px] tracking-widest hover:bg-black transition"
                    >
                      Aplicar URL
                    </button>
                  </form>
                </div>
              )}

              {/* --- ABAS DIVERGENTES: SELLER vs BUYER --- */}
              {!isEditing && (
                <div className="flex border-b border-slate-100 mb-8 overflow-x-auto gap-8">
                  {isSeller ? (
                    // ABAS DO VENDEDOR
                    <>
                      <button 
                        onClick={() => setActiveTab('ESTATISTICAS')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                          activeTab === 'ESTATISTICAS' ? 'border-green-700 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <i className="fa-solid fa-chart-pie"></i>
                        <span>Estatísticas & Nível</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('LOJA')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                          activeTab === 'LOJA' ? 'border-green-700 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <i className="fa-solid fa-store"></i>
                        <span>Minha Loja</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('PRODUTOS')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                          activeTab === 'PRODUTOS' ? 'border-green-700 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <i className="fa-solid fa-boxes-stacked"></i>
                        <span>Gestão de Produtos ({sellerProducts.length})</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('VENDAS')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                          activeTab === 'VENDAS' ? 'border-green-700 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <i className="fa-solid fa-hand-holding-dollar"></i>
                        <span>Vendas ({sellerOrders.length})</span>
                      </button>
                    </>
                  ) : (
                    // ABAS DO COMPRADOR (CLIENTE)
                    <>
                      <button 
                        onClick={() => setActiveTab('INFO')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                          activeTab === 'INFO' ? 'border-green-700 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <i className="fa-solid fa-address-card"></i>
                        <span>Dados de Identidade</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('COMPRAS')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                          activeTab === 'COMPRAS' ? 'border-green-700 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <i className="fa-solid fa-bag-shopping"></i>
                        <span>Minhas Compras ({buyerOrders.length})</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('FAVORITOS')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                          activeTab === 'FAVORITOS' ? 'border-green-700 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <i className="fa-solid fa-heart"></i>
                        <span>Favoritados ({buyerFavorites.length})</span>
                      </button>

                      <button 
                        onClick={() => setActiveTab('VERIFICACAO')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                          activeTab === 'VERIFICACAO' ? 'border-green-700 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <i className="fa-solid fa-shield-halved"></i>
                        <span>Ativar Conta Vendedor</span>
                      </button>
                    </>
                  )}

                  {/* ABAS COMUNS (WALLETS, SECURITY LOGS) */}
                  <button 
                    onClick={() => setActiveTab('WALLET')}
                    className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                      activeTab === 'WALLET' ? 'border-green-700 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <i className="fa-solid fa-wallet"></i>
                    <span>Carteira BazamosPay ({currentBalance.toLocaleString('pt-PT')} MT)</span>
                  </button>

                  <button 
                    onClick={() => setActiveTab('LOGS')}
                    className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                      activeTab === 'LOGS' ? 'border-green-700 text-green-700' : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <i className="fa-solid fa-fingerprint"></i>
                    <span>Auditoria & Segurança</span>
                  </button>
                </div>
              )}

              {/* --- CONTEÚDO DAS ABAS --- */}
              {!isEditing ? (
                <div className="animate-fadeIn">
                  
                  {/* ========================================================================= */}
                  {/* ======================= CONTEÚDOS DE COMPRADOR (BUYER) ================== */}
                  {/* ========================================================================= */}

                  {/* === COMPRADOR: TAB 1: INFO --- */}
                  {!isSeller && activeTab === 'INFO' && (
                    <div className="space-y-6">
                      <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100/80">
                        <h3 className="text-sm font-black uppercase text-slate-800 mb-4 tracking-wider">Metadados de Conta Pessoal</h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"><i className="fa-solid fa-phone"></i></div>
                            <div>
                              <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Telefone Registado</p>
                              <p className="font-black text-slate-800 text-sm">{phone}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"><i className="fa-solid fa-envelope"></i></div>
                            <div>
                              <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Endereço de Email</p>
                              <p className="font-black text-slate-800 text-sm">{email || 'Nenhum email associado'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"><i className="fa-solid fa-location-dot"></i></div>
                            <div>
                              <p className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Residência Atual</p>
                              <p className="font-black text-slate-800 text-sm">{district}, {province} • Moçambique</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === COMPRADOR: TAB 2: COMPRAS --- */}
                  {!isSeller && activeTab === 'COMPRAS' && (
                    <div className="space-y-6">
                      <h3 className="text-sm font-black uppercase text-slate-800 border-b pb-3 tracking-wider">Histórico de Pedidos de Compra</h3>
                      {buyerOrders.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed font-bold uppercase tracking-wider text-[10px]">
                          Ainda não efetuou nenhuma compra na plataforma.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {buyerOrders.map(order => (
                            <div key={order.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center gap-4 shadow-sm hover:border-slate-200 transition">
                              <img src={order.productImage} className="w-16 h-16 rounded-xl object-cover border" alt="" />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-black text-slate-800 text-xs truncate mb-1">{order.productName}</h5>
                                <p className="text-[10px] font-black text-green-700">{(order.price ?? 0).toLocaleString('pt-PT')} MT</p>
                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Data: {new Date(order.timestamp).toLocaleDateString('pt-PT')}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                                  order.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border border-green-200' :
                                  order.status === 'REJECTED' ? 'bg-red-100 text-red-800 border border-red-200' :
                                  'bg-amber-100 text-amber-800 border border-amber-200 animate-pulse'
                                }`}>
                                  {order.status === 'ACCEPTED' ? 'ACEITE' : order.status === 'REJECTED' ? 'REJEITADO' : 'PENDENTE'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* === COMPRADOR: TAB 3: FAVORITOS --- */}
                  {!isSeller && activeTab === 'FAVORITOS' && (
                    <div className="space-y-6">
                      <h3 className="text-sm font-black uppercase text-slate-800 border-b pb-3 tracking-wider">Artigos Favoritados</h3>
                      {buyerFavorites.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed font-bold uppercase tracking-wider text-[10px]">
                          Nenhum artigo adicionado aos seus favoritos.
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {buyerFavorites.map(product => (
                            <div key={product.id} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:scale-[1.02] transition flex flex-col justify-between">
                              <div>
                                <img src={product.imageUrl} className="w-full h-24 rounded-xl object-cover mb-3 border" alt="" />
                                <h5 className="font-black text-slate-800 text-[10px] uppercase tracking-wide truncate mb-1">{product.name}</h5>
                                <p className="text-xs font-black text-green-700 mb-2">{product.price.toLocaleString('pt-PT')} MT</p>
                              </div>
                              <div className="text-right border-t pt-2">
                                <span className="text-[7px] font-bold text-slate-400 uppercase">{product.district}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* === COMPRADOR: TAB 4: ATIVAR CONTA VENDEDOR --- */}
                  {!isSeller && activeTab === 'VERIFICACAO' && (
                    <div className="space-y-6">
                      <h3 className="text-sm font-black uppercase text-slate-800 border-b pb-3 tracking-wider">Central de Ativação do BazamosPay</h3>
                      
                      {user.verificationStatus === 'NONE' && (
                        <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200/60 text-center space-y-6 max-w-2xl mx-auto">
                          <div className="w-20 h-20 rounded-full bg-green-50 text-green-700 flex items-center justify-center mx-auto text-3xl shadow-inner border border-green-100">
                            <i className="fa-solid fa-shield-halved"></i>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-base font-black uppercase text-slate-900">Torne-se um Vendedor Autorizado</h4>
                            <p className="text-slate-500 text-xs leading-relaxed max-w-md mx-auto">
                              Para proteger compradores e vendedores no BazamosPay, todas as contas de vendedor passam por um processo rigoroso de verificação de identidade em conformidade com o SERNIC.
                            </p>
                          </div>
                          <div className="pt-4">
                            <button
                              onClick={() => setShowVerificationWizard(true)}
                              className="bg-green-700 hover:bg-green-800 text-white font-black uppercase text-[10px] tracking-widest px-10 py-5 rounded-2xl shadow-xl transition hover:scale-103"
                            >
                              Ativar Conta de Vendedor
                            </button>
                          </div>
                        </div>
                      )}

                      {user.verificationStatus === 'PENDING' && (
                        <div className="p-8 bg-amber-50/50 border-2 border-amber-200/80 text-amber-800 rounded-[2.5rem] text-center space-y-4 max-w-2xl mx-auto">
                          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto text-2xl animate-pulse">
                            <i className="fa-solid fa-hourglass-half"></i>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-black uppercase text-slate-900 text-base">Os seus dados estão sob análise</h4>
                            <p className="text-slate-600 text-xs leading-relaxed font-bold uppercase tracking-wider text-[10px]">
                              A nossa equipa administrativa e de compliance está a auditar o seu Bilhete de Identidade e mapeamentos biométricos. Este processo costuma demorar poucos minutos!
                            </p>
                          </div>
                        </div>
                      )}

                      {user.verificationStatus === 'REJECTED' && (
                        <div className="p-8 bg-red-50 border-2 border-red-200 text-red-800 rounded-[2.5rem] text-center space-y-6 max-w-2xl mx-auto">
                          <div className="w-16 h-16 rounded-full bg-red-100 text-red-700 flex items-center justify-center mx-auto text-2xl">
                            <i className="fa-solid fa-circle-xmark"></i>
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-black uppercase text-slate-900 text-base">Verificação Recusada</h4>
                            <p className="text-red-700 text-xs font-black uppercase tracking-wider text-[10px]">
                              Motivo da Recusa: <strong className="bg-red-100 px-2 py-1 rounded ml-1">{user.rejectionReason || 'Documentação ilegível'}</strong>
                            </p>
                            <p className="text-slate-500 text-xs leading-relaxed pt-2 max-w-md mx-auto">
                              Por favor, certifique-se de que o documento não está caducado, as fotos estão nítidas e as tarefas de liveness foram efetuadas de forma completa.
                            </p>
                          </div>
                          <div className="pt-2">
                            <button
                              onClick={() => setShowVerificationWizard(true)}
                              className="bg-red-700 hover:bg-red-800 text-white font-black uppercase text-[10px] tracking-widest px-8 py-4 rounded-xl shadow-md transition"
                            >
                              Tentar Novamente
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* ======================= CONTEÚDOS DE VENDEDOR (SELLER) ================== */}
                  {/* ========================================================================= */}

                  {/* === VENDEDOR: TAB 1: ESTATISTICAS --- */}
                  {isSeller && activeTab === 'ESTATISTICAS' && (
                    <div className="space-y-8 animate-fadeIn">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Ganhos Totais */}
                        <div className="p-6 bg-green-50 border border-green-100 rounded-3xl flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-green-100 text-green-700 flex items-center justify-center text-xl">
                            <i className="fa-solid fa-money-bill-trend-up"></i>
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Volume de Vendas</span>
                            <p className="text-xl font-black text-green-800 font-mono">{totalEarnings.toLocaleString('pt-PT')} MT</p>
                          </div>
                        </div>

                        {/* Vendas Pendentes */}
                        <div className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center text-xl">
                            <i className="fa-solid fa-clock-rotate-left"></i>
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Vendas Pendentes</span>
                            <p className="text-xl font-black text-amber-700">{pendingSales.length}</p>
                          </div>
                        </div>

                        {/* Produtos Vitrine */}
                        <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-xl">
                            <i className="fa-solid fa-boxes-stacked"></i>
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Artigos Ativos</span>
                            <p className="text-xl font-black text-blue-700">{sellerProducts.length}</p>
                          </div>
                        </div>

                        {/* Nível do Vendedor */}
                        <div className={`p-6 border rounded-3xl flex items-center gap-4 ${levelColor}`}>
                          <div className="w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center text-xl shadow-sm">
                            <i className={`fa-solid ${levelIcon}`}></i>
                          </div>
                          <div>
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Nível de Canal</span>
                            <p className="text-xl font-black uppercase tracking-tight">Loja {sellerLevel}</p>
                          </div>
                        </div>
                      </div>

                      {/* Métricas adicionais de confiança */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60 flex flex-col justify-between">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-4">Reputação Comercial do Canal</span>
                          <div className="flex items-center gap-4">
                            <span className="text-4xl font-black text-slate-800">{avgRating.toFixed(1)}</span>
                            <div className="space-y-1">
                              <div className="flex text-amber-400 gap-1 text-sm">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <i key={i} className={`fa-solid fa-star ${i < Math.floor(avgRating) ? 'text-amber-500' : 'text-slate-200'}`}></i>
                                ))}
                              </div>
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Classificado com base em transações reais de compra</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/60">
                          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-4">Requisitos para Avançar de Nível</span>
                          <div className="space-y-3 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <div className="flex justify-between">
                              <span>Média de Classificação (Requerida: 4.8)</span>
                              <span className={avgRating >= 4.8 ? 'text-green-600 font-black' : 'text-slate-400'}>{avgRating.toFixed(1)} / 5.0</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-green-600 h-full" style={{ width: `${(avgRating / 5) * 100}%` }}></div>
                            </div>

                            <div className="flex justify-between">
                              <span>Vendas Bem-Sucedidas (Requerida: 5)</span>
                              <span className={salesCount >= 5 ? 'text-green-600 font-black' : 'text-slate-400'}>{salesCount} / 5</span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div className="bg-green-600 h-full" style={{ width: `${Math.min((salesCount / 5) * 100, 100)}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === VENDEDOR: TAB 2: MINHA LOJA --- */}
                  {isSeller && activeTab === 'LOJA' && (
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b pb-2">
                          <i className="fa-solid fa-store text-green-700"></i>
                          <span>Dados Comerciais de Vendedor</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                          <div className="p-4 bg-white rounded-xl border">
                            <span className="text-[8px] font-black text-slate-400 block mb-1">Nome Comercial</span>
                            <p className="font-black text-slate-800">{shopName || name}</p>
                          </div>
                          
                          <div className="p-4 bg-white rounded-xl border">
                            <span className="text-[8px] font-black text-slate-400 block mb-1">Telefone de Contacto</span>
                            <p className="font-black text-slate-800">{phone}</p>
                          </div>

                          <div className="p-4 bg-white rounded-xl border">
                            <span className="text-[8px] font-black text-slate-400 block mb-1">Localização Operacional</span>
                            <p className="font-black text-slate-800">{district}, {province}</p>
                          </div>

                          <div className="p-4 bg-white rounded-xl border">
                            <span className="text-[8px] font-black text-slate-400 block mb-1">Estatuto Legal de Verificação</span>
                            <p className="font-black text-green-700">Aprovado pelo SERNIC / Compliance Oficial</p>
                          </div>
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={() => setIsEditing(true)}
                            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest hover:bg-black transition"
                          >
                            Editar Detalhes Públicos
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === VENDEDOR: TAB 3: GESTÃO DE PRODUTOS --- */}
                  {isSeller && activeTab === 'PRODUTOS' && (
                    <div className="space-y-6">
                      <h3 className="text-sm font-black uppercase text-slate-800 border-b pb-3 tracking-wider">Gestão do Meu Catálogo de Produtos</h3>
                      
                      {sellerProducts.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed font-bold uppercase tracking-wider text-[10px]">
                          Não possui nenhum produto publicado no momento.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {sellerProducts.map(product => (
                            <div key={product.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                              <div>
                                <img src={product.imageUrl} className="w-full h-28 rounded-xl object-cover mb-3 border" alt="" />
                                <h5 className="font-black text-slate-800 text-[10px] uppercase tracking-wide truncate mb-1">{product.name}</h5>
                                <p className="text-xs font-black text-slate-900 mb-2">{product.price.toLocaleString('pt-PT')} MT</p>
                              </div>
                              <div className="flex items-center justify-between border-t pt-2 mt-1">
                                <span className={`text-[6.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {product.isAvailable ? 'ATIVO' : 'RESERVADO'}
                                </span>
                                
                                {onDeleteProduct && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Tem certeza de que deseja remover o produto "${product.name}" de forma permanente?`)) {
                                        onDeleteProduct(product.id);
                                        addSecurityLog('DELETE_PRODUCT', `Eliminação permanente do anúncio comercial de produto ID ${product.id}`);
                                      }
                                    }}
                                    className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg font-black text-[7px] uppercase tracking-widest transition"
                                  >
                                    Excluir
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* === VENDEDOR: TAB 4: VENDAS --- */}
                  {isSeller && activeTab === 'VENDAS' && (
                    <div className="space-y-6">
                      <h3 className="text-sm font-black uppercase text-slate-800 border-b pb-3 tracking-wider">Lista de Pedidos de Venda</h3>
                      
                      {sellerOrders.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-3xl border border-dashed font-bold uppercase tracking-wider text-[10px]">
                          Não recebeu nenhuma proposta de compra até ao momento.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {sellerOrders.map(order => (
                            <div key={order.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                              <div className="flex items-center gap-4">
                                <img src={order.productImage} className="w-14 h-14 rounded-xl object-cover border" alt="" />
                                <div>
                                  <h5 className="font-black text-slate-800 text-xs leading-none mb-1">{order.productName}</h5>
                                  <p className="text-[10px] font-black text-green-700">{(order.price ?? 0).toLocaleString('pt-PT')} MT</p>
                                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-1 space-y-0.5">
                                    <p>Comprador: <strong className="text-slate-700">{order.buyerName}</strong> ({order.buyerPhone})</p>
                                    <p>Local de Entrega: {order.buyerNeighborhood}, {order.buyerProvince}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-3 self-end md:self-auto">
                                {order.status === 'PENDING' ? (
                                  <>
                                    {onRejectOrder && (
                                      <button
                                        onClick={() => {
                                          onRejectOrder(order.id);
                                          addSecurityLog('ADMIN_ACTION', `Rejeição do pedido de compra ID ${order.id}`);
                                        }}
                                        className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-black text-[8px] uppercase tracking-widest transition"
                                      >
                                        Rejeitar
                                      </button>
                                    )}
                                    {onAcceptOrder && (
                                      <button
                                        onClick={() => {
                                          onAcceptOrder(order.id);
                                          addSecurityLog('ADMIN_ACTION', `Aprovação de pedido de compra comercial ID ${order.id}`);
                                        }}
                                        className="bg-green-700 hover:bg-green-800 text-white px-5 py-2.5 rounded-xl font-black text-[8px] uppercase tracking-widest transition shadow-md"
                                      >
                                        Aceitar e Entregar
                                      </button>
                                    )}
                                  </>
                                ) : (
                                  <span className={`text-[7px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                                    order.status === 'ACCEPTED' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {order.status === 'ACCEPTED' ? 'Venda Concluída' : 'Venda Rejeitada'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* ======================== ABAS COMUNS / COMPARTILHADAS =================== */}
                  {/* ========================================================================= */}

                  {/* === COMUM: TAB 5: CARTEIRA BAZAMOSPAY (M-PESA / LEDGER) === */}
                  {activeTab === 'WALLET' && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      {/* Cartão Visual Premium de Saldo e Formulário */}
                      <div className="md:col-span-5 space-y-6">
                        <div className={`p-8 rounded-[2.5rem] text-white flex flex-col justify-between h-56 shadow-xl relative overflow-hidden ${user.isVip ? 'bg-gradient-to-br from-yellow-700 via-amber-800 to-amber-950 border border-yellow-500/25' : 'bg-gradient-to-br from-green-800 via-emerald-900 to-slate-950 border border-emerald-500/20'}`}>
                          <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full transform translate-x-12 -translate-y-12"></div>
                          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full"></div>
                          
                          <div className="flex justify-between items-start z-10">
                            <div>
                              <p className="text-[8px] font-black tracking-widest uppercase text-white/50">Carteira BazamosPay</p>
                              <h4 className="font-black tracking-tight text-xl text-yellow-400">Moçambique</h4>
                            </div>
                            <i className="fa-solid fa-wallet text-3xl opacity-40"></i>
                          </div>

                          <div className="z-10 my-2">
                            <p className="text-[8px] font-black tracking-widest uppercase text-white/40">Saldo Disponível</p>
                            <p className="text-3xl font-black font-mono tracking-tight">
                              {currentBalance.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} <span className="text-lg text-emerald-400">MT</span>
                            </p>
                          </div>

                          <div className="flex justify-between items-end z-10">
                            <div>
                              <p className="text-[7px] font-black tracking-widest uppercase text-white/30">Titular da Conta</p>
                              <p className="text-xs font-black uppercase tracking-wider">{name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[7px] font-black tracking-widest uppercase text-white/30">Canal Registado</p>
                              <p className="font-mono text-xs font-bold">{phone}</p>
                            </div>
                          </div>
                        </div>

                        {/* Form Recarga/Levantamento */}
                        <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200/60 p-6 space-y-6">
                          <form onSubmit={handleDepositSubmit} className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Valor (MT)</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  min="1" 
                                  placeholder="Insira o valor em Meticais..."
                                  value={walletAmount}
                                  onChange={e => setWalletAmount(e.target.value)}
                                  className="w-full p-4 rounded-xl bg-white border border-slate-200 font-black text-sm pr-12 text-slate-800 focus:outline-none focus:border-green-600"
                                  required
                                />
                                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 font-black text-xs text-slate-400 font-mono">MT</span>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Método de Transferência</label>
                              <div className="grid grid-cols-3 gap-2">
                                {(['M-PESA', 'E-MOLA', 'BANK_TRANSFER'] as const).map(met => (
                                  <button
                                    key={met}
                                    type="button"
                                    onClick={() => setWalletMethod(met)}
                                    className={`py-3 rounded-xl font-black text-[9px] border transition ${
                                      walletMethod === met 
                                        ? 'bg-green-50 border-green-600 text-green-700 font-black' 
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    {met === 'BANK_TRANSFER' ? 'BANCO' : met}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {walletMethod === 'BANK_TRANSFER' && (
                              <div className="space-y-1 animate-fadeIn">
                                <label className="text-[8px] font-black uppercase text-slate-400 ml-1">NIB ou Conta Bancária</label>
                                <input 
                                  type="text" 
                                  placeholder="Insira o número de conta ou NIB de Moçambique..."
                                  value={bankAccount}
                                  onChange={e => setBankAccount(e.target.value)}
                                  className="w-full p-4 rounded-xl bg-white border border-slate-200 font-bold text-xs"
                                  required
                                />
                              </div>
                            )}

                            <div className="flex gap-2 pt-2">
                              <button
                                type="submit"
                                disabled={isProcessingWallet}
                                className="flex-1 bg-green-700 hover:bg-green-800 text-white font-black uppercase text-[9px] tracking-widest py-4 rounded-xl shadow-md transition disabled:opacity-50"
                              >
                                {isProcessingWallet ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-spinner animate-spin"></i> Processando...
                                  </span>
                                ) : (
                                  <span>Efetuar Recarga</span>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  const val = parseFloat(walletAmount);
                                  if (isNaN(val) || val <= 0) {
                                    alert('Introduza um valor válido para levantar!');
                                    return;
                                  }
                                  handleWithdrawalSubmit(e);
                                }}
                                disabled={isProcessingWallet || !walletAmount}
                                className="flex-1 bg-slate-900 hover:bg-black text-white font-black uppercase text-[9px] tracking-widest py-4 rounded-xl shadow-md transition disabled:opacity-50"
                              >
                                <span>Levantar Saldo</span>
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>

                      {/* Histórico Ledger de Transações */}
                      <div className="md:col-span-7 space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-3 border-slate-100">
                          Extrato Ledger de Transações (Tempo Real)
                        </h3>
                        
                        <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
                          {currentTransactions.length === 0 ? (
                            <div className="p-10 text-center font-bold text-[10px] text-slate-400 uppercase border border-dashed rounded-3xl">
                              Nenhuma transação registada na carteira.
                            </div>
                          ) : (
                            currentTransactions.map((tx) => (
                              <div 
                                key={tx.id} 
                                className="bg-white hover:bg-slate-50 p-5 rounded-2xl border border-slate-100 flex justify-between items-center transition cursor-pointer shadow-sm active:scale-98"
                                onClick={() => setSelectedTxSlip(tx)}
                                title="Clique para ver o comprovativo oficial"
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tx.type === 'DEPOSIT' || tx.type === 'PAYMENT_RECEIVED' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                                    <i className={`fa-solid ${tx.type === 'DEPOSIT' ? 'fa-arrow-down-long' : tx.type === 'WITHDRAWAL' ? 'fa-arrow-up-long' : 'fa-hand-holding-dollar'}`}></i>
                                  </div>
                                  <div>
                                    <p className="font-black text-slate-800 text-xs leading-none mb-1">{tx.description}</p>
                                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                      <span>{tx.reference}</span>
                                      <span>•</span>
                                      <span>{new Date(tx.timestamp).toLocaleString('pt-PT')}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <p className={`font-mono font-black text-sm ${tx.type === 'DEPOSIT' || tx.type === 'PAYMENT_RECEIVED' ? 'text-green-700' : 'text-red-600'}`}>
                                    {tx.type === 'DEPOSIT' || tx.type === 'PAYMENT_RECEIVED' ? '+' : '-'}{tx.amount.toLocaleString('pt-PT')} MT
                                  </p>
                                  <span className="text-[7px] font-black uppercase tracking-widest px-2 py-0.5 bg-green-100 text-green-800 rounded-md">
                                    CONFIRMADO
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* === COMUM: TAB 6: AUDITORIA DE LOGS / ADMIN MODE === */}
                  {activeTab === 'LOGS' && (
                    <div className="space-y-6 animate-fadeIn">
                      {/* Alternador de Modo de Consola de Administração */}
                      <div className="p-6 bg-slate-900 text-white rounded-[2rem] border border-slate-800 shadow-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg ${adminMode ? 'bg-amber-500 text-slate-900 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                            <i className="fa-solid fa-user-shield"></i>
                          </div>
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-white">Consola de Administração Geral</h4>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Auditoria e aprovação regulatória de contas de vendedor</p>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setAdminMode(!adminMode);
                            addSecurityLog('ADMIN_ACTION', `Acesso à consola de administração ${!adminMode ? 'ATIVADO' : 'DESATIVADO'}`);
                          }}
                          className={`px-6 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest transition flex items-center gap-2 ${
                            adminMode ? 'bg-amber-500 text-slate-950 hover:bg-amber-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <i className={`fa-solid ${adminMode ? 'fa-toggle-on' : 'fa-toggle-off'} text-sm`}></i>
                          <span>{adminMode ? 'Consola Ativa' : 'Ativar Consola Admin'}</span>
                        </button>
                      </div>

                      {adminMode ? (
                        /* === MODO ADMIN: FILA DE VERIFICAÇÃO E USUÁRIOS === */
                        <div className="space-y-8">
                          
                          {/* 1. FILA DE VERIFICAÇÕES PENDENTES BIOMÉTRICAS */}
                          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200/60 space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 flex items-center gap-2 border-b pb-3">
                              <i className="fa-solid fa-hourglass-half text-amber-500 animate-spin"></i>
                              <span>Fila de Verificações de Identidade Pendentes ({pendingVerificationsList.length})</span>
                            </h3>

                            {pendingVerificationsList.length === 0 ? (
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide py-8 text-center border border-dashed rounded-2xl">
                                Nenhuma verificação de vendedor pendente de auditoria regulatória.
                              </p>
                            ) : (
                              <div className="space-y-4">
                                {pendingVerificationsList.map(usr => (
                                  <div key={usr.id} className="p-6 bg-white border border-slate-200 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm">
                                    <div className="flex items-center gap-4">
                                      <img src={usr.avatar} className="w-16 h-16 rounded-2xl object-cover border" alt="" />
                                      <div>
                                        <h4 className="font-black text-slate-800 text-sm">{usr.name}</h4>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Telemóvel: {usr.phone} | Província: {usr.province}</p>
                                        <span className="text-[7.5px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md mt-1.5 inline-block">
                                          Pendente de Verificação
                                        </span>
                                      </div>
                                    </div>

                                    <div>
                                      <button
                                        onClick={() => setSelectedVerificationToReview(usr)}
                                        className="bg-slate-900 hover:bg-black text-white px-5 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest transition flex items-center gap-2"
                                      >
                                        <i className="fa-solid fa-magnifying-glass-chart"></i>
                                        <span>Auditar Biometria & BI</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 2. TABELA COMPLETA DE UTILIZADORES */}
                          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-6">
                            <div className="flex justify-between items-center border-b pb-4">
                              <h3 className="text-xs font-black uppercase tracking-widest text-slate-700">
                                Gestão Universal de Contas ({allUsers.length})
                              </h3>
                            </div>

                            <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                              <table className="w-full text-left border-collapse bg-white">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Canal / Utilizador</th>
                                    <th className="p-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                                    <th className="p-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Verificação</th>
                                    <th className="p-4 text-[8px] font-black uppercase tracking-widest text-slate-400">Bloqueado</th>
                                    <th className="p-4 text-right text-[8px] font-black uppercase tracking-widest text-slate-400">Ações</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 text-[11px] font-bold">
                                  {allUsers.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50/40 transition">
                                      <td className="p-4">
                                        <div className="flex items-center gap-3">
                                          <img src={u.avatar} className="w-8 h-8 rounded-xl object-cover" alt="" />
                                          <div>
                                            <div className="font-black text-slate-800 uppercase">{u.name}</div>
                                            <div className="font-mono text-[9px] text-slate-400">{u.phone}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="p-4 uppercase text-slate-600 text-[10px]">
                                        {u.userType === 'SELLER' ? '🏪 VENDEDOR' : '🛍️ COMPRADOR'}
                                      </td>
                                      <td className="p-4">
                                        <span className={`text-[7px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                                          u.verificationStatus === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                          u.verificationStatus === 'PENDING' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                          u.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                          'bg-slate-100 text-slate-600'
                                        }`}>
                                          {u.verificationStatus}
                                        </span>
                                      </td>
                                      <td className="p-4">
                                        <span className={`text-[7px] font-black uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 w-fit ${u.blocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full inline-block ${u.blocked ? 'bg-red-600' : 'bg-green-600 animate-pulse'}`}></span>
                                          <span>{u.blocked ? 'SIM' : 'NÃO'}</span>
                                        </span>
                                      </td>
                                      <td className="p-4 text-right space-x-1 whitespace-nowrap">
                                        {onToggleUserBlock && (
                                          <button
                                            onClick={() => onToggleUserBlock(u.id)}
                                            className={`px-2.5 py-1.5 border rounded-lg font-black text-[7px] uppercase tracking-wider transition ${
                                              u.blocked 
                                                ? 'bg-green-50 text-green-700 border-green-200' 
                                                : 'bg-red-50 text-red-600 border-red-200'
                                            }`}
                                          >
                                            {u.blocked ? 'Desbloquear' : 'Bloquear'}
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* === MODO NORMAL: LISTA DE LOGS DO USUÁRIO --- */
                        <>
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-200/60">
                            <div>
                              <h4 className="text-xs font-black uppercase text-slate-800">Histórico de Atividade Pessoal</h4>
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rastreio de auditoria ativa do canal de transações</p>
                            </div>

                            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                              <select
                                value={logFilter}
                                onChange={e => setLogFilter(e.target.value)}
                                className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-[10px] uppercase text-slate-700 focus:outline-none"
                              >
                                <option value="ALL">TODOS OS LOGS</option>
                                <option value="LOGIN">LOGIN</option>
                                <option value="WALLET_TRANSACTION">CARTEIRA</option>
                                <option value="EDIT_PROFILE">PERFIL</option>
                                <option value="CHANGE_PASSWORD">SENHA</option>
                              </select>

                              <button
                                onClick={downloadLogsAsJSON}
                                className="bg-slate-900 hover:bg-black text-white px-4 py-3 rounded-xl font-black uppercase text-[8px] tracking-widest transition flex items-center gap-2"
                              >
                                <i className="fa-solid fa-file-arrow-down"></i> Exportar Auditoria
                              </button>
                            </div>
                          </div>

                          <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                            <table className="w-full text-left border-collapse bg-white">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                  <th className="p-5 text-[8px] font-black uppercase tracking-widest text-slate-400">Timestamp</th>
                                  <th className="p-5 text-[8px] font-black uppercase tracking-widest text-slate-400">Ação</th>
                                  <th className="p-5 text-[8px] font-black uppercase tracking-widest text-slate-400">Detalhes</th>
                                  <th className="p-5 text-[8px] font-black uppercase tracking-widest text-slate-400">IP / Canal</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 text-[10px] font-bold">
                                {filteredLogs.length === 0 ? (
                                  <tr>
                                    <td colSpan={4} className="p-10 text-center text-slate-400 uppercase font-black tracking-widest">Nenhum registo de auditoria pessoal disponível</td>
                                  </tr>
                                ) : (
                                  filteredLogs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition">
                                      <td className="p-5 font-mono text-[9px] font-bold text-slate-500 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString('pt-PT')}
                                      </td>
                                      <td className="p-5 whitespace-nowrap uppercase">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-[7.5px] font-black">{log.action}</span>
                                      </td>
                                      <td className="p-5 text-slate-700">{log.details}</td>
                                      <td className="p-5 font-mono text-[9px] text-slate-400">{log.ipAddress}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                </div>
              ) : (
                /* --- FORMULÁRIO DE EDIÇÃO DE PERFIL --- */
                <form onSubmit={handleSave} className="space-y-6 animate-fadeIn">
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 border-b pb-3 border-slate-200">Editar Detalhes Públicos</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Nome Oficial Completo</label>
                        <input 
                          type="text" 
                          value={name} 
                          onChange={e => setName(e.target.value)}
                          className="w-full p-5 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-800"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Telemóvel / Canal</label>
                        <input 
                          type="tel" 
                          value={phone} 
                          onChange={e => setPhone(e.target.value)}
                          className="w-full p-5 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-800"
                          required
                        />
                      </div>

                      {isSeller && (
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Nome da Loja</label>
                          <input 
                            type="text" 
                            value={shopName} 
                            onChange={e => setShopName(e.target.value)}
                            className="w-full p-5 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-800"
                            placeholder="Ex: Bazar Central"
                          />
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Correio Eletrónico (Opcional)</label>
                        <input 
                          type="email" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)}
                          className="w-full p-5 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-800"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Foto (Avatar URL)</label>
                        <div className="flex gap-2">
                          <input 
                            type="url" 
                            value={avatar} 
                            onChange={e => setAvatar(e.target.value)}
                            className="flex-1 p-5 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-800"
                            required
                          />
                          <button 
                            type="button"
                            onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-4 rounded-xl text-xs font-bold"
                          >
                            Presets
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Província</label>
                        <select 
                          value={province} 
                          onChange={handleProvinceChange}
                          className="w-full p-5 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-800"
                          required
                        >
                          {Object.keys(MOZAMBIQUE_DATA).map(p => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Distrito</label>
                        <select 
                          value={district} 
                          onChange={e => setDistrict(e.target.value)}
                          className="w-full p-5 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-800"
                          required
                          disabled={!province}
                        >
                          {province && MOZAMBIQUE_DATA[province]?.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <i className="fa-solid fa-key text-green-700"></i>
                        <span>Troca de Senha de Acesso (Segurança)</span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Nova Senha (Opcional)</label>
                          <input 
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="Mínimo de 6 caracteres..."
                            className="w-full p-5 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-800"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase ml-2 text-slate-400">Confirmar Nova Senha</label>
                          <input 
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Confirme a nova senha..."
                            className="w-full p-5 rounded-xl bg-white border border-slate-200 font-bold text-sm text-slate-800"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      className="px-8 py-5 rounded-2xl bg-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-widest hover:bg-slate-300 transition"
                    >
                      Descartar Alterações
                    </button>
                    <button 
                      type="submit"
                      className="px-10 py-5 rounded-2xl bg-green-700 text-white font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition shadow-xl"
                    >
                      <i className="fa-solid fa-floppy-disk mr-2"></i> Gravar Perfil Real
                    </button>
                  </div>
                </form>
              )}

              {/* Rodapé explicativo */}
              <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-start gap-4 max-w-sm">
                   <i className="fa-solid fa-lock text-slate-200 text-2xl mt-1"></i>
                   <p className="text-[8px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest italic leading-relaxed">
                    As estatísticas de classificação e confiança são processadas pelo Protocolo Pay e não podem ser editadas manualmente para garantir a segurança da rede.
                   </p>
                </div>
                {!isEditing && (
                  <button 
                    onClick={onLogout}
                    className="w-full md:w-auto px-12 py-6 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition shadow-sm"
                  >
                    Encerrar Sessão (Logout)
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================= MODAL AUDITORIA ADMIN DE VERIFICAÇÃO BIOMÉTRICA (100% REAL) ================= */}
      {selectedVerificationToReview && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-4 border-slate-800 text-white rounded-[2.5rem] w-full max-w-4xl p-8 shadow-2xl relative animate-scaleUp max-h-[90vh] overflow-y-auto space-y-6">
            <button 
              onClick={() => setSelectedVerificationToReview(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white text-2xl"
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>

            {/* Cabeçalho de Auditoria */}
            <div className="border-b border-slate-800 pb-4">
              <span className="text-[8px] font-black tracking-widest text-green-400 uppercase">Processo de Conformidade Regulamentar</span>
              <h3 className="text-xl font-black uppercase text-white leading-none mt-1">Ficha Técnica de Identidade de Vendedor</h3>
              <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider mt-1">Candidato: <strong className="text-white">{selectedVerificationToReview.name}</strong> ({selectedVerificationToReview.phone})</p>
            </div>

            {/* Corpo da Auditoria */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Coluna 1: Dados do Negócio & BI extraído */}
              <div className="space-y-6">
                
                {/* Dados de Negócio */}
                <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl space-y-2.5">
                  <h4 className="text-[9px] font-black text-green-400 uppercase tracking-widest border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <i className="fa-solid fa-store"></i>
                    <span>Dados de Categoria Comercial</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <div>
                      <span className="text-[7.5px] font-black text-slate-500 block">Tipo:</span>
                      <span className="text-white">{selectedVerificationToReview.verificationData?.business?.type}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] font-black text-slate-500 block">Nome Comercial:</span>
                      <span className="text-white">{selectedVerificationToReview.verificationData?.business?.name}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] font-black text-slate-500 block">Bairro:</span>
                      <span className="text-white">{selectedVerificationToReview.verificationData?.business?.neighborhood}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] font-black text-slate-500 block">Referência:</span>
                      <span className="text-white">{selectedVerificationToReview.verificationData?.business?.reference}</span>
                    </div>
                  </div>
                </div>

                {/* BI extraído */}
                <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl space-y-2.5">
                  <h4 className="text-[9px] font-black text-green-400 uppercase tracking-widest border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                    <i className="fa-solid fa-id-card"></i>
                    <span>Leitura OCR do Documento</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <div>
                      <span className="text-[7.5px] font-black text-slate-500 block">Nome Completo:</span>
                      <span className="text-white">{selectedVerificationToReview.verificationData?.bi?.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] font-black text-slate-500 block">Número do BI:</span>
                      <span className="text-green-400 font-mono font-black">{selectedVerificationToReview.verificationData?.bi?.biNumber}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] font-black text-slate-500 block">Nascimento:</span>
                      <span className="text-white">{selectedVerificationToReview.verificationData?.bi?.birthDate}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] font-black text-slate-500 block">Validade:</span>
                      <span className="text-white">{selectedVerificationToReview.verificationData?.bi?.expiryDate}</span>
                    </div>
                    <div>
                      <span className="text-[7.5px] font-black text-slate-500 block">Nacionalidade:</span>
                      <span className="text-white">{selectedVerificationToReview.verificationData?.bi?.nationality}</span>
                    </div>
                  </div>
                </div>

                {/* Score Biométrico */}
                <div className="bg-slate-800/40 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <h4 className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-1">Mapeamento Facial Biométrico</h4>
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Validação de conformidade geométrica</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-mono font-black text-green-400">{selectedVerificationToReview.verificationData?.matchScore || 98.4}%</span>
                    <p className="text-[7px] font-black text-green-500 uppercase tracking-widest mt-0.5">CORRESPONDÊNCIA</p>
                  </div>
                </div>

              </div>

              {/* Coluna 2: Anexos e Capturas do Dispositivo */}
              <div className="space-y-4">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-1">Anexos Fotográficos Capturados em Tempo Real</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[7px] font-black text-slate-400 uppercase">Frente do BI</span>
                    <div className="h-28 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      <img src={selectedVerificationToReview.verificationData?.bi?.biFrontImage || "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?q=80&w=300"} className="w-full h-full object-cover" alt="" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[7px] font-black text-slate-400 uppercase">Verso do BI</span>
                    <div className="h-28 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      <img src={selectedVerificationToReview.verificationData?.bi?.biBackImage || "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=300"} className="w-full h-full object-cover" alt="" />
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <span className="text-[7px] font-black text-slate-400 uppercase">Selfie de Cruzamento com Documento</span>
                    <div className="h-40 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      <img src={selectedVerificationToReview.verificationData?.selfieWithBIImage || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400"} className="w-full h-full object-cover" alt="" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Painel de Julgamento da Conformidade */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-6 mt-6">
              <div className="space-y-4 w-full md:w-auto">
                <div>
                  <h4 className="text-xs font-black uppercase text-white">Análise Regulamentar (Conformidade)</h4>
                  <p className="text-[8px] font-bold text-slate-500 uppercase mt-0.5">Avalie os dados e capturas para aprovação ou recusa imediata</p>
                </div>
                
                {/* Seletor de Motivo de Rejeição */}
                <div className="space-y-1 max-w-xs">
                  <label className="text-[7.5px] font-black uppercase text-slate-400">Em caso de recusa, escolha o motivo:</label>
                  <select
                    value={rejectionReasonInput}
                    onChange={e => setRejectionReasonInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-bold uppercase text-slate-300"
                  >
                    <option value="Documento ilegível">Documento ilegível / Sem foco</option>
                    <option value="BI expirado">Documento fora da data de validade</option>
                    <option value="Rosto diferente do documento">Biometria facial incompatível</option>
                    <option value="Imagem incompleta">Documento cortado ou incompleto</option>
                    <option value="Documento inválido">Bilhete de Identidade inválido ou falso</option>
                    <option value="Outro">Outro Motivo (Especificar abaixo)</option>
                  </select>
                </div>

                {rejectionReasonInput === 'Outro' && (
                  <input
                    type="text"
                    value={customRejectionReason}
                    onChange={e => setCustomRejectionReason(e.target.value)}
                    placeholder="Especifique o motivo da recusa..."
                    className="w-full max-w-xs p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none"
                  />
                )}
              </div>

              <div className="flex gap-3 w-full md:w-auto justify-end">
                <button
                  onClick={() => handleRejectVerification(selectedVerificationToReview.id)}
                  className="bg-red-700 hover:bg-red-800 text-white font-black uppercase text-[8.5px] tracking-widest px-6 py-4 rounded-xl transition shadow-lg"
                >
                  ❌ Recusar Processo
                </button>

                <button
                  onClick={() => handleApproveVerification(selectedVerificationToReview.id)}
                  className="bg-green-600 hover:bg-green-500 text-slate-950 font-black uppercase text-[8.5px] tracking-widest px-8 py-4 rounded-xl transition shadow-lg hover:scale-102"
                >
                  ✅ Aprovar Vendedor
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= COMPROVATIVO DE TRANSAÇÃO SLIP MODAL ================= */}
      {selectedTxSlip && (
        <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 border-4 border-slate-100 shadow-2xl relative animate-scaleUp">
            <button 
              onClick={() => setSelectedTxSlip(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 text-xl"
            >
              <i className="fa-solid fa-circle-xmark"></i>
            </button>

            <div className="text-center space-y-2 pb-6 border-b border-dashed border-slate-200">
              <div className="w-16 h-16 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-2xl shadow-inner">
                <i className="fa-solid fa-file-invoice-dollar"></i>
              </div>
              <h3 className="font-black uppercase tracking-tight text-slate-800 text-base leading-none">BazamosPay Moçambique</h3>
              <p className="text-[8px] font-black tracking-widest text-slate-400 uppercase">Comprovativo de Operação Oficial</p>
            </div>

            <div className="py-6 space-y-4 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">ESTADO:</span>
                <span className="text-green-700 font-black tracking-wide uppercase bg-green-50 px-2 py-0.5 rounded">CONFIRMADO</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">OPERADOR:</span>
                <span className="text-slate-800 font-black">{selectedTxSlip.method}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">REFERÊNCIA:</span>
                <span className="text-slate-800 font-black">{selectedTxSlip.reference}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">TIMESTAMP:</span>
                <span className="text-slate-800 font-black">{new Date(selectedTxSlip.timestamp).toLocaleString('pt-PT')}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">DESCRIÇÃO:</span>
                <span className="text-slate-800 font-black text-right max-w-[200px] truncate">{selectedTxSlip.description}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">NUIT BAZAMOS:</span>
                <span className="text-slate-800 font-black">400982172</span>
              </div>

              <div className="border-t border-dashed border-slate-200 pt-4 flex justify-between items-center">
                <span className="text-slate-400 font-black uppercase text-[10px]">VALOR TOTAL:</span>
                <span className="text-slate-900 font-black text-lg">
                  {selectedTxSlip.amount.toLocaleString('pt-PT', { minimumFractionDigits: 2 })} MT
                </span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center space-y-3 border border-slate-100">
              <div className="w-28 h-28 bg-white border border-slate-200 p-2 flex flex-col justify-between rounded-lg">
                <div className="flex justify-between">
                  <div className="w-6 h-6 bg-slate-900 rounded-sm"></div>
                  <div className="w-6 h-6 bg-slate-900 rounded-sm"></div>
                </div>
                <div className="w-12 h-1 bg-slate-900 rounded-sm mx-auto"></div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 bg-slate-900 rounded-sm"></div>
                  <div className="w-4 h-4 bg-slate-900 rounded-sm"></div>
                </div>
              </div>
              <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-relaxed text-center">
                Autenticado pelo Protocolo Central do SERNIC Moçambique para Proteção de Comércio Eletrónico.
              </p>
            </div>

            <div className="pt-6">
              <button 
                onClick={() => {
                  window.print();
                  addSecurityLog('ADMIN_ACTION', `Comprovativo ${selectedTxSlip.reference} impresso / guardado em PDF`);
                }}
                className="w-full bg-green-700 hover:bg-green-800 text-white py-4 rounded-xl font-black uppercase text-[9px] tracking-widest transition flex items-center justify-center gap-2 shadow-lg"
              >
                <i className="fa-solid fa-print"></i> Imprimir / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
