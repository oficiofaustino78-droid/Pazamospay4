
import React, { useState } from 'react';
import { Product, Order, User } from '../types';

interface ProductDetailProps {
  product: Product;
  isLoggedIn: boolean;
  currentUser: User | null;
  onBack: () => void;
  onOrder: (order: Partial<Order>) => void;
  onChat: () => void;
  onSellerView: (sellerId: string) => void;
  onSendDeliveryAlert?: (product: Product, msg: string) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({ 
  product, 
  isLoggedIn,
  currentUser,
  onBack, 
  onOrder, 
  onChat,
  onSellerView,
  onSendDeliveryAlert
}) => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [buyerName, setBuyerName] = useState(currentUser?.name || '');
  const [buyerPhone, setBuyerPhone] = useState(currentUser?.phone || '');
  const [buyerProvince, setBuyerProvince] = useState(currentUser?.province || '');
  const [buyerNeighborhood, setBuyerNeighborhood] = useState(currentUser?.district || '');
  const [alertSent, setAlertSent] = useState(false);

  // Calcular se existe distância significativa (distritos ou províncias diferentes)
  const isDistant = isLoggedIn && currentUser && (
    product.province !== currentUser.province || product.district !== currentUser.district
  );

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOrder({ buyerName, buyerPhone, buyerProvince, buyerNeighborhood });
    setShowOrderModal(false);
  };

  const handleAlertSeller = () => {
    if (!currentUser || !onSendDeliveryAlert) return;
    const msg = `Olá ${product.seller.name}! Estou muito interessado no seu '${product.name}' mas encontro-me no distrito de ${currentUser.district} (${currentUser.province}). Consegue realizar a entrega de forma segura neste distrito? Caso não consiga, não registe a compra. Qualquer tentativa de fraude ou golpe será severamente penalizada pelo SERNIC.`;
    onSendDeliveryAlert(product, msg);
    setAlertSent(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-fadeIn">
      <button onClick={onBack} className="mb-10 flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-green-700 transition">
        <i className="fa-solid fa-chevron-left mr-3"></i> Voltar ao Mercado
      </button>

      <div className={`rounded-[4rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row border-4 ${product.isVip ? 'border-yellow-500 bg-white' : 'border-slate-50 bg-white'}`}>
        {/* FOTO COMPLETA NO QUADRADO SEGURO */}
        <div className="lg:w-1/2 bg-slate-50 flex items-center justify-center p-12 min-h-[500px]">
          <img src={product.imageUrl} className="max-w-full max-h-[600px] object-contain rounded-[2rem] shadow-2xl" alt={product.name} />
        </div>

        <div className="lg:w-1/2 p-12 md:p-16 flex flex-col justify-center">
          <div className="flex items-center gap-4 mb-6">
             <span className={`px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
               {product.isAvailable ? 'Em Stock' : 'Vendido'}
             </span>
             {product.isVip && <span className="bg-yellow-950 text-yellow-400 px-5 py-2 rounded-full text-[8px] font-black uppercase tracking-widest">Premium VIP</span>}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 mb-2 leading-none">{product.name}</h1>
          <p onClick={() => onSellerView(product.seller.id)} className="text-sm font-black text-green-700 uppercase tracking-widest mb-8 cursor-pointer hover:underline">
             Vendedor: {product.seller.name}
          </p>
          
          <div className="text-4xl font-black text-slate-900 mb-10 tracking-tighter">{product.price.toLocaleString()} MT</div>
          
          <div className="space-y-6 mb-12">
             <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                <p className="text-[10px] font-black uppercase text-slate-400 mb-3 tracking-widest">Detalhes do Artigo</p>
                <p className="text-slate-600 font-bold leading-relaxed text-sm">{product.description}</p>
                <div className="mt-4 pt-4 border-t border-slate-200/50 flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <span><i className="fa-solid fa-map-pin mr-1.5 text-green-700"></i>Província: {product.province}</span>
                  <span><i className="fa-solid fa-location-crosshairs mr-1.5 text-green-700"></i>Distrito: {product.district}</span>
                </div>
             </div>

             {isDistant && (
               <div className="p-8 bg-red-50 rounded-[2.5rem] border-2 border-red-100 space-y-4 animate-fadeIn">
                 <div className="flex items-center gap-3 text-red-600 font-black uppercase text-[10px] tracking-[0.2em]">
                   <i className="fa-solid fa-triangle-exclamation text-xl"></i>
                   <span>Protocolo Pay: Alerta de Distância</span>
                 </div>
                 
                 <p className="text-xs text-red-700 font-bold leading-relaxed">
                   Este artigo está em <strong className="underline">{product.province}, distrito de {product.district}</strong>. 
                   Você está em <strong className="underline">{currentUser?.province}, distrito de {currentUser?.district}</strong>. 
                   O Pay adverte: A distância geográfica é considerável!
                 </p>
                 
                 <div className="bg-white/80 p-4 rounded-2xl border border-red-100 text-[10px] font-bold text-red-950 space-y-2">
                   <p className="font-black uppercase text-[8px] text-red-600 tracking-widest">⚠️ CONFIA NESTE VENDEDOR?</p>
                   <p>
                     O vendedor foi alertado. Ele deverá confirmar se consegue entregar o produto. Caso não, cancele a compra. 
                     Qualquer fraude ou golpe terá consequências graves com o <strong>SERNIC</strong>.
                   </p>
                 </div>

                 {alertSent ? (
                   <div className="w-full bg-green-100 text-green-700 py-4 rounded-xl font-black uppercase text-[8px] tracking-widest flex items-center justify-center gap-2 border border-green-200">
                     <i className="fa-solid fa-shield-check"></i>
                     <span>Alerta de Viabilidade Enviado ao Vendedor!</span>
                   </div>
                 ) : (
                   <button 
                     type="button"
                     onClick={handleAlertSeller}
                     className="w-full bg-red-600 text-white font-black py-4 rounded-xl uppercase text-[8px] tracking-widest hover:bg-black transition shadow-md flex items-center justify-center gap-2"
                   >
                     <i className="fa-solid fa-paper-plane"></i>
                     <span>Alertar Vendedor & Perguntar Viabilidade</span>
                   </button>
                 )}
               </div>
             )}
          </div>

          {!isLoggedIn ? (
            <div className="p-8 bg-amber-50 rounded-[2rem] border-2 border-amber-100 text-center">
              <i className="fa-solid fa-lock text-amber-600 text-2xl mb-4"></i>
              <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-4">Identificação Necessária</p>
              <p className="text-xs font-bold text-amber-700/70 mb-6 uppercase">Cria uma conta para negociar este artigo com segurança.</p>
              <button onClick={onChat} className="w-full bg-amber-600 text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-[0.3em]">Entrar / Registar</button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
               <button onClick={() => setShowOrderModal(true)} className="flex-1 bg-green-700 text-white font-black py-6 rounded-[2rem] uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition">Solicitar Compra</button>
               <button onClick={onChat} className="flex-1 bg-slate-900 text-white font-black py-6 rounded-[2rem] uppercase text-[10px] tracking-widest shadow-xl hover:bg-black transition">Negociar em Chat</button>
            </div>
          )}
        </div>
      </div>

      {showOrderModal && isLoggedIn && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-xl p-12 rounded-[4rem] shadow-2xl animate-fadeIn">
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 text-center text-slate-900">Formalizar Interesse</h3>
              <form onSubmit={handleOrderSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase ml-4 text-slate-400">Nome do Interessado</label>
                    <input type="text" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border-2 font-bold text-slate-900" required />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase ml-4 text-slate-400">Telemóvel para Contacto</label>
                    <input type="tel" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="w-full p-5 rounded-2xl bg-slate-50 border-2 font-bold text-slate-900" required />
                 </div>
                 <div className="flex gap-4 pt-6">
                    <button type="button" onClick={() => setShowOrderModal(false)} className="flex-1 bg-slate-100 text-slate-400 font-black py-6 rounded-2xl uppercase text-[10px]">Cancelar</button>
                    <button type="submit" className="flex-[2] bg-green-700 text-white font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl">Enviar Intenção</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};
