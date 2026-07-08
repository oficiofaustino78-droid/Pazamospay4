
import React, { useState, useRef } from 'react';
import { MOZAMBIQUE_DATA } from '../constants';
import { Product } from '../types';

interface PublishFormProps {
  onComplete?: (newProduct: Product) => void;
  publishCount?: number;
}

type Step = 'PLAN' | 'DETAILS' | 'PHONE' | 'SUCCESS';

interface ImageItem {
  id: string;
  src: string;
  isBgRemoved: boolean;
  originalSrc?: string;
}

export const PublishForm: React.FC<PublishFormProps> = ({ onComplete, publishCount = 0 }) => {
  const [step, setStep] = useState<Step>('PLAN');
  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'VIP' | null>(null);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  
  const [phone, setPhone] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [selectedImages, setSelectedImages] = useState<ImageItem[]>([]);
  
  // Estados do Assistente Pay para Edição
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [showEditDialogue, setShowEditDialogue] = useState<{id: string} | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      filesArray.forEach((file: File) => {
        if (file.size > 10 * 1024 * 1024) { // Limite 10MB
           setEditError("A imagem é demasiado grande. Por favor, use um ficheiro até 10MB.");
           return;
        }
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setSelectedImages(prev => [
              ...prev, 
              { 
                id: Math.random().toString(36).substr(2, 9), 
                src: event.target?.result as string, 
                isBgRemoved: false,
                originalSrc: event.target?.result as string
              }
            ]);
          }
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    }
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== id));
  };

  const callRemoveBgAPI = async (base64Image: string) => {
    // Nota: Em ambiente real, o ideal é processar via backend para proteger a API Key.
    // Usaremos a API Key configurada ou um placeholder.
    const API_KEY = process.env.REMOVE_BG_API_KEY || "YOUR_REMOVE_BG_KEY";
    
    // Converter base64 para Blob
    const byteString = atob(base64Image.split(',')[1]);
    const mimeString = base64Image.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], {type: mimeString});

    const formData = new FormData();
    formData.append('image_file', blob);
    formData.append('size', 'auto');

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': API_KEY },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.[0]?.title || 'Erro na remoção de fundo');
    }

    const resultBlob = await response.blob();
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(resultBlob);
    });
  };

  const handleRemoveBackground = async (id: string) => {
    const targetImage = selectedImages.find(img => img.id === id);
    if (!targetImage) return;

    setIsProcessingAI(true);
    setEditError(null);
    setShowEditDialogue(null);

    try {
      const processedSrc = await callRemoveBgAPI(targetImage.src);
      setSelectedImages(prev => prev.map(img => 
        img.id === id ? { ...img, src: processedSrc, isBgRemoved: true } : img
      ));
    } catch (err: any) {
      console.error(err);
      setEditError(`O Pay não conseguiu remover o fundo: ${err.message}. Verifique a sua conexão ou tente novamente.`);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const revertToOriginal = (id: string) => {
    setSelectedImages(prev => prev.map(img => 
      img.id === id && img.originalSrc ? { ...img, src: img.originalSrc, isBgRemoved: false } : img
    ));
    setEditError(null);
  };

  const selectPlan = (plan: 'FREE' | 'VIP') => {
    setSelectedPlan(plan);
    setStep('DETAILS');
  };

  const handleFinish = () => {
    if (onComplete) {
      const newProd: Product = {
        id: Math.random().toString(36).substr(2, 9),
        name: name,
        price: Number(price),
        isAvailable: isAvailable,
        province: province,
        district: district,
        neighborhood: 'Central',
        description: description,
        imageUrl: selectedImages[0]?.src || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800',
        isVip: selectedPlan === 'VIP',
        seller: {
          id: 's-' + Date.now(),
          name: 'Comerciante Validado',
          avatar: `https://i.pravatar.cc/150?u=seller`,
          rating: 5.0,
          reviewsCount: 1,
          phone: phone,
          location: province,
          isVip: selectedPlan === 'VIP'
        }
      };
      onComplete(newProd);
    }
  };

  if (step === 'SUCCESS') {
    return (
      <div className="max-w-2xl mx-auto bg-white p-12 md:p-20 rounded-[3rem] md:rounded-[4.5rem] shadow-2xl border-4 border-slate-50 text-center animate-fadeIn">
        <div className="w-20 h-20 md:w-28 md:h-28 bg-green-50 text-green-700 rounded-3xl md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-4xl md:text-5xl shadow-xl">
          <i className="fa-solid fa-check-shield"></i>
        </div>
        <h2 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">Publicação Segura</h2>
        <p className="text-slate-400 font-bold mb-10 md:mb-14 text-[10px] uppercase tracking-[0.3em] leading-relaxed">
          Produto publicado com sucesso! 🎉 Agora está visível para os compradores. O Protocolo Pay validou a integridade do seu anúncio.
        </p>
        <button onClick={handleFinish} className="w-full bg-green-700 text-white py-6 md:py-8 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-[0.5em] text-[10px] shadow-2xl hover:bg-black transition">Finalizar Operação</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 mb-24 animate-fadeIn">
      {step === 'PLAN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 py-12 md:py-20">
          <div onClick={() => selectPlan('FREE')} className="group bg-white p-10 md:p-16 rounded-[3rem] md:rounded-[4rem] border-4 border-slate-50 shadow-xl hover:border-slate-200 cursor-pointer transition-all">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8">
              <i className="fa-solid fa-list-check text-2xl text-slate-300"></i>
            </div>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4">Plano Standard</h3>
            <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mb-10">Anúncio convencional com visibilidade regional.</p>
            <button className="w-full bg-slate-100 text-slate-900 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest group-hover:bg-slate-900 group-hover:text-white transition">Utilizar Grátis</button>
          </div>
          
          <div onClick={() => selectPlan('VIP')} className="group gold-shimmer-bg p-10 md:p-16 rounded-[3rem] md:rounded-[4rem] border-4 border-yellow-500 shadow-2xl cursor-pointer transition-all">
            <div className="w-16 h-16 bg-yellow-950/10 rounded-2xl flex items-center justify-center mb-8">
              <i className="fa-solid fa-crown text-2xl text-yellow-950"></i>
            </div>
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter mb-4 text-yellow-950">Protocolo VIP Gold</h3>
            <p className="text-yellow-950/60 font-bold text-[9px] uppercase tracking-widest mb-10">Máxima exposição nacional com destaque imponente.</p>
            <button className="w-full bg-yellow-950 text-yellow-400 font-black py-6 rounded-2xl uppercase text-[10px] tracking-widest group-hover:bg-black transition">Ativar Privilégios</button>
          </div>
        </div>
      )}

      {step === 'DETAILS' && (
        <div className="bg-white p-8 md:p-20 rounded-[3rem] md:rounded-[4.5rem] shadow-2xl border-4 border-slate-50 relative overflow-hidden">
           
           {/* LOADING ASSISTENTE PAY (SPINNER DOURADO) */}
           {isProcessingAI && (
             <div className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center rounded-[3rem] md:rounded-[4.5rem] animate-fadeIn">
                <div className="relative w-24 h-24 mb-8">
                   <div className="absolute inset-0 border-8 border-yellow-500/20 rounded-full"></div>
                   <div className="absolute inset-0 border-8 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fa-solid fa-sparkles text-yellow-600 text-3xl animate-pulse"></i>
                   </div>
                </div>
                <p className="font-pay-serif text-xl text-slate-900 mb-2">Removendo o fundo da sua foto...</p>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-700 animate-pulse text-center px-6">Isso vai levar só uns segundos! ✨</p>
             </div>
           )}

           {/* DIÁLOGO PAY: PROPOSTA DE EDIÇÃO */}
           {showEditDialogue && (
             <div className="absolute inset-0 z-[90] bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
                <div className="bg-[#F9E4B7] max-w-md w-full p-10 rounded-[2rem] border-4 border-white shadow-2xl relative">
                   <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border-4 border-[#F9E4B7]">
                      <i className="fa-solid fa-wand-magic-sparkles text-[#b45309] text-3xl"></i>
                   </div>
                   <div className="mt-8 text-center space-y-4">
                      <p className="font-pay-serif text-2xl text-[#333]">Ótimo! Vamos tornar a sua foto profissional.</p>
                      <p className="font-pay-sans text-sm text-[#555] leading-relaxed">
                        Posso remover o fundo automaticamente para que o produto se ajuste perfeitamente aos nossos grids, sem cortes ou distorções. Isso deixa tudo mais clean e atraente! Quer prosseguir?
                      </p>
                      <div className="flex flex-col gap-3 pt-6">
                         <button 
                           onClick={() => handleRemoveBackground(showEditDialogue.id)}
                           className="w-full bg-[#15803d] text-white font-black py-5 rounded-xl uppercase tracking-widest text-[10px] shadow-lg hover:bg-black transition"
                         >
                           Sim, Remover Fundo
                         </button>
                         <button 
                           onClick={() => setShowEditDialogue(null)}
                           className="w-full bg-white/50 text-[#666] font-black py-4 rounded-xl uppercase tracking-widest text-[10px] border border-black/10 hover:bg-white transition"
                         >
                           Não, Manter Original
                         </button>
                      </div>
                   </div>
                </div>
             </div>
           )}
           
           <form className="space-y-8 md:space-y-12" onSubmit={(e)=>{e.preventDefault(); setStep('PHONE');}}>
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-6">Documentação Fotográfica (Obrigatório)</label>
                
                {editError && (
                   <div className="bg-red-50 border-2 border-red-100 p-6 rounded-2xl flex items-start gap-4 animate-fadeIn">
                      <i className="fa-solid fa-triangle-exclamation text-red-600 mt-1"></i>
                      <p className="text-red-700 font-bold text-xs leading-relaxed uppercase tracking-tight">{editError}</p>
                   </div>
                )}

                <div className={`w-full ${selectedImages.length > 0 ? 'min-h-[200px]' : 'h-44 md:h-64'} border-4 border-dashed border-slate-100 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col items-center justify-center bg-slate-50/50 overflow-hidden group hover:border-green-600/30 transition-all`}>
                  {selectedImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 p-6 md:p-10 w-full">
                      {selectedImages.map((img) => (
                        <div key={img.id} className="relative group aspect-square rounded-2xl md:rounded-[2rem] overflow-hidden shadow-lg border-4 border-white transition-all hover:scale-105">
                          {/* FUNDO QUADRICULADO PARA TRANSPARÊNCIA */}
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10"></div>
                          <img src={img.src} className="h-full w-full object-contain relative z-10" />
                          
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 z-20">
                             <button type="button" onClick={() => removeImage(img.id)} className="bg-red-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:scale-110 transition shadow-lg"><i className="fa-solid fa-trash"></i></button>
                             
                             {!img.isBgRemoved ? (
                               <button 
                                 type="button" 
                                 onClick={() => setShowEditDialogue({id: img.id})} 
                                 className="bg-yellow-600 text-white px-4 py-3 rounded-xl text-[7px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-yellow-700 transition"
                               >
                                 <i className="fa-solid fa-paintbrush"></i> Editar Foto
                               </button>
                             ) : (
                               <button 
                                 type="button" 
                                 onClick={() => revertToOriginal(img.id)} 
                                 className="bg-white text-slate-900 px-4 py-3 rounded-xl text-[7px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:bg-slate-100 transition"
                               >
                                 <i className="fa-solid fa-rotate-left"></i> Reverter
                               </button>
                             )}
                          </div>

                          {img.isBgRemoved && (
                             <div className="absolute bottom-2 right-2 z-30 bg-green-700 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[8px] shadow-lg animate-fadeIn">
                               <i className="fa-solid fa-sparkles"></i>
                             </div>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square border-4 border-dashed border-slate-200 rounded-2xl md:rounded-[2rem] flex flex-col items-center justify-center text-slate-300 bg-white hover:border-green-600 hover:text-green-700 transition-all"><i className="fa-solid fa-plus text-xl"></i></button>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center cursor-pointer group p-10">
                      <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition border border-slate-100"><i className="fa-solid fa-camera-retro text-2xl text-slate-200"></i></div>
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Clique aqui para adicionar fotos reais do seu produto</p>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
                </div>
                {selectedImages.length > 0 && selectedImages.some(i => i.isBgRemoved) && (
                   <p className="text-[8px] font-black text-green-700 uppercase tracking-widest ml-6 bg-green-50 px-4 py-2 rounded-full inline-block border border-green-100">
                     Pronto! O fundo foi removido profissionalmente. 😄
                   </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                 <div className="space-y-3"><label className="text-[10px] font-black uppercase ml-6 text-slate-400">Designação Comercial</label><input type="text" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ex: Equipamento Profissional" className="w-full p-5 md:p-8 rounded-2xl md:rounded-[2rem] bg-slate-50 border-2 border-slate-100 font-black text-black outline-none focus:border-green-600 transition" required /></div>
                 <div className="space-y-3"><label className="text-[10px] font-black uppercase ml-6 text-slate-400">Preço Estipulado (MT)</label><input type="number" value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="0" className="w-full p-5 md:p-8 rounded-2xl md:rounded-[2rem] bg-slate-50 border-2 border-slate-100 font-black text-black outline-none focus:border-green-600 transition" required /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
                <div className="space-y-3"><label className="text-[10px] font-black uppercase ml-6 text-slate-400">Província</label><select value={province} onChange={(e)=>setProvince(e.target.value)} className="w-full p-5 md:p-8 rounded-2xl md:rounded-[2rem] bg-slate-50 border-2 border-slate-100 font-black text-black outline-none" required><option value="">Selecionar</option>{Object.keys(MOZAMBIQUE_DATA).map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                <div className="space-y-3"><label className="text-[10px] font-black uppercase ml-6 text-slate-400">Localização</label><select value={district} onChange={(e)=>setDistrict(e.target.value)} className="w-full p-5 md:p-8 rounded-2xl md:rounded-[2rem] bg-slate-50 border-2 border-slate-100 font-black text-black outline-none" required><option value="">Selecionar</option>{province && MOZAMBIQUE_DATA[province].map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                <div className="space-y-3"><label className="text-[10px] font-black uppercase ml-6 text-slate-400">Status</label><select value={isAvailable ? "T" : "F"} onChange={(e)=>setIsAvailable(e.target.value === "T")} className="w-full p-5 md:p-8 rounded-2xl md:rounded-[2rem] bg-slate-50 border-2 border-slate-100 font-black text-black outline-none" required><option value="T">Pronto p/ Entrega</option><option value="F">Sob Pedido</option></select></div>
              </div>

              <div className="space-y-3"><label className="text-[10px] font-black uppercase ml-6 text-slate-400">Especificações Técnicas</label><textarea value={description} onChange={(e)=>setDescription(e.target.value)} placeholder="Detalhes precisos do estado e condições de venda..." className="w-full p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] bg-slate-50 border-2 border-slate-100 font-black text-black min-h-[150px] outline-none focus:border-green-600 transition" required /></div>

              <button 
                type="submit" 
                disabled={selectedImages.length === 0}
                className={`w-full py-6 md:py-8 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-[0.4em] text-[10px] shadow-2xl transition-all ${selectedImages.length > 0 ? 'bg-slate-900 text-white hover:bg-black' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
              >
                Revisar Informações
              </button>
           </form>
        </div>
      )}

      {step === 'PHONE' && (
        <div className="bg-white p-12 md:p-20 rounded-[3rem] md:rounded-[4.5rem] shadow-2xl text-center border-4 border-slate-50 max-w-2xl mx-auto">
           <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4">Canal de Contacto</h2>
           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-10 md:mb-14">Insira o contacto para negociações oficiais</p>
           <input type="tel" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="8X 000 0000" className="w-full p-6 md:p-10 text-center rounded-[2rem] border-4 bg-slate-50 font-black text-3xl md:text-5xl text-black focus:border-green-600 outline-none mb-10 md:mb-14" required autoFocus />
           <div className="flex gap-4">
             <button onClick={()=>setStep('DETAILS')} className="flex-1 bg-slate-100 text-slate-400 py-6 md:py-8 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest text-[9px]">Anterior</button>
             <button onClick={()=>setStep('SUCCESS')} className="flex-[2] bg-green-700 text-white py-6 md:py-8 rounded-2xl md:rounded-[2rem] font-black uppercase tracking-widest text-[9px] shadow-2xl hover:bg-black transition">Publicar Anúncio</button>
           </div>
        </div>
      )}
    </div>
  );
};
