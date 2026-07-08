
import React, { useState } from 'react';
import { ChatMessage, Order } from '../types';

interface ChatSystemProps {
  messages: ChatMessage[];
  currentUserId?: string;
  onSendMessage: (txt: string) => void;
  onBack: () => void;
  onAcceptOrder?: (orderId: string) => void;
  onRejectOrder?: (orderId: string) => void;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({ 
  messages, 
  currentUserId,
  onSendMessage, 
  onBack, 
  onAcceptOrder,
  onRejectOrder
}) => {
  const [input, setInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto h-[70vh] flex flex-col bg-white rounded-[4rem] shadow-2xl border overflow-hidden animate-fadeIn">
      <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center"><i className="fa-solid fa-chevron-left"></i></button>
           <div>
              <h3 className="font-black uppercase tracking-tighter text-lg leading-none">Canal de Negociação</h3>
              <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest mt-1">Criptografia Pay Ativa</p>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === 'me' || m.senderId === 'buyer' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] space-y-2`}>
              {m.order ? (
                <div className={`bg-white border-2 rounded-[2.5rem] p-8 shadow-xl max-w-sm ${m.order.status === 'ACCEPTED' ? 'border-green-600' : 'border-slate-200'}`}>
                   <div className="flex items-center gap-4 mb-6">
                      <img src={m.order.productImage} className="w-16 h-16 rounded-2xl object-cover" />
                      <div className="flex-1">
                         <p className="text-[9px] font-black uppercase text-slate-400">Formalização de Pedido</p>
                         <p className="font-black text-slate-900 uppercase truncate">{m.order.productName}</p>
                      </div>
                   </div>
                   {m.order.status === 'PENDING' ? (
                     currentUserId && m.order.sellerId === currentUserId ? (
                       <div className="flex gap-2">
                          <button 
                            onClick={() => onAcceptOrder && onAcceptOrder(m.order!.id)} 
                            className="flex-1 bg-green-700 hover:bg-green-800 text-white font-black py-4 rounded-xl uppercase text-[8px] tracking-widest shadow-md transition"
                          >
                            Aceitar
                          </button>
                          <button 
                            onClick={() => onRejectOrder && onRejectOrder(m.order!.id)}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 font-black py-4 rounded-xl uppercase text-[8px] tracking-widest border border-red-100 transition"
                          >
                            Rejeitar
                          </button>
                       </div>
                     ) : (
                       <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-center font-black uppercase text-[8px] tracking-widest border border-amber-200">
                         <i className="fa-solid fa-hourglass-half mr-2 animate-pulse"></i> Aguardando Vendedor
                       </div>
                     )
                   ) : m.order.status === 'ACCEPTED' ? (
                     <div className="bg-green-100 text-green-700 p-4 rounded-xl text-center font-black uppercase text-[8px] tracking-widest">
                       <i className="fa-solid fa-check-double mr-2"></i> Negócio Aceite
                     </div>
                   ) : (
                     <div className="bg-red-100 text-red-700 p-4 rounded-xl text-center font-black uppercase text-[8px] tracking-widest">
                       <i className="fa-solid fa-ban mr-2"></i> Negócio Rejeitado
                     </div>
                   )}
                </div>
              ) : (
                <div className={`p-6 rounded-[2rem] font-bold text-sm shadow-sm ${
                  m.senderId === 'me' || m.senderId === 'buyer' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                }`}>
                  {m.text}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSend} className="p-8 bg-white border-t flex gap-4">
        <input 
          type="text" 
          value={input} 
          onChange={e => setInput(e.target.value)} 
          placeholder="Mensagem profissional..." 
          className="flex-1 bg-slate-50 p-6 rounded-2xl font-black outline-none" 
        />
        <button type="submit" className="bg-slate-900 text-white w-20 rounded-2xl flex items-center justify-center shadow-lg hover:bg-black transition">
          <i className="fa-solid fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};
