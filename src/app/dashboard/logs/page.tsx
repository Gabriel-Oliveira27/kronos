import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { ROTULOS_PAPEL, ROTULOS_TIPO_DIA } from "@/lib/utils";
import { AuditoriaBoard, type ItemLog } from "@/components/dashboard/AuditoriaBoard";

type Tom = ItemLog["tom"];

// Eventos de "mudança" — vão para a aba Auditoria.
const TIPOS_AUDITORIA = [
  "ACESSO_CRIADO",
  "ACESSO_EDITADO",
  "SOLICITACAO_CRIADA",
  "SOLICITACAO_REJEITADA",
  "ESCALA_ALTERADA",
  "CONHECIMENTO_EXCLUIDO",
  "PONTO_EXCLUIDO",
];

// Acessos e erros — vão para a aba "Acessos & Erros".
const TIPOS_SISTEMA = [
  "LOGIN_SUCESSO",
  "LOGIN_FALHA",
  "LOGOUT",
  "ACESSO_NEGADO",
  "ERRO_API",
  "ERRO_BANCO",
  "UPLOAD_FOTO_FALHA",
];

const ROTULO_TIPO: Record<string, string> = {
  ACESSO_CRIADO: "Usuário criado",
  ACESSO_EDITADO: "Usuário editado",
  SOLICITACAO_CRIADA: "Solicitação",
  SOLICITACAO_REJEITADA: "Solicitação rejeitada",
  ESCALA_ALTERADA: "Escala alterada",
  CONHECIMENTO_EXCLUIDO: "Conhecimento excluído",
  PONTO_EXCLUIDO: "Ponto excluído",
  REGISTRO_EXCLUIDO: "Registro excluído",
  LOGIN_SUCESSO: "Login",
  LOGIN_FALHA: "Falha de login",
  LOGOUT: "Logout",
  ACESSO_NEGADO: "Acesso negado",
  ERRO_API: "Erro de API",
  ERRO_BANCO: "Erro de banco",
  UPLOAD_FOTO_FALHA: "Upload de foto",
};

const TOM_TIPO: Record<string, Tom> = {
  ACESSO_CRIADO: "green",
  ACESSO_EDITADO: "blue",
  SOLICITACAO_CRIADA: "blue",
  SOLICITACAO_REJEITADA: "amber",
  ESCALA_ALTERADA: "blue",
  CONHECIMENTO_EXCLUIDO: "amber",
  PONTO_EXCLUIDO: "amber",
  REGISTRO_EXCLUIDO: "amber",
  LOGIN_SUCESSO: "green",
  LOGIN_FALHA: "red",
  LOGOUT: "slate",
  ACESSO_NEGADO: "red",
  ERRO_API: "red",
  ERRO_BANCO: "red",
  UPLOAD_FOTO_FALHA: "red",
};

function obj(detalhe: unknown): Record<string, unknown> {
  return detalhe && typeof detalhe === "object" ? (detalhe as Record<string, unknown>) : {};
}

function descreverAuditoria(tipo: string, detalhe: unknown, nomePor: Record<string, string>): string {
  const d = obj(detalhe);
  const nome = (id: unknown) => nomePor[String(id)] ?? String(id ?? "");
  switch (tipo) {
    case "ACESSO_CRIADO":
      return `${nome(d.usuarioCriadoId)} • papel ${ROTULOS_PAPEL[String(d.papel)] ?? d.papel}`;
    case "ACESSO_EDITADO":
      return `${nome(d.usuarioEditadoId)}${Array.isArray(d.campos) ? ` • campos: ${(d.campos as string[]).join(", ")}` : ""}`;
    case "SOLICITACAO_CRIADA":
      return String(d.nomeCompleto ?? "");
    case "SOLICITACAO_REJEITADA":
      return `solicitação ${d.solicitacaoId ?? ""}`;
    case "ESCALA_ALTERADA": {
      const alvo = nome(d.usuarioDestino);
      const acao = d.acao === "remocao" ? "remoção" : d.tipo ? (ROTULOS_TIPO_DIA[String(d.tipo)] ?? String(d.tipo)) : "";
      return `${alvo}${acao ? ` • ${acao}` : ""}`;
    }
    case "CONHECIMENTO_EXCLUIDO":
      return `item ${d.itemId ?? ""}`;
    case "PONTO_EXCLUIDO":
      return `registro ${d.id ?? ""}`;
    default:
      return "";
  }
}

function descreverSistema(tipo: string, detalhe: unknown): string {
  const d = obj(detalhe);
  if (tipo === "LOGIN_FALHA") return d.username ? `usuário "${d.username}"` : "";
  if (tipo === "ERRO_API" || tipo === "ERRO_BANCO" || tipo === "UPLOAD_FOTO_FALHA") return String(d.mensagem ?? "");
  return "";
}

export default async function LogsPage() {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  if (usuario.papel !== "ADMIN" && usuario.papel !== "SUPORTE") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Esta área é exclusiva de administradores e suporte.
        </p>
      </div>
    );
  }

  const ehAdmin = usuario.papel === "ADMIN";

  const [auditLogs, sistemaLogs, registrosExcluidos] = await Promise.all([
    prisma.logEvento.findMany({
      where: { tipo: { in: TIPOS_AUDITORIA } },
      orderBy: { criadoEm: "desc" },
      take: 150,
      include: { usuario: { select: { nomeCompleto: true } } },
    }),
    prisma.logEvento.findMany({
      where: { tipo: { in: TIPOS_SISTEMA } },
      orderBy: { criadoEm: "desc" },
      take: 150,
      include: { usuario: { select: { nomeCompleto: true } } },
    }),
    // Exclusões (soft delete) só são auditáveis por administradores.
    ehAdmin
      ? prisma.registroExcluido.findMany({ orderBy: { excluidoEm: "desc" }, take: 150 })
      : Promise.resolve([] as { id: string; tabelaOrigem: string; registroId: string; excluidoPorId: string; excluidoEm: Date }[]),
  ]);

  // Resolve os nomes dos usuários referenciados nos detalhes / como autores.
  const idsAlvo = new Set<string>();
  for (const l of auditLogs) {
    const d = obj(l.detalhe);
    for (const k of ["usuarioCriadoId", "usuarioEditadoId", "usuarioDestino"]) {
      if (d[k]) idsAlvo.add(String(d[k]));
    }
  }
  for (const r of registrosExcluidos) idsAlvo.add(r.excluidoPorId);

  const nomes =
    idsAlvo.size > 0
      ? await prisma.usuario.findMany({ where: { id: { in: [...idsAlvo] } }, select: { id: true, nomeCompleto: true } })
      : [];
  const nomePor: Record<string, string> = {};
  nomes.forEach((u) => (nomePor[u.id] = u.nomeCompleto));

  const auditoria: ItemLog[] = [
    ...auditLogs.map((l) => ({
      id: l.id,
      rotulo: ROTULO_TIPO[l.tipo] ?? l.tipo,
      tom: TOM_TIPO[l.tipo] ?? "slate",
      descricao: descreverAuditoria(l.tipo, l.detalhe, nomePor),
      ator: l.usuario?.nomeCompleto ?? "Sistema",
      quando: l.criadoEm.toISOString(),
    })),
    ...registrosExcluidos.map((r) => ({
      id: `re_${r.id}`,
      rotulo: ROTULO_TIPO.REGISTRO_EXCLUIDO,
      tom: "amber" as Tom,
      descricao: `${r.tabelaOrigem} • registro ${r.registroId}`,
      ator: nomePor[r.excluidoPorId] ?? r.excluidoPorId,
      quando: r.excluidoEm.toISOString(),
    })),
  ].sort((a, b) => b.quando.localeCompare(a.quando));

  const sistema: ItemLog[] = sistemaLogs.map((l) => ({
    id: l.id,
    rotulo: ROTULO_TIPO[l.tipo] ?? l.tipo,
    tom: TOM_TIPO[l.tipo] ?? "slate",
    descricao: descreverSistema(l.tipo, l.detalhe),
    ator: l.usuario?.nomeCompleto ?? "—",
    quando: l.criadoEm.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-slate-900 dark:text-white">Auditoria</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Alterações de usuários, escalas e exclusões — e os acessos e erros do sistema.
        </p>
      </div>
      <AuditoriaBoard auditoria={auditoria} sistema={sistema} />
    </div>
  );
}
