
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface VipGridProps {
  products: Product[];
  onProductClick: (p: Product) => void;
  onSellerClick: (sId: string) => void;
}

export const VipGrid: React.FC<VipGridProps> = ({ products, onProductClick, onSellerClick }) => {
  const vipItems = products.filter(p => p.isVip);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Selecionar até 4 produtos para a rotação do Big Grid
  const rotationItems = vipItems.slice(0, 4);

  useEffect(() => {
    if (rotationItems.length <= 1) return;

    const interval = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % rotationItems.length);
        setIsExiting(false);
      }, 800); // Tempo para a animação de saída
    }, 60000); // 1 minuto de intervalo

    return () => clearInterval(interval);
  }, [rotationItems.length]);

  if (vipItems.length === 0) return null;

  const currentVip = rotationItems[currentIndex];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 animate-fadeIn">
      {/* QUADRADO ENORME PERFEITO COM ROTAÇÃO */}
      <div className="w-full mb-8 md:mb-12">
        <div 
          className={`relative w-full aspect-[1/0.85] md:aspect-[16/7] max-h-[500px] mx-auto rounded-[2rem] md:rounded-[4rem] overflow-hidden shadow-2xl cursor-pointer border-4 md:border-8 border-yellow-500/20 bg-slate-900 transition-all duration-1000 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
          onClick={() => onProductClick(currentVip)}
        >
          {/* Fundo com Shimmer VIP */}
          <div className="absolute inset-0 gold-shimmer-bg opacity-30"></div>
          
          {/* Imagem do Produto em Destaque */}
          <img 
            src={currentVip.imageUrl} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] ease-linear group-hover:scale-110" 
            alt={currentVip.name} 
          />
          
          {/* Overlay de Gradiente Profissional */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

          {/* Conteúdo Informativo */}
          <div className="absolute bottom-0 left-0 w-full p-6 md:p-16 text-white flex flex-col justify-end">
            <div className="flex items-center gap-3 mb-3 md:mb-6">
              <span className="bg-yellow-500 text-black px-4 py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] shadow-xl">
                DESTAQUE VIP GOLD • CANAL {currentIndex + 1}
              </span>
            </div>
            
            <h2 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-3 md:mb-6 truncate max-w-4xl">
              {currentVip.name}
            </h2>
            
            <div className="flex items-center justify-between gap-4">
              <div className="text-2xl md:text-5xl font-black text-yellow-500 tracking-tighter">
                {currentVip.price.toLocaleString()} <span className="text-sm md:text-2xl opacity-50">MT</span>
              </div>
              
              <div className="flex items-center gap-2 md:gap-4 bg-white/10 backdrop-blur-md px-4 py-2 md:px-8 md:py-4 rounded-2xl border border-white/20">
                <img src={currentVip.seller.avatar} className="w-8 h-8 md:w-12 md:h-12 rounded-xl border border-white/30" />
                <div className="text-left hidden xs:block">
                  <p className="text-[6px] md:text-[8px] font-black uppercase opacity-60 tracking-widest">Selo Profissional</p>
                  <p className="text-[10px] md:text-[12px] font-black uppercase tracking-tighter">{currentVip.seller.name}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Paginação do Grid Grande */}
          {rotationItems.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {rotationItems.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === currentIndex ? 'w-8 bg-yellow-500' : 'w-2 bg-white/30'}`}></div>
              ))}
            </div>
          )}

          {/* Ícone VIP */}
          <div className="absolute top-6 right-6 md:top-12 md:right-12 w-12 h-12 md:w-20 md:h-20 bg-yellow-500 rounded-2xl md:rounded-[2rem] flex items-center justify-center text-xl md:text-3xl shadow-2xl border-4 border-white">
            <i className="fa-solid fa-crown text-black"></i>
          </div>
        </div>
      </div>
      
      <div className="mt-8 mb-6 flex items-center gap-4">
        <h3 className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.4em] text-slate-400 whitespace-nowrap">Mercado Geral</h3>
        <div className="h-px flex-1 bg-slate-200"></div>
      </div>
    </div>
  );
};
