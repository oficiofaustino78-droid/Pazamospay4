
import React, { useState, useEffect, useMemo } from 'react';
import { Logo } from '../constants';

interface PayBlockingModalProps {
  onOptionSelect: (option: 'LOGIN' | 'REGISTER' | 'LOOK' | 'CLOSE' | 'CREATE_OTHER' | 'LOGIN_OTHER' | 'DELETE_START' | 'DELETE_CANCEL') => void;
  persuasionMode?: boolean;
  isWelcome?: boolean;
  isLogout?: boolean;
  isDeleteConfirm?: boolean;
  welcomeType?: 'LOGIN' | 'REGISTER';
  userName?: string;
  timeOffline?: string;
  notificationsCount?: number;
  messagesCount?: number;
  onDeleteValidate?: (phone: string, pass: string) => void;
  deleteError?: string;
}

export const PayBlockingModal: React.FC<PayBlockingModalProps> = ({ 
  onOptionSelect, 
  persuasionMode = false,
  isWelcome = false,
  isLogout = false,
  isDeleteConfirm = false,
  welcomeType,
  userName = "",
  timeOffline = "",
  notificationsCount = 0,
  messagesCount = 0,
  onDeleteValidate,
  deleteError
}) => {
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [showButtons, setShowButtons] = useState(false);
  
  // Estados para o formulário de eliminação
  const [delPhone, setDelPhone] = useState('');
  const [delPass, setDelPass] = useState('');

  const firstName = useMemo(() => userName.split(' ')[0], [userName]);

  const initialMessages = [
    "Olá! 🙏 Bem-vindo ao nosso site!",
    "É a sua primeira vez por aqui? 😊",
    "Você já tem uma conta conosco?"
  ];

  const persuasionMessages = [
    "Ei, você disse que queria só dar uma olhada! 😄",
    "Para tocar nos produtos, precisa criar uma conta.",
    "É rápido e 100% seguro!"
  ];

  const welcomeRegisterMessages = [
    "Parabéns! 🎉 Conta criada com sucesso!",
    `Bem-vindo(a) oficial ao nosso site, ${userName.toUpperCase()}!`,
    "Agora pode explorar, comprar e desfrutar de tudo com total segurança! 😊"
  ];

  const welcomeLoginMessages = [
    `Bem-vindo de volta, ${userName.toUpperCase()}! 😄`,
    `Você esteve desligado(a) por aproximadamente ${timeOffline}.`,
    "Temos novidades para você!",
    messagesCount > 0 ? `Você tem ${messagesCount} nova(s) mensagem(ns) no inbox.` : null,
    notificationsCount > 0 ? `Você tem ${notificationsCount} nova(s) notificação(ões).` : null,
    (messagesCount === 0 && notificationsCount === 0) ? "Tudo em dia! Continue explorando as nossas ofertas." : null,
    "Qualquer coisa, é só me chamar. Estou aqui para ajudar! 🙏"
  ].filter(Boolean) as string[];

  const logoutMessages = [
    `${firstName}, acabaste de sair da conta. O que pretendes fazer agora?`
  ];

  const deleteConfirmMessages = [
    `Atenção, ${firstName}! Esta ação é permanente e irreversível.`,
    `Para eliminar permanentemente a conta de ${userName}, insira o número de telemóvel e a senha.`
  ];

  const targetMessages = useMemo(() => {
    if (isDeleteConfirm) return deleteConfirmMessages;
    if (isLogout) return logoutMessages;
    if (isWelcome) return welcomeType === 'REGISTER' ? welcomeRegisterMessages : welcomeLoginMessages;
    return persuasionMode ? persuasionMessages : initialMessages;
  }, [isWelcome, isLogout, isDeleteConfirm, welcomeType, persuasionMode, userName, timeOffline, messagesCount, notificationsCount, firstName]);

  useEffect(() => {
    setDisplayedText(new Array(targetMessages.length).fill(""));
    setCurrentMessageIndex(0);
    setCurrentCharIndex(0);
    setShowButtons(false);
    
    // Bloqueia scroll em todos os modos exceto Welcome que é ignorável
    if (!isWelcome) {
      document.body.classList.add('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [isWelcome, isLogout, isDeleteConfirm, targetMessages]);

  useEffect(() => {
    if (currentMessageIndex < targetMessages.length) {
      if (currentCharIndex < targetMessages[currentMessageIndex].length) {
        // Digitação ultra-rápida para máxima fluidez e profissionalismo
        const speed = isLogout ? 8 : (isWelcome ? 2 : 4);
        const timer = setTimeout(() => {
          setDisplayedText(prev => {
            const updated = [...prev];
            updated[currentMessageIndex] = targetMessages[currentMessageIndex].substring(0, currentCharIndex + 1);
            return updated;
          });
          setCurrentCharIndex(prev => prev + 1);
        }, speed);
        return () => clearTimeout(timer);
      } else {
        const nextMsgTimer = setTimeout(() => {
          setCurrentMessageIndex(prev => prev + 1);
          setCurrentCharIndex(0);
        }, (isWelcome || isLogout) ? 60 : 80);
        return () => clearTimeout(nextMsgTimer);
      }
    } else {
      setShowButtons(true);
    }
  }, [currentMessageIndex, currentCharIndex, targetMessages, isWelcome, isLogout]);

  const handleBackdropClick = () => {
    // Apenas fecha se for welcome. Logout e bloqueio inicial são obrigatórios.
    if (isWelcome) onOptionSelect('CLOSE');
  };

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={handleBackdropClick}
    >
      <div 
        className={`${isLogout ? 'gold-shimmer-bg' : 'bg-[#F9E4B7]'} w-full max-w-[460px] rounded-[24px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden border-2 border-[#F1D495] flex flex-col relative transition-all duration-500`}
        onClick={(e) => e.stopPropagation()}
      >
        {isWelcome && (
          <button 
            onClick={() => onOptionSelect('CLOSE')}
            className="absolute top-5 right-5 w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors z-20"
          >
            <i className="fa-solid fa-xmark text-[#333]"></i>
          </button>
        )}

        {/* AVATAR/LOGO */}
        <div className="pt-12 flex justify-center">
          <div className={`w-[90px] md:w-[130px] aspect-square rounded-full bg-white shadow-2xl flex items-center justify-center border-4 border-white overflow-hidden transition-transform duration-700 ${showButtons ? 'scale-100' : 'scale-90'}`}>
             <div className="scale-[0.55] transform">
                <Logo />
             </div>
          </div>
        </div>

        {/* TEXT AREA */}
        <div className="p-8 md:p-14 space-y-5 text-center min-h-[160px]">
          {(isLogout || isDeleteConfirm) && (
            <h2 className={`font-pay-serif text-3xl font-black mb-6 ${isDeleteConfirm ? 'text-red-700' : 'text-black'}`}>
              {isDeleteConfirm ? 'CONFIRMAÇÃO DE ELIMINAÇÃO' : 'Pay Consciência Ativa'}
            </h2>
          )}

          {displayedText.map((text, idx) => {
            const isNameWelcome = isWelcome && (
              (welcomeType === 'REGISTER' && idx === 1) || 
              (welcomeType === 'LOGIN' && idx === 0)
            );

            if (isNameWelcome) {
                const parts = text.split(userName.toUpperCase());
                return (
                  <div key={idx} className="mb-6">
                    <p className="font-pay-serif text-2xl md:text-[26px] text-[#333] leading-tight inline">{parts[0]}</p>
                    <span className="font-pay-serif text-3xl md:text-[42px] text-[#d4af37] font-black uppercase block my-3 tracking-tighter drop-shadow-md">{userName.toUpperCase()}</span>
                    <p className="font-pay-serif text-2xl md:text-[26px] text-[#333] leading-tight inline">{parts[1]}</p>
                  </div>
                );
            }

            return (
              <p 
                key={idx} 
                className={`
                  ${(idx === 0 && !isWelcome && !isDeleteConfirm) ? 'font-pay-serif text-2xl md:text-[30px] text-[#333] mb-5 leading-snug font-bold' : 'font-pay-sans text-base md:text-[19px] text-[#444] leading-relaxed'}
                  ${isDeleteConfirm && idx === 0 ? 'text-red-800 font-black text-xl' : ''}
                  ${isDeleteConfirm && idx === 1 ? 'text-[#555] font-bold mt-4' : ''}
                `}
              >
                {text}
                {idx === currentMessageIndex && currentCharIndex < targetMessages[idx].length && (
                  <span className="inline-block w-2 h-6 bg-green-700 ml-1 animate-pulse"></span>
                )}
              </p>
            );
          })}
        </div>

        {/* BOTOES LOGOUT */}
        {isLogout && showButtons && (
          <div className="p-10 pt-0 flex flex-col gap-5 animate-fadeIn">
            <button 
              onClick={() => onOptionSelect('CREATE_OTHER')}
              className="w-full bg-green-100 text-green-900 font-pay-sans font-black py-6 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-md hover:bg-green-200 transition-all flex items-center justify-center gap-4 active:scale-95"
            >
              <i className="fa-solid fa-user-plus text-lg"></i> Quero criar outra conta
            </button>
            <button 
              onClick={() => onOptionSelect('LOGIN_OTHER')}
              className="w-full bg-blue-100 text-blue-900 font-pay-sans font-black py-6 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-md hover:bg-blue-200 transition-all flex items-center justify-center gap-4 active:scale-95"
            >
              <i className="fa-solid fa-key text-lg"></i> Quero entrar noutra conta
            </button>
            <button 
              onClick={() => onOptionSelect('DELETE_START')}
              className="w-full bg-red-900 text-white font-pay-sans font-black py-6 rounded-2xl uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-4 active:scale-95"
            >
              <i className="fa-solid fa-triangle-exclamation text-lg"></i> Quero eliminar esta conta
            </button>
          </div>
        )}

        {/* BOTOES DELETE CONFIRM */}
        {isDeleteConfirm && showButtons && (
          <div className="p-10 pt-0 space-y-5 animate-fadeIn">
            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase text-red-900/50 ml-5 tracking-widest">Número de telemóvel (+258)</label>
               <input 
                 type="tel" 
                 value={delPhone} 
                 onChange={e => setDelPhone(e.target.value)}
                 placeholder="8X 000 0000"
                 className="w-full p-6 rounded-2xl bg-white border-2 border-red-100 font-black text-black outline-none focus:border-red-600 transition shadow-inner"
               />
            </div>
            <div className="space-y-3">
               <label className="text-[10px] font-black uppercase text-red-900/50 ml-5 tracking-widest">Senha de Segurança</label>
               <input 
                 type="password" 
                 value={delPass} 
                 onChange={e => setDelPass(e.target.value)}
                 placeholder="••••••••"
                 className="w-full p-6 rounded-2xl bg-white border-2 border-red-100 font-black text-black outline-none focus:border-red-600 transition shadow-inner"
               />
            </div>
            {deleteError && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-200 animate-pulse">
                <p className="text-[10px] font-black text-red-600 text-center uppercase tracking-tight">{deleteError}</p>
              </div>
            )}
            <div className="flex flex-col gap-4 pt-6">
               <button 
                 disabled={!delPhone || !delPass}
                 onClick={() => onDeleteValidate?.(delPhone, delPass)}
                 className={`w-full py-7 rounded-2xl font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl transition-all ${(!delPhone || !delPass) ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-red-700 text-white hover:bg-black active:scale-95'}`}
               >
                 Eliminar Permanentemente
               </button>
               <button 
                 onClick={() => onOptionSelect('DELETE_CANCEL')}
                 className="w-full bg-white/60 text-gray-500 font-black py-5 rounded-2xl uppercase tracking-widest text-[11px] border-2 border-gray-100 hover:bg-white hover:text-black transition-all"
               >
                 Cancelar
               </button>
            </div>
          </div>
        )}

        {/* MODO BLOQUEADOR PADRAO */}
        {!isWelcome && !isLogout && !isDeleteConfirm && (
          <div className={`p-10 pt-0 flex flex-col gap-5 transition-opacity duration-700 ${showButtons ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <button 
              onClick={() => onOptionSelect('LOGIN')}
              className="w-full bg-[#15803d] text-white font-pay-sans font-bold py-6 rounded-2xl uppercase tracking-[0.3em] text-[11px] shadow-xl hover:bg-black transition-all active:scale-95"
            >
              Entrar na minha conta
            </button>
            <button 
              onClick={() => onOptionSelect('REGISTER')}
              className="w-full bg-[#d4af37] text-black font-pay-sans font-bold py-6 rounded-2xl uppercase tracking-[0.3em] text-[11px] shadow-xl hover:bg-[#b45309] hover:text-white transition-all active:scale-95"
            >
              Criar conta
            </button>
            <button 
              onClick={() => onOptionSelect('LOOK')}
              className="w-full bg-white/50 border-2 border-[#F1D495] text-[#666] font-pay-sans font-bold py-5 rounded-2xl uppercase tracking-[0.3em] text-[11px] hover:bg-white transition-all active:scale-95"
            >
              Dar uma olhada
            </button>
          </div>
        )}

        <div className="pb-8 text-center">
          <p className="text-[9px] font-black text-[#999] uppercase tracking-[0.3em]">
            {isLogout ? 'O Pay está aqui para te ajudar com segurança.' : 'Protocolo Bazamos Pay • v3.5'}
          </p>
        </div>
      </div>
    </div>
  );
};
