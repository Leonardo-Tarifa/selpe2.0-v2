"use client";

import { useState, useEffect } from "react";
import { Clock, Shield, User } from "lucide-react";

interface BrasiliaClockProps {
  userName?: string;
  userRole?: string;
}

export default function BrasiliaClock({ userName, userRole }: BrasiliaClockProps) {
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTimeStr(formatter.format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#f8fafc",
        padding: "8px 16px",
        borderRadius: "10px",
        fontSize: "13px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            boxShadow: "0 0 8px #22c55e",
          }}
        />
        <Clock size={16} color="#38bdf8" />
        <span style={{ color: "#94a3b8" }}>Horário Oficial de Brasília:</span>
        <strong style={{ letterSpacing: "0.5px", color: "#ffffff" }}>
          {timeStr || "Sincronizando..."}
        </strong>
      </div>

      {userName && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px" }}>
          <User size={14} color="#94a3b8" />
          <span style={{ color: "#cbd5e1" }}>Usuário: <strong>{userName}</strong></span>
          {userRole && (
            <span
              style={{
                background: "#2563eb",
                color: "#ffffff",
                padding: "2px 8px",
                borderRadius: "12px",
                fontSize: "11px",
                fontWeight: "700",
                textTransform: "uppercase",
              }}
            >
              {userRole}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
