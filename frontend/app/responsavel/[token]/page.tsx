"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ShieldCheck, CheckCircle2, AlertCircle, FileText, UserCheck, Calendar, Clock, MapPin, Award } from "lucide-react";
import { api } from "../../services/api";

interface ConviteInfo {
  alunoNome: string;
  alunoPrimeiroNome: string;
  modalidadeNome: string;
  poloNome: string;
  diasSemana: string[];
  horarioInicio: string;
  horarioFim: string;
  status: string;
  expiraEm: string;
}

export default function ConfirmacaoResponsavelPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [convite, setConvite] = useState<ConviteInfo | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroInicial, setErroInicial] = useState<string | null>(null);

  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [cpfResponsavel, setCpfResponsavel] = useState("");
  const [telefoneResponsavel, setTelefoneResponsavel] = useState("");
  const [parentesco, setParentesco] = useState<"mae" | "pai" | "tutor_legal" | "outro">("mae");
  const [termoAceito, setTermoAceito] = useState(false);

  const [submetendo, setSubmetendo] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{
    numeroMatricula: string;
    carteirinha: any;
  } | null>(null);

  useEffect(() => {
    async function carregarConvite() {
      try {
        const res = await api.get(`/responsavel/convite/${token}`);
        if (res.error) {
          setErroInicial(res.error);
        } else {
          setConvite(res.data);
        }
      } catch (err: any) {
        setErroInicial("Não foi possível carregar a autorização. Verifique se o link está correto.");
      } finally {
        setCarregando(false);
      }
    }
    carregarConvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    if (!nomeResponsavel.trim() || !cpfResponsavel.trim() || !telefoneResponsavel.trim()) {
      setErroForm("Por favor, preencha todos os campos do responsável.");
      return;
    }

    if (!termoAceito) {
      setErroForm("É obrigatório o aceite formal dos termos da LGPD e autorização de participação do menor.");
      return;
    }

    setSubmetendo(true);

    try {
      const res = await api.post("/responsavel/confirmar", {
        token,
        nomeResponsavel,
        cpfResponsavel,
        telefoneResponsavel,
        parentesco,
        termoAceito: true,
      });

      if (res.error) {
        setErroForm(res.error);
      } else {
        setSucesso({
          numeroMatricula: res.data.numeroMatricula,
          carteirinha: res.data.carteirinha,
        });
      }
    } catch (err: any) {
      setErroForm("Falha ao confirmar autorização. Tente novamente.");
    } finally {
      setSubmetendo(false);
    }
  };

  if (carregando) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <div style={{ width: "40px", height: "40px", border: "4px solid #cbd5e1", borderTopColor: "#2563eb", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          Carregando autorização de inscrição do atleta...
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (erroInicial) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "20px", fontFamily: "sans-serif" }}>
        <div style={{ maxWidth: "480px", width: "100%", background: "#ffffff", borderRadius: "16px", padding: "32px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", textAlign: "center" }}>
          <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", marginBottom: "16px" }}>
            <AlertCircle size={48} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", marginBottom: "12px" }}>Link Indisponível ou Expirado</h2>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "24px" }}>{erroInicial}</p>
          <Link href="/cadastro" style={{ display: "inline-block", padding: "12px 24px", background: "#2563eb", color: "#ffffff", borderRadius: "8px", textDecoration: "none", fontWeight: "600", fontSize: "14px" }}>
            Realizar Nova Inscrição
          </Link>
        </div>
      </div>
    );
  }

  if (sucesso) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "20px", fontFamily: "sans-serif" }}>
        <div style={{ maxWidth: "560px", width: "100%", background: "#ffffff", borderRadius: "16px", padding: "36px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", textAlign: "center" }}>
          <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", marginBottom: "20px" }}>
            <CheckCircle2 size={52} />
          </div>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>Autorização Confirmada com Sucesso!</h2>
          <p style={{ fontSize: "15px", color: "#475569", lineHeight: "1.6", marginBottom: "24px" }}>
            A inscrição foi ativada e a <strong>Carteirinha Digital Oficial</strong> já está disponível para o atleta.
          </p>

          <div style={{ background: "#f1f5f9", borderRadius: "12px", padding: "20px", textAlign: "left", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "#1e293b", fontWeight: "700" }}>
              <Award size={20} color="#2563eb" /> Resumo da Matrícula:
            </div>
            <div style={{ fontSize: "14px", color: "#334155", display: "grid", gap: "6px" }}>
              <div><strong>Atleta:</strong> {sucesso.carteirinha.nome}</div>
              <div><strong>Número de Matrícula:</strong> {sucesso.numeroMatricula}</div>
              <div><strong>Modalidade:</strong> {sucesso.carteirinha.modalidadeNome}</div>
              <div><strong>Horário:</strong> {sucesso.carteirinha.horarioInicio} às {sucesso.carteirinha.horarioFim}</div>
            </div>
          </div>

          <Link
            href="/aluno/login"
            style={{
              display: "inline-block",
              width: "100%",
              padding: "14px",
              background: "#2563eb",
              color: "#ffffff",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "16px",
              textDecoration: "none",
            }}
          >
            Acessar com o Login do Aluno
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 15px", fontFamily: "sans-serif" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", background: "#ffffff", borderRadius: "16px", padding: "32px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ display: "inline-flex", padding: "12px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", marginBottom: "12px" }}>
            <ShieldCheck size={36} />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            Autorização do Responsável Legal
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            Prefeitura Municipal da Estância Balneária de Peruíbe — SELPE
          </p>
        </div>

        {/* Card do Atleta */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px", marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#64748b", marginBottom: "10px" }}>
            Dados da Inscrição Esportiva
          </div>
          <div style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
            Atleta: {convite?.alunoNome}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "13px", color: "#475569" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Award size={16} color="#2563eb" /> {convite?.modalidadeNome}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MapPin size={16} color="#2563eb" /> {convite?.poloNome}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Clock size={16} color="#2563eb" /> {convite?.horarioInicio} - {convite?.horarioFim}
            </div>
          </div>
        </div>

        {erroForm && (
          <div style={{ background: "#fef2f2", border: "1px solid #f87171", borderRadius: "8px", padding: "12px", color: "#b91c1c", fontSize: "14px", marginBottom: "20px" }}>
            {erroForm}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
              SEU NOME COMPLETO (RESPONSÁVEL): *
            </label>
            <input
              type="text"
              value={nomeResponsavel}
              onChange={(e) => setNomeResponsavel(e.target.value)}
              placeholder="Digite seu nome completo"
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
              SEU CPF: *
            </label>
            <input
              type="text"
              value={cpfResponsavel}
              onChange={(e) => setCpfResponsavel(e.target.value)}
              placeholder="000.000.000-00"
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
              SEU TELEFONE / WHATSAPP: *
            </label>
            <input
              type="tel"
              value={telefoneResponsavel}
              onChange={(e) => setTelefoneResponsavel(e.target.value)}
              placeholder="(13) 99999-9999"
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
              GRAU DE PARENTESCO: *
            </label>
            <select
              value={parentesco}
              onChange={(e: any) => setParentesco(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#ffffff" }}
            >
              <option value="mae">Mãe</option>
              <option value="pai">Pai</option>
              <option value="tutor_legal">Tutor Legal / Guarda Judicial</option>
              <option value="outro">Outro Responsável Legal</option>
            </select>
          </div>

          {/* Termo LGPD / ECA */}
          <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "14px", marginBottom: "24px" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "13px", color: "#334155", cursor: "pointer", lineHeight: "1.5" }}>
              <input
                type="checkbox"
                checked={termoAceito}
                onChange={(e) => setTermoAceito(e.target.checked)}
                style={{ marginTop: "3px", width: "16px", height: "16px" }}
              />
              <span>
                <strong>Termo de Consentimento e Autorização:</strong> Declaro sob as penas da lei ser o responsável legal pelo atleta menor acima qualificado e autorizo sua participação nos treinos e eventos esportivos organizados pela Secretaria Municipal de Esportes e Lazer de Peruíbe (SELPE), manifestando concordância com a Lei Geral de Proteção de Dados (LGPD) e o Estatuto da Criança e do Adolescente (ECA).
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submetendo}
            style={{
              width: "100%",
              padding: "14px",
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "10px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {submetendo ? "CONFIRMANDO AUTORIZAÇÃO..." : "AUTORIZAR INSCRIÇÃO DO MENOR"}
          </button>
        </form>
      </div>
    </div>
  );
}
