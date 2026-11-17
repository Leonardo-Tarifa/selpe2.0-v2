"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setAuth } from "../../services/api";
import "../../styles/wireframes.css";

export default function CoordenadorLoginPage() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!login.trim() || !senha.trim()) {
      setErro("Informe o login/CPF e a senha.");
      return;
    }

    setCarregando(true);
    setErro(null);

    const res = await api.post("/auth/login", {
      login: login.trim(),
      senha,
    });

    setCarregando(false);

    if (res.error) {
      setErro(res.error);
    } else if (res.data?.token) {
      const userRole = res.data.user?.role;
      if (userRole !== "coordenador" && userRole !== "secretaria") {
        setErro("Acesso restrito. Este portal é exclusivo para Coordenadores de Associações.");
        return;
      }
      setAuth(res.data.token, res.data.user);
      router.push("/coordenador");
    }
  };

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

        <div className="wireframe-badge">
          COORDENADOR
        </div>

        {erro && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              color: "#b91c1c",
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: "600",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            {erro}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="wireframe-input-group">
            <label className="wireframe-label">Log in</label>
            <input
              type="text"
              className="wireframe-input"
              placeholder="Digite seu login ou CPF"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              disabled={carregando}
              autoComplete="username"
            />
          </div>

          <div className="wireframe-input-group">
            <label className="wireframe-label">Senha</label>
            <input
              type="password"
              className="wireframe-input"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={carregando}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="wireframe-btn-azul"
            disabled={carregando}
            style={{ opacity: carregando ? 0.7 : 1 }}
          >
            {carregando ? "ACESSANDO..." : "ACESSAR"}
          </button>

          <Link href="/cadastro/profissional" className="wireframe-link">
            CADASTRE-SE
          </Link>
        </form>
      </div>
    </div>
  );
}
