"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import "../styles/aluno.css";
import { Camera, CheckCircle2, AlertCircle } from "lucide-react";

import { api, clearAuth, getToken } from "../services/api";
import BrasiliaClock from "../components/BrasiliaClock";
import CarteirinhaDigital from "../components/CarteirinhaDigital";

interface ModalidadeItem {
  id: string;
  nome: string;
  descricao?: string;
  icone: string;
  corBadge: string;
  corIcone: string;
}

const LISTA_OFICIAL_MODALIDADES: ModalidadeItem[] = [
  { id: "mod-1", nome: "FUTSAL", descricao: "Futsal de quadra e competição", icone: "🏆", corBadge: "#eaf2ff", corIcone: "#1769e0" },
  { id: "mod-2", nome: "FUTEBOL", descricao: "Futebol de campo tradicional", icone: "⚽", corBadge: "#eaf2ff", corIcone: "#1769e0" },
  { id: "mod-3", nome: "SURF", descricao: "Aulas e treinos de surf no litoral", icone: "🌊", corBadge: "#e6f8ff", corIcone: "#00a8e8" },
  { id: "mod-4", nome: "BASQUETE", descricao: "Basquetebol masculino e feminino", icone: "📈", corBadge: "#fff7df", corIcone: "#e5a500" },
  { id: "mod-5", nome: "VÔLEI", descricao: "Voleibol de quadra e areia", icone: "⚡", corBadge: "#eaf8ef", corIcone: "#159447" },
  { id: "mod-6", nome: "JUDÔ", descricao: "Arte marcial e disciplina", icone: "🛡️", corBadge: "#eaf8ef", corIcone: "#0f9d58" },
  { id: "mod-7", nome: "BOXE", descricao: "Treinamento e prática de boxe", icone: "🎯", corBadge: "#fff0f1", corIcone: "#d9363e" },
  { id: "mod-8", nome: "HANDEBOL", descricao: "Prática e treinos de handebol", icone: "📈", corBadge: "#eeedfe", corIcone: "#5b5bd6" },
  { id: "mod-9", nome: "CAPOEIRA", descricao: "Expressão cultural e esporte", icone: "🏋️", corBadge: "#fff7df", corIcone: "#d97706" },
  { id: "mod-10", nome: "KARATÊ", descricao: "Arte marcial e treinamento", icone: "🛡️", corBadge: "#eaf8ef", corIcone: "#10b981" },
  { id: "mod-11", nome: "GINÁSTICA", descricao: "Ginástica artística e rítmica", icone: "✨", corBadge: "#f5e8ff", corIcone: "#9333ea" },
  { id: "mod-12", nome: "XADREZ", descricao: "Esporte da mente e raciocínio", icone: "🏅", corBadge: "#f1f5f9", corIcone: "#475569" },
  { id: "mod-13", nome: "TÊNIS", descricao: "Prática e treinos de tênis", icone: "📈", corBadge: "#eaf8ef", corIcone: "#16a34a" },
];

export default function AlunoDashboardPage() {
  const router = useRouter();
  const [paginaAtiva, setPaginaAtiva] = useState<"inicio" | "carteirinha" | "perfil" | "modalidades" | "turma" | "frequencia">("inicio");
  const [perfil, setPerfil] = useState<any>(null);
  const [carteirinha, setCarteirinha] = useState<any>(null);
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [modalidadesDisponiveis, setModalidadesDisponiveis] = useState<ModalidadeItem[]>(LISTA_OFICIAL_MODALIDADES);
  const [modalidadesSelecionadas, setModalidadesSelecionadas] = useState<string[]>([]);
  const [salvandoModalidades, setSalvandoModalidades] = useState(false);
  const [mensagemModalidade, setMensagemModalidade] = useState<{ texto: string; tipo: "sucesso" | "erro" | "" }>({
    texto: "",
    tipo: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [mensagemFoto, setMensagemFoto] = useState<{ texto: string; tipo: "sucesso" | "erro" | "" }>({
    texto: "",
    tipo: "",
  });

  const carregarDados = async () => {
    // 1. Carregar perfil do usuário
    const res = await api.get("/auth/me");
    if (res.data?.user) {
      const u = res.data.user;
      setPerfil(u);
      if (Array.isArray(u.modalidades) && u.modalidades.length > 0) {
        setModalidadesSelecionadas(u.modalidades);
      }

      // Carregar carteirinha digital oficial
      try {
        const resCart = await api.get(`/matriculas/carteirinha/${u.uid}`);
        if (resCart.data) {
          setCarteirinha(resCart.data);
        }
      } catch (err) {
        console.error("Erro ao carregar carteirinha:", err);
      }
    }

    // 2. Carregar modalidades da API backend e mesclar com a lista oficial
    const resMod = await api.get("/modalidades");
    if (resMod.data && Array.isArray(resMod.data) && resMod.data.length > 0) {
      const apiMods: any[] = resMod.data;
      const combinadas = LISTA_OFICIAL_MODALIDADES.map((item) => {
        const encontrada = apiMods.find((m) => m.nome.toLowerCase() === item.nome.toLowerCase());
        return encontrada ? { ...item, id: encontrada.id } : item;
      });
      setModalidadesDisponiveis(combinadas);
    }

    // 3. Carregar matrículas ativas do aluno
    const resMat = await api.get("/matriculas");
    if (resMat.data) {
      const mats = Array.isArray(resMat.data) ? resMat.data : [];
      setMatriculas(mats);
      if ((!res.data?.user?.modalidades || res.data.user.modalidades.length === 0) && mats.length > 0) {
        const modsDasMatriculas = mats.map((m: any) => m.modalidadeId).filter(Boolean);
        setModalidadesSelecionadas(modsDasMatriculas);
      }
    }
  };

  const handleFotoAtualizada = (novaFotoUrl: string) => {
    setPerfil((prev: any) => (prev ? { ...prev, fotoUrl: novaFotoUrl } : prev));
    setCarteirinha((prev: any) => (prev ? { ...prev, fotoUrl: novaFotoUrl } : prev));
    try {
      const stored = localStorage.getItem("selpe_usuario");
      if (stored) {
        const u = JSON.parse(stored);
        u.fotoUrl = novaFotoUrl;
        localStorage.setItem("selpe_usuario", JSON.stringify(u));
      }
    } catch (e) {}
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
          handleFotoAtualizada(resData.fotoUrl);
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
  }, []);

  const sair = () => {
    clearAuth();
    router.push("/aluno/login");
  };

  const getNomeUsuario = () => perfil?.nome || "Aluno";

  const getAvatarInitials = () => {
    if (!perfil?.nome) return "AL";
    const partes = perfil.nome.trim().split(" ");
    if (partes.length >= 2) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return partes[0].substring(0, 2).toUpperCase();
  };

  const toggleModalidade = (id: string) => {
    setModalidadesSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  const salvarModalidades = async () => {
    setSalvandoModalidades(true);
    setMensagemModalidade({ texto: "Salvando suas modalidades...", tipo: "" });

    const res = await api.post("/auth/me/modalidades", {
      modalidades: modalidadesSelecionadas,
    });

    setSalvandoModalidades(false);

    if (res.error) {
      setMensagemModalidade({ texto: res.error, tipo: "erro" });
    } else {
      setMensagemModalidade({
        texto: "Modalidades atualizadas com sucesso!",
        tipo: "sucesso",
      });
      await carregarDados();
    }
  };

  const getTituloPagina = () => {
    switch (paginaAtiva) {
      case "inicio":
        return "Início";
      case "carteirinha":
        return "Carteirinha Digital";
      case "perfil":
        return "Meu Perfil";
      case "modalidades":
        return "Minhas Modalidades";
      case "turma":
        return "Minha Turma";
      case "frequencia":
        return "Frequência";
      default:
        return "Início";
    }
  };

  const nomesModalidadesSelecionadas = modalidadesDisponiveis
    .filter((m) => modalidadesSelecionadas.includes(m.id))
    .map((m) => m.nome);

  return (
    <div className="aluno-dashboard-container">
      <aside className="sidebar">
        <div className="logo">
          <h1>SELPE</h1>
          <p>Área do Aluno</p>
        </div>

        <ul className="menu">
          <li>
            <button
              className={paginaAtiva === "inicio" ? "active" : ""}
              onClick={() => setPaginaAtiva("inicio")}
            >
              🏠 Início
            </button>
          </li>

          <li>
            <button
              className={paginaAtiva === "carteirinha" ? "active" : ""}
              onClick={() => setPaginaAtiva("carteirinha")}
            >
              🪪 Carteirinha Digital
            </button>
          </li>

          <li>
            <button
              className={paginaAtiva === "perfil" ? "active" : ""}
              onClick={() => setPaginaAtiva("perfil")}
            >
              👤 Meu Perfil
            </button>
          </li>

          <li>
            <button
              className={paginaAtiva === "modalidades" ? "active" : ""}
              onClick={() => setPaginaAtiva("modalidades")}
            >
              ⚽ Modalidades
            </button>
          </li>

          <li>
            <button
              className={paginaAtiva === "turma" ? "active" : ""}
              onClick={() => setPaginaAtiva("turma")}
            >
              📋 Minha Turma
            </button>
          </li>

          <li>
            <button
              className={paginaAtiva === "frequencia" ? "active" : ""}
              onClick={() => setPaginaAtiva("frequencia")}
            >
              📅 Frequência
            </button>
          </li>

          <li>
            <button onClick={sair}>🚪 Sair</button>
          </li>
        </ul>
      </aside>

      <main className="main">
        <header className="topbar">
          <h2 id="tituloPagina">{getTituloPagina()}</h2>

          <div className="aluno-top">
            <div>
              <strong>{getNomeUsuario()}</strong>
              <br />
              <small>Aluno</small>
            </div>

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

        <div className="content">
          <BrasiliaClock userName={getNomeUsuario()} userRole="Aluno" />

          {/* SEÇÃO CARTEIRINHA DIGITAL */}
          {paginaAtiva === "carteirinha" && (
            <section id="carteirinha" className="page active" style={{ padding: "10px 0" }}>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a" }}>Carteirinha Digital do Atleta</h1>
                <p style={{ color: "#64748b", fontSize: "14px" }}>Apresente este documento oficial nos polos esportivos e eventos do município.</p>
              </div>

              {carteirinha ? (
                <CarteirinhaDigital
                  data={{ ...carteirinha, alunoId: perfil?.uid }}
                  onFotoAtualizada={handleFotoAtualizada}
                />
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b", background: "#ffffff", borderRadius: "12px" }}>
                  Carregando sua Carteirinha Digital Oficial...
                </div>
              )}
            </section>
          )}

          {/* SEÇÃO INÍCIO */}
          {paginaAtiva === "inicio" && (
            <section id="inicio" className="page active">
              <div className="welcome">
                <div>
                  <h1>Olá, {getNomeUsuario()}!</h1>
                  <p>Bem-vindo à sua Área do Aluno do SELPE.</p>
                </div>
              </div>

              <div className="cards">
                <div className="card">
                  <h3>Modalidades</h3>
                  <div className="value" style={{ fontSize: "16px", marginTop: "5px", lineHeight: "1.3" }}>
                    {nomesModalidadesSelecionadas.length > 0
                      ? nomesModalidadesSelecionadas.join(", ")
                      : "Nenhuma selecionada"}
                  </div>
                </div>

                <div className="card">
                  <h3>Inscrições</h3>
                  <div className="value">{modalidadesSelecionadas.length}</div>
                </div>

                <div
                  className="card"
                  onClick={() => setPaginaAtiva("carteirinha")}
                  style={{ cursor: "pointer", border: "1px solid #bfdbfe", background: "#f0f9ff" }}
                  title="Clique para visualizar sua Carteirinha Digital"
                >
                  <h3 style={{ color: "#0284c7" }}>🪪 Carteirinha</h3>
                  <div className="value" style={{ fontSize: "16px", marginTop: "5px", color: "#0369a1" }}>
                    {perfil?.numeroMatricula || "Ver Carteirinha"}
                  </div>
                </div>

                <div className="card">
                  <h3>Status</h3>
                  <div className="value">
                    <span className="status ativo">Ativo</span>
                  </div>
                </div>
              </div>

              {modalidadesSelecionadas.length === 0 ? (
                <div className="box" style={{ textAlign: "center", padding: "40px 20px" }}>
                  <h2>Escolha suas Modalidades Esportivas</h2>
                  <p style={{ color: "#666", marginBottom: "20px" }}>
                    Você ainda não selecionou nenhuma modalidade. Clique no botão abaixo para escolher em quais esportes deseja participar!
                  </p>
                  <button
                    onClick={() => setPaginaAtiva("modalidades")}
                    style={{
                      backgroundColor: "var(--verde)",
                      color: "#fff",
                      padding: "12px 24px",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                    }}
                  >
                    ⚽ Selecionar Modalidades
                  </button>
                </div>
              ) : (
                <div className="grid">
                  <div className="box">
                    <h2>Minhas Modalidades ({modalidadesSelecionadas.length})</h2>
                    <div className="info" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {modalidadesDisponiveis
                        .filter((m) => modalidadesSelecionadas.includes(m.id))
                        .map((mod) => (
                          <div
                            key={mod.id}
                            className="info-item"
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  borderRadius: "8px",
                                  backgroundColor: mod.corBadge,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "18px",
                                }}
                              >
                                {mod.icone}
                              </div>
                              <div>
                                <strong style={{ fontSize: "15px", color: "var(--texto)" }}>{mod.nome}</strong>
                                <span style={{ fontSize: "12px", color: "#667085", display: "block" }}>
                                  Polo Esportivo Municipal
                                </span>
                              </div>
                            </div>
                            <span className="status ativo">Inscrito</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="box">
                    <h2>Informações do Polo Esportivo</h2>
                    <div className="info">
                      <div className="info-item">
                        <strong>Unidade Principal</strong>
                        <span>Polo Esportivo Central</span>
                      </div>

                      <div className="info-item">
                        <strong>Município</strong>
                        <span>Peruíbe - SP</span>
                      </div>

                      <div className="info-item">
                        <strong>Secretaria responsável</strong>
                        <span>SELPE</span>
                      </div>

                      <div className="info-item">
                        <strong>Atendimento</strong>
                        <span>Segunda a Sexta (08h às 17h)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* SEÇÃO PERFIL */}
          {paginaAtiva === "perfil" && (
            <section id="perfil" className="page active">
              <div className="box">
                <h2>Meu Perfil</h2>

                {/* Card de Foto de Perfil Oficial */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "24px",
                    padding: "20px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    marginBottom: "24px",
                    flexWrap: "wrap",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        width: "96px",
                        height: "96px",
                        borderRadius: "50%",
                        background: "#0284c7",
                        border: "3px solid #38bdf8",
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
                        background: "#0284c7",
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
                      <span className="status ativo" style={{ fontSize: "11px", padding: "2px 8px" }}>
                        Atleta Ativo
                      </span>
                    </div>
                    <p style={{ margin: "4px 0 12px 0", fontSize: "13px", color: "#64748b" }}>
                      Matrícula: {perfil?.numeroMatricula || "SELPE-2026"} {perfil?.cpf ? `• CPF: ${perfil.cpf}` : ""}
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
                          background: uploadingFoto ? "#94a3b8" : "#0284c7",
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

                <div className="info">
                  <div className="info-item">
                    <strong>Nome completo</strong>
                    <span>{perfil?.nome || "Não informado"}</span>
                  </div>

                  <div className="info-item">
                    <strong>CPF</strong>
                    <span>{perfil?.cpf || "Não informado"}</span>
                  </div>

                  <div className="info-item">
                    <strong>Data de nascimento</strong>
                    <span>{perfil?.dataNascimento || "Não informado"}</span>
                  </div>

                  <div className="info-item">
                    <strong>Telefone</strong>
                    <span>{perfil?.telefone || perfil?.telefoneEmergencia || "Não informado"}</span>
                  </div>

                  <div className="info-item">
                    <strong>E-mail</strong>
                    <span>{perfil?.email || "Não informado"}</span>
                  </div>

                  <div className="info-item">
                    <strong>Cidade / Estado</strong>
                    <span>
                      {perfil?.cidade
                        ? `${perfil.cidade} - ${perfil.estado || "SP"}`
                        : "Peruíbe - SP"}
                    </span>
                  </div>

                  <div className="info-item">
                    <strong>Endereço</strong>
                    <span>{perfil?.endereco || "Não informado"}</span>
                  </div>

                  <div className="info-item">
                    <strong>Número da Matrícula</strong>
                    <span>{perfil?.numeroMatricula || "Não informado"}</span>
                  </div>

                  <div className="info-item">
                    <strong>Responsável Legal</strong>
                    <span>{perfil?.nomeResponsavel || "Não informado"}</span>
                  </div>

                  <div className="info-item">
                    <strong>Telefone de Emergência</strong>
                    <span>{perfil?.telefoneEmergencia || "Não informado"}</span>
                  </div>

                  <div className="info-item">
                    <strong>Observações / Saúde</strong>
                    <span>{perfil?.observacoes || "Nenhuma"}</span>
                  </div>

                  <div className="info-item">
                    <strong>Status no Sistema</strong>
                    <span>
                      <span className="status ativo">Ativo</span>
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SEÇÃO MODALIDADES (CARDS VISUAIS IDENTICOS À IMAGEM) */}
          {paginaAtiva === "modalidades" && (
            <section id="modalidades" className="page active">
              <div className="box">
                <h2>Modalidades Esportivas Oferecidas</h2>
                <p style={{ color: "#667085", marginBottom: "24px", fontSize: "14px" }}>
                  Clique no card para se inscrever ou cancelar. Você pode selecionar <strong>quantas modalidades desejar</strong>!
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "18px",
                    marginBottom: "28px",
                  }}
                >
                  {modalidadesDisponiveis.map((mod) => {
                    const selecionado = modalidadesSelecionadas.includes(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModalidade(mod.id)}
                        style={{
                          backgroundColor: "#ffffff",
                          borderRadius: "14px",
                          padding: "18px 20px",
                          border: selecionado ? "2px solid #159447" : "1px solid #e5eaf1",
                          boxShadow: selecionado
                            ? "0 8px 20px rgba(21, 148, 71, 0.15)"
                            : "0 4px 12px rgba(16, 24, 40, 0.04)",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "12px",
                            backgroundColor: mod.corBadge,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "22px",
                            flexShrink: 0,
                          }}
                        >
                          {mod.icone}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong
                            style={{
                              display: "block",
                              fontSize: "15px",
                              fontWeight: "800",
                              color: "#182230",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {mod.nome}
                          </strong>

                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              marginTop: "4px",
                              fontSize: "13px",
                              fontWeight: selecionado ? "700" : "500",
                              color: selecionado ? "#159447" : "#1769e0",
                            }}
                          >
                            {selecionado ? "✓ Inscrito" : "Inscrever-se >"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <button
                    onClick={salvarModalidades}
                    disabled={salvandoModalidades}
                    style={{
                      backgroundColor: "var(--verde)",
                      color: "#ffffff",
                      padding: "14px 32px",
                      borderRadius: "10px",
                      fontWeight: "bold",
                      fontSize: "15px",
                      border: "none",
                      cursor: salvandoModalidades ? "not-allowed" : "pointer",
                      boxShadow: "0 4px 14px rgba(21, 148, 71, 0.25)",
                      transition: "all 0.2s ease",
                    }}
                  >
                    {salvandoModalidades ? "SALVANDO..." : "SALVAR MODALIDADES SELECIONADAS"}
                  </button>

                  {mensagemModalidade.texto && (
                    <span
                      style={{
                        color: mensagemModalidade.tipo === "erro" ? "var(--vermelho)" : "var(--verde)",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      {mensagemModalidade.texto}
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* SEÇÃO TURMA */}
          {paginaAtiva === "turma" && (
            <section id="turma" className="page active">
              <div className="box">
                <h2>Minhas Turmas e Inscrições</h2>

                {modalidadesSelecionadas.length === 0 ? (
                  <div className="frequencia-vazia">
                    <div className="icone">⚽</div>
                    <h3>Nenhuma modalidade selecionada</h3>
                    <p style={{ marginBottom: "16px" }}>Você ainda não selecionou modalidades na sua conta.</p>
                    <button
                      onClick={() => setPaginaAtiva("modalidades")}
                      style={{
                        backgroundColor: "var(--verde)",
                        color: "#fff",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        fontWeight: "bold",
                      }}
                    >
                      Ir para Minhas Modalidades
                    </button>
                  </div>
                ) : (
                  <div className="tabela-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Modalidade</th>
                          <th>Turma</th>
                          <th>Data de Inscrição</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modalidadesSelecionadas.map((modId) => {
                          const modInfo = modalidadesDisponiveis.find((m) => m.id === modId);
                          const matInfo = matriculas.find((m) => m.modalidadeId === modId);
                          return (
                            <tr key={modId}>
                              <td style={{ fontWeight: "bold" }}>{modInfo?.nome || modId}</td>
                              <td>{matInfo?.turmaNome || matInfo?.turmaId || "Geral - Turma A"}</td>
                              <td>
                                {matInfo?.dataInscricao
                                  ? new Date(matInfo.dataInscricao).toLocaleDateString("pt-BR")
                                  : new Date().toLocaleDateString("pt-BR")}
                              </td>
                              <td>
                                <span className="status ativo">Ativa</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* SEÇÃO FREQUÊNCIA */}
          {paginaAtiva === "frequencia" && (
            <section id="frequencia" className="page active">
              <div className="box">
                <h2>Minha Frequência</h2>

                <div className="frequencia-vazia">
                  <div className="icone">📅</div>
                  <h3>Nenhum registro de frequência</h3>
                  <p>Ainda não existem registros de presença cadastrados para este aluno.</p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
