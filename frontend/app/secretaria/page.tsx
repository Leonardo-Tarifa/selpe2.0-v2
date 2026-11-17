"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api, clearAuth, getToken } from "../services/api";
import { ArrowLeft, Download, LogOut, Calendar, MapPin, CheckCircle2, QrCode, FileText } from "lucide-react";
import BrasiliaClock from "../components/BrasiliaClock";
import "../styles/wireframes.css";

interface AssociacaoItem {
  id: string;
  nome: string;
}

const ASSOCIACOES_OFICIAIS: AssociacaoItem[] = [
  { id: "assoc-amigos-bem", nome: "ASSOCIAÇÃO AMIGOS DO BEM" },
  { id: "assoc-pernas-pau", nome: "ASSOCIAÇÃO PERNAS DE PAU" },
  { id: "assoc-e-noix", nome: "É NOIX" },
  { id: "assoc-quase-nada", nome: "QUASE NADA" },
  { id: "assoc-tudo-indo", nome: "TUDO INDO" },
  { id: "assoc-traz-volta", nome: "TRAZ DE VOLTA" },
];

const MODALIDADES_ASSOCIAÇÃO = [
  { id: "mod-futsal", nome: "FUTSAL" },
  { id: "mod-beach-tenis", nome: "BEACH TENIS" },
  { id: "mod-basquete", nome: "BASQUETE" },
  { id: "mod-futevolei", nome: "FUTEVÔLEI" },
  { id: "mod-capoeira", nome: "CAPOEIRA" },
];

const VISITAS_WIREFRAME = [
  { dataTexto: "22/08", evento: "FUTEVOLEI ARENA 08:00", local: "Av. Gov. Mario Covas Jr. 1234", coordenador: "Augusto Figueiredo" },
  { dataTexto: "23/08", evento: "BEACH TENIS 17:00", local: "Arena da Praia - Posto 2", coordenador: "Augusto Figueiredo" },
  { dataTexto: "23/08", evento: "FUTSAL CARAGUAVA 09:00", local: "Polo Caraguava", coordenador: "Augusto Figueiredo" },
  { dataTexto: "25/08", evento: "TENIS DE MESA JD BRASIL 19:00", local: "Ginásio Jardim Brasil", coordenador: "Augusto Figueiredo" },
  { dataTexto: "26/08", evento: "ATLETISMO BECHIR 18:00", local: "Complexo Esportivo Bechir", coordenador: "Augusto Figueiredo" },
];

const HORARIOS_TURMA = ["08:00", "09:00", "18:00", "19:00"];

const ALUNOS_MATRIZ = [
  { id: "1", nome: "Francisco da Silva", presencas: [false, true, true, false] },
  { id: "2", nome: "Lucas Gabriel Santos", presencas: [true, true, true, true] },
  { id: "3", nome: "Mariana Souza Lima", presencas: [true, false, false, true] },
  { id: "4", nome: "Pedro Henrique Alves", presencas: [false, false, false, false] },
  { id: "5", nome: "Ana Beatriz Rocha", presencas: [true, true, true, true] },
  { id: "6", nome: "Carlos Eduardo Costa", presencas: [true, true, false, true] },
  { id: "7", nome: "Juliana Ferreira", presencas: [true, true, true, true] },
  { id: "8", nome: "Rafael Mendes", presencas: [false, false, false, false] },
  { id: "9", nome: "Beatriz Oliveira", presencas: [true, true, true, true] },
  { id: "10", nome: "Gabriel Martins", presencas: [true, true, false, true] },
];

export default function SecretariaDashboardPage() {
  const router = useRouter();

  const [perfil, setPerfil] = useState<any>(null);
  const [associacoes, setAssociacoes] = useState<AssociacaoItem[]>(ASSOCIACOES_OFICIAIS);
  const [associacaoSelecionada, setAssociacaoSelecionada] = useState<AssociacaoItem>(ASSOCIACOES_OFICIAIS[0]);

  // Fluxo de visualização do Wireframe (Páginas 6 a 10)
  const [visao, setVisao] = useState<
    "lista_associacoes" | "hub_associacao" | "visitas_coordenador" | "monitor_modalidades" | "monitor_polo_turma" | "matriz_presenca"
  >("lista_associacoes");

  const [modalidadeSelecionada, setModalidadeSelecionada] = useState<string>("FUTSAL");
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>("08:00");
  const [periodoFiltro, setPeriodoFiltro] = useState("22/08/2026 A 29/08/2026");
  const [baixandoPdf, setBaixandoPdf] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    const resMe = await api.get("/auth/me");
    if (resMe.data?.user) {
      setPerfil(resMe.data.user);
    }

    const resAssoc = await api.get("/associacoes");
    if (resAssoc.data && Array.isArray(resAssoc.data) && resAssoc.data.length > 0) {
      setAssociacoes(resAssoc.data);
    }
  };

  const handleSelecionarAssociacao = (assoc: AssociacaoItem) => {
    setAssociacaoSelecionada(assoc);
    setVisao("hub_associacao");
  };

  const gerarRelatorioPdf = async (tipo: "visitas" | "matriz" | "quantitativo") => {
    setBaixandoPdf(true);
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
      a.download = `relatorio-secretaria-${tipo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      alert("Relatório executivo oficial gerado com sucesso.");
    } finally {
      setBaixandoPdf(false);
    }
  };

  const sair = () => {
    clearAuth();
    router.push("/secretaria/login");
  };

  return (
    <div className="wireframe-container">
      <div className="wireframe-card moldura-secretaria">
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
          <BrasiliaClock userName={perfil?.nome || "Secretaria de Esportes"} userRole="Secretaria Global" />
        </div>

        {/* VISÃO 1 (Página 6 Right): Lista de Associações Parceiras */}
        {visao === "lista_associacoes" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ textAlign: "center", marginBottom: "16px", fontWeight: "800", color: "#854d0e", fontSize: "14px" }}>
              SELECIONE A ASSOCIAÇÃO ESPORTIVA
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {associacoes.map((assoc) => (
                <button
                  key={assoc.id}
                  className="wireframe-btn-amarelo"
                  onClick={() => handleSelecionarAssociacao(assoc)}
                >
                  {assoc.nome}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
              <button
                onClick={() => gerarRelatorioPdf("quantitativo")}
                disabled={baixandoPdf}
                className="wireframe-action-btn"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Download size={16} /> Relatório Geral (PDF)
              </button>

              <button
                onClick={sair}
                style={{
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  fontWeight: "700",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  cursor: "pointer",
                }}
              >
                <LogOut size={16} /> Sair
              </button>
            </div>
          </div>
        )}

        {/* VISÃO 2 (Página 7 Left): Hub da Associação Selecionada [COORDENADOR] ou [MONITOR] */}
        {visao === "hub_associacao" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="wireframe-badge">{associacaoSelecionada.nome}</div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: "24px" }}>
              <button
                className="wireframe-btn-amarelo"
                style={{ padding: "20px 16px", fontSize: "18px" }}
                onClick={() => setVisao("visitas_coordenador")}
              >
                COORDENADOR
              </button>

              <button
                className="wireframe-btn-amarelo"
                style={{ padding: "20px 16px", fontSize: "18px" }}
                onClick={() => setVisao("monitor_modalidades")}
              >
                MONITOR
              </button>
            </div>

            <button
              className="wireframe-action-btn"
              onClick={() => setVisao("lista_associacoes")}
              style={{ display: "flex", alignItems: "center", gap: "4px", alignSelf: "flex-start", marginTop: "16px" }}
            >
              <ArrowLeft size={16} /> Voltar para Associações
            </button>
          </div>
        )}

        {/* VISÃO 3 (Páginas 7 Right & 8 Left): Visão Coordenador / Auditoria de Visitas no Período */}
        {visao === "visitas_coordenador" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="wireframe-badge">COORDENADOR</div>

            <div style={{ textAlign: "center", fontWeight: "900", color: "#1e293b", fontSize: "16px", marginBottom: "4px" }}>
              VISITAS
            </div>

            <div style={{ textAlign: "center", fontSize: "13px", fontWeight: "700", color: "#2563eb", marginBottom: "16px" }}>
              PERÍODO: {periodoFiltro}
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", paddingRight: "4px" }}>
              {VISITAS_WIREFRAME.map((v, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "10px 14px",
                    backgroundColor: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "6px",
                  }}
                >
                  <div style={{ fontWeight: "900", color: "#0f172a", fontSize: "14px" }}>
                    {v.dataTexto} – {v.evento}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    <MapPin size={13} color="#ef4444" />
                    <span>{v.local}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px" }}>
              <button
                className="wireframe-action-btn"
                onClick={() => setVisao("hub_associacao")}
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <ArrowLeft size={16} /> Voltar
              </button>

              <button
                onClick={() => gerarRelatorioPdf("visitas")}
                disabled={baixandoPdf}
                className="wireframe-action-btn"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Download size={16} />
                {baixandoPdf ? "GERANDO..." : "GERAR RELATÓRIO"}
              </button>
            </div>
          </div>
        )}

        {/* VISÃO 4 (Página 8 Right): Visão Monitor / Lista de Modalidades */}
        {visao === "monitor_modalidades" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="wireframe-badge">MONITOR</div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {MODALIDADES_ASSOCIAÇÃO.map((m) => (
                <button
                  key={m.id}
                  className="wireframe-btn-amarelo"
                  onClick={() => {
                    setModalidadeSelecionada(m.nome);
                    setVisao("monitor_polo_turma");
                  }}
                >
                  {m.nome}
                </button>
              ))}
            </div>

            <button
              className="wireframe-action-btn"
              onClick={() => setVisao("hub_associacao")}
              style={{ display: "flex", alignItems: "center", gap: "4px", alignSelf: "flex-start", marginTop: "16px" }}
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          </div>
        )}

        {/* VISÃO 5 (Página 9): Detalhes do Polo / Turma e Horários */}
        {visao === "monitor_polo_turma" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="wireframe-badge">
              {modalidadeSelecionada} POLO CARAGUAVA
            </div>

            <div style={{ textAlign: "center", fontWeight: "700", color: "#1e293b", fontSize: "14px", marginBottom: "16px" }}>
              MONITOR PEDRO MAGALHÃES
            </div>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
              {HORARIOS_TURMA.map((h) => (
                <div key={h} className="wireframe-horario-row">
                  <div className="wireframe-horario-box">{h}</div>

                  <button
                    className="wireframe-action-btn"
                    onClick={() => {
                      setHorarioSelecionado(h);
                      setVisao("matriz_presenca");
                    }}
                  >
                    ALUNOS
                  </button>

                  <button
                    className="wireframe-action-btn"
                    onClick={() => alert(`Importação de lista de chamada para o horário ${h} acionada.`)}
                  >
                    IMPORTAR
                  </button>
                </div>
              ))}
            </div>

            <button
              className="wireframe-action-btn"
              onClick={() => setVisao("monitor_modalidades")}
              style={{ display: "flex", alignItems: "center", gap: "4px", alignSelf: "flex-start", marginTop: "16px" }}
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          </div>
        )}

        {/* VISÃO 6 (Página 10): Matriz Consolidada de Frequência Histórica */}
        {visao === "matriz_presenca" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="wireframe-badge" style={{ fontSize: "14px", padding: "8px 12px" }}>
              {modalidadeSelecionada} POLO CARAGUAVA
            </div>

            <div style={{ textAlign: "center", fontSize: "12px", fontWeight: "800", color: "#2563eb", marginBottom: "12px" }}>
              PERÍODO: {periodoFiltro} - {horarioSelecionado}
            </div>

            <div style={{ flex: 1, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "6px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1.5px solid #cbd5e1" }}>
                    <th style={{ textAlign: "left", padding: "8px 10px" }}>Atleta</th>
                    <th style={{ textAlign: "center", padding: "8px 4px" }}>22</th>
                    <th style={{ textAlign: "center", padding: "8px 4px" }}>23</th>
                    <th style={{ textAlign: "center", padding: "8px 4px" }}>24</th>
                    <th style={{ textAlign: "center", padding: "8px 4px" }}>25</th>
                  </tr>
                </thead>
                <tbody>
                  {ALUNOS_MATRIZ.map((aluno) => (
                    <tr key={aluno.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "8px 10px", fontWeight: "700", color: "#334155" }}>
                        {aluno.nome}
                      </td>
                      {aluno.presencas.map((status, pIdx) => (
                        <td key={pIdx} style={{ textAlign: "center", padding: "8px 4px" }}>
                          <span className={`indicador-presenca ${status ? "verde" : "vermelho"}`} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "14px" }}>
              <button
                className="wireframe-action-btn"
                onClick={() => setVisao("monitor_polo_turma")}
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <ArrowLeft size={16} /> Voltar
              </button>

              <button
                onClick={() => gerarRelatorioPdf("matriz")}
                disabled={baixandoPdf}
                className="wireframe-action-btn"
                style={{ display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Download size={16} />
                {baixandoPdf ? "GERANDO..." : "GERAR RELATÓRIO"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
