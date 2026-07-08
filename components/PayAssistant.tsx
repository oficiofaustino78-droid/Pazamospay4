
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";

interface PayAssistantProps {
  userName: string;
  province: string;
  totalUsers: number;
  provinceUsers: number;
  onClose: () => void;
}

export const PayAssistant: React.FC<PayAssistantProps> = ({ 
  userName, 
  province, 
  totalUsers, 
  provinceUsers,
  onClose 
}) => {
  const [messages, setMessages] = useState<{role: 'PAY' | 'USER', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    setMessages([{
      role: 'PAY',
      text: `Olá ${userName}. Eu sou o Pay, o seu assistente de segurança. Estou a monitorizar o seu canal em ${province}. Atualmente, ${totalUsers} utilizadores confiam no nosso protocolo. Como posso garantir a integridade da sua sessão hoje?`
    }]);
  }, [userName, province, totalUsers]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'USER', text: userMsg }]);
    setInput('');
    setIsTyping(true);

    setTimeout(async () => {
      let responseText = "";
      const query = userMsg.toLowerCase();

      try {
        const ai = new GoogleGenAI({
          apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
        const result = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: userMsg,
          config: {
            systemInstruction: `Você é o "Pay", assistente virtual amigável, paciente, proativo e altamente atento à segurança no site Bazamos Pay. Você não usa emojis. Sua missão é orientar o usuário ${userName} de forma clara, educada e acolhedora. 
            Regras de Negócio Inegociáveis:
            1. Ninguém entra sem registro.
            2. Se o número não está no sistema, deve-se orientar a criar conta.
            3. Se a senha está errada, diga: "Este número já tem uma conta associada, mas a senha está incorreta. Tente novamente ou recupere a sua senha."
            4. Se tentar criar conta com número já existente, diga: "Este número de telefone já possui uma conta. Impossível criar uma nova conta com o mesmo número."
            5. Logout sempre exige confirmação.
            6. Seja profissional, direto e transmita segurança máxima.`
          }
        });
        responseText = result.text || "Pode repetir a questão? O Protocolo Pay exige clareza nas comunicações.";
      } catch (e) {
        responseText = "Erro na rede neural Pay. Por favor, tente novamente em alguns segundos.";
      }

      setMessages(prev => [...prev, { role: 'PAY', text: responseText }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[9000] flex items-end md:items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col overflow-hidden max-h-[85vh] border-4 border-slate-100">
        <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl border border-white/10">
              <i className="fa-solid fa-user-shield"></i>
            </div>
            <div>
              <h3 className="font-black uppercase tracking-tighter text-xl leading-none">Canal Pay Oficial</h3>
              <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">A sua segurança é a nossa soberania</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-10 space-y-6 bg-slate-50 min-h-[350px]">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-6 rounded-[2rem] font-bold text-sm leading-relaxed shadow-sm ${
                m.role === 'USER' ? 'bg-green-700 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Consultando Protocolos Pay...</div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="p-8 bg-white border-t flex gap-4">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Comunique com o Pay..." 
            className="flex-1 bg-slate-100 p-6 rounded-2xl font-black text-black outline-none border-2 border-transparent focus:border-green-600 transition"
          />
          <button type="submit" className="bg-slate-900 text-white w-20 rounded-2xl flex items-center justify-center shadow-lg hover:bg-black transition">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </form>
      </div>
    </div>
  );
};
