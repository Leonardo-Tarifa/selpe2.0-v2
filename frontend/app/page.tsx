"use client";

import Link from "next/link";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import {
  Award,
  User,
  ChevronRight,
  Sparkles,
  Trophy,
  Activity,
  Dumbbell,
  Waves,
  Zap,
  Target,
} from "lucide-react";

export default function Home() {
  // Lista oficial de modalidades conforme documento oficial da SELPE Peruíbe
  const modalidades = [
    {
      nome: "Futsal",
      icone: Trophy,
      cor: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      nome: "Futsal",
      icone: Trophy,
      cor: "bg-blue-50 text-blue-600 border-blue-200",
    },
    {
      nome: "Surf",
      icone: Waves,
      cor: "bg-cyan-50 text-cyan-600 border-cyan-200",
    },
    {
      nome: "Basquete",
      icone: Activity,
      cor: "bg-amber-50 text-amber-600 border-amber-200",
    },
    {
      nome: "Vôlei",
      icone: Zap,
      cor: "bg-teal-50 text-teal-600 border-teal-200",
    },
    {
      nome: "Judô",
      icone: ShieldIcon,
      cor: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      nome: "Boxe",
      icone: Target,
      cor: "bg-red-50 text-red-600 border-red-200",
    },
    {
      nome: "Handebol",
      icone: Activity,
      cor: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
    {
      nome: "Capoeira",
      icone: Dumbbell,
      cor: "bg-yellow-50 text-yellow-700 border-yellow-200",
    },
    {
      nome: "Karatê",
      icone: ShieldIcon,
      cor: "bg-emerald-50 text-emerald-600 border-emerald-200",
    },
    {
      nome: "Ginástica",
      icone: Sparkles,
      cor: "bg-purple-50 text-purple-600 border-purple-200",
    },
    {
      nome: "Xadrez",
      icone: Award,
      cor: "bg-slate-100 text-slate-700 border-slate-300",
    },
    {
      nome: "Tênis",
      icone: Activity,
      cor: "bg-green-50 text-green-600 border-green-200",
    },
  ];

  function ShieldIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      </svg>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200 bg-linear-to-b from-blue-50/50 via-white to-slate-50 min-h-200 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto space-y-6">
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-tight">
                Secretaria de Esportes e Lazer de{" "}
                <span className="bg-linear-to-b from-emerald-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Peruíbe
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
                Portal oficial da SELPE. Inscreva-se gratuitamente nas
                aulas esportivas municipais e participe das
                modalidades.
              </p>

              {/* 4 Portais Oficiais SELPE (Aluno, Monitor, Coordenador, Secretaria) */}
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                {/* 🔴 ALUNO */}
                <Link
                  href="/aluno/login"
                  className="p-5 rounded-xl bg-white border-2 border-red-500 hover:border-red-600 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 block group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-red-600"></span>
                    <span className="text-xs font-black uppercase text-red-700 tracking-wider">Aluno / Atleta</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-red-600 transition-colors">
                    Área do Aluno
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Inscrição via QR Code, carteirinha digital e histórico.
                  </p>
                </Link>

                {/* 🟢 MONITOR */}
                <Link
                  href="/professor/login"
                  className="p-5 rounded-xl bg-white border-2 border-emerald-600 hover:border-emerald-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 block group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-600"></span>
                    <span className="text-xs font-black uppercase text-emerald-700 tracking-wider">Monitor / Professor</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    Área do Monitor
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Chamada em tempo real, validação e relatórios.
                  </p>
                </Link>

                {/* 🔵 COORDENADOR */}
                <Link
                  href="/coordenador/login"
                  className="p-5 rounded-xl bg-white border-2 border-blue-600 hover:border-blue-700 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 block group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-blue-600"></span>
                    <span className="text-xs font-black uppercase text-blue-700 tracking-wider">Coordenador</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Área do Coordenador
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Supervisão técnica, visitas em campo e check-in.
                  </p>
                </Link>

                {/* 🟡 SECRETARIA */}
                <Link
                  href="/secretaria/login"
                  className="p-5 rounded-xl bg-white border-2 border-amber-500 hover:border-amber-600 shadow-sm hover:shadow-md transition-all duration-200 transform hover:-translate-y-1 block group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <span className="text-xs font-black uppercase text-amber-800 tracking-wider">Secretaria Global</span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900 group-hover:text-amber-700 transition-colors">
                    Secretaria de Esporte
                  </h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Visão macro, associações e relatórios executivos.
                  </p>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= MODALIDADES SECTION ================= */}
        <section
          id="modalidades"
          className="py-16 bg-slate-50 border-b border-slate-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                MODALIDADES SELPE PERUÍBE
              </h2>
              <p className="text-sm text-slate-600 font-medium mt-2">
                Confira as modalidades esportivas oficiais oferecidas pela
                Secretaria de Esportes e Lazer.
              </p>
            </div>

            {/* Grid de Modalidades Limpo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {modalidades.map((item, index) => {
                const IconComp = item.icone;
                return (
                  <div
                    key={index}
                    className="group rounded-xl bg-white border border-slate-200 hover:border-blue-400 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-4"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${item.cor}`}
                    >
                      <IconComp className="w-6 h-6" />
                    </div>

                    <div className="flex-1">
                      <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-wide">
                        {item.nome}
                      </h3>
                      <div className="text-xs text-slate-500 font-medium mt-1 group-hover:text-blue-600 transition-colors">
                        Inscrever-se ➤
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/aluno/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition-all"
              >
                <span>Inscrever-se em uma Modalidade</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
