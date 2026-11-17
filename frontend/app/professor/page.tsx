"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  Download,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  UserPlus,
  X,
  Camera,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  Video,
  VideoOff,
  Sparkles,
} from "lucide-react";
import jsQR from "jsqr";
import "../styles/professor.css";
import "../styles/wireframes.css";

import { api, clearAuth, getToken } from "../services/api";
import BrasiliaClock from "../components/BrasiliaClock";
import CarteirinhaDigital from "../components/CarteirinhaDigital";

interface ModalityDef {
  id: string;
  nome: string;
  descricao?: string;
  faixaEtariaMinima?: number;
  faixaEtariaMaxima?: number;
  icone: string;
  corBadge: string;
}

const LISTA_MODALIDADES_OFICIAIS: ModalityDef[] = [
  { id: "mod-1", nome: "FUTEBOL", descricao: "Futebol de campo tradicional e competição", faixaEtariaMinima: 7, faixaEtariaMaxima: 17, icone: "⚽", corBadge: "#eaf2ff" },
  { id: "mod-2", nome: "FUTSAL", descricao: "Futsal de quadra e treinamento técnico", faixaEtariaMinima: 7, faixaEtariaMaxima: 17, icone: "🏆", corBadge: "#eaf2ff" },
  { id: "mod-3", nome: "SURF", descricao: "Aulas e treinos de surf no litoral de Peruíbe", faixaEtariaMinima: 7, faixaEtariaMaxima: 17, icone: "🌊", corBadge: "#e6f8ff" },
  { id: "mod-4", nome: "BASQUETE", descricao: "Basquetebol masculino e feminino", faixaEtariaMinima: 10, faixaEtariaMaxima: 17, icone: "🏀", corBadge: "#fff7df" },
  { id: "mod-5", nome: "VÔLEI", descricao: "Voleibol de quadra e areia", faixaEtariaMinima: 10, faixaEtariaMaxima: 17, icone: "🏐", corBadge: "#eaf8ef" },
  { id: "mod-6", nome: "JUDÔ", descricao: "Arte marcial, disciplina e alto rendimento", faixaEtariaMinima: 6, faixaEtariaMaxima: 17, icone: "🥋", corBadge: "#eaf8ef" },
  { id: "mod-7", nome: "BOXE", descricao: "Treinamento funcional e prática de boxe", faixaEtariaMinima: 12, faixaEtariaMaxima: 17, icone: "🥊", corBadge: "#fff0f1" },
  { id: "mod-8", nome: "HANDEBOL", descricao: "Prática esportiva e tática de handebol", faixaEtariaMinima: 8, faixaEtariaMaxima: 17, icone: "🤾", corBadge: "#eeedfe" },
  { id: "mod-9", nome: "CAPOEIRA", descricao: "Expressão cultural, dança e arte marcial", faixaEtariaMinima: 6, faixaEtariaMaxima: 17, icone: "🤸", corBadge: "#fff7df" },
  { id: "mod-10", nome: "KARATÊ", descricao: "Arte marcial, kata e kumite", faixaEtariaMinima: 6, faixaEtariaMaxima: 17, icone: "🥋", corBadge: "#eaf8ef" },
  { id: "mod-11", nome: "GINÁSTICA", descricao: "Ginástica artística, rítmica e de solo", faixaEtariaMinima: 5, faixaEtariaMaxima: 17, icone: "✨", corBadge: "#f5e8ff" },
  { id: "mod-12", nome: "XADREZ", descricao: "Esporte da mente, estratégia e raciocínio", faixaEtariaMinima: 6, faixaEtariaMaxima: 17, icone: "♟️", corBadge: "#f1f5f9" },
  { id: "mod-13", nome: "TÊNIS", descricao: "Prática de tênis de campo e fundamentos", faixaEtariaMinima: 7, faixaEtariaMaxima: 17, icone: "🎾", corBadge: "#eaf8ef" },
];

export default function ProfessorDashboardPage() {
  const router = useRouter();
  const [paginaAtiva, setPaginaAtiva] = useState<
    "inicio" | "aulas" | "modalidades" | "turmas" | "alunos" | "frequencia" | "validar" | "perfil"
  >("inicio");

  const [perfil, setPerfil] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [modalidades, setModalidades] = useState<any[]>(LISTA_MODALIDADES_OFICIAIS);
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [filtroModalidades, setFiltroModalidades] = useState<"todas" | "minhas">("todas");

  // ESTADO DA CHAMADA / FREQUÊNCIA
  const [turmaSelecionadaId, setTurmaSelecionadaId] = useState<string>("");
  const [dataChamada, setDataChamada] = useState<string>(new Date().toISOString().split("T")[0]);
  const [observacoesChamada, setObservacoesChamada] = useState<string>("");
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});
  const [salvandoChamada, setSalvandoChamada] = useState(false);
  const [mensagemChamada, setMensagemChamada] = useState<{ texto: string; tipo: "sucesso" | "erro" | "" }>({
    texto: "",
    tipo: "",
  });
  const [historicoChamadas, setHistoricoChamadas] = useState<any[]>([]);

  // ESTADO DA FOTO DE PERFIL
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [mensagemFoto, setMensagemFoto] = useState<{ texto: string; tipo: "sucesso" | "erro" | "" }>({
    texto: "",
    tipo: "",
  });

  // ESTADO DE VALIDAÇÃO DE CARTEIRINHA
  const [inputValidacao, setInputValidacao] = useState("");
  const [validando, setValidando] = useState(false);
  const [resultadoValidacao, setResultadoValidacao] = useState<any>(null);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);
  const [modoValidacao, setModoValidacao] = useState<"camera" | "arquivo" | "manual">("camera");
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [streamCamera, setStreamCamera] = useState<MediaStream | null>(null);
  const cameraAtivaRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const [arrastandoArquivo, setArrastandoArquivo] = useState(false);
  const [sucessoLeituraQr, setSucessoLeituraQr] = useState<string | null>(null);

  // ESTADO DE SINCRONIZAÇÃO OFFLINE
  const [chamadasOfflineCount, setChamadasOfflineCount] = useState(0);
  const [sincronizandoOffline, setSincronizandoOffline] = useState(false);

  // ESTADO DE RELATÓRIO PDF
  const [periodoPreset, setPeriodoPreset] = useState("mensal");
  const [observacoesRelatorio, setObservacoesRelatorio] = useState("");
  const [baixandoPdf, setBaixandoPdf] = useState(false);

  // ESTADO MODAL VER CARTEIRINHA DO ATLETA (Página 5 do Wireframe)
  const [modalCarteirinhaData, setModalCarteirinhaData] = useState<any | null>(null);
  const [carregandoModalCarteirinha, setCarregandoModalCarteirinha] = useState(false);

  // ESTADO MODAL INSERIR ALUNO NA TURMA (Página 4 do Wireframe)
  const [modalInserirAberto, setModalInserirAberto] = useState(false);
  const [novoAlunoIdOuCpf, setNovoAlunoIdOuCpf] = useState("");
  const [inserindoAluno, setInserindoAluno] = useState(false);
  const [mensagemInserir, setMensagemInserir] = useState<string | null>(null);

  const abrirCarteirinhaModal = async (matricula: any) => {
    const aId = matricula.alunoId || matricula.id;
    setCarregandoModalCarteirinha(true);
    try {
      const res = await api.get(`/matriculas/carteirinha?alunoId=${aId}`);
      if (res.data) {
        setModalCarteirinhaData({ ...res.data, alunoId: aId });
      } else {
        setModalCarteirinhaData({
          nome: matricula.alunoNome || matricula.aluno?.nome || "Atleta",
          numeroMatricula: matricula.aluno?.numeroMatricula || "2026-000001",
          cpf: matricula.aluno?.cpf || "000.000.000-00",
          modalidadeNome: matricula.modalidadeNome || "Esporte",
          alunoId: aId,
        });
      }
    } catch (e) {
      alert("Erro ao carregar carteirinha do atleta.");
    } finally {
      setCarregandoModalCarteirinha(false);
    }
  };

  const handleInserirAlunoNaTurma = async () => {
    if (!novoAlunoIdOuCpf.trim() || !turmaSelecionadaId) return;
    setInserindoAluno(true);
    setMensagemInserir(null);
    try {
      const res = await api.post("/matriculas", {
        alunoId: novoAlunoIdOuCpf.trim(),
        turmaId: turmaSelecionadaId,
      });
      if (res.error) {
        setMensagemInserir(`Erro: ${res.error}`);
      } else {
        setMensagemInserir("Atleta inserido na turma com sucesso!");
        setNovoAlunoIdOuCpf("");
        await carregarDados();
        setTimeout(() => {
          setModalInserirAberto(false);
          setMensagemInserir(null);
        }, 1500);
      }
    } catch (e: any) {
      setMensagemInserir("Erro ao matricular aluno.");
    } finally {
      setInserindoAluno(false);
    }
  };

  const carregarDados = async () => {
    // 1. Perfil do Professor
    const resMe = await api.get("/auth/me");
    if (resMe.data?.user) {
      setPerfil(resMe.data.user);
    }

    // 2. Modalidades do Backend
    const resMod = await api.get("/modalidades");
    if (resMod.data && Array.isArray(resMod.data) && resMod.data.length > 0) {
      const apiMods: any[] = resMod.data;
      const combinadas = LISTA_MODALIDADES_OFICIAIS.map((item) => {
        const enc = apiMods.find((m) => m.nome.toLowerCase() === item.nome.toLowerCase());
        return enc ? { ...item, id: enc.id, ...enc } : item;
      });
      setModalidades(combinadas);
    }

    // 3. Turmas
    const resTurmas = await api.get("/turmas");
    if (resTurmas.data) {
      const listTurmas = Array.isArray(resTurmas.data) ? resTurmas.data : [];
      setTurmas(listTurmas);
      if (listTurmas.length > 0 && !turmaSelecionadaId) {
        setTurmaSelecionadaId(listTurmas[0].id);
      }
    }

    // 4. Matrículas / Alunos
    const resMat = await api.get("/matriculas");
    if (resMat.data) {
      setMatriculas(Array.isArray(resMat.data) ? resMat.data : []);
    }
  };

  const handleUploadFotoPerfil = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMensagemFoto({ texto: "", tipo: "" });
    setUploadingFoto(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
      const token = getToken();

      const res = await fetch(`${API_URL}/auth/me/foto`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const resData = await res.json();

      if (!res.ok) {
        setMensagemFoto({
          texto: resData.message || "Erro no envio da foto. Verifique o arquivo.",
          tipo: "erro",
        });
      } else {
        setMensagemFoto({
          texto: "Foto de perfil atualizada e salva com sucesso!",
          tipo: "sucesso",
        });
        if (resData.fotoUrl) {
          setPerfil((prev: any) => (prev ? { ...prev, fotoUrl: resData.fotoUrl } : prev));
          try {
            const stored = localStorage.getItem("selpe_usuario");
            if (stored) {
              const u = JSON.parse(stored);
              u.fotoUrl = resData.fotoUrl;
              localStorage.setItem("selpe_usuario", JSON.stringify(u));
            }
          } catch (err) {}
        }
      }
    } catch (err) {
      setMensagemFoto({
        texto: "Falha ao conectar com o serviço de upload.",
        tipo: "erro",
      });
    } finally {
      setUploadingFoto(false);
    }
  };

  useEffect(() => {
    try {
      const cached = localStorage.getItem("selpe_usuario");
      if (cached) {
        const u = JSON.parse(cached);
        if (u) {
          setPerfil((prev: any) => prev || u);
        }
      }
    } catch (e) {}
    carregarDados();
    try {
      const fila = JSON.parse(localStorage.getItem("selpe_offline_chamadas") || "[]");
      setChamadasOfflineCount(fila.length);
    } catch (e) {}
  }, []);

  // Carregar histórico e presenças existentes ao alterar turma ou data na chamada
  useEffect(() => {
    if (!turmaSelecionadaId) return;

    async function carregarChamadaDaTurma() {
      // 1. Obter alunos ativos da turma selecionada
      const alunosNaTurma = matriculas.filter(
        (m) => m && m.turmaId === turmaSelecionadaId && m.status !== "pendente_responsavel"
      );

      // 2. Buscar histórico de chamadas da turma
      const resChamadas = await api.get(`/chamadas?turmaId=${turmaSelecionadaId}`);
      if (resChamadas.data && Array.isArray(resChamadas.data)) {
        setHistoricoChamadas(resChamadas.data);

        // Verificar se já existe uma chamada salva exatamente na data selecionada
        const chamadaExistente = resChamadas.data.find((c: any) => c.data === dataChamada);
        if (chamadaExistente) {
          const mapa: Record<string, boolean> = {};
          const presentesSet = new Set(chamadaExistente.presentes || []);
          alunosNaTurma.forEach((m) => {
            const aId = m.alunoId || m.id;
            mapa[aId] = presentesSet.has(aId);
          });
          setPresencas(mapa);
          setObservacoesChamada(chamadaExistente.observacoes || "");
          return;
        }
      }

      // Se não há chamada gravada no servidor na data, verificar se há na fila offline
      try {
        const fila = JSON.parse(localStorage.getItem("selpe_offline_chamadas") || "[]");
        const offlineItem = fila.find(
          (item: any) => item.turmaId === turmaSelecionadaId && item.data === dataChamada
        );
        if (offlineItem) {
          const mapa: Record<string, boolean> = {};
          const presentesSet = new Set(offlineItem.presentes || []);
          alunosNaTurma.forEach((m) => {
            const aId = m.alunoId || m.id;
            mapa[aId] = presentesSet.has(aId);
          });
          setPresencas(mapa);
          setObservacoesChamada(offlineItem.observacoes || "");
          return;
        }
      } catch (e) {}

      // Se não há chamada gravada na data, todos começam como presentes por padrão
      const mapaInicial: Record<string, boolean> = {};
      alunosNaTurma.forEach((m) => {
        const aId = m.alunoId || m.id;
        mapaInicial[aId] = true;
      });
      setPresencas(mapaInicial);
      setObservacoesChamada("");
    }

    carregarChamadaDaTurma();
  }, [turmaSelecionadaId, dataChamada, matriculas]);

  const sair = () => {
    clearAuth();
    router.push("/aluno/login");
  };

  const getNomeUsuario = () => perfil?.nome || "Professor";

  const getAvatarInitials = () => {
    if (!perfil?.nome || typeof perfil.nome !== "string") return "PT";
    const partes = perfil.nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length >= 2 && partes[0] && partes[partes.length - 1]) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    if (partes.length === 1 && partes[0]) {
      return partes[0].substring(0, 2).toUpperCase();
    }
    return "PT";
  };

  // Todos os alunos matriculados na turma selecionada
  const todosAlunosDaTurma = matriculas.filter((m) => {
    if (!turmaSelecionadaId) return true;
    return m.turmaId === turmaSelecionadaId;
  });

  // Apenas alunos com matrícula ativa podem ter presença registrada oficialmente
  const alunosDaTurmaSelecionada = todosAlunosDaTurma.filter((m) => m.status !== "pendente_responsavel");
  const alunosPendentesDaTurma = todosAlunosDaTurma.filter((m) => m.status === "pendente_responsavel");

  // Alternar presença do aluno (Adicionar ou Remover presença)
  const togglePresencaAluno = (alunoId: string, status: boolean) => {
    setPresencas((prev) => ({
      ...prev,
      [alunoId]: status,
    }));
  };

  const marcarTodosPresentes = () => {
    const novoMapa: Record<string, boolean> = {};
    alunosDaTurmaSelecionada.forEach((m) => {
      novoMapa[m.alunoId || m.id] = true;
    });
    setPresencas(novoMapa);
  };

  const marcarTodosAusentes = () => {
    const novoMapa: Record<string, boolean> = {};
    alunosDaTurmaSelecionada.forEach((m) => {
      novoMapa[m.alunoId || m.id] = false;
    });
    setPresencas(novoMapa);
  };

  // Salvar Lista de Chamada no Backend
  const salvarChamada = async () => {
    if (salvandoChamada) return;

    if (!turmaSelecionadaId) {
      setMensagemChamada({ texto: "Selecione uma turma para realizar a chamada.", tipo: "erro" });
      return;
    }

    if (alunosDaTurmaSelecionada.length === 0) {
      setMensagemChamada({
        texto: "Não há alunos com matrícula ativa nesta turma para registrar presença.",
        tipo: "erro",
      });
      return;
    }

    setSalvandoChamada(true);
    setMensagemChamada({ texto: "Salvando registro de frequência no servidor...", tipo: "" });

    const presentes: string[] = [];
    const ausentes: string[] = [];

    alunosDaTurmaSelecionada.forEach((m) => {
      const aId = m.alunoId || m.id;
      if (presencas[aId] !== false) {
        presentes.push(aId);
      } else {
        ausentes.push(aId);
      }
    });

    const payload = {
      turmaId: turmaSelecionadaId,
      data: dataChamada,
      presentes,
      ausentes,
      observacoes: observacoesChamada || undefined,
    };

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      salvarChamadaLocal(payload);
      setSalvandoChamada(false);
      return;
    }

    const res = await api.post("/chamadas", payload);
    setSalvandoChamada(false);

    if (res.error) {
      // Só enfileira offline se foi falha de conexão/rede comprovada
      const isConexaoFalhou =
        res.status === 0 ||
        res.error.toLowerCase().includes("conectar") ||
        res.error.toLowerCase().includes("conexão") ||
        res.error.toLowerCase().includes("network") ||
        res.error.toLowerCase().includes("failed to fetch");

      if (isConexaoFalhou) {
        salvarChamadaLocal(payload);
      } else {
        // Erro de regra de negócio retornado pelo backend
        setMensagemChamada({
          texto: `Não foi possível salvar: ${res.error}`,
          tipo: "erro",
        });
      }
    } else {
      // Se houver chamada offline salva para esta mesma aula, remove da fila pois o servidor já recebeu
      limparItemOffline(turmaSelecionadaId, dataChamada);

      setMensagemChamada({
        texto: `Frequência salva/atualizada com sucesso! (${presentes.length} presentes, ${ausentes.length} ausentes)`,
        tipo: "sucesso",
      });
      // Recarregar histórico de chamadas
      const resCham = await api.get(`/chamadas?turmaId=${turmaSelecionadaId}`);
      if (resCham.data && Array.isArray(resCham.data)) {
        setHistoricoChamadas(resCham.data);
      }
    }
  };

  const limparItemOffline = (turmaId: string, data: string) => {
    try {
      const fila = JSON.parse(localStorage.getItem("selpe_offline_chamadas") || "[]");
      const novaFila = fila.filter((item: any) => !(item.turmaId === turmaId && item.data === data));
      if (novaFila.length !== fila.length) {
        localStorage.setItem("selpe_offline_chamadas", JSON.stringify(novaFila));
        setChamadasOfflineCount(novaFila.length);
      }
    } catch (e) {}
  };

  const limparChamadasOffline = () => {
    if (confirm("Deseja realmente descartar todas as chamadas salvas offline neste dispositivo?")) {
      localStorage.removeItem("selpe_offline_chamadas");
      setChamadasOfflineCount(0);
      setMensagemChamada({
        texto: "Fila de chamadas offline foi descartada com sucesso.",
        tipo: "sucesso",
      });
    }
  };

  const salvarChamadaLocal = (payload: any) => {
    try {
      const fila: any[] = JSON.parse(localStorage.getItem("selpe_offline_chamadas") || "[]");
      // UPSERT: não duplica registros da mesma turma e mesma data
      const indexExistente = fila.findIndex(
        (item) => item.turmaId === payload.turmaId && item.data === payload.data
      );
      const novoItem = {
        ...payload,
        clientSyncId: `offline_${payload.turmaId}_${payload.data}`,
        dataHoraDispositivo: new Date().toISOString(),
        timestampLocal: new Date().toISOString(),
      };
      if (indexExistente >= 0) {
        fila[indexExistente] = novoItem;
      } else {
        fila.push(novoItem);
      }
      localStorage.setItem("selpe_offline_chamadas", JSON.stringify(fila));
      setChamadasOfflineCount(fila.length);
      setMensagemChamada({
        texto: `Sem conexão com o servidor. A lista de presença desta aula (${payload.data}) foi gravada/atualizada localmente (${fila.length} aula(s) pendente(s)). Sincronize ao reconectar.`,
        tipo: "sucesso",
      });
    } catch (e) {
      console.error("Erro ao salvar offline:", e);
    }
  };

  const sincronizarChamadasOffline = async () => {
    try {
      const fila: any[] = JSON.parse(localStorage.getItem("selpe_offline_chamadas") || "[]");
      if (fila.length === 0) return;
      setSincronizandoOffline(true);
      let sucesso = 0;
      const novasPendentes = [];

      // Deduplicar fila antes de enviar: manter apenas a versão mais recente de cada (turmaId, data)
      const filaDeduplicada: any[] = [];
      const mapaTurmaData = new Set<string>();
      for (let i = fila.length - 1; i >= 0; i--) {
        const item = fila[i];
        const chave = `${item.turmaId}_${item.data}`;
        if (!mapaTurmaData.has(chave)) {
          mapaTurmaData.add(chave);
          filaDeduplicada.unshift(item);
        }
      }

      for (const item of filaDeduplicada) {
        // Filtrar presentes/ausentes para não enviar IDs pendentes
        const idsValidos = new Set(
          matriculas
            .filter((m) => m.turmaId === item.turmaId && m.status === "ativo")
            .map((m) => m.alunoId || m.id)
        );
        const presentesFiltrados = (item.presentes || []).filter((id: string) => idsValidos.has(id));
        const ausentesFiltrados = (item.ausentes || []).filter((id: string) => idsValidos.has(id));

        const res = await api.post("/chamadas", {
          turmaId: item.turmaId,
          data: item.data,
          presentes: presentesFiltrados,
          ausentes: ausentesFiltrados,
          observacoes: item.observacoes,
        });

        if (!res.error) {
          sucesso++;
        } else {
          novasPendentes.push(item);
        }
      }

      localStorage.setItem("selpe_offline_chamadas", JSON.stringify(novasPendentes));
      setChamadasOfflineCount(novasPendentes.length);
      if (sucesso > 0) {
        setMensagemChamada({
          texto: `${sucesso} aula(s) sincronizada(s) com sucesso no servidor!`,
          tipo: "sucesso",
        });
        if (turmaSelecionadaId) {
          const resCham = await api.get(`/chamadas?turmaId=${turmaSelecionadaId}`);
          if (resCham.data && Array.isArray(resCham.data)) {
            setHistoricoChamadas(resCham.data);
          }
        }
      } else if (novasPendentes.length > 0) {
        setMensagemChamada({
          texto: `Não foi possível sincronizar ${novasPendentes.length} aula(s). Verifique sua conexão.`,
          tipo: "erro",
        });
      }
    } finally {
      setSincronizandoOffline(false);
    }
  };

  const pararCamera = () => {
    cameraAtivaRef.current = false;
    if (streamCamera) {
      streamCamera.getTracks().forEach((track) => track.stop());
      setStreamCamera(null);
    }
    setCameraAtiva(false);
  };

  const scanVideoLoop = () => {
    if (!cameraAtivaRef.current) return;
    if (!videoRef.current || videoRef.current.readyState < 2) {
      requestAnimationFrame(scanVideoLoop);
      return;
    }

    const video = videoRef.current;
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code && code.data) {
          pararCamera();
          setSucessoLeituraQr("QR Code lido com sucesso pela câmera!");
          setInputValidacao(code.data);
          executarValidacao(code.data);
          return;
        }
      }
    }

    if (cameraAtivaRef.current) {
      requestAnimationFrame(scanVideoLoop);
    }
  };

  const iniciarCamera = async () => {
    setErroValidacao(null);
    setSucessoLeituraQr(null);
    pararCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setStreamCamera(stream);
      cameraAtivaRef.current = true;
      setCameraAtiva(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        requestAnimationFrame(scanVideoLoop);
      }
    } catch (err: any) {
      cameraAtivaRef.current = false;
      setCameraAtiva(false);
      setErroValidacao("Não foi possível acessar a câmera. Verifique as permissões de vídeo do seu navegador.");
    }
  };

  const processarArquivoQr = (file: File) => {
    setErroValidacao(null);
    setSucessoLeituraQr(null);
    if (!file.type.startsWith("image/")) {
      setErroValidacao("Por favor, selecione um arquivo de imagem válido (PNG, JPG, WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          setErroValidacao("Não foi possível processar a imagem do QR Code.");
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          setSucessoLeituraQr("QR Code detectado e decodificado da imagem com sucesso!");
          setInputValidacao(code.data);
          executarValidacao(code.data);
        } else {
          setErroValidacao("Nenhum QR Code foi detectado na imagem selecionada. Verifique se a foto está focada e nítida.");
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const executarValidacao = async (valorCustom?: string) => {
    const raw = (valorCustom !== undefined ? valorCustom : inputValidacao).trim();
    if (!raw) return;
    setValidando(true);
    setErroValidacao(null);
    setResultadoValidacao(null);

    try {
      let alunoId = "";
      let matricula = "";
      let hash = "";

      if (raw.startsWith("{") || raw.includes('"hash"')) {
        try {
          const parsed = JSON.parse(raw);
          alunoId = parsed.alunoId || "";
          matricula = parsed.matricula || "";
          hash = parsed.hash || parsed.qrValidationHash || "";
        } catch (e) {}
      }

      if (!hash) {
        hash = raw;
      }

      const res = await api.post("/matriculas/carteirinha/validar", {
        alunoId: alunoId || undefined,
        matricula: matricula || undefined,
        qrValidationHash: hash,
      });

      if (res.error) {
        setErroValidacao(res.error);
      } else if (res.data) {
        setResultadoValidacao(res.data);
      }
    } catch (err: any) {
      setErroValidacao("Falha ao comunicar com o validador de carteirinhas.");
    } finally {
      setValidando(false);
    }
  };

  const validarCarteirinhaAction = () => {
    executarValidacao();
  };

  const testarComAluno = async (m: any) => {
    const aId = m.alunoId || m.id || m.uid;
    if (!aId) return;
    setValidando(true);
    setErroValidacao(null);
    setResultadoValidacao(null);
    setSucessoLeituraQr(`Carregando credenciais de teste para ${m.aluno?.nome || "Aluno"}...`);
    try {
      const res = await api.get(`/matriculas/carteirinha/${aId}`);
      if (res.data?.qrValidationHash) {
        const payload = JSON.stringify({
          alunoId: aId,
          matricula: res.data.numeroMatricula || m.aluno?.numeroMatricula || "",
          hash: res.data.qrValidationHash,
        });
        setInputValidacao(payload);
        setSucessoLeituraQr(`QR Code oficial de ${res.data.nome} carregado!`);
        await executarValidacao(payload);
      } else {
        setErroValidacao("Não foi possível carregar os dados de validação desta carteirinha.");
      }
    } catch (e) {
      setErroValidacao("Erro ao consultar carteirinha do aluno para teste.");
    } finally {
      setValidando(false);
    }
  };

  // Encerra câmera ao mudar de aba
  useEffect(() => {
    if (paginaAtiva !== "validar") {
      pararCamera();
    }
  }, [paginaAtiva]);

  // Listener global de Colar (Ctrl + V) para imagens de QR Code
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (paginaAtiva !== "validar") return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            processarArquivoQr(file);
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [paginaAtiva]);

  const baixarPdfRelatorio = async () => {
    if (!turmaSelecionadaId) return;
    setBaixandoPdf(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
      const token = getToken();
      const query = new URLSearchParams({
        turmaId: turmaSelecionadaId,
        periodoPreset,
        ...(observacoesRelatorio ? { observacoes: observacoesRelatorio } : {}),
      });
      const res = await fetch(`${API_URL}/relatorios/frequencia/pdf?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Falha ao gerar relatório.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-frequencia-${turmaSelecionadaId}-${periodoPreset}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert("Erro ao baixar PDF do relatório de frequência.");
    } finally {
      setBaixandoPdf(false);
    }
  };

  // Verificar se o professor leciona em uma modalidade específica
  const isMinhaModalidade = (modId: string, modNome: string) => {
    return turmas.some(
      (t) =>
        t.modalidadeId === modId ||
        (t.modalidadeNome && t.modalidadeNome.toLowerCase() === modNome.toLowerCase()) ||
        t.monitorId === perfil?.uid
    );
  };

  const modalidadesFiltradas = modalidades.filter((mod) => {
    if (filtroModalidades === "minhas") {
      return isMinhaModalidade(mod.id, mod.nome);
    }
    return true;
  });

  const turmaAtual = turmas.find((t) => t.id === turmaSelecionadaId) || turmas[0];

  return (
    <div className="tela-sistema visivel">
      <header className="barra-superior">
        <div className="marca">
          <div className="logo-pequena">S</div>
          <div>
            <h2>SELPE</h2>
            <small>Área do Professor</small>
          </div>
        </div>

        <div className="usuario-barra">
          <span>{getNomeUsuario()}</span>
          <div
            className="avatar"
            style={{
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {perfil?.fotoUrl ? (
              <img
                src={perfil.fotoUrl}
                alt={getNomeUsuario()}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              getAvatarInitials()
            )}
          </div>
        </div>
      </header>

      <div className="estrutura-sistema">
        <aside className="menu-lateral">
          <div className="menu-titulo">Menu</div>

          <button
            className={`menu-item ${paginaAtiva === "inicio" ? "ativo" : ""}`}
            onClick={() => setPaginaAtiva("inicio")}
          >
            🏠 Início
          </button>

          <button
            className={`menu-item ${paginaAtiva === "aulas" ? "ativo" : ""}`}
            onClick={() => setPaginaAtiva("aulas")}
          >
            📅 Quadro de Aulas
          </button>

          <button
            className={`menu-item ${paginaAtiva === "modalidades" ? "ativo" : ""}`}
            onClick={() => setPaginaAtiva("modalidades")}
          >
            ⚽ Modalidades
          </button>

          <button
            className={`menu-item ${paginaAtiva === "turmas" ? "ativo" : ""}`}
            onClick={() => setPaginaAtiva("turmas")}
          >
            📋 Minhas Turmas
          </button>

          <button
            className={`menu-item ${paginaAtiva === "alunos" ? "ativo" : ""}`}
            onClick={() => setPaginaAtiva("alunos")}
          >
            👥 Alunos
          </button>

          <button
            className={`menu-item ${paginaAtiva === "frequencia" ? "ativo" : ""}`}
            onClick={() => setPaginaAtiva("frequencia")}
          >
            📝 Chamada / Frequência
          </button>

          <button
            className={`menu-item ${paginaAtiva === "validar" ? "ativo" : ""}`}
            onClick={() => setPaginaAtiva("validar")}
          >
            🪪 Validar Carteirinha
          </button>

          <button
            className={`menu-item ${paginaAtiva === "perfil" ? "ativo" : ""}`}
            onClick={() => setPaginaAtiva("perfil")}
          >
            👤 Meu Perfil
          </button>

          <button className="menu-item menu-sair" onClick={sair}>
            🚪 Sair
          </button>
        </aside>

        <main className="conteudo-sistema">
          <BrasiliaClock userName={getNomeUsuario()} userRole="Monitor / Professor" />

          {chamadasOfflineCount > 0 && (
            <div
              style={{
                marginBottom: "20px",
                padding: "14px 18px",
                borderRadius: "10px",
                backgroundColor: "#fff7ed",
                border: "1px solid #fed7aa",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <WifiOff size={22} color="#c2410c" />
                <div>
                  <strong style={{ color: "#9a3412", fontSize: "14px" }}>
                    Você possui {chamadasOfflineCount} aula(s) com frequência salva localmente
                  </strong>
                  <p style={{ margin: 0, fontSize: "12px", color: "#c2410c" }}>
                    Registros salvos em modo offline no dispositivo. Sincronize com a nuvem assim que reconectar.
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  onClick={limparChamadasOffline}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#ffffff",
                    color: "#c2410c",
                    border: "1px solid #fed7aa",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <X size={14} /> Descartar Fila
                </button>
                <button
                  onClick={sincronizarChamadasOffline}
                  disabled={sincronizandoOffline}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#ea580c",
                    color: "#ffffff",
                    border: "none",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontWeight: "bold",
                    fontSize: "13px",
                    cursor: sincronizandoOffline ? "not-allowed" : "pointer",
                  }}
                >
                  <RefreshCw size={16} />
                  {sincronizandoOffline ? "Sincronizando..." : "Sincronizar Agora"}
                </button>
              </div>
            </div>
          )}
          {/* SEÇÃO INÍCIO */}
          {paginaAtiva === "inicio" && (
            <section id="inicio" className="pagina-sistema ativa">
              <div className="cabecalho-pagina">
                <h1>Olá, {getNomeUsuario()}!</h1>
                <p>Bem-vindo à sua área de professor do SELPE.</p>
              </div>

              <div className="cards">
                <div className="card">
                  <h3>AULAS</h3>
                  <div className="numero">{turmas.length}</div>
                  <div className="descricao">Turmas cadastradas</div>
                </div>

                <div className="card">
                  <h3>ALUNOS</h3>
                  <div className="numero">{matriculas.length}</div>
                  <div className="descricao">Atletas matriculados</div>
                </div>

                <div className="card">
                  <h3>MODALIDADES</h3>
                  <div className="numero">{modalidades.length}</div>
                  <div className="descricao">Oferecidas no SELPE</div>
                </div>

                <div className="card">
                  <h3>SITUAÇÃO</h3>
                  <div className="numero" style={{ fontSize: "20px", color: "var(--verde)" }}>
                    Ativo
                  </div>
                  <div className="descricao">Professor autorizado</div>
                </div>
              </div>

              <div className="painel">
                <div className="painel-titulo">
                  <h2>Sua Próxima Aula</h2>
                  <span className="tag tag-verde">ATIVA</span>
                </div>

                {turmaAtual ? (
                  <div className="aula-destaque">
                    <h3>{turmaAtual.modalidadeNome || turmaAtual.nomeTurma || "Futebol"}</h3>
                    <p>
                      <strong>Turma:</strong> {turmaAtual.nomeTurma || "Turma A"}
                    </p>
                    <p>
                      <strong>Dia:</strong>{" "}
                      {Array.isArray(turmaAtual.diasSemana)
                        ? turmaAtual.diasSemana.join(", ")
                        : turmaAtual.diasSemana || "Segunda-feira"}
                    </p>
                    <p>
                      <strong>Horário:</strong> {turmaAtual.horarioInicio || "08:00"} às{" "}
                      {turmaAtual.horarioFim || "09:00"}
                    </p>
                    <p>
                      <strong>Local:</strong> {turmaAtual.unidadeNome || "Unidade Esportiva Central"}
                    </p>

                    <div className="aula-info">
                      <span className="tag">{turmaAtual.modalidadeNome || "Esporte"}</span>
                      <span className="tag tag-amarela">{turmaAtual.capacidadeMax || 30} vagas</span>
                    </div>
                  </div>
                ) : (
                  <p>Nenhuma turma cadastrada no momento.</p>
                )}
              </div>
            </section>
          )}

          {/* SEÇÃO QUADRO DE AULAS */}
          {paginaAtiva === "aulas" && (
            <section id="aulas" className="pagina-sistema ativa">
              <div className="cabecalho-pagina">
                <h1>Quadro de Aulas</h1>
                <p>Confira as turmas e horários que você ministrará no SELPE.</p>
              </div>

              <div className="painel">
                <div className="painel-titulo">
                  <h2>Horários das Minhas Turmas</h2>
                </div>

                {turmas.length === 0 ? (
                  <div className="vazio">Nenhuma aula cadastrada.</div>
                ) : (
                  <div className="quadro-aulas">
                    {turmas.map((t) => (
                      <div key={t.id} className="aula-card">
                        <div>
                          <div className="dia-aula">
                            {Array.isArray(t.diasSemana) ? t.diasSemana.join(", ").toUpperCase() : "SEGUNDA-FEIRA"}
                          </div>
                          <div className="horario-aula">
                            {t.horarioInicio || "08:00"} - {t.horarioFim || "09:00"}
                          </div>
                        </div>

                        <div>
                          <h3>{t.nomeTurma || t.modalidadeNome}</h3>
                          <p>{t.unidadeNome || "Polo Esportivo Municipal"}</p>
                          <p>Peruíbe/SP</p>
                        </div>

                        <div>
                          <span className="tag tag-verde">ATIVA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* SEÇÃO MODALIDADES (LISTAGEM DINÂMICA COMPLETA DE TODAS AS 13 MODALIDADES) */}
          {paginaAtiva === "modalidades" && (
            <section id="modalidades" className="pagina-sistema ativa">
              <div className="cabecalho-pagina">
                <h1>Modalidades Esportivas ({modalidades.length})</h1>
                <p>Todas as modalidades esportivas oferecidas no município de Peruíbe.</p>
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                <button
                  className={`btn ${filtroModalidades === "todas" ? "btn-azul" : ""}`}
                  onClick={() => setFiltroModalidades("todas")}
                  style={{
                    backgroundColor: filtroModalidades === "todas" ? "var(--azul)" : "#fff",
                    color: filtroModalidades === "todas" ? "#fff" : "#475467",
                    border: "1px solid var(--borda)",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  Todas as Modalidades ({modalidades.length})
                </button>

                <button
                  className={`btn ${filtroModalidades === "minhas" ? "btn-azul" : ""}`}
                  onClick={() => setFiltroModalidades("minhas")}
                  style={{
                    backgroundColor: filtroModalidades === "minhas" ? "var(--azul)" : "#fff",
                    color: filtroModalidades === "minhas" ? "#fff" : "#475467",
                    border: "1px solid var(--borda)",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontWeight: "bold",
                    cursor: "pointer",
                  }}
                >
                  ⭐ Minhas Modalidades
                </button>
              </div>

              <div className="painel">
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "18px",
                  }}
                >
                  {modalidadesFiltradas.map((mod) => {
                    const eMinha = isMinhaModalidade(mod.id, mod.nome);
                    return (
                      <div
                        key={mod.id}
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "14px",
                          padding: "20px",
                          border: eMinha ? "2px solid var(--azul)" : "1px solid var(--borda)",
                          boxShadow: eMinha
                            ? "0 6px 18px rgba(23, 105, 224, 0.12)"
                            : "0 4px 12px rgba(16, 24, 40, 0.04)",
                          position: "relative",
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <div
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "12px",
                              backgroundColor: mod.corBadge || "#eaf2ff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "22px",
                            }}
                          >
                            {mod.icone || "⚽"}
                          </div>

                          {eMinha && (
                            <span
                              style={{
                                backgroundColor: "var(--azul-claro)",
                                color: "var(--azul)",
                                fontSize: "11px",
                                fontWeight: "bold",
                                padding: "4px 10px",
                                borderRadius: "999px",
                                border: "1px solid #cfe1fa",
                              }}
                            >
                              ⭐ Sua Turma
                            </span>
                          )}
                        </div>

                        <div>
                          <strong style={{ fontSize: "16px", color: "var(--texto)", display: "block" }}>
                            {mod.nome}
                          </strong>
                          <span style={{ fontSize: "13px", color: "var(--texto-secundario)", display: "block", marginTop: "4px" }}>
                            {mod.descricao || "Atividade esportiva oficial do município."}
                          </span>
                        </div>

                        <div
                          style={{
                            borderTop: "1px dashed var(--borda)",
                            paddingTop: "10px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            fontSize: "12px",
                            color: "#526071",
                          }}
                        >
                          <div>
                            <strong>Faixa Etária:</strong> {mod.faixaEtariaMinima || 6} a {mod.faixaEtariaMaxima || 17} anos
                          </div>
                          <div>
                            <strong>Local:</strong> Unidade Esportiva Central
                          </div>
                          <div>
                            <strong>Status:</strong> <span style={{ color: "var(--verde)", fontWeight: "bold" }}>Ativa</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* SEÇÃO MINHAS TURMAS */}
          {paginaAtiva === "turmas" && (
            <section id="turmas" className="pagina-sistema ativa">
              <div className="cabecalho-pagina">
                <h1>Minhas Turmas</h1>
                <p>Turmas e modalidades sob sua responsabilidade.</p>
              </div>

              <div className="painel">
                <div className="tabela-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Modalidade</th>
                        <th>Turma</th>
                        <th>Dia</th>
                        <th>Horário</th>
                        <th>Alunos Inscritos</th>
                        <th>Unidade</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {turmas.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", padding: "20px" }}>
                            Nenhuma turma cadastrada.
                          </td>
                        </tr>
                      ) : (
                        turmas.map((t) => {
                          const totalAlunos = matriculas.filter((m) => m.turmaId === t.id).length;
                          return (
                            <tr key={t.id}>
                              <td style={{ fontWeight: "bold" }}>{t.modalidadeNome || "Futebol"}</td>
                              <td>{t.nomeTurma || "Turma A"}</td>
                              <td>
                                {Array.isArray(t.diasSemana) ? t.diasSemana.join(", ") : t.diasSemana || "Segunda"}
                              </td>
                              <td>
                                {t.horarioInicio || "08:00"} - {t.horarioFim || "09:00"}
                              </td>
                              <td>
                                <strong style={{ color: "var(--azul)" }}>{totalAlunos}</strong> / {t.capacidadeMax || 30}
                              </td>
                              <td>{t.unidadeNome || "Unidade Esportiva Central"}</td>
                              <td>
                                <span className="tag tag-verde">ATIVA</span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* SEÇÃO ALUNOS */}
          {paginaAtiva === "alunos" && (
            <section id="alunos" className="pagina-sistema ativa">
              <div className="cabecalho-pagina">
                <h1>Alunos Matriculados ({matriculas.length})</h1>
                <p>Lista de alunos inscritos em suas turmas.</p>
              </div>

              <div className="painel">
                <div className="tabela-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Matrícula</th>
                        <th>Nome do Aluno</th>
                        <th>CPF</th>
                        <th>Turma</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matriculas.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: "center", padding: "20px" }}>
                            Nenhum aluno matriculado até o momento.
                          </td>
                        </tr>
                      ) : (
                        matriculas.map((m) => (
                          <tr key={m.id}>
                            <td>{m.aluno?.numeroMatricula || m.numeroMatricula || "2026-000001"}</td>
                            <td style={{ fontWeight: "bold" }}>{m.aluno?.nome || m.alunoNome || "Aluno"}</td>
                            <td>{m.aluno?.cpf || "000.000.000-00"}</td>
                            <td>{m.turmaNome || m.turmaId || "Geral - Turma A"}</td>
                            <td>
                              <span className="tag tag-verde">ATIVO</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          )}

          {/* SEÇÃO FREQUÊNCIA / REGISTRO DE CHAMADA E HISTÓRICO */}
          {paginaAtiva === "frequencia" && (
            <section id="frequencia" className="pagina-sistema ativa">
              <div className="cabecalho-pagina">
                <h1>Controle de Frequência e Lista de Chamada</h1>
                <p>Selecione a data e a turma para registrar ou alterar a presença dos atletas.</p>
              </div>

              {/* PAINEL DE FILTROS DA CHAMADA */}
              <div className="painel" style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#667085", marginBottom: "6px" }}>
                      TURMA DA AULA:
                    </label>
                    <select
                      value={turmaSelecionadaId}
                      onChange={(e) => setTurmaSelecionadaId(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--borda)",
                        fontSize: "14px",
                        backgroundColor: "#fff",
                      }}
                    >
                      {turmas.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nomeTurma || t.modalidadeNome || "Turma A"} ({t.diasSemana || "Segunda"} - {t.horarioInicio || "08:00"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#667085", marginBottom: "6px" }}>
                      DATA DA AULA:
                    </label>
                    <input
                      type="date"
                      value={dataChamada}
                      max={new Date().toISOString().split("T")[0]}
                      onChange={(e) => setDataChamada(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--borda)",
                        fontSize: "14px",
                        backgroundColor: "#fff",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#667085", marginBottom: "6px" }}>
                      OBSERVAÇÕES DA AULA:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Treino tático / Chuva forte"
                      value={observacoesChamada}
                      onChange={(e) => setObservacoesChamada(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--borda)",
                        fontSize: "14px",
                        backgroundColor: "#fff",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* LISTA DE ALUNOS E AÇÕES DE CHAMADA */}
              <div className="painel">
                <div className="painel-titulo" style={{ flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <h2>Lista de Chamada dos Atletas</h2>
                    <span style={{ fontSize: "13px", color: "#667085" }}>
                      Data: <strong>{new Date(dataChamada + "T00:00:00").toLocaleDateString("pt-BR")}</strong> | Total: {alunosDaTurmaSelecionada.length} atleta(s) apto(s)
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      onClick={() => setModalInserirAberto(true)}
                      style={{
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <UserPlus size={16} /> Inserir Aluno
                    </button>

                    <button
                      onClick={marcarTodosPresentes}
                      style={{
                        backgroundColor: "var(--verde-claro)",
                        color: "var(--verde)",
                        border: "1px solid #c9ead6",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      ✓ Marcar Todos Presentes
                    </button>

                    <button
                      onClick={marcarTodosAusentes}
                      style={{
                        backgroundColor: "var(--vermelho-claro)",
                        color: "var(--vermelho)",
                        border: "1px solid #f8c9cb",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      ✗ Marcar Todos Ausentes
                    </button>
                  </div>
                </div>

                {alunosPendentesDaTurma.length > 0 && (
                  <div
                    style={{
                      margin: "14px 0 16px 0",
                      padding: "10px 14px",
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fef08a",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "#854d0e",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0 }} />
                    <div>
                      <strong>{alunosPendentesDaTurma.length} atleta(s) aguardando confirmação do responsável legal:</strong>{" "}
                      {alunosPendentesDaTurma.map((p) => p.aluno?.nome || "Atleta").join(", ")}. Por determinação legal, atletas com matrícula pendente não constam na lista de presença oficial até a confirmação expressa do responsável.
                    </div>
                  </div>
                )}

                {alunosDaTurmaSelecionada.length === 0 ? (
                  <div className="vazio">Nenhum aluno cadastrado para esta turma.</div>
                ) : (
                  <div className="tabela-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Atleta / Aluno</th>
                          <th>Presença</th>
                          <th>Carteirinha</th>
                          <th>Ação (Alternar Presença)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alunosDaTurmaSelecionada.map((m) => {
                          const aId = m.alunoId || m.id;
                          const isPresente = presencas[aId] !== false;
                          return (
                            <tr key={aId}>
                              <td style={{ fontWeight: "bold", fontSize: "14px" }}>
                                {m.aluno?.nome || m.alunoNome || "Aluno"}
                                <div style={{ fontSize: "11px", color: "#64748b" }}>
                                  Matrícula: {m.aluno?.numeroMatricula || m.aluno?.cpf || "Matriculado"}
                                </div>
                              </td>
                              <td>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span className={`indicador-presenca ${isPresente ? "verde" : "vermelho"}`} />
                                  <span style={{ fontWeight: "700", fontSize: "13px", color: isPresente ? "#16a34a" : "#dc2626" }}>
                                    {isPresente ? "PRESENTE" : "AUSENTE"}
                                  </span>
                                </div>
                              </td>
                              <td>
                                <button
                                  onClick={() => abrirCarteirinhaModal(m)}
                                  className="wireframe-action-btn"
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    color: "#1d4ed8",
                                    fontWeight: "800",
                                    fontSize: "13px",
                                  }}
                                >
                                  <QrCode size={16} /> VER CARTEIRINHA
                                </button>
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button
                                    onClick={() => togglePresencaAluno(aId, true)}
                                    style={{
                                      backgroundColor: isPresente ? "var(--verde)" : "#f1f5f9",
                                      color: isPresente ? "#ffffff" : "#64748b",
                                      border: "none",
                                      padding: "6px 14px",
                                      borderRadius: "6px",
                                      fontWeight: "bold",
                                      cursor: "pointer",
                                    }}
                                  >
                                    ✓ Presente
                                  </button>

                                  <button
                                    onClick={() => togglePresencaAluno(aId, false)}
                                    style={{
                                      backgroundColor: !isPresente ? "var(--vermelho)" : "#f1f5f9",
                                      color: !isPresente ? "#ffffff" : "#64748b",
                                      border: "none",
                                      padding: "6px 14px",
                                      borderRadius: "6px",
                                      fontWeight: "bold",
                                      cursor: "pointer",
                                    }}
                                  >
                                    Remover Presença (Ausente)
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div style={{ marginTop: "24px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <button
                    onClick={salvarChamada}
                    disabled={salvandoChamada || alunosDaTurmaSelecionada.length === 0}
                    style={{
                      backgroundColor: "var(--azul)",
                      color: "#ffffff",
                      padding: "14px 32px",
                      borderRadius: "10px",
                      fontWeight: "bold",
                      fontSize: "15px",
                      border: "none",
                      cursor: salvandoChamada ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 14px rgba(23, 105, 224, 0.25)",
                    }}
                  >
                    {salvandoChamada ? "SALVANDO..." : "💾 SALVAR LISTA DE CHAMADA"}
                  </button>

                  {mensagemChamada.texto && (
                    <span
                      style={{
                        color: mensagemChamada.tipo === "erro" ? "var(--vermelho)" : "var(--verde)",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      {mensagemChamada.texto}
                    </span>
                  )}
                </div>
              </div>

              {/* HISTÓRICO DE CHAMADAS DA TURMA */}
              {historicoChamadas.length > 0 && (
                <div className="painel">
                  <div className="painel-titulo">
                    <h2>Histórico de Chamadas Registradas nesta Turma</h2>
                  </div>

                  <div className="tabela-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Data da Aula</th>
                          <th>Presentes</th>
                          <th>Ausentes</th>
                          <th>Observação</th>
                          <th>Fechada em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historicoChamadas.map((c) => (
                          <tr key={c.id}>
                            <td style={{ fontWeight: "bold" }}>
                              {new Date(c.data + "T00:00:00").toLocaleDateString("pt-BR")}
                            </td>
                            <td>
                              <span className="tag tag-verde">{c.presentes?.length || 0} Presentes</span>
                            </td>
                            <td>
                              <span className="tag" style={{ backgroundColor: "var(--vermelho-claro)", color: "var(--vermelho)", borderColor: "#f8c9cb" }}>
                                {c.ausentes?.length || 0} Ausentes
                              </span>
                            </td>
                            <td>{c.observacoes || "Nenhuma"}</td>
                            <td>{c.fechadaEm ? new Date(c.fechadaEm).toLocaleString("pt-BR") : "Sim"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* EXPORTAÇÃO OFICIAL DE RELATÓRIO EM PDF */}
              <div className="painel" style={{ marginTop: "24px" }}>
                <div className="painel-titulo">
                  <div>
                    <h2>📄 Exportar Relatório Oficial de Frequência (PDF)</h2>
                    <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                      Gere e baixe o relatório consolidado de chamada com observações pedagógicas para a Secretaria e Associação.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "16px",
                    alignItems: "end",
                    marginTop: "12px",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#667085", marginBottom: "6px" }}>
                      PERÍODO DO RELATÓRIO:
                    </label>
                    <select
                      value={periodoPreset}
                      onChange={(e) => setPeriodoPreset(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--borda)",
                        fontSize: "14px",
                        backgroundColor: "#fff",
                      }}
                    >
                      <option value="diario">Diário (Hoje)</option>
                      <option value="semanal">Semanal (Últimos 7 dias)</option>
                      <option value="mensal">Mensal (Mês atual)</option>
                      <option value="trimestral">Trimestral (Últimos 3 meses)</option>
                      <option value="semestral">Semestral (Semestre corrente)</option>
                      <option value="anual">Anual (Ano corrente)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", color: "#667085", marginBottom: "6px" }}>
                      OBSERVAÇÕES PEDAGÓGICAS (OPCIONAL):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Atletas com bom rendimento técnico e disciplina."
                      value={observacoesRelatorio}
                      onChange={(e) => setObservacoesRelatorio(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--borda)",
                        fontSize: "14px",
                        backgroundColor: "#fff",
                      }}
                    />
                  </div>

                  <div>
                    <button
                      onClick={baixarPdfRelatorio}
                      disabled={baixandoPdf || !turmaSelecionadaId}
                      style={{
                        width: "100%",
                        backgroundColor: "#0f766e",
                        color: "#ffffff",
                        padding: "12px 20px",
                        borderRadius: "8px",
                        fontWeight: "bold",
                        fontSize: "14px",
                        border: "none",
                        cursor: baixandoPdf || !turmaSelecionadaId ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <Download size={18} />
                      {baixandoPdf ? "Gerando PDF..." : "Baixar Relatório em PDF"}
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SEÇÃO VALIDAR CARTEIRINHA DIGITAL */}
          {paginaAtiva === "validar" && (
            <section id="validar" className="pagina-sistema ativa">
              <div className="cabecalho-pagina">
                <h1>Validador Oficial de Carteirinhas</h1>
                <p>
                  Escaneie o QR Code com a câmera do dispositivo, envie um print/foto da carteirinha ou digite o código de validação.
                </p>
              </div>

              <div className="painel" style={{ maxWidth: "760px", margin: "0 auto 24px auto" }}>
                {/* Abas de Modo de Validação */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    background: "#f1f5f9",
                    padding: "6px",
                    borderRadius: "10px",
                    marginBottom: "20px",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setModoValidacao("camera");
                      setErroValidacao(null);
                      setSucessoLeituraQr(null);
                      if (!cameraAtiva) iniciarCamera();
                    }}
                    style={{
                      flex: 1,
                      minWidth: "150px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: modoValidacao === "camera" ? "#2563eb" : "transparent",
                      color: modoValidacao === "camera" ? "#ffffff" : "#475569",
                      fontWeight: "700",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Camera size={16} /> Câmera / Escanear
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      pararCamera();
                      setModoValidacao("arquivo");
                      setErroValidacao(null);
                      setSucessoLeituraQr(null);
                    }}
                    style={{
                      flex: 1,
                      minWidth: "150px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: modoValidacao === "arquivo" ? "#2563eb" : "transparent",
                      color: modoValidacao === "arquivo" ? "#ffffff" : "#475569",
                      fontWeight: "700",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Upload size={16} /> Imagem / Print do QR Code
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      pararCamera();
                      setModoValidacao("manual");
                      setErroValidacao(null);
                      setSucessoLeituraQr(null);
                    }}
                    style={{
                      flex: 1,
                      minWidth: "150px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "none",
                      background: modoValidacao === "manual" ? "#2563eb" : "transparent",
                      color: modoValidacao === "manual" ? "#ffffff" : "#475569",
                      fontWeight: "700",
                      fontSize: "13px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <Search size={16} /> Digitar / Colar Código
                  </button>
                </div>

                {/* MODO 1: CÂMERA AO VIVO */}
                {modoValidacao === "camera" && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      background: "#0f172a",
                      color: "#ffffff",
                      borderRadius: "14px",
                      marginBottom: "20px",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
                    }}
                  >
                    {cameraAtiva ? (
                      <div style={{ position: "relative", maxWidth: "420px", margin: "0 auto" }}>
                        <div
                          style={{
                            width: "100%",
                            height: "320px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            background: "#000000",
                            position: "relative",
                            border: "2px solid #38bdf8",
                          }}
                        >
                          <video
                            ref={videoRef}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                          {/* Mirador do Scanner */}
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: "200px",
                              height: "200px",
                              border: "2px dashed #facc15",
                              borderRadius: "12px",
                              boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
                              pointerEvents: "none",
                            }}
                          />
                        </div>

                        <p style={{ marginTop: "12px", fontSize: "13px", color: "#94a3b8" }}>
                          Posicione o QR Code da carteirinha dentro do quadro amarelo
                        </p>

                        <button
                          type="button"
                          onClick={pararCamera}
                          style={{
                            marginTop: "10px",
                            padding: "8px 18px",
                            background: "#ef4444",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            fontWeight: "600",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          Desativar Câmera
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding: "30px 10px" }}>
                        <div
                          style={{
                            width: "68px",
                            height: "68px",
                            borderRadius: "50%",
                            background: "rgba(56, 189, 248, 0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 16px auto",
                          }}
                        >
                          <Camera size={34} color="#38bdf8" />
                        </div>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Leitor de QR Code por Câmera</h3>
                        <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#94a3b8", maxWidth: "420px", marginLeft: "auto", marginRight: "auto" }}>
                          Utilize a câmera do notebook ou smartphone para escanear a Carteirinha Digital física ou na tela do atleta.
                        </p>
                        <button
                          type="button"
                          onClick={iniciarCamera}
                          style={{
                            background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "10px",
                            padding: "12px 28px",
                            fontSize: "14px",
                            fontWeight: "700",
                            cursor: "pointer",
                            boxShadow: "0 4px 14px rgba(37,99,235,0.4)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <Camera size={18} /> Ativar Câmera para Escanear
                        </button>
                      </div>
                    )}
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                  </div>
                )}

                {/* MODO 2: CARREGAR IMAGEM / PRINT DO QR CODE */}
                {modoValidacao === "arquivo" && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setArrastandoArquivo(true);
                    }}
                    onDragLeave={() => setArrastandoArquivo(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setArrastandoArquivo(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processarArquivoQr(file);
                    }}
                    style={{
                      border: arrastandoArquivo ? "2px dashed #2563eb" : "2px dashed #cbd5e1",
                      backgroundColor: arrastandoArquivo ? "#eff6ff" : "#f8fafc",
                      borderRadius: "14px",
                      padding: "36px 20px",
                      textAlign: "center",
                      marginBottom: "20px",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onClick={() => qrFileInputRef.current?.click()}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        background: "#e0f2fe",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "0 auto 14px auto",
                      }}
                    >
                      <Upload size={28} color="#0284c7" />
                    </div>
                    <h3 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#0f172a" }}>
                      Clique ou Arraste a Foto/Print do QR Code aqui
                    </h3>
                    <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
                      Suporta PNG, JPG, WebP ou cole diretamente com <strong>Ctrl + V</strong>
                    </p>
                    <button
                      type="button"
                      style={{
                        background: "#0284c7",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        padding: "9px 20px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        qrFileInputRef.current?.click();
                      }}
                    >
                      Selecionar Arquivo de Imagem
                    </button>
                    <input
                      ref={qrFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processarArquivoQr(file);
                      }}
                      style={{ display: "none" }}
                    />
                  </div>
                )}

                {/* MODO 3: ENTRADA MANUAL OU EXIBIÇÃO DO CÓDIGO DECODIFICADO */}
                <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                  <input
                    type="text"
                    placeholder="Cole os dados do QR Code, hash ou selecione uma imagem..."
                    value={inputValidacao}
                    onChange={(e) => setInputValidacao(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && executarValidacao()}
                    style={{
                      flex: 1,
                      padding: "12px 14px",
                      borderRadius: "8px",
                      border: "1px solid var(--borda)",
                      fontSize: "13px",
                      fontFamily: "monospace",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => executarValidacao()}
                    disabled={validando || !inputValidacao.trim()}
                    style={{
                      backgroundColor: "var(--azul)",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "0 22px",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: validando || !inputValidacao.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    <Search size={18} />
                    {validando ? "Validando..." : "Validar"}
                  </button>
                </div>

                {/* ATALHO: TESTAR COM UM ATLETA CADASTRADO */}
                {matriculas.length > 0 && (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "12px 16px",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <QrCode size={18} color="#0284c7" />
                      <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                        Testar Validação com Aluno Cadastrado:
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {matriculas.slice(0, 3).map((m: any) => (
                        <button
                          key={m.id || m.alunoId}
                          type="button"
                          onClick={() => testarComAluno(m)}
                          disabled={validando}
                          style={{
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            fontWeight: "500",
                            color: "#0f172a",
                            cursor: "pointer",
                          }}
                        >
                          {m.aluno?.nome || m.alunoNome || "Atleta"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* FEEDBACK DE SUCESSO NA LEITURA DO QR CODE */}
                {sucessoLeituraQr && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      backgroundColor: "#ecfdf5",
                      border: "1px solid #10b981",
                      color: "#047857",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "13px",
                      marginBottom: "14px",
                    }}
                  >
                    <CheckCircle2 size={16} />
                    <span>{sucessoLeituraQr}</span>
                  </div>
                )}

                {/* FEEDBACK DE ERRO */}
                {erroValidacao && (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "8px",
                      backgroundColor: "var(--vermelho-claro)",
                      border: "1px solid #f8c9cb",
                      color: "var(--vermelho)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontSize: "14px",
                      marginBottom: "16px",
                    }}
                  >
                    <XCircle size={18} />
                    <span>{erroValidacao}</span>
                  </div>
                )}

                {/* RESULTADO OFICIAL DA VALIDAÇÃO */}
                {resultadoValidacao && (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "20px",
                      borderRadius: "12px",
                      backgroundColor: resultadoValidacao.valido ? "#f0fdf4" : "#fef2f2",
                      border: `2px solid ${resultadoValidacao.valido ? "#86efac" : "#fca5a5"}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                      {resultadoValidacao.valido ? (
                        <CheckCircle2 size={28} color="#16a34a" />
                      ) : (
                        <XCircle size={28} color="#dc2626" />
                      )}
                      <div>
                        <h3 style={{ margin: 0, fontSize: "17px", color: resultadoValidacao.valido ? "#15803d" : "#b91c1c" }}>
                          {resultadoValidacao.valido ? "CARTEIRINHA VÁLIDA E AUTORIZADA" : "CARTEIRINHA INVÁLIDA OU SUSPENSA"}
                        </h3>
                        <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                          {resultadoValidacao.mensagem || "Autenticidade criptográfica e cadastro verificados com o SELPE Oficial."}
                        </p>
                      </div>
                    </div>

                    {(resultadoValidacao.aluno || resultadoValidacao.dados) && (() => {
                      const al = resultadoValidacao.aluno || resultadoValidacao.dados;
                      return (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "18px",
                            backgroundColor: "#ffffff",
                            padding: "16px",
                            borderRadius: "10px",
                            border: "1px solid #e2e8f0",
                            marginTop: "12px",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              width: "68px",
                              height: "68px",
                              borderRadius: "50%",
                              background: "#0284c7",
                              border: "2px solid #38bdf8",
                              overflow: "hidden",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            {al.fotoUrl ? (
                              <img
                                src={al.fotoUrl}
                                alt={al.nome}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                            ) : (
                              <span style={{ fontSize: "24px", fontWeight: "bold", color: "#ffffff" }}>
                                {al.nome?.slice(0, 2).toUpperCase() || "AT"}
                              </span>
                            )}
                          </div>

                          <div style={{ flex: 1, minWidth: "220px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <h4 style={{ margin: 0, fontSize: "16px", color: "#0f172a" }}>{al.nome}</h4>
                              <span className="tag tag-verde" style={{ fontSize: "10px", padding: "2px 6px" }}>
                                ATLETA ATIVO
                              </span>
                            </div>
                            <div style={{ fontSize: "13px", color: "#475569", marginTop: "4px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
                              <span><strong>Matrícula:</strong> {al.numeroMatricula || al.matricula || "N/A"}</span>
                              <span><strong>CPF:</strong> {al.cpf || "N/A"}</span>
                              <span><strong>Polo:</strong> {al.associacaoId || "SELPE Peruíbe"}</span>
                            </div>
                            <div style={{ marginTop: "6px", fontSize: "11px", color: "#16a34a", fontWeight: "600" }}>
                              ✓ Validado oficialmente em {new Date(resultadoValidacao.validadoEm || Date.now()).toLocaleString("pt-BR")}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* SEÇÃO MEU PERFIL */}
          {paginaAtiva === "perfil" && (
            <section id="perfil" className="pagina-sistema ativa">
              <div className="cabecalho-pagina">
                <h1>Meu Perfil</h1>
                <p>Informações do professor cadastradas no SELPE.</p>
              </div>

              {/* Card de Foto de Perfil Oficial */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "24px",
                  padding: "20px",
                  background: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  marginBottom: "24px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: "96px",
                      height: "96px",
                      borderRadius: "50%",
                      background: "#1e3a8a",
                      border: "3px solid #3b82f6",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  >
                    {perfil?.fotoUrl ? (
                      <img
                        src={perfil.fotoUrl}
                        alt={getNomeUsuario()}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <span style={{ fontSize: "32px", fontWeight: "bold", color: "#ffffff" }}>
                        {getAvatarInitials()}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFoto}
                    title="Alterar foto de perfil"
                    style={{
                      position: "absolute",
                      bottom: "0",
                      right: "0",
                      background: "#2563eb",
                      color: "#ffffff",
                      border: "2px solid #ffffff",
                      borderRadius: "50%",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                    }}
                  >
                    <Camera size={16} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleUploadFotoPerfil}
                    style={{ display: "none" }}
                  />
                </div>

                <div style={{ flex: 1, minWidth: "220px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
                      {getNomeUsuario()}
                    </h3>
                    <span className="tag tag-verde" style={{ fontSize: "11px", padding: "2px 8px" }}>
                      PROFESSOR ATIVO
                    </span>
                  </div>
                  <p style={{ margin: "4px 0 12px 0", fontSize: "13px", color: "#64748b" }}>
                    Código: {perfil?.codigoProfessor || "PROF001"} {perfil?.cpf ? `• CPF: ${perfil.cpf}` : ""}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFoto}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        fontSize: "13px",
                        fontWeight: "600",
                        background: uploadingFoto ? "#94a3b8" : "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "6px",
                        cursor: uploadingFoto ? "not-allowed" : "pointer",
                      }}
                    >
                      <Camera size={14} />
                      {uploadingFoto ? "Salvando foto..." : "Alterar Foto de Perfil"}
                    </button>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                      Formatos: JPG, PNG, WebP (até 5MB)
                    </span>
                  </div>
                </div>
              </div>

              {mensagemFoto.texto && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "8px",
                    fontSize: "13px",
                    marginBottom: "16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: mensagemFoto.tipo === "sucesso" ? "#ecfdf5" : "#fef2f2",
                    color: mensagemFoto.tipo === "sucesso" ? "#047857" : "#b91c1c",
                    border: `1px solid ${mensagemFoto.tipo === "sucesso" ? "#10b981" : "#ef4444"}`,
                  }}
                >
                  {mensagemFoto.tipo === "sucesso" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {mensagemFoto.texto}
                </div>
              )}

              <div className="painel">
                <div className="informacoes">
                  <div className="informacao">
                    <strong>NOME COMPLETO</strong>
                    {getNomeUsuario()}
                  </div>

                  <div className="informacao">
                    <strong>CPF</strong>
                    {perfil?.cpf || "111.111.111-11"}
                  </div>

                  <div className="informacao">
                    <strong>CÓDIGO DO PROFESSOR</strong>
                    {perfil?.codigoProfessor || "PROF001"}
                  </div>

                  <div className="informacao">
                    <strong>E-MAIL</strong>
                    {perfil?.email || "professor@teste.com"}
                  </div>

                  <div className="informacao">
                    <strong>ESPECIALIDADE / CARGO</strong>
                    {perfil?.especialidade || "Educação Física / Professor"}
                  </div>

                  <div className="informacao">
                    <strong>STATUS NO SISTEMA</strong>
                    <span className="tag tag-verde">ATIVO</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* MODAL OFICIAL: VER CARTEIRINHA DIGITAL DO ATLETA (Página 5) */}
          {modalCarteirinhaData && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(4px)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
            >
              <div
                style={{
                  position: "relative",
                  maxWidth: "520px",
                  width: "100%",
                  maxHeight: "90vh",
                  overflowY: "auto",
                }}
              >
                <button
                  onClick={() => setModalCarteirinhaData(null)}
                  style={{
                    position: "absolute",
                    top: "14px",
                    right: "14px",
                    zIndex: 10,
                    backgroundColor: "#ffffff",
                    border: "none",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <X size={20} color="#0f172a" />
                </button>
                <CarteirinhaDigital data={modalCarteirinhaData} />
              </div>
            </div>
          )}

          {/* MODAL OFICIAL: INSERIR ALUNO NA TURMA (Página 4) */}
          {modalInserirAberto && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(15, 23, 42, 0.75)",
                backdropFilter: "blur(4px)",
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  padding: "24px",
                  maxWidth: "440px",
                  width: "100%",
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "800" }}>
                    Inserir Atleta na Turma
                  </h3>
                  <button
                    onClick={() => setModalInserirAberto(false)}
                    style={{ background: "none", border: "none", cursor: "pointer" }}
                  >
                    <X size={20} color="#64748b" />
                  </button>
                </div>

                <p style={{ margin: "0 0 16px 0", fontSize: "13px", color: "#64748b" }}>
                  Insira o UID ou CPF do atleta cadastrado no SELPE para vinculá-lo imediatamente a esta turma.
                </p>

                {mensagemInserir && (
                  <div
                    style={{
                      padding: "10px",
                      borderRadius: "6px",
                      marginBottom: "12px",
                      fontSize: "13px",
                      fontWeight: "700",
                      backgroundColor: mensagemInserir.startsWith("Erro") ? "#fef2f2" : "#f0fdf4",
                      color: mensagemInserir.startsWith("Erro") ? "#b91c1c" : "#15803d",
                    }}
                  >
                    {mensagemInserir}
                  </div>
                )}

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "#334155", marginBottom: "6px" }}>
                    UID ou CPF DO ALUNO:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 000.000.000-00 ou ID do atleta"
                    value={novoAlunoIdOuCpf}
                    onChange={(e) => setNovoAlunoIdOuCpf(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "14px",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => setModalInserirAberto(false)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>

                  <button
                    onClick={handleInserirAlunoNaTurma}
                    disabled={inserindoAluno || !novoAlunoIdOuCpf.trim()}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#2563eb",
                      color: "#ffffff",
                      fontWeight: "700",
                      cursor: inserindoAluno || !novoAlunoIdOuCpf.trim() ? "not-allowed" : "pointer",
                    }}
                  >
                    {inserindoAluno ? "Inserindo..." : "Confirmar Inserção"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
