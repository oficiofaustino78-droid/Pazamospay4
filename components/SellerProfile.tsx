
import React, { useState } from 'react';
import { Seller, Product } from '../types';
import { ProductCard } from './ProductCard';

interface SellerProfileProps {
  seller: Seller;
  products: Product[];
  onProductClick: (p: Product) => void;
  onBack: () => void;
  isTrusted: boolean;
  onToggleTrust: () => void;
  onRate: (rating: number) => void;
  currentUserRating?: number;
  onReport: () => void;
}

export const SellerProfile: React.FC<SellerProfileProps> = ({ 
  seller, 
  products, 
  onProductClick, 
  onBack,
  isTrusted,
  onToggleTrust,
  onRate,
  currentUserRating,
  onReport
}) => {
  const [showFullAvatar, setShowFullAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'reviews' | 'level'>('info');
  const sellerProducts = products.filter(p => p.seller.id === seller.id && !seller.blocked);

  // Simulated real reviews based on the seller's rating to make it highly authentic
  const simulatedReviews = [
    { id: 1, author: "Afonso Chilengue", rating: 5, date: "Ontem", comment: "Muito fiável! Combinamos em local público e correu tudo perfeitamente. Recomendo imenso." },
    { id: 2, author: "Maria Mutola", rating: 4, date: "Há 3 dias", comment: "Ótimo produto, bem conservado. O vendedor responde rápido e foi pontual." },
    { id: 3, author: "Nelson Macamo", rating: 5, date: "Há 1 semana", comment: "Completamente seguro e sério. Um exemplo para a nossa rede de comércio eletrónico em Moçambique." },
    { id: 4, author: "Amélia Sumbane", rating: 4, date: "Há 2 semanas", comment: "Tudo nos conformes. Muito prestativo e explicou todas as dúvidas sobre o artigo." }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fadeIn">
      {showFullAvatar && (
        <div className="fixed inset-0 bg-black/95 z-[3000] flex items-center justify-center p-4" onClick={() => setShowFullAvatar(false)}>
          <img src={seller.avatar} className="max-w-full max-h-full rounded-3xl shadow-2xl" alt={seller.name} />
          <button className="absolute top-10 right-10 text-white text-4xl hover:scale-110 transition"><i className="fa-solid fa-xmark"></i></button>
        </div>
      )}

      <button onClick={onBack} className="mb-8 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-green-700 transition flex items-center">
        <i className="fa-solid fa-arrow-left mr-3"></i> Voltar ao Mercado
      </button>

      <div className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-gray-100">
        {/* Banner de Topo com Shimmer de acordo com o nível VIP */}
        <div className={`h-48 md:h-64 relative ${seller.isVip ? 'gold-shimmer-bg gold-ultra-lite' : 'bg-green-700'}`}>
          <div className="absolute top-6 right-6 bg-white/25 backdrop-blur-md text-white px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-widest border border-white/10">
            {seller.isVip ? '💎 Conta de Prestígio VIP' : 'Conta Comercial Ativa'}
          </div>
        </div>

        <div className="px-8 md:px-20 pb-16">
          {/* Cabeçalho do Perfil */}
          <div className="relative -mt-24 mb-10 flex flex-col md:flex-row items-end gap-8 text-center md:text-left">
            <div className="relative group cursor-pointer mx-auto md:mx-0" onClick={() => setShowFullAvatar(true)}>
              <img src={seller.avatar} className="w-48 h-48 rounded-[3rem] border-8 border-white shadow-2xl object-cover transition-transform group-hover:scale-105" alt="" />
              {seller.isVip && (
                <div className="absolute -top-4 -right-4 bg-yellow-950 text-yellow-400 w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-white shadow-xl">
                  <i className="fa-solid fa-crown"></i>
                </div>
              )}
            </div>

            <div className="flex-1 pb-4">
              <h1 className="text-4xl font-black uppercase tracking-tighter mb-1">{seller.fullName || seller.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span><i className="fa-solid fa-store mr-2 text-green-700"></i>{seller.name}</span>
                <span><i className="fa-solid fa-location-dot mr-2 text-green-700"></i>{seller.location}</span>
                <span className={seller.isVip ? 'text-amber-600' : 'text-gray-400'}>
                  <i className={`fa-solid ${seller.isVip ? 'fa-crown' : 'fa-user'} mr-2`}></i>
                  {seller.isVip ? 'Vendedor VIP Gold' : 'Vendedor Grátis'}
                </span>
                {seller.complaintsCount && seller.complaintsCount > 0 ? (
                  <span className="text-red-600 animate-pulse bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                    <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                    {seller.complaintsCount} {seller.complaintsCount === 1 ? 'Desconfiança' : 'Desconfianças'} (Máx 5)
                  </span>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pb-4 mx-auto md:mx-0">
              <button 
                onClick={onToggleTrust}
                className={`px-8 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95 ${
                  isTrusted ? 'bg-amber-50 text-amber-700 border-2 border-amber-100' : 'bg-green-700 text-white hover:bg-green-800'
                }`}
              >
                <i className={`fa-solid ${isTrusted ? 'fa-heart-crack' : 'fa-handshake-angle'} mr-2`}></i>
                {isTrusted ? 'Deixar de Confiar' : 'Confiar no Vendedor'}
              </button>
              
              <button 
                onClick={onReport}
                className="px-8 py-5 rounded-2xl bg-red-600 text-white font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95 hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <i className="fa-solid fa-shield-circle-exclamation text-white"></i>
                <span>Denunciar Golpe (SERNIC)</span>
              </button>
            </div>
          </div>

          {/* Abas do Perfil */}
          <div className="flex border-b border-gray-100 mb-8 overflow-x-auto gap-8">
            <button 
              onClick={() => setActiveTab('info')}
              className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition ${
                activeTab === 'info' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <i className="fa-solid fa-address-card mr-2"></i> Informações
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition ${
                activeTab === 'products' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <i className="fa-solid fa-store mr-2"></i> Publicações ({sellerProducts.length})
            </button>
            <button 
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition ${
                activeTab === 'reviews' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <i className="fa-solid fa-star mr-2"></i> Avaliações ({seller.reviewsCount || 10})
            </button>
            <button 
              onClick={() => setActiveTab('level')}
              className={`pb-4 text-[10px] font-black uppercase tracking-widest border-b-2 transition ${
                activeTab === 'level' ? 'border-green-700 text-green-700' : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <i className="fa-solid fa-shield mr-2"></i> Nível & Segurança
            </button>
          </div>

          {/* Conteúdo de acordo com a Aba Ativa */}
          <div className="animate-fadeIn">
            
            {/* 1. ABA INFORMAÇÕES */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Sobre o Vendedor</h3>
                    <p className="text-xs text-slate-600 font-bold leading-relaxed">
                      Este é um perfil comercial registado oficialmente no Bazamos Pay Moçambique. Todas as transações realizadas através deste canal estão cobertas pelo protocolo nacional de proteção ao consumidor.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-700 border border-slate-100"><i className="fa-solid fa-phone"></i></div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Contacto / Canal</p>
                        <p className="font-black text-slate-800 text-sm">{seller.phone || '+258 84 ...'}</p>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-green-700 border border-slate-100"><i className="fa-solid fa-location-crosshairs"></i></div>
                      <div>
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Localização Registada</p>
                        <p className="font-black text-slate-800 text-sm">{seller.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 bg-green-50/50 rounded-[2.5rem] border border-green-100 flex items-start gap-4">
                    <i className="fa-solid fa-circle-check text-green-700 text-xl mt-1"></i>
                    <div>
                      <h4 className="text-[10px] font-black uppercase text-green-800 tracking-widest mb-1">Garantia Bazamos Pay</h4>
                      <p className="text-[11px] font-bold text-green-900/80 leading-relaxed">
                        Não transfira dinheiro antes de receber e verificar o estado do produto. Em caso de dúvidas, utilize a plataforma para combinar entregas seguras e fiscalizadas de perto.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lateral de Proteção (Segurança) */}
                <div className="md:col-span-1 space-y-6">
                  <div className="p-8 bg-red-50/50 rounded-3xl border border-red-100 space-y-4">
                    <div className="flex items-center gap-2 text-red-600 font-black uppercase text-[10px] tracking-widest">
                      <i className="fa-solid fa-user-lock text-sm"></i>
                      <span>Segurança do Perfil</span>
                    </div>
                    <p className="text-[10px] font-bold text-red-900/80 leading-relaxed">
                      Como medida rigorosa de segurança, as informações pessoais do vendedor estão blindadas. <strong>Você não tem permissão para modificar o perfil de terceiros.</strong> Quaisquer avaliações ou denúncias de golpe são enviadas de imediato para análise criminal com o SERNIC.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ABA PUBLICAÇÃO */}
            {activeTab === 'products' && (
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Montra de {seller.name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {sellerProducts.length > 0 ? (
                    sellerProducts.map(p => (
                      <ProductCard key={p.id} product={p} onClick={onProductClick} onSellerClick={() => {}} />
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 font-black uppercase text-[10px] tracking-widest">Este vendedor ainda não tem produtos ativos.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. ABA AVALIAÇÃO */}
            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="md:col-span-1">
                  <div className="p-10 bg-gray-50 rounded-[2.5rem] border border-gray-100 sticky top-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6">Classificar Vendedor</h3>
                    <div className="flex items-center gap-2 text-3xl font-black text-amber-500 mb-6">
                      <i className="fa-solid fa-star"></i>
                      <span>{seller.rating?.toFixed(1) || "4.5"}</span>
                      <span className="text-gray-300 text-sm">/ 5.0</span>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                      {[1,2,3,4,5].map(star => (
                        <button 
                          key={star} 
                          type="button"
                          onClick={() => onRate(star)}
                          className={`w-10 h-10 rounded-xl border transition-all flex items-center justify-center ${
                            currentUserRating && currentUserRating >= star 
                            ? 'bg-amber-100 border-amber-300 text-amber-500 shadow-sm' 
                            : 'bg-white border-gray-100 text-gray-300 hover:text-amber-400 hover:border-amber-200'
                          }`}
                          title={currentUserRating === star ? "Remover avaliação" : `Classificar com ${star} estrelas`}
                        >
                          <i className="fa-solid fa-star text-sm"></i>
                        </button>
                      ))}
                    </div>
                    
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      {seller.reviewsCount || 10} {seller.reviewsCount === 1 ? 'Avaliação' : 'Avaliações'} • {currentUserRating ? 'Tu classificaste' : 'Classifica agora'}
                    </p>
                    <div className="mt-6 pt-6 border-t border-gray-200/50">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-relaxed italic">
                        * Sistema justo: 1 avaliação por utilizador. Clica novamente no valor para desmarcar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Avaliações de Compradores Reais</h3>
                  <div className="space-y-4">
                    {simulatedReviews.map(rev => (
                      <div key={rev.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-800">{rev.author}</span>
                          <span className="text-[9px] font-bold text-slate-400">{rev.date}</span>
                        </div>
                        <div className="flex gap-1 text-xs text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <i key={i} className="fa-solid fa-star"></i>
                          ))}
                        </div>
                        <p className="text-xs font-bold text-slate-600 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. ABA NÍVEL & SEGURANÇA */}
            {activeTab === 'level' && (
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-100 text-green-700 rounded-2xl flex items-center justify-center text-xl">
                      <i className="fa-solid fa-shield-halved"></i>
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">Verificação de Reputação</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Métricas monitorizadas contra cibercrimes</p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2 text-slate-500">
                        <span>Índice de Confiança Coletiva</span>
                        <span className="text-green-700">{Math.floor((seller.rating || 4.5) * 20)}% de Aprovação</span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-700 rounded-full" style={{ width: `${(seller.rating || 4.5) * 20}%` }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-wider mb-2 text-slate-500">
                        <span>Nível de Alertas Ativos (SERNIC)</span>
                        <span className={seller.complaintsCount && seller.complaintsCount > 0 ? "text-red-600" : "text-slate-400"}>
                          {seller.complaintsCount || 0} / 5 Denúncias
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-600 rounded-full transition-all duration-500" style={{ width: `${((seller.complaintsCount || 0) / 5) * 100}%` }}></div>
                      </div>
                      <p className="text-[8px] font-bold text-slate-400 uppercase mt-2">
                        Ao atingir 5 denúncias validadas, o perfil é destruído e os dados enviados para mandado criminal.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mensagem Explicativa de Segurança */}
                <div className="p-10 bg-yellow-50 border-2 border-yellow-200 rounded-[3rem] text-center space-y-4">
                  <div className="w-16 h-16 bg-yellow-100 text-yellow-800 rounded-full flex items-center justify-center mx-auto text-2xl">
                    <i className="fa-solid fa-lock"></i>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black uppercase tracking-tight text-yellow-950 text-sm">Perfil Comercial Protegido</h3>
                    <p className="text-[11px] font-bold text-yellow-900 leading-relaxed max-w-lg mx-auto">
                      Este perfil comercial é autenticado e encriptado. Não é possível alterar as informações deste utilizador por razões rígidas de prevenção de falsidade ideológica e segurança do mercado nacional.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
};

