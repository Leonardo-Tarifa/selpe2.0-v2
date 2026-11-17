import Link from "next/link";
import Image from "next/image";
import { Phone, Mail, Clock, Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-100 text-slate-700 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          
          {/* Coluna 1: Logo e Sobre a SELPE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <Image
                src="/selpe-logo.jpeg"
                alt="Logo SELPE Peruíbe"
                width={140}
                height={45}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              A Secretaria de Esportes e Lazer de Peruíbe promove a saúde, inclusão social e o desenvolvimento esportivo de munícipes através de modalidades esportivas gratuitas.
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Inscrições Abertas
              </span>
            </div>
          </div>

          {/* Coluna 2: Navegação Rápida do Aluno */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-l-3 border-blue-600 pl-2">
              Navegação Rápida
            </h3>
            <ul className="space-y-2.5 text-xs font-semibold">
              <li>
                <Link href="/" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-700">
                  <span className="text-blue-600">›</span> Início
                </Link>
              </li>
              <li>
                <Link href="/#modalidades" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-700">
                  <span className="text-blue-600">›</span> Modalidades Esportivas
                </Link>
              </li>
              <li>
                <Link href="/aluno/login" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-700">
                  <span className="text-blue-600">›</span> Área do Aluno (Inscrições)
                </Link>
              </li>
              <li>
                <Link href="/aluno/login" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 text-slate-700">
                  <span className="text-blue-600">›</span> Cadastro de Atleta Munícipe
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3: Atendimento SELPE */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 border-l-3 border-emerald-600 pl-2">
              Atendimento SELPE
            </h3>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-900 font-semibold">Segunda a Sexta-feira</p>
                  <p className="text-slate-600">08h00 às 17h00</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-900 font-semibold">Telefone / WhatsApp</p>
                  <p className="text-slate-600">(13) 3451-1000 / Ramal Esportes</p>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-900 font-semibold">E-mail Institucional</p>
                  <p className="text-slate-600">esportes@peruibe.sp.gov.br</p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        {/* Linha de Copyright com link discreto para servidores */}
        <div className="pt-6 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} SELPE Peruíbe. Todos os direitos reservados.</p>
          
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1 text-slate-600 font-medium">
              <span>Desenvolvido para Peruíbe</span>
            </div>

            {/* Link Discreto para Membros da Secretaria */}
            <Link 
              href="/membro/login" 
              className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 text-[11px]"
              title="Acesso de Servidores SELPE"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Acesso Restrito</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
