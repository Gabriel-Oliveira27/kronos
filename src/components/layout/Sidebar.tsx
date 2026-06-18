"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import type { Papel } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  papeis?: Papel[];
}

const ITENS_BASE: NavItem[] = [
  { href: "/dashboard", label: "Início" },
  { href: "/dashboard/conhecimento", label: "Base de conhecimento" },
  { href: "/dashboard/ponto", label: "Meu ponto" },
];

const ITENS_ESCALA: NavItem[] = [
  { href: "/dashboard/escalas", label: "Escalas da equipe", papeis: ["CONFIGURADOR_ESCALA", "ADMIN"] },
];

const ITENS_ADMIN: NavItem[] = [
  { href: "/dashboard/usuarios", label: "Usuários", papeis: ["ADMIN", "SUPORTE"] },
  { href: "/dashboard/solicitacoes", label: "Solicitações de acesso", papeis: ["ADMIN"] },
  { href: "/dashboard/logs", label: "Logs", papeis: ["ADMIN", "SUPORTE"] },
  { href: "/dashboard/registros-excluidos", label: "Registros excluídos", papeis: ["ADMIN"] },
];

export function Sidebar({ papel, className }: { papel: Papel; className?: string }) {
  const pathname = usePathname();
  const itensVisiveis = [...ITENS_ESCALA, ...ITENS_ADMIN].filter(
    (item) => !item.papeis || item.papeis.includes(papel)
  );

  function ehAtivo(href: string) {
    return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
  }

  return (
    <nav className={cn("flex h-full flex-col gap-1 p-4", className)}>
      <div className="mb-6 px-2">
        <Logo />
      </div>

      {ITENS_BASE.map((item) => (
        <SidebarLink key={item.href} item={item} ativo={ehAtivo(item.href)} />
      ))}

      {itensVisiveis.length > 0 && (
        <>
          <div className="my-3 border-t border-slate-200 dark:border-slate-800" />
          {itensVisiveis.map((item) => (
            <SidebarLink key={item.href} item={item} ativo={ehAtivo(item.href)} />
          ))}
        </>
      )}
    </nav>
  );
}

function SidebarLink({ item, ativo }: { item: NavItem; ativo: boolean }) {
  return (
    <Link
      href={item.href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        ativo
          ? "bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/20"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      )}
    >
      {item.label}
    </Link>
  );
}
