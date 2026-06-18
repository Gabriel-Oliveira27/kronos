"use client";

import { useRouter } from "next/navigation";

const TIPOS = [
  "",
  "LOGIN_SUCESSO",
  "LOGIN_FALHA",
  "LOGOUT",
  "ACESSO_NEGADO",
  "ERRO_API",
  "ERRO_BANCO",
  "SOLICITACAO_CRIADA",
  "ACESSO_CRIADO",
  "ACESSO_EDITADO",
  "SOLICITACAO_REJEITADA",
  "ESCALA_ALTERADA",
  "CONHECIMENTO_EXCLUIDO",
  "PONTO_EXCLUIDO",
  "UPLOAD_FOTO_FALHA",
];

export function FiltroTipoLog({ valorAtual }: { valorAtual: string }) {
  const router = useRouter();
  return (
    <select
      value={valorAtual}
      onChange={(e) => router.push(e.target.value ? `/dashboard/logs?tipo=${e.target.value}` : "/dashboard/logs")}
      className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
    >
      {TIPOS.map((t) => (
        <option key={t} value={t}>
          {t || "Todos os tipos"}
        </option>
      ))}
    </select>
  );
}
