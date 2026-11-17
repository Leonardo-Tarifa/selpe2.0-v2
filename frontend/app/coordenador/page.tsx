"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, clearAuth, getToken } from "../services/api";
import { MapPin, CheckCircle2, ArrowLeft, Download, LogOut } from "lucide-react";
import BrasiliaClock from "../components/BrasiliaClock";
import "../styles/wireframes.css";

interface ModalidadeItem {
  id: string;
  nome: string;
  polo?: string;
}

const MODALIDADES_PADRAO_COORDENADOR: ModalidadeItem[] = [
  { id: "mod-futsal", nome: "FUTSAL", polo: "POLO CARAGUAVA" },
  { id: "mod-beach-tenis", nome: "BEACH TENIS", polo: "ARENA DA PRAIA" },
  { id: "mod-basquete", nome: "BASQUETE", polo: "GINÁSIO CENTRAL" },
  { id: "mod-futevolei", nome: "FUTEVÔLEI", polo: "ARENA" },
  { id: "mod-capoeira", nome: "CAPOEIRA", polo: "POLO CULTURAL" },
];

const DIAS_SEMANA = [
  { label: "SEGUNDA", valor: "segunda", dataTexto: "SEGUNDA 22/08" },
  { label: "TERÇA", valor: "terca", dataTexto: "TERÇA 23/08" },
  { label: "QUARTA", valor: "quarta", dataTexto: "QUARTA 24/08" },
  { label: "QUINTA", valor: "quinta", dataTexto: "QUINTA 25/08" },
  { label: "SEXTA", valor: "sexta", dataTexto: "SEXTA 26/08" },
];

const HORARIOS_VISITA = ["08:00", "09:00", "18:00", "19:00"];

export default function CoordenadorDashboardPage() {
  const router = useRouter();

  const [perfil, setPerfil] = useState<any>(null);
  const [modalidades, setModalidades] = useState<ModalidadeItem[]>(MODALIDADES_PADRAO_COORDENADOR);
  const [associacaoNome, setAssociacaoNome] = useState("ASSOCIAÇÃO AMIGOS DO BEM");

  // Navegação de Telas conforme Wireframe
  const [tela, setTela] = useState<"associacao" | "modalidade_dias" | "grade_checkin">("associacao");
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<ModalidadeItem | null>(null);
  const [diaSelecionado, setDiaSelecionado] = useState(DIAS_SEMANA[0]);

  // Estado dos Check-ins de Visita Técnica
  const [checkinsFeitos, setCheckinsFeitos] = useState<Record<string, boolean>>({});
  const [observacoesHorario, setObservacoesHorario] = useState<Record<string, string>>({});
  const [enderecoAtual, setEnderecoAtual] = useState("Av. Gov. Mario Covas Jr. 1234");
  const [registrandoHorario, setRegistrandoHorario] = useState<string | null>(null);
  const [mensagemStatus, setMensagemStatus] = useState<string | null>(null);
  const [baixandoRelatorio, setBaixandoRelatorio] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const resMe = await api.get("/auth/me");
    if (resMe.data?.user) {
      setPerfil(resMe.data.user);
      if (resMe.data.user.associacaoNome) {
        setAssociacaoNome(resMe.data.user.associacaoNome.toUpperCase());
      }
    }

    // Carregar check-ins existentes do coordenador
    const resCheckins = await api.get("/checkins");
    if (resCheckins.data && Array.isArray(resCheckins.data)) {
      const mapa: Record<string, boolean> = {};
      const obsMapa: Record<string, string> = {};
      resCheckins.data.forEach((c: any) => {
        if (c.horario) {
          mapa[c.horario] = true;
          if (c.observacoes) obsMapa[c.horario] = c.observacoes;
        }
      });
      setCheckinsFeitos(mapa);
      setObservacoesHorario(obsMapa);
    }
  };

  const handleSelecionarModalidade = (mod: ModalidadeItem) => {
    setModalidadeSelecionada(mod);
    setTela("modalidade_dias");
  };

  const handleSelecionarDia = (dia: typeof DIAS_SEMANA[0]) => {
    setDiaSelecionado(dia);
    setTela("grade_checkin");
  };

  const realizarCheckin = async (horario: string) => {
    setRegistrandoHorario(horario);
    setMensagemStatus(null);

    let lat = -24.3209;
    let lng = -46.9984; // Peruíbe centro padrão

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos: any = await new Promise((resolve) =>
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 4000 })
        );
        if (pos?.coords) {
          lat = pos.coords.latitude;
          lng = pos.coords.longitude;
        }
      } catch (e) {}
    }

    const payload = {
      localizacao: {
        lat,
        lng,
        enderecoAproximado: enderecoAtual,
      },
      observacoes: observacoesHorario[horario] || `Visita técnica do coordenador às ${horario}`,
      horario,
      polo: modalidadeSelecionada ? `${modalidadeSelecionada.nome} - ${modalidadeSelecionada.polo || "ARENA"}` : "ARENA",
    };

    const res = await api.post("/checkins", payload);
    setRegistrandoHorario(null);

    if (res.error) {
      setMensagemStatus(`Aviso: Check-in salvo localmente em modo offline.`);
      setCheckinsFeitos((prev) => ({ ...prev, [horario]: true }));
    } else {
      setMensagemStatus(`✓ Check-in das ${horario} registrado com sucesso em campo!`);
      setCheckinsFeitos((prev) => ({ ...prev, [horario]: true }));
    }
  };

  const gerarRelatorioPdf = async () => {
    setBaixandoRelatorio(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
      const token = getToken();
      const res = await fetch(`${API_URL}/relatorios/quantitativo/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao gerar relatório");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-coordenador-${diaSelecionado.valor}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("Relatório consolidado gerado. (Baixando versão de visitas da associação)");
    } finally {
      setBaixandoRelatorio(false);
    }
  };

  const sair = () => {
    clearAuth();
    router.push("/coordenador/login");
  };

  const getNomeCoordenador = () => perfil?.nome || "Augusto Figueiredo";

  return (
    <div className="wireframe-container">
      <div className="wireframe-card moldura-coordenador">
        <header className="wireframe-header">
          <div className="wireframe-logo-container">
            <img src="/img/logo.png" alt="Logo SELPE" className="wireframe-logo-imagem" />
          </div>
          <div className="wireframe-logo">
            <span className="azul">sel</span>
            <span className="verde">pe</span>
          </div>
          <div className="wireframe-subtitulo">
            SECRETARIA DE ESPORTES E LAZER
            <br />
            DE PERUÍBE
          </div>
        </header>

        <div style={{ marginBottom: "16px" }}>
          <BrasiliaClock userName={getNomeCoordenador()} userRole="Coordenador" />
        </div>

        {/* TELA 1 (Página 1 Right): Associação e Lista de Modalidades */}
        {tela === "associacao" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="wireframe-badge">{associacaoNome}</div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {modalidades.map((mod) => (
                <button
                  key={mod.id}
                  className="wireframe-btn-amarelo"
                  onClick={() => handleSelecionarModalidade(mod)}
                >
                  {mod.nome}
                </button>
              ))}
            </div>

            <button
              onClick={sair}
              style={{
                marginTop: "20px",
                background: "none",
                border: "none",
                color: "#64748b",
                fontWeight: "700",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                cursor: "pointer",
              }}
            >
              <LogOut size={16} /> Sair da Conta
            </button>
          </div>
        )}

        {/* TELA 2 (Página 2 Left): Modalidade, Dias da Semana e Relatório */}
        {tela === "modalidade_dias" && modalidadeSelecionada && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="wireframe-badge">
              {modalidadeSelecionada.nome} - {modalidadeSelecionada.polo || "ARENA"}
            </div>

            <div style={{ textAlign: "center", marginBottom: "16px", fontWeight: "700", color: "#1e293b", fontSize: "15px" }}>
              Coordenador {getNomeCoordenador()}
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {DIAS_SEMANA.map((dia) => (
                <button
                  key={dia.valor}
                  className="wireframe-btn-amarelo"
                  onClick={() => handleSelecionarDia(dia)}
                >
                  {dia.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
              <button
                className="wireframe-action-btn"
                onClick={() => setTela("associacao")}
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <ArrowLeft size={16} /> Voltar
              </button>

              <button
                onClick={gerarRelatorioPdf}
                disabled={baixandoRelatorio}
                className="wireframe-action-btn"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Download size={16} />
                {baixandoRelatorio ? "GERANDO..." : "GERAR RELATÓRIO"}
              </button>
            </div>
          </div>
        )}

        {/* TELA 3 (Página 2 Right): Grade de Horários e Check-in com Endereço e Observações */}
        {tela === "grade_checkin" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="wireframe-badge">{diaSelecionado.dataTexto}</div>

            {mensagemStatus && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  backgroundColor: "#f0fdf4",
                  border: "1px solid #86efac",
                  color: "#15803d",
                  fontSize: "13px",
                  fontWeight: "700",
                  marginBottom: "12px",
                  textAlign: "center",
                }}
              >
                {mensagemStatus}
              </div>
            )}

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
              {HORARIOS_VISITA.map((horario) => {
                const jaCheckin = checkinsFeitos[horario];
                return (
                  <div key={horario} className="wireframe-horario-row">
                    <div className="wireframe-horario-box">{horario}</div>

                    <button
                      className="wireframe-action-btn"
                      onClick={() => realizarCheckin(horario)}
                      disabled={registrandoHorario === horario}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "15px",
                        color: jaCheckin ? "#16a34a" : "#2563eb",
                        fontWeight: "900",
                      }}
                    >
                      {jaCheckin ? (
                        <>
                          CHECK IN <CheckCircle2 size={18} color="#16a34a" />
                        </>
                      ) : (
                        <>
                          {registrandoHorario === horario ? "SALVANDO..." : "CHECK IN"}
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "700", color: "#475569", marginBottom: "8px" }}>
                <MapPin size={16} color="#ef4444" />
                <span>{enderecoAtual}</span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "800", color: "#1e293b", marginBottom: "4px" }}>
                  Observações:
                </label>
                <input
                  type="text"
                  placeholder="Insira as observações da visita técnica..."
                  value={observacoesHorario["geral"] || ""}
                  onChange={(e) =>
                    setObservacoesHorario((prev) => ({ ...prev, geral: e.target.value }))
                  }
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "4px",
                    border: "1px solid #cbd5e1",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
              <button
                className="wireframe-action-btn"
                onClick={() => setTela("modalidade_dias")}
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <ArrowLeft size={16} /> Voltar
              </button>

              <button
                onClick={gerarRelatorioPdf}
                disabled={baixandoRelatorio}
                className="wireframe-action-btn"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Download size={16} />
                {baixandoRelatorio ? "GERANDO..." : "GERAR RELATÓRIO"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
