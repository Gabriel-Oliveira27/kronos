"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import type { Papel } from "@prisma/client";

interface NavItem { href: string; label: string; papeis?: Papel[]; icone: React.ReactNode }

const icone = (path: string, extra?: string) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("h-4 w-4 shrink-0", extra)}>
    <path d={path} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ICONES = {
  home:        icone("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11 2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6"),
  knowledge:   icone("M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25"),
  clock:       icone("M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"),
  users:       icone("M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"),
  calendar:    icone("M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"),
  requests:    icone("M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9 2 2 4-4"),
  logs:        icone("M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 0 0-1.883 2.542l.857 6a2.25 2.25 0 0 0 2.227 1.932H19.05a2.25 2.25 0 0 0 2.227-1.932l.857-6a2.25 2.25 0 0 0-1.883-2.542m-16.5 0V6A2.25 2.25 0 0 1 6 3.75h3.879a1.5 1.5 0 0 1 1.06.44l2.122 2.12a1.5 1.5 0 0 0 1.06.44H18A2.25 2.25 0 0 1 20.25 9v.776"),
  trash:       icone("M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"),
  schedule:    icone("M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5m18 7.5v-7.5m-9-3.75h.008v.008H12v-.008Z"),
  phone:       icone("M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"),
  model:       icone("M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"),
  tag:         icone("M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z M6 6h.008v.008H6V6Z"),
};

const ITENS_BASE: NavItem[] = [
  { href: "/dashboard",             label: "Início",              icone: ICONES.home },
  { href: "/dashboard/conhecimento",label: "Base de conhecimento",icone: ICONES.knowledge },
  { href: "/dashboard/ponto",       label: "Meu ponto",           icone: ICONES.clock },
];

const ITENS_ESCALA: NavItem[] = [
  // Escala visível para todos: usuário comum vê o(s) próprio(s) setor(es) em
  // modo somente leitura; configurador/admin editam.
  { href: "/dashboard/escalas",       label: "Escalas da equipe",  icone: ICONES.schedule },
  { href: "/dashboard/modelos-horario",label: "Modelos de horário", icone: ICONES.model,    papeis: ["CONFIGURADOR_ESCALA","ADMIN"] },
];

const ITENS_ADMIN: NavItem[] = [
  { href: "/dashboard/usuarios",          label: "Usuários",              icone: ICONES.users,    papeis: ["ADMIN","SUPORTE"] },
  { href: "/dashboard/setores",           label: "Setores",               icone: ICONES.tag,      papeis: ["ADMIN"] },
  { href: "/dashboard/solicitacoes",      label: "Solicitações de acesso",icone: ICONES.requests, papeis: ["ADMIN"] },
  { href: "/dashboard/logs",              label: "Auditoria",             icone: ICONES.logs,     papeis: ["ADMIN","SUPORTE"] },
];

const ITENS_APP: NavItem[] = [
  { href: "/dashboard/kronos-app", label: "Kronos App", icone: ICONES.phone, papeis: ["ADMIN","SUPORTE","CONFIGURADOR_ESCALA","USUARIO"] },
];

export function Sidebar({ papel, className }: { papel: Papel; className?: string }) {
  const pathname = usePathname();
  const ehAtivo = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const filtrar = (itens: NavItem[]) =>
    itens.filter((i) => !i.papeis || i.papeis.includes(papel));

  const itensEscala = filtrar(ITENS_ESCALA);
  const itensAdmin  = filtrar(ITENS_ADMIN);
  const itensApp    = filtrar(ITENS_APP);

  return (
    <nav className={cn("flex h-full flex-col gap-0.5 p-3", className)}>
      <div className="mb-5 px-2 pt-1">
        <Logo />
      </div>

      {ITENS_BASE.map((item) => <SidebarLink key={item.href} item={item} ativo={ehAtivo(item.href)} />)}

      {itensEscala.length > 0 && (
        <>
          <Divider label="Escalas" />
          {itensEscala.map((item) => <SidebarLink key={item.href} item={item} ativo={ehAtivo(item.href)} />)}
        </>
      )}

      {itensAdmin.length > 0 && (
        <>
          <Divider label="Administração" />
          {itensAdmin.map((item) => <SidebarLink key={item.href} item={item} ativo={ehAtivo(item.href)} />)}
        </>
      )}

      {itensApp.length > 0 && (
        <>
          <Divider label="App" />
          {itensApp.map((item) => <SidebarLink key={item.href} item={item} ativo={ehAtivo(item.href)} />)}
        </>
      )}
    </nav>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="mt-3 mb-1 px-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-600">{label}</p>
    </div>
  );
}

function SidebarLink({ item, ativo }: { item: NavItem; ativo: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        ativo
          ? "bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      )}
    >
      {item.icone}
      {item.label}
    </Link>
  );
}
