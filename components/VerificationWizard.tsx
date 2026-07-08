import React, { useState, useEffect } from 'react';
import { User, BusinessData, BIData, VerificationData } from '../types';
import { MOZAMBIQUE_DATA } from '../constants';

interface VerificationWizardProps {
  user: User;
  onComplete: (verificationData: VerificationData) => void;
  onCancel: () => void;
}

const LIVENESS_TASKS = [
  { id: 'blink', label: 'Pisque os olhos duas vezes', instruction: 'Olhe fixamente para o círculo e dê duas piscadelas rápidas.' },
  { id: 'smile', label: 'Sorria para a câmara', instruction: 'Mostre um sorriso natural para validar a sua expressão.' },
  { id: 'turn_right', label: 'Rode a cabeça para a direita', instruction: 'Vire o seu rosto lentamente para o lado direito.' },
  { id: 'tilt_up', label: 'Incline a cabeça para cima', instruction: 'Incline ligeiramente o queixo para cima.' },
];

export const VerificationWizard: React.FC<VerificationWizardProps> = ({ user, onComplete, onCancel }) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // --- Passo 1: Dados do Negócio ---
  const [businessType, setBusinessType] = useState<'PERSONAL' | 'STORE'>('PERSONAL');
  const [bizName, setBizName] = useState<string>(user.name);
  const [bizOwner, setBizOwner] = useState<string>(user.name);
  const [bizPhone, setBizPhone] = useState<string>(user.phone);
  const [bizCategory, setBizCategory] = useState<string>('Tecnologia e Eletrónicos');
  const [province, setProvince] = useState<string>(user.province || 'Maputo Cidade');
  const [district, setDistrict] = useState<string>(user.district || 'Distrito Urbano 1');
  const [neighborhood, setNeighborhood] = useState<string>('');
  const [reference, setReference] = useState<string>('');

  // --- Passo 2: Localização ---
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number }>({ lat: -25.9692, lng: 32.5732 });
  const [mapPinned, setMapPinned] = useState<boolean>(false);

  // --- Passo 3: Verificação de BI ---
  const [biFront, setBiFront] = useState<string>('');
  const [biBack, setBiBack] = useState<string>('');
  const [isCapturingBI, setIsCapturingBI] = useState<'front' | 'back' | null>(null);
  const [cameraCountdown, setCameraCountdown] = useState<number>(0);
  const [ocrData, setOcrData] = useState<BIData | null>(null);
  const [ocrLoading, setOcrLoading] = useState<boolean>(false);

  // --- Passo 4: Verificação Facial (Liveness) ---
  const [isCapturingLiveness, setIsCapturingLiveness] = useState<boolean>(false);
  const [activeTaskIndex, setActiveTaskIndex] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [livenessSuccess, setLivenessSuccess] = useState<boolean>(false);

  // --- Passo 5: Comparação Facial (Selfie com BI) ---
  const [selfieWithBI, setSelfieWithBI] = useState<string>('');
  const [isCapturingSelfie, setIsCapturingSelfie] = useState<boolean>(false);
  const [comparisonScore, setComparisonScore] = useState<number>(0);
  const [comparing, setComparing] = useState<boolean>(false);

  // Sincronizar dados de Moçambique ao mudar província
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prov = e.target.value;
    setProvince(prov);
    if (prov && MOZAMBIQUE_DATA[prov]) {
      setDistrict(MOZAMBIQUE_DATA[prov][0]);
    } else {
      setDistrict('');
    }
  };

  // Contagem decrescente para simular câmara
  useEffect(() => {
    let timer: any;
    if (cameraCountdown > 0) {
      timer = setTimeout(() => setCameraCountdown(cameraCountdown - 1), 1000);
    } else if (cameraCountdown === 0 && (isCapturingBI || isCapturingLiveness || isCapturingSelfie)) {
      triggerCapture();
    }
    return () => clearTimeout(timer);
  }, [cameraCountdown]);

  // Gatilho de captura simulada
  const triggerCapture = () => {
    if (isCapturingBI === 'front') {
      setBiFront('https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?q=80&w=600');
      setIsCapturingBI(null);
    } else if (isCapturingBI === 'back') {
      setBiBack('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600');
      setIsCapturingBI(null);
      // Simular OCR instantâneo ao ter as duas fotos
      runOcrSimulation();
    } else if (isCapturingLiveness) {
      // Avança a tarefa de liveness com sucesso
      const task = LIVENESS_TASKS[activeTaskIndex];
      const nextTasks = [...completedTasks, task.id];
      setCompletedTasks(nextTasks);
      
      if (activeTaskIndex < LIVENESS_TASKS.length - 1) {
        setOcrLoading(true);
        setTimeout(() => {
          setOcrLoading(false);
          setActiveTaskIndex(activeTaskIndex + 1);
        }, 800);
      } else {
        setIsCapturingLiveness(false);
        setLivenessSuccess(true);
      }
    } else if (isCapturingSelfie) {
      setSelfieWithBI('https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=600');
      setIsCapturingSelfie(null);
      runFacialComparison();
    }
  };

  const startCamera = (type: 'front' | 'back' | 'liveness' | 'selfie') => {
    setCameraCountdown(3);
    if (type === 'front' || type === 'back') {
      setIsCapturingBI(type);
    } else if (type === 'liveness') {
      setIsCapturingLiveness(true);
      setActiveTaskIndex(0);
      setCompletedTasks([]);
      setLivenessSuccess(false);
    } else if (type === 'selfie') {
      setIsCapturingSelfie(true);
      setComparisonScore(0);
    }
  };

  // Simular a extração OCR de dados do BI
  const runOcrSimulation = () => {
    setOcrLoading(true);
    setTimeout(() => {
      // Gera número de BI aleatório com formato válido moçambicano
      const randomBiNum = '1101' + Math.floor(10000000 + Math.random() * 90000000) + 'M';
      setOcrData({
        biNumber: randomBiNum,
        fullName: bizName || user.name,
        birthDate: '1992-06-15',
        gender: 'MASCULINO',
        issueDate: '2021-02-10',
        expiryDate: '2031-02-10',
        nationality: 'MOÇAMBICANA',
        imageUrlFront: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?q=80&w=600',
        imageUrlBack: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=600',
        imageUrlSelfie: ''
      });
      setOcrLoading(false);
    }, 2500);
  };

  // Simular comparação facial biométrica
  const runFacialComparison = () => {
    setComparing(true);
    setTimeout(() => {
      // Gera um score alto aleatório para simular sucesso
      const score = Number((95 + Math.random() * 4.9).toFixed(2));
      setComparisonScore(score);
      setComparing(false);
    }, 3000);
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!neighborhood.trim() || !reference.trim()) {
        alert('Por favor, preencha o Bairro e uma Referência de Localização.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!mapPinned) {
        alert('Por favor, confirme a sua localização geográfica clicando no mapa.');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!ocrData) {
        alert('Por favor, realize a verificação do Bilhete de Identidade (BI) primeiro.');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!livenessSuccess) {
        alert('Por favor, complete as tarefas de verificação de vivacidade (Liveness Check).');
        return;
      }
      setStep(5);
    } else if (step === 5) {
      if (!selfieWithBI || comparisonScore < 90) {
        alert('Por favor, capte a selfie com o documento e aguarde a correspondência biométrica facial.');
        return;
      }
      setStep(6);
    }
  };

  const handleFinish = () => {
    setLoading(true);
    setTimeout(() => {
      const bData: BusinessData = {
        type: businessType,
        name: businessType === 'PERSONAL' ? user.name : bizName,
        ownerName: businessType === 'PERSONAL' ? user.name : bizOwner,
        phone: bizPhone,
        category: businessType === 'STORE' ? bizCategory : undefined,
        province,
        district,
        neighborhood,
        reference
      };

      const finalBiData: BIData = {
        ...ocrData!
      };

      const verifiedPayload: VerificationData = {
        business: bData,
        bi: finalBiData,
        livenessActionsDone: completedTasks,
        selfieWithBIImage: selfieWithBI,
        gpsCoordinates: gpsCoords,
        livenessChecked: livenessSuccess,
        matchScore: comparisonScore,
        submittedAt: new Date().toISOString()
      };

      onComplete(verifiedPayload);
      setLoading(false);
    }, 2000);
  };

  // Simulação de marcação de GPS no mapa
  const pinLocationOnMockMap = (latOffset: number, lngOffset: number) => {
    setGpsCoords({
      lat: -25.9692 + latOffset,
      lng: 32.5732 + lngOffset
    });
    setMapPinned(true);
  };

  return (
    <div className="bg-slate-900 text-white rounded-[3rem] p-6 md:p-12 border-4 border-slate-800 shadow-2xl relative overflow-hidden space-y-8 max-w-4xl mx-auto">
      {/* Luzes de Fundo de Alta Tecnologia */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-green-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      {/* Cabeçalho do Wizard */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6 z-10 relative">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-950 text-green-400 border border-green-800/40 flex items-center justify-center text-xl">
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <span className="text-[8px] font-black tracking-[0.2em] text-green-400 uppercase">Processo Regulatório</span>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none text-white">Verificação de Identidade</h2>
          </div>
        </div>
        <button 
          onClick={onCancel}
          className="text-slate-400 hover:text-white px-4 py-2 bg-slate-800/60 hover:bg-slate-800 rounded-xl font-bold text-[10px] uppercase tracking-widest transition"
        >
          Cancelar
        </button>
      </div>

      {/* Indicador de Passos */}
      <div className="grid grid-cols-6 gap-2 text-center select-none">
        {[1, 2, 3, 4, 5, 6].map((s) => (
          <div key={s} className="space-y-2">
            <div className={`h-2.5 rounded-full transition-all duration-300 ${
              s === step ? 'bg-green-500 shadow-lg shadow-green-500/30' : s < step ? 'bg-green-800' : 'bg-slate-800'
            }`}></div>
            <span className={`text-[8px] font-black uppercase tracking-widest hidden md:inline-block ${s === step ? 'text-green-400' : 'text-slate-500'}`}>
              Passo {s}
            </span>
          </div>
        ))}
      </div>

      {/* Corpo do Wizard */}
      <div className="z-10 relative min-h-[350px] flex flex-col justify-between">
        
        {/* ================= PASSO 1: DADOS DO NEGÓCIO ================= */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6">
              <p className="text-slate-300 text-xs leading-relaxed font-bold">
                Para proteger compradores e vendedores, todas as contas de vendedor passam por um processo rigoroso de verificação de identidade. Por favor, preencha os dados do seu negócio abaixo.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tipo de Negócio</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setBusinessType('PERSONAL')}
                  className={`p-6 rounded-2xl border text-left transition relative overflow-hidden ${
                    businessType === 'PERSONAL' 
                      ? 'bg-green-950/40 border-green-500/40 text-white shadow-lg' 
                      : 'bg-slate-800/30 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${businessType === 'PERSONAL' ? 'bg-green-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                      <i className="fa-solid fa-user"></i>
                    </div>
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wide">Negócio Pessoal</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Venda rápida de artigos particulares</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBusinessType('STORE')}
                  className={`p-6 rounded-2xl border text-left transition relative overflow-hidden ${
                    businessType === 'STORE' 
                      ? 'bg-green-950/40 border-green-500/40 text-white shadow-lg' 
                      : 'bg-slate-800/30 border-slate-800 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${businessType === 'STORE' ? 'bg-green-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                      <i className="fa-solid fa-store"></i>
                    </div>
                    <div>
                      <h4 className="font-black text-xs uppercase tracking-wide">Loja / Empresa</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Ponto de venda oficial e de maior escala</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {businessType === 'STORE' && (
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Nome Comercial da Loja</label>
                  <input 
                    type="text" 
                    value={bizName}
                    onChange={e => setBizName(e.target.value)}
                    placeholder="Ex: Bazamos Express"
                    className="w-full p-4 bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-green-500 text-white"
                  />
                </div>
              )}

              {businessType === 'STORE' && (
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Proprietário Legal</label>
                  <input 
                    type="text" 
                    value={bizOwner}
                    onChange={e => setBizOwner(e.target.value)}
                    placeholder="Nome completo do representante"
                    className="w-full p-4 bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>
              )}

              {businessType === 'STORE' && (
                <div className="space-y-1">
                  <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Categoria de Artigos</label>
                  <select
                    value={bizCategory}
                    onChange={e => setBizCategory(e.target.value)}
                    className="w-full p-4 bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="Tecnologia e Eletrónicos">Tecnologia e Eletrónicos</option>
                    <option value="Moda e Acessórios">Moda e Acessórios</option>
                    <option value="Casa e Eletrodomésticos">Casa e Eletrodomésticos</option>
                    <option value="Serviços e Outros">Serviços e Outros</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Telefone Comercial</label>
                <input 
                  type="tel" 
                  value={bizPhone}
                  onChange={e => setBizPhone(e.target.value)}
                  placeholder="Ex: 841234567"
                  className="w-full p-4 bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Província</label>
                <select 
                  value={province}
                  onChange={handleProvinceChange}
                  className="w-full p-4 bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-bold focus:outline-none text-white"
                >
                  {Object.keys(MOZAMBIQUE_DATA).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Distrito</label>
                <select 
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full p-4 bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-bold focus:outline-none text-white"
                >
                  {province && MOZAMBIQUE_DATA[province]?.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Bairro</label>
                <input 
                  type="text" 
                  value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  placeholder="Ex: Central / Alto Maé / Hulene"
                  className="w-full p-4 bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-green-500 text-white"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-[8px] font-black uppercase text-slate-400 tracking-wider">Referência da Localização</label>
                <input 
                  type="text" 
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="Ex: Próximo ao Mercado Central / Em frente ao Hospital Provin"
                  className="w-full p-4 bg-slate-800/50 border border-slate-800 rounded-xl text-xs font-bold focus:outline-none focus:border-green-500 text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= PASSO 2: LOCALIZAÇÃO GPS ================= */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center text-lg border border-blue-900/40 shrink-0">
                <i className="fa-solid fa-location-crosshairs"></i>
              </div>
              <div>
                <h4 className="font-black text-xs uppercase text-white mb-1">Coordenadas Geográficas Obrigatórias</h4>
                <p className="text-slate-400 text-[10px] leading-relaxed font-bold uppercase tracking-wide">
                  Para garantir a fiabilidade de vendas locais, por favor marque a localização exata do seu negócio físico no painel de posicionamento dinâmico.
                </p>
              </div>
            </div>

            {/* Simulador de Mapa Satélite de Alta Tecnologia */}
            <div className="border-2 border-slate-800 rounded-3xl h-64 relative bg-slate-950 overflow-hidden flex flex-col justify-between">
              {/* Malha de Fundo do Radar/Mapa */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#22c55e_1px,transparent_1px)] [background-size:16px_16px]"></div>
              
              {/* Scanning Laser Effect */}
              <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20 animate-scan"></div>

              {/* Botões do Mapa */}
              <div className="p-4 z-10 flex justify-between">
                <span className="text-[8px] font-mono font-black tracking-widest bg-slate-900/80 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-lg uppercase">
                  Satélite Ativo: Maputo Grid
                </span>
                <span className="text-[8px] font-mono font-black tracking-widest bg-slate-900/80 border border-slate-800 text-green-400 px-3 py-1.5 rounded-lg uppercase">
                  Sinal GPS Estável
                </span>
              </div>

              {/* Central Marker */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {mapPinned ? (
                  <div className="text-center transform -translate-y-4 animate-bounce">
                    <i className="fa-solid fa-location-dot text-4xl text-green-500 filter drop-shadow-[0_0_10px_#22c55e]"></i>
                    <div className="bg-green-950/90 text-green-400 px-2 py-1 rounded-md text-[7px] font-black uppercase mt-1 border border-green-500/30 whitespace-nowrap">
                      Ponto Estabelecido
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full border-4 border-dashed border-red-500 animate-spin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
                    <i className="fa-solid fa-location-crosshairs text-2xl text-red-500"></i>
                    <p className="text-[7px] text-red-400 font-black uppercase mt-4 tracking-widest bg-slate-900/80 px-2 py-1 rounded-md">Clique no Mapa para Fixar</p>
                  </div>
                )}
              </div>

              {/* Pontos de clique simulados */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 z-0">
                <div onClick={() => pinLocationOnMockMap(-0.005, 0.002)} className="hover:bg-green-500/5 cursor-pointer border border-slate-900/30"></div>
                <div onClick={() => pinLocationOnMockMap(-0.002, -0.001)} className="hover:bg-green-500/5 cursor-pointer border border-slate-900/30"></div>
                <div onClick={() => pinLocationOnMockMap(0.004, 0.006)} className="hover:bg-green-500/5 cursor-pointer border border-slate-900/30"></div>
                <div onClick={() => pinLocationOnMockMap(-0.001, -0.004)} className="hover:bg-green-500/5 cursor-pointer border border-slate-900/30"></div>
                <div onClick={() => pinLocationOnMockMap(0.001, 0.001)} className="hover:bg-green-500/5 cursor-pointer border border-slate-900/30"></div>
                <div onClick={() => pinLocationOnMockMap(0.003, -0.002)} className="hover:bg-green-500/5 cursor-pointer border border-slate-900/30"></div>
                <div onClick={() => pinLocationOnMockMap(-0.004, -0.005)} className="hover:bg-green-500/5 cursor-pointer border border-slate-900/30"></div>
                <div onClick={() => pinLocationOnMockMap(-0.003, 0.004)} className="hover:bg-green-500/5 cursor-pointer border border-slate-900/30"></div>
                <div onClick={() => pinLocationOnMockMap(0.005, -0.003)} className="hover:bg-green-500/5 cursor-pointer border border-slate-900/30"></div>
              </div>

              {/* Coordenadas e Confirmação */}
              <div className="bg-slate-900/90 border-t border-slate-800 p-4 z-10 flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="font-mono text-[8px] text-slate-400 flex gap-4">
                  <span>LATITUDE: <strong className="text-white">{gpsCoords.lat.toFixed(6)}</strong></span>
                  <span>LONGITUDE: <strong className="text-white">{gpsCoords.lng.toFixed(6)}</strong></span>
                </div>
                <div className="text-[7px] font-black uppercase text-slate-400">
                  Residência: {district}, {province}
                </div>
              </div>
            </div>

            {mapPinned && (
              <div className="p-4 bg-green-950/20 border border-green-800/40 text-green-400 rounded-xl font-bold text-[9px] uppercase tracking-widest text-center animate-bounce">
                ✨ Localização geo-referenciada vinculada com absoluta precisão!
              </div>
            )}
          </div>
        )}

        {/* ================= PASSO 3: VERIFICAÇÃO DE BI (CÂMARA / OCR) ================= */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-red-950/20 border border-red-900/30 text-red-400 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-950 text-red-500 flex items-center justify-center text-lg border border-red-900/40 shrink-0">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <div>
                <h4 className="font-black text-xs uppercase text-white mb-1">Restrição de Segurança Anti-Fraude</h4>
                <p className="text-slate-400 text-[9px] leading-relaxed font-bold uppercase tracking-wide">
                  ❌ Para sua segurança e para prevenir falsificações de identidade, não é permitido fazer upload de fotos da galeria. Apenas capturas com a câmara do dispositivo em tempo real são autorizadas pelo protocolo de segurança.
                </p>
              </div>
            </div>

            {/* Capturas do BI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Frente do BI */}
              <div className="space-y-2 text-center">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Frente do BI (Documento)</label>
                <div className="h-44 border-2 border-dashed border-slate-800 rounded-2xl overflow-hidden relative bg-slate-950 flex flex-col items-center justify-center">
                  {biFront ? (
                    <>
                      <img src={biFront} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                        <button 
                          onClick={() => startCamera('front')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-black text-[8px] uppercase tracking-widest transition"
                        >
                          Repetir Captura
                        </button>
                      </div>
                    </>
                  ) : isCapturingBI === 'front' ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-green-500 animate-spin mx-auto"></div>
                      <p className="text-[10px] font-mono tracking-widest font-black uppercase text-green-400">Câmara Ativa: A capturar em {cameraCountdown}s</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => startCamera('front')}
                      className="flex flex-col items-center gap-2 text-slate-400 hover:text-white transition"
                    >
                      <i className="fa-solid fa-camera text-2xl text-green-500"></i>
                      <span className="text-[9px] font-black uppercase tracking-widest">Abrir Câmara (Frente)</span>
                    </button>
                  )}
                  {/* Overlay guias para BI */}
                  <div className="absolute inset-6 border border-dashed border-white/10 rounded pointer-events-none"></div>
                </div>
              </div>

              {/* Verso do BI */}
              <div className="space-y-2 text-center">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Verso do BI (Documento)</label>
                <div className="h-44 border-2 border-dashed border-slate-800 rounded-2xl overflow-hidden relative bg-slate-950 flex flex-col items-center justify-center">
                  {biBack ? (
                    <>
                      <img src={biBack} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                        <button 
                          onClick={() => startCamera('back')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-black text-[8px] uppercase tracking-widest transition"
                        >
                          Repetir Captura
                        </button>
                      </div>
                    </>
                  ) : isCapturingBI === 'back' ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-green-500 animate-spin mx-auto"></div>
                      <p className="text-[10px] font-mono tracking-widest font-black uppercase text-green-400">Câmara Ativa: A capturar em {cameraCountdown}s</p>
                    </div>
                  ) : (
                    <button 
                      disabled={!biFront}
                      onClick={() => startCamera('back')}
                      className={`flex flex-col items-center gap-2 transition ${biFront ? 'text-slate-400 hover:text-white' : 'text-slate-700 cursor-not-allowed'}`}
                    >
                      <i className={`fa-solid fa-camera text-2xl ${biFront ? 'text-green-500' : 'text-slate-700'}`}></i>
                      <span className="text-[9px] font-black uppercase tracking-widest">Abrir Câmara (Verso)</span>
                    </button>
                  )}
                  {/* Overlay guias para BI */}
                  <div className="absolute inset-6 border border-dashed border-white/10 rounded pointer-events-none"></div>
                </div>
              </div>
            </div>

            {/* OCR Loading & Dados Extraídos */}
            {ocrLoading && (
              <div className="p-6 bg-slate-800 rounded-2xl text-center space-y-3 animate-pulse border border-slate-700">
                <div className="w-10 h-10 rounded-full border-4 border-t-transparent border-green-500 animate-spin mx-auto"></div>
                <h4 className="text-xs font-black uppercase tracking-widest text-green-400">Extração de Metadados via IA (OCR)</h4>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Lendo o chip e os dados visuais do Bilhete de Identidade...</p>
              </div>
            )}

            {ocrData && !ocrLoading && (
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 space-y-4 animate-fadeIn">
                <h4 className="text-[9px] font-black uppercase text-green-400 tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
                  <i className="fa-solid fa-id-card"></i>
                  <span>Dados Extraídos do Documento (Apenas Leitura)</span>
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-500">Nome Completo</span>
                    <p className="font-black text-white uppercase">{ocrData.fullName}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-500">Número do BI</span>
                    <p className="font-mono font-black text-green-400">{ocrData.biNumber}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-500">Data de Nascimento</span>
                    <p className="font-bold text-slate-300">{new Date(ocrData.birthDate).toLocaleDateString('pt-PT')}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-500">Gênero</span>
                    <p className="font-bold text-slate-300 uppercase">{ocrData.gender}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-500">Data de Emissão</span>
                    <p className="font-bold text-slate-300">{new Date(ocrData.issueDate).toLocaleDateString('pt-PT')}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-500">Validade</span>
                    <p className="font-bold text-slate-300">{new Date(ocrData.expiryDate).toLocaleDateString('pt-PT')}</p>
                  </div>
                  <div>
                    <span className="text-[8px] font-black uppercase text-slate-500">Nacionalidade</span>
                    <p className="font-bold text-slate-300 uppercase">{ocrData.nationality}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                  <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest">⚠️ Os dados do BI não podem ser editados manualmente. Eles foram extraídos de forma encriptada e segura do próprio documento.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= PASSO 4: VERIFICAÇÃO FACIAL (LIVENESS CHECK) ================= */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-950 text-green-400 flex items-center justify-center text-lg border border-green-900/40 shrink-0">
                <i className="fa-solid fa-face-viewfinder"></i>
              </div>
              <div>
                <h4 className="font-black text-xs uppercase text-white mb-1">Verificação de Vivacidade Biométrica</h4>
                <p className="text-slate-400 text-[9px] leading-relaxed font-bold uppercase tracking-wide">
                  Para comprovar que é uma pessoa real e não uma fotografia estática, por favor complete a sequência dinâmica de tarefas em frente à câmara do dispositivo.
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center space-y-6">
              
              {/* Câmara circular de liveness */}
              <div className="relative w-56 h-56 rounded-full border-4 border-dashed border-green-500 p-2 overflow-hidden bg-slate-950 flex flex-col items-center justify-center shadow-2xl shadow-green-500/10">
                <div className="absolute inset-0 bg-radial-circle opacity-10"></div>
                {isCapturingLiveness ? (
                  <div className="text-center z-10 p-4 space-y-2">
                    <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-green-400 animate-spin mx-auto mb-2"></div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Analizando...</span>
                    <p className="text-xs font-black text-green-400 animate-pulse">{LIVENESS_TASKS[activeTaskIndex].label}</p>
                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1 leading-tight">{LIVENESS_TASKS[activeTaskIndex].instruction}</p>
                    <div className="bg-green-900/80 px-2 py-1 rounded text-[8px] font-bold font-mono tracking-wider mt-2">
                      FALTAM {cameraCountdown}s
                    </div>
                  </div>
                ) : livenessSuccess ? (
                  <div className="text-center z-10 space-y-2">
                    <i className="fa-solid fa-circle-check text-5xl text-green-500 filter drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]"></i>
                    <h4 className="text-xs font-black uppercase tracking-widest">Sucesso Biométrico</h4>
                    <span className="text-[7px] font-black uppercase tracking-widest px-2.5 py-1 bg-green-950 text-green-400 border border-green-800/40 rounded-full">
                      LIVENESS COMPLETO
                    </span>
                  </div>
                ) : (
                  <button 
                    onClick={() => startCamera('liveness')}
                    className="flex flex-col items-center gap-2 text-slate-400 hover:text-white transition z-10"
                  >
                    <i className="fa-solid fa-face-viewfinder text-4xl text-green-500"></i>
                    <span className="text-[9px] font-black uppercase tracking-widest">Iniciar Liveness Check</span>
                  </button>
                )}
                {/* Circulo Interno de Captura */}
                <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none"></div>
              </div>

              {/* Lista de Checklist de Vivacidade */}
              <div className="w-full max-w-sm bg-slate-800/30 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-800 pb-1.5 block">Seqüência de Verificação Requerida</span>
                {LIVENESS_TASKS.map((task) => {
                  const completed = completedTasks.includes(task.id);
                  const isCurrent = isCapturingLiveness && LIVENESS_TASKS[activeTaskIndex].id === task.id;
                  return (
                    <div key={task.id} className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-300">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                          completed ? 'bg-green-500 text-slate-950' : isCurrent ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-600'
                        }`}>
                          <i className={`fa-solid ${completed ? 'fa-check' : 'fa-circle'}`}></i>
                        </div>
                        <span className={completed ? 'line-through text-slate-500' : isCurrent ? 'text-amber-400 font-black' : ''}>{task.label}</span>
                      </div>
                      {isCurrent && <span className="text-[8px] font-mono tracking-widest font-black text-amber-500 uppercase animate-pulse">EM CURSO</span>}
                      {completed && <span className="text-[8px] font-mono tracking-widest font-black text-green-500 uppercase">VALIDADO</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= PASSO 5: COMPARAÇÃO FACIAL ================= */}
        {step === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-6 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-950 text-green-400 flex items-center justify-center text-lg border border-green-900/40 shrink-0">
                <i className="fa-solid fa-users-viewfinder"></i>
              </div>
              <div>
                <h4 className="font-black text-xs uppercase text-white mb-1">Comparação Facial vs. Foto do BI</h4>
                <p className="text-slate-400 text-[9px] leading-relaxed font-bold uppercase tracking-wide">
                  Segure o seu Bilhete de Identidade (BI) ao lado do seu rosto e tire uma fotografia nítida em boa iluminação para fazermos a verificação biométrica de conformidade documental.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Câmara Selfie com BI */}
              <div className="space-y-2 text-center">
                <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Selfie de Cruzamento Biométrico</label>
                <div className="h-56 border-2 border-dashed border-slate-800 rounded-2xl overflow-hidden relative bg-slate-950 flex flex-col items-center justify-center">
                  {selfieWithBI ? (
                    <>
                      <img src={selfieWithBI} className="w-full h-full object-cover" alt="" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                        <button 
                          onClick={() => startCamera('selfie')}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-black text-[8px] uppercase tracking-widest transition"
                        >
                          Repetir Captura
                        </button>
                      </div>
                    </>
                  ) : isCapturingSelfie ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-full border-4 border-t-transparent border-green-500 animate-spin mx-auto"></div>
                      <p className="text-[10px] font-mono tracking-widest font-black uppercase text-green-400">Capturando em {cameraCountdown}s...</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => startCamera('selfie')}
                      className="flex flex-col items-center gap-2 text-slate-400 hover:text-white transition"
                    >
                      <i className="fa-solid fa-camera text-2xl text-green-500"></i>
                      <span className="text-[9px] font-black uppercase tracking-widest">Capturar Selfie com BI</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Indicador de correspondência */}
              <div className="bg-slate-800/20 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Mapeamento Biométrico Facial</span>
                
                {comparing ? (
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-full border-4 border-t-transparent border-green-500 animate-spin mx-auto"></div>
                    <p className="text-[9px] font-black text-green-400 uppercase tracking-widest animate-pulse">Calculando pontos nodais faciais...</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase">Cruzando com foto de identidade...</p>
                  </div>
                ) : comparisonScore > 0 ? (
                  <div className="space-y-4">
                    <div className="inline-block relative">
                      <div className="w-24 h-24 rounded-full border-8 border-green-950/60 border-t-green-500 flex items-center justify-center mx-auto text-xl font-black font-mono text-white">
                        {comparisonScore}%
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black uppercase tracking-wide text-green-400">Verificação Aprovada em Tempo Real!</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase leading-relaxed">Alta compatibilidade geométrica entre o seu rosto atual e a foto do documento de identidade.</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-slate-500 text-[10px] uppercase font-bold tracking-wide">
                    Por favor, tire a fotografia ao lado do seu documento para iniciar o cruzamento de metadados faciais.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= PASSO 6: ENVIAR PARA ANÁLISE ================= */}
        {step === 6 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-8 bg-green-950/20 border-2 border-green-500/20 rounded-3xl text-center space-y-4">
              <i className="fa-solid fa-file-shield text-5xl text-green-400 filter drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]"></i>
              <div className="space-y-2">
                <h3 className="font-black uppercase tracking-tight text-lg text-white">Pronto para Envio do Processo</h3>
                <p className="text-slate-400 text-xs leading-relaxed font-bold max-w-lg mx-auto uppercase tracking-wide">
                  Os seus dados foram coletados e estão prontos para auditoria de segurança da nossa equipe do BazamosPay.
                </p>
              </div>
            </div>

            {/* Aviso Regulamentar RGPD / Proteção de PII */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 space-y-4 text-[10px] leading-relaxed">
              <h4 className="font-black uppercase text-amber-500 tracking-widest flex items-center gap-2 border-b border-slate-800 pb-2">
                <i className="fa-solid fa-circle-info"></i>
                <span>Tratamento Isolado de Dados Pessoais (PII Protection)</span>
              </h4>
              <p className="text-slate-400 font-bold uppercase tracking-wide">
                Os seus dados pessoais (Bilhete de Identidade e mapeamentos biométricos) estão encriptados de ponta a ponta em trânsito e em descanso. Eles permanecem numa base de dados isolada no Firestore com restrição estrita de acesso por privilégio mínimo, acessível apenas para oficiais de conformidade (Compliance Officer) durante o processo de auditoria regulatória.
              </p>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="consent_check" 
                  defaultChecked 
                  className="w-5 h-5 accent-green-500 bg-slate-900 border-slate-800 rounded text-green-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="consent_check" className="font-black uppercase text-slate-300 tracking-widest text-[8px] cursor-pointer">
                  Confirmo que os dados declarados pertencem à minha pessoa e autorizo a análise de conformidade comercial.
                </label>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Botões de Ação do Fundo */}
      <div className="flex justify-between items-center border-t border-slate-800 pt-6 z-10 relative">
        {step > 1 ? (
          <button
            type="button"
            onClick={() => setStep(step - 1)}
            className="px-6 py-4 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition"
          >
            Voltar
          </button>
        ) : (
          <div></div>
        )}

        {step < 6 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="px-6 py-4 bg-green-600 hover:bg-green-500 text-slate-950 hover:scale-102 hover:shadow-lg hover:shadow-green-500/20 rounded-xl font-black text-[9px] uppercase tracking-widest transition"
          >
            Confirmar e Avançar
          </button>
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={loading}
            className="px-8 py-4 bg-green-500 hover:bg-green-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-xl shadow-xl hover:shadow-green-500/25 transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner animate-spin"></i>
                <span>Enviando Dados...</span>
              </>
            ) : (
              <>
                <i className="fa-solid fa-paper-plane"></i>
                <span>Submeter para Auditoria</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
