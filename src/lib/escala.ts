// Regras e etiquetas de escala compartilhadas entre servidor e cliente.
// (Sem "server-only": os componentes do board usam tudo isso no browser.)

/** Comportamentos base de um dia de escala. A etiqueta dá o nome/cor; o tipo
 * dá o comportamento (par de fim de semana, restrição de domingo, folga...).
 * HOME_OFFICE é legado: dias antigos ainda existem no banco, mas a UI não
 * oferece mais. */
export type TipoBaseEscala = "NORMAL" | "PLANTAO" | "FOLGA" | "DOMINGO_EFETIVO";

export interface EtiquetaEscala {
  id: string;
  nome: string;
  /** Cor em hex (#rrggbb) usada no ring do avatar, botões e legenda. */
  cor: string;
  tipo: TipoBaseEscala;
}

/** Conjunto padrão de etiquetas de um setor sem personalização. */
export const ETIQUETAS_PADRAO: EtiquetaEscala[] = [
  { id: "normal",   nome: "Normal",            cor: "#94a3b8", tipo: "NORMAL" },
  { id: "plantao",  nome: "Plantão",           cor: "#3b82f6", tipo: "PLANTAO" },
  { id: "sab-exp",  nome: "Sábado expediente", cor: "#14b8a6", tipo: "NORMAL" },
  { id: "dom-efet", nome: "Domingo efetivo",   cor: "#8b5cf6", tipo: "DOMINGO_EFETIVO" },
  { id: "folga",    nome: "Folga",             cor: "#fbbf24", tipo: "FOLGA" },
];

/** Etiqueta usada só para exibir dias legados de home office. */
export const ETIQUETA_LEGADO_HO: EtiquetaEscala = {
  id: "legado-ho", nome: "Home office (antigo)", cor: "#22c55e", tipo: "NORMAL",
};

/** Normaliza o JSON salvo em Setor.etiquetas; null/inválido → padrão. */
export function etiquetasDoSetor(json: unknown): EtiquetaEscala[] {
  if (!Array.isArray(json) || json.length === 0) return ETIQUETAS_PADRAO;
  const validas = json.filter(
    (e): e is EtiquetaEscala =>
      !!e && typeof e === "object" &&
      typeof (e as EtiquetaEscala).id === "string" &&
      typeof (e as EtiquetaEscala).nome === "string" &&
      typeof (e as EtiquetaEscala).cor === "string" &&
      ["NORMAL", "PLANTAO", "FOLGA", "DOMINGO_EFETIVO"].includes((e as EtiquetaEscala).tipo)
  );
  return validas.length > 0 ? validas : ETIQUETAS_PADRAO;
}

/** Resolve a etiqueta de um dia salvo: primeiro pelo etiquetaId, senão pela
 * primeira etiqueta com o mesmo tipo base, senão um fallback legível. */
export function resolverEtiqueta(
  etiquetas: EtiquetaEscala[],
  etiquetaId: string | null | undefined,
  tipo: string
): EtiquetaEscala {
  if (etiquetaId) {
    const porId = etiquetas.find((e) => e.id === etiquetaId);
    if (porId) return porId;
  }
  if (tipo === "HOME_OFFICE") return ETIQUETA_LEGADO_HO;
  const porTipo = etiquetas.find((e) => e.tipo === tipo);
  if (porTipo) return porTipo;
  return { id: `tipo-${tipo}`, nome: tipo, cor: "#94a3b8", tipo: "NORMAL" };
}

/** Sigla curta (3 letras, sem acento) derivada do nome da etiqueta. */
export function siglaEtiqueta(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 3)
    .toUpperCase() || "?";
}

// ── Datas (tudo em UTC para casar com o armazenamento em UTC midnight) ──

export function diaDaSemanaUTC(dataISO: string): number {
  return new Date(dataISO.slice(0, 10) + "T12:00:00Z").getUTCDay();
}

export function somarDias(dataISO: string, dias: number): string {
  const d = new Date(dataISO.slice(0, 10) + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Para um sábado ou domingo, devolve o par {sab, dom} do mesmo fim de
 * semana; para outros dias devolve null. */
export function parFimDeSemana(dataISO: string): { sab: string; dom: string } | null {
  const dia = diaDaSemanaUTC(dataISO);
  if (dia === 6) return { sab: dataISO.slice(0, 10), dom: somarDias(dataISO, 1) };
  if (dia === 0) return { sab: somarDias(dataISO, -1), dom: dataISO.slice(0, 10) };
  return null;
}

/** Sábado do fim de semana SEGUINTE a um dia útil (a "semana de plantão" de
 * um plantão no dia 11-12 é a segunda a sexta dos dias 6-10). Para sáb/dom,
 * devolve o sábado do próprio fim de semana. */
export function sabadoDaSemana(dataISO: string): string {
  const dia = diaDaSemanaUTC(dataISO);
  if (dia === 6) return dataISO.slice(0, 10);
  if (dia === 0) return somarDias(dataISO, -1);
  return somarDias(dataISO, 6 - dia);
}

/** Formata horas decimais como "7h30". */
export function formatarJornada(horas: number): string {
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
