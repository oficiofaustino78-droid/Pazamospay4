
import React from 'react';
import { Logo } from '../constants';
import { User } from '../types';

interface HeaderProps {
  onMenuClick: () => void;
  onProfileClick: () => void;
  onNotificationClick: () => void;
  isLoggedIn: boolean;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({ 
  onMenuClick, 
  onProfileClick,
  onNotificationClick,
  isLoggedIn,
  user
}) => {
  const totalNotifications = user?.notifications?.filter(n => !n.read).length || 0;

  return (
    <header className="fixed top-0 left-0 w-full h-32 bg-[#15803d] z-[1000] px-8 shadow-[0_10px_30px_rgba(0,0,0,0.15)] flex items-center border-b border-white/5">
      <div className="flex-1 flex items-center justify-start">
        <button 
          onClick={onMenuClick}
          className="w-14 h-14 flex items-center justify-center text-white hover:bg-green-800 rounded-2xl transition-all border border-white/10 relative group"
        >
          <i className="fa-solid fa-bars-staggered text-2xl transition-transform group-active:scale-90"></i>
        </button>
      </div>

      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-64">
        <Logo />
      </div>

      <div className="flex-1 flex items-center justify-end gap-4">
        {isLoggedIn && user && (
          <button 
            onClick={onNotificationClick}
            className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 transition relative"
          >
            <i className="fa-solid fa-bell text-xl"></i>
            {totalNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#15803d] shadow-lg animate-bounce">
                {totalNotifications}
              </span>
            )}
          </button>
        )}

        {isLoggedIn && user ? (
          <button 
            onClick={onProfileClick}
            className="group relative w-16 h-16 rounded-[1.25rem] border-2 border-white/20 p-1 hover:border-white transition-all overflow-visible shadow-lg"
          >
            <img 
              src={user.avatar} 
              alt={user.name} 
              className="w-full h-full object-cover rounded-[0.9rem]"
            />
          </button>
        ) : (
          <button 
            onClick={onMenuClick}
            className="w-14 h-14 bg-white/10 text-white rounded-2xl flex items-center justify-center hover:bg-white/20 transition group"
          >
            <i className="fa-solid fa-user-lock text-xl group-hover:scale-110 transition-transform"></i>
          </button>
        )}
      </div>
    </header>
  );
};
