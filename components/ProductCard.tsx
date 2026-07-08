
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: (p: Product) => void;
  onSellerClick: (sId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onSellerClick }) => {
  return (
    <div 
      className={`rounded-2xl md:rounded-[2.5rem] shadow-sm border overflow-hidden transition-all duration-300 group cursor-pointer hover:shadow-xl ${
        product.isVip ? 'gold-shimmer-bg border-yellow-500/50' : 'bg-white border-gray-100'
      }`} 
      onClick={() => onClick(product)}
    >
      <div className="relative h-36 md:h-64 overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className={`absolute top-2 left-2 md:top-5 md:left-5 px-3 py-1 md:px-5 md:py-2 rounded-full text-[6px] md:text-[9px] font-black uppercase tracking-widest z-10 shadow-lg ${
          product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {product.isAvailable ? 'Disponível' : 'Indisponível'}
        </div>
      </div>

      <div className="p-4 md:p-8 relative z-10">
        <h3 className={`font-black uppercase tracking-tighter text-[11px] md:text-xl truncate mb-1 ${product.isVip ? 'text-yellow-950' : 'text-slate-900'}`}>
          {product.name}
        </h3>
        <div className={`text-base md:text-3xl font-black mb-4 md:mb-8 ${product.isVip ? 'text-yellow-900' : 'text-green-700'}`}>
          {product.price.toLocaleString()} <span className="text-[10px] md:text-[14px] opacity-50">MT</span>
        </div>

        <div 
          className={`pt-3 md:pt-6 border-t flex items-center justify-between ${product.isVip ? 'border-yellow-950/10' : 'border-slate-50'}`} 
          onClick={(e) => { 
            e.stopPropagation(); 
            onSellerClick(product.seller.id); 
          }}
        >
          <div className="flex items-center space-x-2 md:space-x-3">
            <img src={product.seller.avatar} className="w-6 h-6 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover border-2 border-white shadow-sm" />
            <span className={`text-[7px] md:text-[10px] font-black uppercase tracking-widest truncate max-w-[60px] md:max-w-none ${product.isVip ? 'text-yellow-950' : 'text-slate-500'}`}>
              {product.seller.name}
            </span>
          </div>
          <div className={`flex items-center text-[9px] md:text-sm font-black ${product.isVip ? 'text-yellow-900' : 'text-amber-500'}`}>
            <i className="fa-solid fa-shield-check mr-1 md:mr-2"></i>
            {product.seller.rating}
          </div>
        </div>
      </div>
    </div>
  );
};
