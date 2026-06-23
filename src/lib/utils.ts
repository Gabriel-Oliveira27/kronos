import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatarData(data: Date | string, padrao = "dd/MM/yyyy"): string {
  const d = typeof data === "string" ? new Date(data) : data;
  return format(d, padrao, { locale: ptBR });
}

export function formatarDataHora(data: Date | string): string {
  return formatarData(data, "dd/MM/yyyy 'às' HH:mm");
}

export const ROTULOS_PAPEL: Record<string, string> = {
  ADMIN: "Administrador",
  SUPORTE: "Suporte",
  CONFIGURADOR_ESCALA: "Configurador de escala",
  USUARIO: "Usuário",
};

export const ROTULOS_TIPO_DIA: Record<string, string> = {
  NORMAL: "Normal",
  PLANTAO: "Plantão",
  HOME_OFFICE: "Home office",
  FOLGA: "Folga",
};

/** Escurece uma cor hex em `fator` (0–1) — usado para o estado :hover do
 * acento customizado por usuário (corDestaque), sem precisar de uma segunda
 * cor cadastrada manualmente. */
export function escurecerHex(hex: string, fator = 0.15): string {
  const limpo = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(limpo)) return hex;
  const num = parseInt(limpo, 16);
  const r = Math.max(0, Math.floor(((num >> 16) & 0xff) * (1 - fator)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0xff) * (1 - fator)));
  const b = Math.max(0, Math.floor((num & 0xff) * (1 - fator)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function inicioDoDia(data: Date): Date {
  // setUTCHours garante meia-noite em UTC, independente do timezone do servidor.
  // setHours usava hora LOCAL: no Brasil (UTC-3) criava 03:00Z em vez de 00:00Z,
  // fazendo a query de upsert não encontrar registros salvos em UTC midnight.
  const d = new Date(data);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function fimDoDia(data: Date): Date {
  const d = new Date(data);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}
