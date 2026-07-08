
import React from 'react';
import { Notification } from '../types';

interface NotificationPanelProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({ 
  notifications, 
  onClose,
  onMarkAsRead
}) => {
  return (
    <div className="fixed inset-0 z-[3000] flex justify-end animate-fadeIn">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
        <div className="p-8 bg-green-700 text-white flex items-center justify-between">
          <h3 className="font-black uppercase tracking-tighter text-xl">Notificações</h3>
          <button onClick={onClose} className="text-2xl hover:scale-110 transition"><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {notifications.length > 0 ? (
            notifications.map(n => (
              <div 
                key={n.id} 
                onClick={() => onMarkAsRead(n.id)}
                className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer shadow-sm ${
                  n.read ? 'bg-white border-gray-100 opacity-60' : 'bg-white border-green-600 shadow-green-100'
                }`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${
                    n.type === 'VIP' ? 'bg-yellow-950 text-yellow-400' : 
                    n.type === 'TRUST' ? 'bg-green-700 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    <i className={`fa-solid ${
                      n.type === 'VIP' ? 'fa-crown' : 
                      n.type === 'TRUST' ? 'fa-heart' : 'fa-bell'
                    }`}></i>
                  </div>
                  <h4 className="font-black uppercase tracking-tighter text-[10px]">{n.title}</h4>
                </div>
                <p className="text-xs font-bold text-gray-500 leading-relaxed uppercase tracking-widest">{n.message}</p>
                <div className="mt-4 text-[8px] font-black text-gray-300 uppercase tracking-widest">
                  {new Date(n.timestamp).toLocaleTimeString()} • {new Date(n.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center opacity-30">
              <i className="fa-solid fa-bell-slash text-6xl mb-6"></i>
              <p className="font-black uppercase tracking-widest text-xs">Sem notificações</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
