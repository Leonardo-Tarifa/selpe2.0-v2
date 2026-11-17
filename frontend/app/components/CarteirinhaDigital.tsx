"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Camera, ShieldCheck, Printer, AlertCircle, CheckCircle2 } from "lucide-react";
import { api, getToken } from "../services/api";

interface CarteirinhaData {
  nome: string;
  numeroMatricula: string;
  cpf?: string;
  fotoUrl?: string | null;
  modalidadeNome: string;
  local?: string;
  poloNome?: string;
  diasSemana?: string[];
  horarioInicio?: string;
  horarioFim?: string;
  telefoneEmergencia?: string;
  nomeResponsavel?: string;
  qrValidationHash?: string;
  alunoId?: string;
  status?: string;
}

interface CarteirinhaProps {
  data: CarteirinhaData;
  onFotoAtualizada?: (novaFotoUrl: string) => void;
}

export default function CarteirinhaDigital({ data, onFotoAtualizada }: CarteirinhaProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [fotoAtual, setFotoAtual] = useState<string | null | undefined>(data.fotoUrl);
  const [uploading, setUploading] = useState(false);
  const [erroUpload, setErroUpload] = useState<string | null>(null);
  const [sucessoUpload, setSucessoUpload] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFotoAtual(data.fotoUrl);
  }, [data.fotoUrl]);

  // Gera o QR Code com o Hash Oficial de validação
  useEffect(() => {
    async function gerarQr() {
      if (!data.qrValidationHash && !data.numeroMatricula) return;
      try {
        const payload = JSON.stringify({
          alunoId: data.alunoId || "",
          matricula: data.numeroMatricula,
          hash: data.qrValidationHash || "",
        });
        const url = await QRCode.toDataURL(payload, {
          width: 200,
          margin: 1,
          color: {
            dark: "#0F294A",
            light: "#FFFFFF",
          },
        });
        setQrCodeUrl(url);
      } catch (err) {
        console.error("Erro ao gerar QR Code:", err);
      }
    }
    gerarQr();
  }, [data]);

  // Manipulador de upload de foto com moderação NSFW e verificação mágica
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErroUpload(null);
    setSucessoUpload(null);
    setUploading(true);

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
        setErroUpload(resData.message || "Erro no envio da foto. Verifique o arquivo.");
      } else {
        setSucessoUpload("Foto atualizada e aprovada na moderação!");
        if (resData.fotoUrl) {
          setFotoAtual(resData.fotoUrl);
          try {
            const stored = localStorage.getItem("selpe_usuario");
            if (stored) {
              const u = JSON.parse(stored);
              u.fotoUrl = resData.fotoUrl;
              localStorage.setItem("selpe_usuario", JSON.stringify(u));
            }
          } catch (e) {}

          if (onFotoAtualizada) {
            onFotoAtualizada(resData.fotoUrl);
          }
        }
      }
    } catch (err) {
      setErroUpload("Falha ao conectar com o serviço de upload.");
    } finally {
      setUploading(false);
    }
  };

  const cpfMascarado = data.cpf
    ? `${data.cpf.slice(0, 3)}.***.***-${data.cpf.slice(-2)}`
    : "***.***.***-**";

  const imprimirCarteirinha = () => {
    const cardEl = document.getElementById("carteirinha-impressao");
    if (!cardEl) {
      window.print();
      return;
    }

    // Remove qualquer iframe de impressão anterior
    const oldIframe = document.getElementById("carteirinha-print-iframe");
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "carteirinha-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    // Clona apenas a carteirinha e remove botões interativos do clone
    const clone = cardEl.cloneNode(true) as HTMLElement;
    clone.querySelectorAll("button, input, .no-print").forEach((el) => el.remove());

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Carteirinha Digital - ${data.nome}</title>
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
              background-color: #ffffff !important;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 90vh;
              padding: 20px;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .cabecalho-doc {
              text-align: center;
              margin-bottom: 24px;
            }
            .cabecalho-doc h1 {
              font-size: 15px;
              font-weight: 900;
              color: #0f294a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .cabecalho-doc p {
              font-size: 11px;
              font-weight: 600;
              color: #475569;
              margin-top: 3px;
            }
            .card-wrapper {
              width: 440px;
              max-width: 100%;
              margin: 0 auto;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .card-wrapper #carteirinha-impressao {
              box-shadow: 0 4px 14px rgba(0,0,0,0.15) !important;
              border: 2px solid #eab308 !important;
            }
            .rodape-doc {
              text-align: center;
              margin-top: 24px;
              font-size: 10px;
              font-weight: 600;
              color: #64748b;
              max-width: 420px;
              line-height: 1.4;
            }
            .linha-corte {
              margin-top: 24px;
              border-top: 1px dashed #cbd5e1;
              width: 440px;
              text-align: center;
              position: relative;
            }
            .linha-corte span {
              position: relative;
              top: -8px;
              background: #fff;
              padding: 0 10px;
              font-size: 9px;
              color: #94a3b8;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
          </style>
        </head>
        <body>
          <div class="cabecalho-doc">
            <h1>Prefeitura da Estância Balneária de Peruíbe</h1>
            <p>Secretaria de Esportes e Lazer — Documento Oficial de Identificação do Atleta</p>
          </div>

          <div class="card-wrapper">
            ${clone.outerHTML}
          </div>

          <div class="rodape-doc">
            Válido para acesso a treinos, competições e instalações esportivas municipais.
          </div>

          <div class="linha-corte">
            <span>✂ Linha de corte para carteirinha de bolso</span>
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        window.print();
      }
    }, 350);
  };

  return (
    <div style={{ maxWidth: "450px", margin: "0 auto", fontFamily: "'Inter', sans-serif" }}>
      {/* Mensagens de Feedback de Upload */}
      {erroUpload && (
        <div style={{ background: "#fee2e2", border: "1px solid #ef4444", borderRadius: "8px", padding: "10px", color: "#b91c1c", fontSize: "13px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} /> {erroUpload}
        </div>
      )}
      {sucessoUpload && (
        <div style={{ background: "#ecfdf5", border: "1px solid #10b981", borderRadius: "8px", padding: "10px", color: "#047857", fontSize: "13px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <CheckCircle2 size={18} /> {sucessoUpload}
        </div>
      )}

      {/* CARTÃO DA CARTEIRINHA DIGITAL OFICIAL */}
      <div
        id="carteirinha-impressao"
        style={{
          background: "linear-gradient(135deg, #0F294A 0%, #1e3a8a 100%)",
          color: "#ffffff",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(15, 41, 74, 0.4), 0 8px 10px -6px rgba(15, 41, 74, 0.2)",
          position: "relative",
          overflow: "hidden",
          border: "2px solid rgba(255, 215, 0, 0.4)",
        }}
      >
        {/* Marca d'água / Efeito de Fundo */}
        <div
          style={{
            position: "absolute",
            top: "-30px",
            right: "-30px",
            width: "160px",
            height: "160px",
            background: "radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        {/* Topo da Carteirinha */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: "14px", marginBottom: "18px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "1px", color: "#facc15", textTransform: "uppercase" }}>
              Prefeitura de Peruíbe
            </div>
            <div style={{ fontSize: "16px", fontWeight: "900", letterSpacing: "0.5px" }}>
              SELPE ESPORTES
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "rgba(34, 197, 94, 0.2)",
              border: "1px solid #22c55e",
              color: "#4ade80",
              padding: "4px 8px",
              borderRadius: "20px",
              fontSize: "11px",
              fontWeight: "700",
            }}
          >
            <ShieldCheck size={14} /> CARTEIRINHA OFICIAL
          </div>
        </div>

        {/* Corpo: Foto + Dados Principais */}
        <div style={{ display: "flex", gap: "18px", alignItems: "center", marginBottom: "20px" }}>
          {/* Foto com Botão de Upload */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "90px",
                height: "115px",
                borderRadius: "10px",
                background: "#0284c7",
                border: "2px solid #facc15",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.2)",
              }}
            >
              {fotoAtual ? (
                <img
                  src={fotoAtual}
                  alt={data.nome}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ fontSize: "28px", fontWeight: "bold", color: "#ffffff" }}>
                  {data.nome.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Atualizar Foto de Perfil"
              className="no-print"
              style={{
                position: "absolute",
                bottom: "-6px",
                right: "-6px",
                background: "#2563eb",
                color: "#ffffff",
                border: "2px solid #ffffff",
                borderRadius: "50%",
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              <Camera size={14} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </div>

          {/* Dados do Atleta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "4px" }}>
              {data.nome}
            </div>

            <div style={{ fontSize: "12px", color: "#93c5fd", marginBottom: "8px" }}>
              Matrícula: <strong style={{ color: "#facc15", letterSpacing: "0.5px" }}>{data.numeroMatricula}</strong>
            </div>

            <div style={{ fontSize: "11px", color: "#cbd5e1", marginBottom: "2px" }}>
              CPF: <span>{cpfMascarado}</span>
            </div>

            <div style={{ fontSize: "11px", color: "#cbd5e1", marginBottom: "2px" }}>
              Modalidade: <strong style={{ color: "#ffffff" }}>{data.modalidadeNome}</strong>
            </div>

            <div style={{ fontSize: "11px", color: "#cbd5e1" }}>
              Horário: <span>{data.horarioInicio || "08:00"} às {data.horarioFim || "09:30"}</span>
            </div>
          </div>
        </div>

        {/* Rodapé: QR Code e Selo de Validação */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.08)", borderRadius: "12px", padding: "12px 14px" }}>
          <div>
            <div style={{ fontSize: "10px", textTransform: "uppercase", color: "#94a3b8", fontWeight: "700", marginBottom: "2px" }}>
              Emergência / Responsável:
            </div>
            <div style={{ fontSize: "12px", fontWeight: "700", color: "#f8fafc", marginBottom: "4px" }}>
              {data.telefoneEmergencia || "(13) 3451-1000"}
            </div>
            {data.nomeResponsavel && (
              <div style={{ fontSize: "10px", color: "#94a3b8" }}>
                Resp: {data.nomeResponsavel}
              </div>
            )}
          </div>

          {/* QR Code Dinâmico */}
          <div style={{ background: "#ffffff", borderRadius: "8px", padding: "4px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code de Validação" style={{ width: "68px", height: "68px", display: "block" }} />
            ) : (
              <div style={{ width: "68px", height: "68px", background: "#f1f5f9" }} />
            )}
          </div>
        </div>
      </div>

      {/* Botão de Impressão */}
      <button
        onClick={imprimirCarteirinha}
        className="no-print"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          width: "100%",
          marginTop: "16px",
          padding: "12px",
          background: "#ffffff",
          color: "#0f294a",
          border: "1px solid #cbd5e1",
          borderRadius: "10px",
          fontSize: "14px",
          fontWeight: "700",
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        }}
      >
        <Printer size={16} /> Imprimir / Salvar Carteirinha em PDF
      </button>
    </div>
  );
}
