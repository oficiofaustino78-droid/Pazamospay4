
import React from 'react';
import { Product, Seller } from './types';

export const MOZAMBIQUE_DATA: Record<string, string[]> = {
  'Maputo Cidade': ['KaMpfumo', 'Nlhamankulu', 'KaMaxaquene', 'KaMavota', 'KaMubukwana', 'KaTembe', 'KaNyaka'],
  'Maputo Província': ['Boane', 'Magude', 'Manhiça', 'Marracuene', 'Matola', 'Matutuíne', 'Moamba', 'Namaacha'],
  'Gaza': ['Bilene', 'Chibuto', 'Chicualacuala', 'Chigubo', 'Chókwe', 'Guijá', 'Mabalane', 'Manjacaze', 'Massangena', 'Massingir', 'Xai-Xai', 'Limpopo', 'Mandlakazi'],
  'Inhambane': ['Funhalouro', 'Govuro', 'Homoíne', 'Inharrime', 'Inhassoro', 'Jangamo', 'Mabote', 'Massinga', 'Maxixe', 'Morrumbene', 'Panda', 'Vilankulo', 'Zavala', 'Inhambane Cidade'],
  'Sofala': ['Beira', 'Búzi', 'Caia', 'Chemba', 'Cheringoma', 'Chibabava', 'Dondo', 'Gorongosa', 'Marromeu', 'Machanga', 'Maringué', 'Muanza', 'Nhamatanda'],
  'Manica': ['Barué', 'Gondola', 'Guro', 'Macate', 'Machaze', 'Macossa', 'Manica', 'Mossurize', 'Sussundenga', 'Tambara', 'Chimoio'],
  'Tete': ['Angónia', 'Cahora-Bassa', 'Changara', 'Chifunde', 'Chiúta', 'Dôa', 'Macanga', 'Magoé', 'Marávia', 'Moatize', 'Mutarara', 'Tsangano', 'Zumbo', 'Tete Cidade'],
  'Zambézia': ['Alto Molócuè', 'Chinde', 'Gilé', 'Gurué', 'Ile', 'Inhassunge', 'Luarua', 'Maganja da Costa', 'Milange', 'Mocuba', 'Mocubela', 'Molumbo', 'Mopeia', 'Morrumbala', 'Mulevala', 'Namacurra', 'Namarroi', 'Nicoadala', 'Pebane', 'Quelimane'],
  'Nampula': ['Angoche', 'Eráti', 'Ilha de Moçambique', 'Lalaua', 'Larde', 'Liúpo', 'Malema', 'Meconta', 'Mecubúri', 'Memba', 'Mogincual', 'Mogovolas', 'Moma', 'Monapo', 'Mossuril', 'Muecate', 'Murrupula', 'Nacala-a-Velha', 'Nacala Porto', 'Nacarôa', 'Nampula Cidade', 'Rapale', 'Ribáuè'],
  'Niassa': ['Cuamba', 'Lago', 'Lichinga', 'Majune', 'Mandimba', 'Marrupa', 'Maúa', 'Mavago', 'Mecanhelas', 'Mecula', 'Metarica', 'Muembe', 'Ngauma', 'Nipepe', 'Sanga', 'Chimbonila'],
  'Cabo Delgado': ['Ancuabe', 'Balama', 'Chiúre', 'Ibo', 'Macomia', 'Mecúfi', 'Meluco', 'Metuge', 'Mocímboa da Praia', 'Montepuez', 'Mueda', 'Muidumbe', 'Namuno', 'Nangade', 'Palma', 'Pemba', 'Quissanga']
};

export const COLORS = {
  PRIMARY: 'bg-[#15803d]',
  SECONDARY: 'bg-white',
  ACCENT_GOLD: '#d4af37',
  ACCENT_GREEN: '#15803d',
  ACCENT_RED: '#b91c1c',
};

// Fixed: Added isVip property to each mock seller to satisfy type requirements
const MOCK_SELLERS: Record<string, Seller> = {
  's1': { id: 's1', name: 'Eletro Store', avatar: 'https://i.pravatar.cc/150?u=eletro', rating: 4.8, reviewsCount: 124, phone: '+258 84 123 4567', location: 'Maputo Cidade', isVip: true },
  's2': { id: 's2', name: 'Nelo Tech', avatar: 'https://i.pravatar.cc/150?u=nelo', rating: 4.9, reviewsCount: 89, phone: '+258 82 987 6543', location: 'Beira', isVip: true },
  's3': { id: 's3', name: 'Smart Solutions', avatar: 'https://i.pravatar.cc/150?u=smart', rating: 4.5, reviewsCount: 56, phone: '+258 87 555 0101', location: 'Nampula', isVip: false },
};

export const MOCK_PRODUCTS: Product[] = [
  { id: '1', name: 'iPhone 15 Pro Max', price: 85000, isAvailable: true, province: 'Maputo Cidade', district: 'KaMpfumo', neighborhood: 'Polana', description: 'Estado novo, bateria 100%, com todos acessórios originais.', imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=1200', isVip: true, seller: MOCK_SELLERS['s1'] },
  { id: '2', name: 'MacBook Air M2', price: 72000, isAvailable: true, province: 'Sofala', district: 'Beira', neighborhood: 'Ponta Gêa', description: '8GB RAM, 256GB SSD, semi-novo sem riscos.', imageUrl: 'https://images.unsplash.com/photo-1611186871348-b1ec696e5237?auto=format&fit=crop&q=80&w=1200', isVip: true, seller: MOCK_SELLERS['s2'] },
  { id: '3', name: 'Sony PlayStation 5', price: 45000, isAvailable: true, province: 'Inhambane', district: 'Vilankulo', neighborhood: 'Bairro Central', description: 'Inclui 2 comandos e 3 jogos físicos.', imageUrl: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&q=80&w=1200', isVip: true, seller: MOCK_SELLERS['s1'] }
];

/**
 * Leaf Pro - Folha com proporções normais (nem gorda, nem fina) e raízes visíveis.
 */
const LeafPro = ({ color, rootColor = "rgba(255,255,255,0.4)", className = "" }: { color: string, rootColor?: string, className?: string }) => (
  <svg width="46" height="66" viewBox="0 0 100 150" className={`filter drop-shadow-lg transition-all duration-700 ${className}`}>
    <path 
      d="M50 0 C75 35 90 85 90 115 C90 135 72 145 50 145 C28 145 10 135 10 115 C10 85 25 35 50 0" 
      fill={color} 
    />
    <path d="M50 5 V145" stroke={rootColor} strokeWidth="3" strokeLinecap="round" />
    <path d="M50 40 L80 65 M50 75 L92 105 M50 110 L78 132" stroke={rootColor} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    <path d="M50 40 L20 65 M50 75 L8 105 M50 110 L22 132" stroke={rootColor} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const Logo = () => (
  <div className="flex flex-col items-center justify-center pointer-events-none select-none group h-24">
    <div className="relative w-48 h-24 flex items-center justify-center overflow-visible">
      
      {/* Vento Cinético Profissional */}
      <svg className="absolute inset-0 w-full h-full z-0 overflow-visible" viewBox="0 0 100 80">
        <defs>
          <linearGradient id="windGradHeader" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255,255,255,0)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.7)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <path d="M-30 25 Q 20 5, 60 25 T 150 25" fill="none" stroke="url(#windGradHeader)" strokeWidth="1.2" className="animate-wind-pro" />
        <path d="M-20 48 Q 25 28, 65 48 T 155 48" fill="none" stroke="url(#windGradHeader)" strokeWidth="0.8" className="animate-wind-pro" style={{ animationDelay: '2s' }} />
      </svg>
      
      {/* Sequência Exata de 3 Folhas: Amarela, Vermelha (Centro), Azul */}
      <div className="relative z-10 flex items-center -space-x-8">
        {/* Folha Amarela - Prosperidade */}
        <LeafPro 
          color="url(#gradY)" 
          className="transform -rotate-12 translate-y-1 group-hover:-translate-x-1" 
          rootColor="rgba(0,0,0,0.12)"
        />
        {/* Folha Vermelha - Energia e Centralidade */}
        <LeafPro 
          color="url(#gradR)" 
          className="z-10 transform scale-110 drop-shadow-[0_12px_24px_rgba(185,28,28,0.5)]" 
          rootColor="rgba(255,255,255,0.4)"
        />
        {/* Folha Azul - Confiança e Tecnologia */}
        <LeafPro 
          color="url(#gradB)" 
          className="transform rotate-12 translate-y-1 group-hover:translate-x-1" 
          rootColor="rgba(255,255,255,0.3)"
        />
        
        <svg width="0" height="0" className="absolute">
          <defs>
            <linearGradient id="gradY" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#92400e" /></linearGradient>
            <linearGradient id="gradR" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#7f1d1d" /></linearGradient>
            <linearGradient id="gradB" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#1e3a8a" /></linearGradient>
          </defs>
        </svg>
      </div>
    </div>
    
    {/* Tipografia Profissional */}
    <div className="text-center -mt-4 relative z-20">
      <span className="text-white font-black text-2xl tracking-[0.2em] uppercase italic drop-shadow-xl block leading-none">
        Bazamos <span className="text-yellow-400 not-italic">Pay</span>
      </span>
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent mt-1.5 shadow-[0_2px_8px_rgba(250,204,21,0.3)]"></div>
    </div>
  </div>
);
