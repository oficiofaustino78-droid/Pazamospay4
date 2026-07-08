
import React, { useState, useEffect } from 'react';

interface GuestOnboardingProps {
  onFinish: (name: string) => void;
  onGoToRegister: () => void;
}

export const GuestOnboarding: React.FC<GuestOnboardingProps> = ({ onFinish, onGoToRegister }) => {
  const [step, setStep] = useState<'INTRO' | 'ASK_NAME' | 'PERSUADE'>('INTRO');
  const [displayedText, setDisplayedText] = useState('');
  const [guestName, setGuestName] = useState('');

  const introText = "Bem-vindo ao protocolo Bazamos Pay. Eu sou o Pay, a sua autoridade de segurança. Para continuarmos de forma segura em Moçambique, necessito que se identifique com o seu nome real. Seja onesto, eu guardarei esta informação.";
  const persuasionText = (name: string) => `Sr(a). ${name}, é um prazer. Agora que estabelecemos contacto, recomendo a criação de um perfil oficial para desbloquear ferramentas exclusivas de negociação. Como deseja proceder?`;

  useEffect(() => {
    let currentText = "";
    let index = 0;
    const targetText = step === 'INTRO' ? introText : (step === 'PERSUADE' ? persuasionText(guestName) : "");
    
    if (!targetText) return;

    setDisplayedText("");
    const timer = setInterval(() => {
      if (index < targetText.length) {
        currentText += targetText[index];
        setDisplayedText(currentText);
        index++;
      } else {
        clearInterval(timer);
        if (step === 'INTRO') {
          setTimeout(() => setStep('ASK_NAME'), 2000);
        }
      }
    }, 25);

    return () => clearInterval(timer);
  }, [step, guestName]);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (guestName.trim().split(/\s+/)[0].length > 2) {
      setStep('PERSUADE');
    }
  };

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-[4rem] shadow-2xl overflow-hidden border-8 border-green-700/10">
        <div className="bg-green-700 p-12 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center text-3xl mb-6 mx-auto border border-white/20 shadow-xl">
            <i className="fa-solid fa-user-lock"></i>
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tighter">Identificação Oficial</h3>
          <p className="text-[9px] font-bold opacity-60 uppercase tracking-[0.5em] mt-1">Soberania Bazamos Pay</p>
        </div>

        <div className="p-12 space-y-8 bg-slate-50/50">
          <div className="min-h-[140px] text-center px-4">
            <p className="text-lg font-bold text-slate-800 leading-relaxed italic">
              "{displayedText}"
              <span className="inline-block w-1 h-5 bg-green-700 ml-1 animate-pulse"></span>
            </p>
          </div>

          {step === 'ASK_NAME' && (
            <form onSubmit={handleSaveName} className="animate-fadeIn space-y-6">
              <input 
                autoFocus
                type="text" 
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Insira o seu primeiro nome verdadeiro..." 
                className="w-full bg-white p-7 rounded-3xl font-black text-center text-2xl text-black border-4 border-slate-100 focus:border-green-600 outline-none transition shadow-sm"
                required
              />
              <button type="submit" className="w-full bg-green-700 text-white font-black py-7 rounded-3xl uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:bg-green-800 transition active:scale-95">
                Confirmar Identidade
              </button>
            </form>
          )}

          {step === 'PERSUADE' && (
            <div className="animate-fadeIn space-y-4">
              <button 
                onClick={onGoToRegister}
                className="w-full bg-green-700 text-white font-black py-7 rounded-3xl uppercase tracking-widest text-[10px] shadow-xl hover:bg-green-800 transition"
              >
                Criar Minha Conta Agora
              </button>
              <button 
                onClick={() => onFinish(guestName)}
                className="w-full bg-white border-2 border-slate-200 text-slate-400 font-black py-5 rounded-3xl uppercase tracking-widest text-[10px] hover:bg-slate-100 transition"
              >
                Apenas Observar o Mercado
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
