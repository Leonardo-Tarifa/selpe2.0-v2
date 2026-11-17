"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { UserCheck, Shield, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { api, setToken } from "../../services/api";

function CadastroProfissionalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [convite, setConvite] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroInicial, setErroInicial] = useState<string | null>(null);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");

  const [submetendo, setSubmetendo] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErroInicial("Nenhum token de convite foi informado na URL. Utilize o link oficial do QR Code.");
      setCarregando(false);
      return;
    }

    async function carregarConvite() {
      try {
        const res = await api.get(`/convites/${token}`);
        if (res.error) {
          setErroInicial(res.error);
        } else {
          setConvite(res.data);
        }
      } catch (err) {
        setErroInicial("Falha ao validar convite profissional. Tente novamente.");
      } finally {
        setCarregando(false);
      }
    }
    carregarConvite();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroForm(null);

    if (!nome.trim() || !cpf.trim() || !email.trim() || !password.trim() || !telefone.trim() || !endereco.trim()) {
      setErroForm("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    if (password.length < 6) {
      setErroForm("A senha deve conter no mínimo 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErroForm("As senhas digitadas não coincidem.");
      return;
    }

    setSubmetendo(true);

    try {
      const res = await api.post(`/convites/${token}/aceitar`, {
        nome,
        cpf,
        email,
        password,
        telefone,
        endereco,
      });

      if (res.error) {
        setErroForm(res.error);
      } else {
        if (res.data?.token) {
          setToken(res.data.token);
          localStorage.setItem("selpe_usuario", JSON.stringify(res.data.user));
          localStorage.setItem("selpe_tipo_usuario", res.data.user.role);

          if (res.data.user.role === "monitor") {
            router.push("/professor");
          } else {
            router.push("/membro");
          }
        }
      }
    } catch (err: any) {
      setErroForm("Erro ao processar cadastro profissional.");
    } finally {
      setSubmetendo(false);
    }
  };

  const roleFormatada = convite?.role === "coordenador"
    ? "Coordenador Técnico"
    : convite?.role === "monitor"
    ? "Monitor / Professor"
    : "Secretaria de Esportes";

  if (carregando) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <p style={{ color: "#64748b" }}>Validando convite profissional do SELPE...</p>
      </div>
    );
  }

  if (erroInicial) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: "20px" }}>
        <div style={{ maxWidth: "480px", width: "100%", background: "#ffffff", borderRadius: "16px", padding: "32px", textAlign: "center", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}>
          <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", background: "#fee2e2", color: "#dc2626", marginBottom: "16px" }}>
            <AlertCircle size={48} />
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", marginBottom: "12px" }}>Convite Inválido ou Expirado</h2>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6", marginBottom: "24px" }}>{erroInicial}</p>
          <Link href="/login" style={{ display: "inline-block", padding: "12px 24px", background: "#2563eb", color: "#ffffff", borderRadius: "8px", textDecoration: "none", fontWeight: "600" }}>
            Ir para Login
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
            <UserCheck size={36} />
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#0f172a", marginBottom: "6px" }}>
            Cadastro de {roleFormatada}
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            Prefeitura Municipal de Peruíbe — Secretaria de Esportes e Lazer
          </p>
        </div>

        {/* Card do Perfil Convidado */}
        <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "#64748b", marginBottom: "8px" }}>
            Atribuição Profissional
          </div>
          <div style={{ fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
            <strong>Associação / Polo:</strong> {convite?.associacaoNome}
          </div>
          {convite?.modalidades && convite.modalidades.length > 0 && (
            <div style={{ fontSize: "14px", color: "#1e293b" }}>
              <strong>Modalidades Vinculadas:</strong> {convite.modalidades.map((m: any) => m.nome).join(", ")}
            </div>
          )}
        </div>

        {erroForm && (
          <div style={{ background: "#fef2f2", border: "1px solid #f87171", borderRadius: "8px", padding: "12px", color: "#b91c1c", fontSize: "14px", marginBottom: "20px" }}>
            {erroForm}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
              NOME COMPLETO: *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Digite seu nome completo"
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
              CPF: *
            </label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
              E-MAIL PROFISSIONAL (LOGIN): *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@exemplo.com"
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
              TELEFONE / WHATSAPP: *
            </label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(13) 99999-9999"
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
              ENDEREÇO RESIDENCIAL: *
            </label>
            <input
              type="text"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Rua, número, bairro - Peruíbe/SP"
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
              SENHA DE ACESSO: *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "700", color: "#1e293b", marginBottom: "6px" }}>
              CONFIRMAR SENHA: *
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita sua senha"
              required
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
            />
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
            {submetendo ? "CONCLUINDO CADASTRO..." : "CONCLUIR CADASTRO E ENTRAR"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CadastroProfissionalPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Carregando...</div>}>
      <CadastroProfissionalContent />
    </Suspense>
  );
}
