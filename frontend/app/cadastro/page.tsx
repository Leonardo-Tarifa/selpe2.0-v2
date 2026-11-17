"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Share2, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Camera } from "lucide-react";
import "../styles/cadastro_selpe.css";

import { api, setToken } from "../services/api";

interface TurmaOption {
  id: string;
  nomeTurma?: string;
  modalidadeNome?: string;
  diasSemana?: string[];
  horarioInicio?: string;
  horarioFim?: string;
  capacidadeMax?: number;
  vagasDisponiveis?: number;
}

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [email, setEmail] = useState("");
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [telefoneEmergencia, setTelefoneEmergencia] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fotoArquivo, setFotoArquivo] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const [turmas, setTurmas] = useState<TurmaOption[]>([]);
  const [isMenor, setIsMenor] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [carregandoTurmas, setCarregandoTurmas] = useState(true);

  // Estado de Sucesso para Menor de Idade
  const [minorPending, setMinorPending] = useState<{
    linkResponsavel: string;
    nomeMenor: string;
    modalidadeNome: string;
  } | null>(null);

  const [copiado, setCopiado] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: "sucesso" | "erro" | "" }>({
    texto: "",
    tipo: "",
  });

  // Carrega turmas disponíveis da prefeitura
  useEffect(() => {
    async function carregarTurmas() {
      try {
        const res = await api.get("/turmas");
        if (res.data && Array.isArray(res.data)) {
          setTurmas(res.data);
          if (res.data.length > 0) {
            setTurmaId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar turmas:", err);
      } finally {
        setCarregandoTurmas(false);
      }
    }
    carregarTurmas();
  }, []);

  // Monitora data de nascimento e detecta menoridade em tempo real
  useEffect(() => {
    if (!dataNascimento) {
      setIsMenor(false);
      return;
    }
    const [yearStr, monthStr, dayStr] = dataNascimento.split("-");
    const birthYear = parseInt(yearStr, 10);
    const birthMonth = parseInt(monthStr, 10);
    const birthDay = parseInt(dayStr, 10);

    const now = new Date();
    let age = now.getFullYear() - birthYear;
    const m = now.getMonth() + 1 - birthMonth;
    if (m < 0 || (m === 0 && now.getDate() < birthDay)) {
      age--;
    }
    setIsMenor(age < 18);
  }, [dataNascimento]);

  const copiarLink = () => {
    if (!minorPending) return;
    const fullUrl = `${window.location.origin}${minorPending.linkResponsavel}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const compartilharWhatsApp = () => {
    if (!minorPending) return;
    const fullUrl = `${window.location.origin}${minorPending.linkResponsavel}`;
    const texto = `Olá! Por favor, acesse o link oficial do SELPE para autorizar e confirmar a inscrição esportiva de ${minorPending.nomeMenor} (${minorPending.modalidadeNome}):\n\n${fullUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`, "_blank");
  };

  const realizarCadastro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !email.trim() || !cpf.trim() || !password.trim() || !telefone.trim() || !endereco.trim() || !dataNascimento || !turmaId) {
      setMensagem({ texto: "Por favor, preencha todos os campos obrigatórios (*).", tipo: "erro" });
      return;
    }

    if (password.length < 6) {
      setMensagem({ texto: "A senha deve ter no mínimo 6 caracteres.", tipo: "erro" });
      return;
    }

    if (password !== confirmPassword) {
      setMensagem({ texto: "As senhas digitadas não coincidem.", tipo: "erro" });
      return;
    }

    setCarregando(true);
    setMensagem({ texto: "Enviando dados e reservando vaga na turma...", tipo: "" });

    const res = await api.post("/auth/register-aluno", {
      nome,
      dataNascimento,
      cpf,
      telefone,
      endereco,
      email,
      nomeResponsavel: nomeResponsavel || (isMenor ? "Responsável Legal" : nome),
      telefoneEmergencia: telefoneEmergencia || telefone,
      turmaId,
      observacoes: observacoes || undefined,
      password,
    });

    setCarregando(false);

    if (res.error) {
      setMensagem({ texto: res.error, tipo: "erro" });
      return;
    }

    // Se for menor de idade (HTTP 202 Accepted)
    if (res.status === 202 || res.data?.status === "aguardando_responsavel") {
      const selectedTurma = turmas.find((t) => t.id === turmaId);
      setMinorPending({
        linkResponsavel: res.data.linkResponsavel,
        nomeMenor: nome,
        modalidadeNome: selectedTurma?.modalidadeNome || "Modalidade Esportiva",
      });
      return;
    }

    // Se maior de idade, login direto
    if (res.data?.token) {
      setToken(res.data.token);
      let usuarioSalvo = res.data.user;

      if (fotoArquivo) {
        try {
          const formData = new FormData();
          formData.append("file", fotoArquivo);
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
          const uploadRes = await fetch(`${API_URL}/auth/me/foto`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${res.data.token}`,
            },
            body: formData,
          });
          const uploadData = await uploadRes.json();
          if (uploadData.fotoUrl) {
            usuarioSalvo = { ...usuarioSalvo, fotoUrl: uploadData.fotoUrl };
          }
        } catch (e) {
          console.error("Erro ao salvar foto de perfil durante cadastro:", e);
        }
      }

      localStorage.setItem("selpe_usuario", JSON.stringify(usuarioSalvo));
      localStorage.setItem("selpe_tipo_usuario", "aluno");
    }

    setMensagem({
      texto: "Inscrição realizada com sucesso! Redirecionando para a sua Carteirinha Digital...",
      tipo: "sucesso",
    });

    setTimeout(() => {
      router.push("/aluno");
    }, 1200);
  };

  // TELA DE SUCESSO / LINK DO RESPONSÁVEL (QUANDO MENOR DE IDADE)
  if (minorPending) {
    return (
      <div className="tela tela-login" style={{ minHeight: "100vh", padding: "30px 15px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ maxWidth: "600px", width: "100%", background: "#ffffff", borderRadius: "16px", padding: "32px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", border: "1px solid #e2e8f0", textAlign: "center" }}>
          <div style={{ display: "inline-flex", padding: "16px", borderRadius: "50%", background: "#ecfdf5", color: "#059669", marginBottom: "20px" }}>
            <CheckCircle2 size={48} />
          </div>

          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", marginBottom: "8px" }}>
            Inscrição Pré-Realizada!
          </h2>
          <p style={{ fontSize: "15px", color: "#475569", lineHeight: "1.6", marginBottom: "24px" }}>
            Como <strong>{minorPending.nomeMenor}</strong> é menor de idade, a legislação exige a confirmação expressa dos dados pelo responsável legal para emissão da Carteirinha Digital.
          </p>

          <div style={{ background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: "12px", padding: "16px", marginBottom: "24px", wordBreak: "break-all" }}>
            <span style={{ display: "block", fontSize: "12px", textTransform: "uppercase", fontWeight: "bold", color: "#64748b", marginBottom: "6px" }}>
              Link de Confirmação do Responsável:
            </span>
            <code style={{ fontSize: "14px", color: "#2563eb", fontWeight: "600" }}>
              {typeof window !== "undefined" ? `${window.location.origin}${minorPending.linkResponsavel}` : minorPending.linkResponsavel}
            </code>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
            <button
              onClick={compartilharWhatsApp}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "14px",
                background: "#25D366",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 6px -1px rgba(37, 211, 102, 0.3)",
              }}
            >
              <Share2 size={20} /> Compartilhar no WhatsApp do Responsável
            </button>

            <button
              onClick={copiarLink}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                width: "100%",
                padding: "12px",
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: "10px",
                fontSize: "15px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              <Copy size={18} /> {copiado ? "Link Copiado com Sucesso!" : "Copiar Link de Autorização"}
            </button>
          </div>

          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
            <Link
              href="/aluno/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: "#2563eb",
                fontWeight: "600",
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              Ir para Tela de Login do Aluno <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tela tela-login" style={{ minHeight: "100vh", padding: "30px 15px" }}>
      <div className="pagina" style={{ margin: "0 auto", maxWidth: "650px" }}>
        <header className="cabecalho">
          <div className="logo-container">
            <img src="/img/logo.png" alt="Logo SELPE" className="logo-imagem" />
          </div>

          <div className="nome-logo">
            <span className="azul">sel</span>
            <span className="verde">pe</span>
          </div>

          <p className="subtitulo">
            SECRETARIA DE ESPORTES E LAZER
            <br />
            DE PERUÍBE
          </p>
        </header>

        <main className="area-login" style={{ background: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }}>
          <div
            style={{
              borderBottom: "2px solid #2563eb",
              paddingBottom: "10px",
              textAlign: "center",
              fontWeight: "bold",
              fontSize: "20px",
              marginBottom: "20px",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <ShieldCheck size={24} color="#2563eb" /> INSCRIÇÃO ESPORTIVA OFICIAL
          </div>

          {isMenor && (
            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "20px",
                display: "flex",
                alignItems: "flex-start",
                gap: "12px",
                color: "#92400e",
                fontSize: "14px",
              }}
            >
              <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Atenção (Menor de 18 Anos):</strong> Ao finalizar o cadastro, será gerado um link de uso único para que seu responsável confirme seus dados e autorize sua participação.
              </div>
            </div>
          )}

          <form id="formCadastro" onSubmit={realizarCadastro}>
            {/* SELEÇÃO OBRIGATÓRIA DE TURMA E MODALIDADE */}
            <div className="campo" style={{ marginBottom: "16px" }}>
              <label htmlFor="turmaId" style={{ fontWeight: "700", color: "#1e293b", display: "block", marginBottom: "6px" }}>
                MODALIDADE E HORÁRIO PRETENDIDO: *
              </label>
              {carregandoTurmas ? (
                <div style={{ padding: "10px", background: "#f8fafc", borderRadius: "6px", color: "#64748b" }}>Carregando turmas disponíveis...</div>
              ) : (
                <select
                  id="turmaId"
                  value={turmaId}
                  onChange={(e) => setTurmaId(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "2px solid #cbd5e1",
                    fontSize: "14px",
                    fontWeight: "500",
                    background: "#ffffff",
                    color: "#0f172a",
                  }}
                >
                  {turmas.length === 0 ? (
                    <option value="">Nenhuma turma disponível no momento</option>
                  ) : (
                    turmas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.modalidadeNome || "Esporte"} — {t.nomeTurma || "Turma Geral"} ({(t.diasSemana || []).join(", ") || "Seg/Qua"} às {t.horarioInicio || "08:00"}) - Vagas: {t.vagasDisponiveis ?? t.capacidadeMax ?? 30}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            {/* FOTO DE PERFIL / CARTEIRINHA DIGITAL (OPCIONAL) */}
            <div className="campo" style={{ marginBottom: "20px" }}>
              <label style={{ fontWeight: "700", color: "#1e293b", display: "block", marginBottom: "6px" }}>
                FOTO DE PERFIL (PARA CARTEIRINHA DIGITAL):
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "50%",
                    background: "#f1f5f9",
                    border: "2px dashed #94a3b8",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {fotoPreview ? (
                    <img src={fotoPreview} alt="Prévia da foto" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Camera size={26} color="#64748b" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="fotoPerfil"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFotoArquivo(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setFotoPreview(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                    style={{ fontSize: "13px" }}
                  />
                  <small style={{ display: "block", color: "#64748b", marginTop: "4px" }}>
                    Opcional: JPEG, PNG ou WebP até 5MB. Você também poderá alterar a foto mais tarde.
                  </small>
                </div>
              </div>
            </div>

            <div className="campo">
              <label htmlFor="nome">NOME COMPLETO: *</label>
              <input
                type="text"
                id="nome"
                placeholder="Digite seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="dataNascimento">DATA DE NASCIMENTO: *</label>
              <input
                type="date"
                id="dataNascimento"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="cpf">CPF: *</label>
              <input
                type="text"
                id="cpf"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="telefone">TELEFONE / WHATSAPP: *</label>
              <input
                type="tel"
                id="telefone"
                placeholder="(13) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="endereco">ENDEREÇO RESIDENCIAL COMPLETO: *</label>
              <input
                type="text"
                id="endereco"
                placeholder="Rua, número, bairro - Peruíbe/SP"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="email">E-MAIL (LOGIN): *</label>
              <input
                type="email"
                id="email"
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="nomeResponsavel">NOME DO RESPONSÁVEL: {isMenor && "*"}</label>
              <input
                type="text"
                id="nomeResponsavel"
                placeholder="Nome do responsável legal (obrigatório se menor)"
                value={nomeResponsavel}
                onChange={(e) => setNomeResponsavel(e.target.value)}
                required={isMenor}
              />
            </div>

            <div className="campo">
              <label htmlFor="telefoneEmergencia">TELEFONE DE EMERGÊNCIA: *</label>
              <input
                type="tel"
                id="telefoneEmergencia"
                placeholder="(13) 98888-8888"
                value={telefoneEmergencia}
                onChange={(e) => setTelefoneEmergencia(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="observacoes">OBSERVAÇÕES MÉDICAS / RESTRIÇÕES:</label>
              <textarea
                id="observacoes"
                placeholder="Ex: Alergias, condições cardíacas, medicamentos ou observações pedagógicas"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                }}
              />
            </div>

            <div className="campo" style={{ marginTop: "15px" }}>
              <label htmlFor="password">SENHA DE ACESSO AO SISTEMA: *</label>
              <input
                type="password"
                id="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="confirmPassword">CONFIRMAR SENHA: *</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Repita a senha digitada"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="acoes" style={{ marginTop: "25px" }}>
              <button type="submit" className="botao-acessar" disabled={carregando}>
                {carregando ? "PROCESSANDO INSCRIÇÃO..." : "REALIZAR INSCRIÇÃO"}
              </button>

              <Link href="/aluno/login" className="botao-cadastro" style={{ display: "inline-block" }}>
                JÁ POSSUI CADASTRO? FAÇA LOGIN
              </Link>
            </div>
          </form>

          {mensagem.texto && (
            <p id="mensagemCadastro" className={`mensagem ${mensagem.tipo}`}>
              {mensagem.texto}
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
