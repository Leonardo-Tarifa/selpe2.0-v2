"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, Menu, X, Award, Activity } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/95 border-b border-slate-200 text-slate-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Oficial SELPE Peruíbe de assets */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative flex items-center justify-center">
              <Image
                src="/selpe-logo.jpeg"
                alt="Logo SELPE - Secretaria de Esportes e Lazer de Peruíbe"
                width={160}
                height={50}
                className="h-12 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2 text-sm font-semibold text-slate-700">
            <Link
              href="/"
              className="px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              Início
            </Link>
            <Link
              href="/#modalidades"
              className="px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Award className="w-4 h-4 text-blue-600" />
              Modalidades
            </Link>
            <Link
              href="/professor/login"
              className="px-3 py-2 rounded-lg hover:text-green-700 hover:bg-green-50 transition-colors font-bold text-green-700"
            >
              Monitor
            </Link>
            <Link
              href="/coordenador/login"
              className="px-3 py-2 rounded-lg hover:text-blue-700 hover:bg-blue-50 transition-colors font-bold text-blue-700"
            >
              Coordenador
            </Link>
            <Link
              href="/secretaria/login"
              className="px-3 py-2 rounded-lg hover:text-amber-700 hover:bg-amber-50 transition-colors font-bold text-amber-700"
            >
              Secretaria
            </Link>
          </nav>

          {/* Desktop Action Button (Área do Aluno) */}
          <div className="hidden md:flex items-center">
            <Link
              href="/aluno/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
            >
              <User className="w-4 h-4" />
              <span>Área do Aluno</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2.5 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Alternar menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-3 shadow-xl">
          <nav className="flex flex-col space-y-1">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-slate-800 hover:bg-slate-100 font-semibold text-sm flex items-center gap-2"
            >
              <Activity className="w-4 h-4 text-emerald-600" />
              Início
            </Link>
            <Link
              href="/#modalidades"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-slate-800 hover:bg-slate-100 font-semibold text-sm flex items-center gap-2"
            >
              <Award className="w-4 h-4 text-blue-600" />
              Modalidades Esportivas
            </Link>
            <Link
              href="/professor/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-green-700 hover:bg-green-50 font-bold text-sm"
            >
              🟢 Área do Monitor
            </Link>
            <Link
              href="/coordenador/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-blue-700 hover:bg-blue-50 font-bold text-sm"
            >
              🔵 Área do Coordenador
            </Link>
            <Link
              href="/secretaria/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-3.5 py-2.5 rounded-lg text-amber-700 hover:bg-amber-50 font-bold text-sm"
            >
              🟡 Secretaria de Esportes
            </Link>
          </nav>

          <div className="pt-3 border-t border-slate-200">
            <Link
              href="/aluno/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-600 text-white font-bold text-sm shadow-md"
            >
              <User className="w-4 h-4" />
              🔴 Área do Aluno (Inscrições e Carteirinha)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
