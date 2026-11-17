"use client";

import { useState } from "react";
import Link from "next/link";
import "../styles/cadastro_selpe.css";

export default function RecuperacaoPage() {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<{ texto: string; tipo: "sucesso" | "erro" | "" }>({
    texto: "",
    tipo: "",
  });

  const solicitarRecuperacao = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMensagem({ texto: "Por favor, informe seu e-mail.", tipo: "erro" });
      return;
    }

    setCarregando(true);
    setMensagem({ texto: "Enviando solicitação...", tipo: "" });

    setTimeout(() => {
      setCarregando(false);
      setMensagem({
        texto: "Link de recuperação enviado com sucesso para o e-mail informado!",
        tipo: "sucesso",
      });
    }, 1000);
  };

  return (
    <div id="aplicacao">
      <section className="tela tela-login">
        <div className="pagina pagina-recuperacao">
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
            <h1>RECUPERAR SENHA</h1>

            <p className="texto-recuperacao">
              Esqueceu sua senha?
              <br />
              Informe o e-mail cadastrado para receber um link de recuperação.
            </p>

            <form id="formRecuperacao" onSubmit={solicitarRecuperacao}>
              <div className="campo">
                <label htmlFor="email">E-mail</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Digite seu e-mail"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="acoes acoes-recuperacao">
                <button
                  type="submit"
                  className="botao-acessar"
                  id="btnRecuperar"
                  disabled={carregando}
                >
                  {carregando ? "ENVIANDO..." : "ENVIAR LINK"}
                </button>
              </div>

              {mensagem.texto && (
                <p id="mensagem" className={`mensagem ${mensagem.tipo}`} aria-live="polite">
                  {mensagem.texto}
                </p>
              )}
            </form>

            <Link href="/aluno/login" className="link-voltar">
              VOLTAR PARA O LOGIN
            </Link>
          </main>
        </div>
      </section>
    </div>
  );
}
