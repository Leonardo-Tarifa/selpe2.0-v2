"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import "../../styles/cadastro_selpe.css";

import { api, setToken } from "../../services/api";

export default function AlunoLoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const isProfessorPath = pathname?.includes("professor");
  const [tipoUsuario, setTipoUsuario] = useState<"aluno" | "professor">(
    isProfessorPath ? "professor" : "aluno"
  );
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [codigoProfessor, setCodigoProfessor] = useState("");
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: "sucesso" | "erro" | "" }>({
    texto: "",
    tipo: "",
  });

  useEffect(() => {
    if (pathname?.includes("professor")) {
      setTipoUsuario("professor");
    } else {
      setTipoUsuario("aluno");
    }
  }, [pathname]);

  const selecionarTipo = (tipo: "aluno" | "professor") => {
    setTipoUsuario(tipo);
    setMensagem({ texto: "", tipo: "" });
    if (tipo === "professor") {
      if (pathname !== "/professor/login") {
        router.push("/professor/login");
      }
    } else {
      if (pathname !== "/aluno/login") {
        router.push("/aluno/login");
      }
    }
  };

  const realizarLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!login.trim() || !senha.trim()) {
      setMensagem({ texto: "Por favor, preencha todos os campos obrigatórios.", tipo: "erro" });
      return;
    }

    if (tipoUsuario === "professor" && !codigoProfessor.trim()) {
      setMensagem({ texto: "Por favor, digite o código do professor.", tipo: "erro" });
      return;
    }

    setMensagem({ texto: "Autenticando no servidor...", tipo: "" });

    const res = await api.post("/auth/login", {
      identifier: login,
      password: senha,
    });

    if (res.error || !res.data) {
      setMensagem({ texto: res.error || "Erro ao efetuar login. Verifique suas credenciais.", tipo: "erro" });
      return;
    }

    const { token, user } = res.data;
    if (token) setToken(token);

    const usuarioSalvo = {
      login,
      tipo: tipoUsuario,
      nome: user?.nome || (tipoUsuario === "aluno" ? "Aluno Teste" : "Professor Teste"),
      uid: user?.uid,
      email: user?.email,
      role: user?.role,
      fotoUrl: user?.fotoUrl || null,
    };

    localStorage.setItem("selpe_usuario", JSON.stringify(usuarioSalvo));
    localStorage.setItem("selpe_tipo_usuario", tipoUsuario);

    setMensagem({ texto: "Login realizado com sucesso! Redirecionando...", tipo: "sucesso" });

    setTimeout(() => {
      if (tipoUsuario === "aluno") {
        window.location.href = "/aluno";
      } else {
        window.location.href = "/professor";
      }
    }, 600);
  };

  return (
    <div id="aplicacao">
      <section id="telaLogin" className="tela tela-login">
        <div className={`pagina ${tipoUsuario === "professor" ? "professor-ativo" : ""}`}>
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

          <main className="area-login">
            <div className="seletor">
              <Link
                href="/aluno/login"
                id="btnAluno"
                className={`tipo ${tipoUsuario === "aluno" ? "ativo" : ""}`}
                onClick={(e) => {
                  if (pathname === "/aluno/login") {
                    e.preventDefault();
                  }
                  selecionarTipo("aluno");
                }}
              >
                ALUNO
              </Link>

              <Link
                href="/professor/login"
                id="btnProfessor"
                className={`tipo ${tipoUsuario === "professor" ? "ativo" : ""}`}
                onClick={(e) => {
                  if (pathname === "/professor/login") {
                    e.preventDefault();
                  }
                  selecionarTipo("professor");
                }}
              >
                PROFESSOR
              </Link>
            </div>

            <h1 id="tituloLogin">
              {tipoUsuario === "aluno" ? "LOGIN DO ALUNO" : "LOGIN DO PROFESSOR"}
            </h1>

            <form id="formLogin" onSubmit={realizarLogin}>
              <div className="campo">
                <label htmlFor="login">Login</label>
                <input
                  type="text"
                  id="login"
                  placeholder="Digite seu login"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                  required
                />
              </div>

              <div className="campo">
                <label htmlFor="senha">Senha</label>
                <input
                  type="password"
                  id="senha"
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                />
              </div>

              {tipoUsuario === "professor" && (
                <div className="campo professor-campo" style={{ display: "block" }}>
                  <label htmlFor="codigoProfessor">Código do professor</label>
                  <input
                    type="text"
                    id="codigoProfessor"
                    placeholder="Digite o código do professor"
                    value={codigoProfessor}
                    onChange={(e) => setCodigoProfessor(e.target.value)}
                    required
                  />
                </div>
              )}

              <div className="acoes">
                <button type="submit" className="botao-acessar">
                  ACESSAR
                </button>

                <Link href="/cadastro" className="botao-cadastro" style={{ display: "inline-block" }}>
                  CADASTRE-SE
                </Link>
              </div>

              <div className="recuperacao-senha">
                <Link href="/recuperacao">ESQUECI MINHA SENHA</Link>
              </div>
            </form>

            {mensagem.texto && (
              <p id="mensagem" className={`mensagem ${mensagem.tipo}`}>
                {mensagem.texto}
              </p>
            )}
          </main>
        </div>
      </section>
    </div>
  );
}
