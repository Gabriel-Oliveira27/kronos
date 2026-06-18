import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { usuarioAtual } from "@/lib/session";
import { EscalasBoard } from "@/components/dashboard/EscalasBoard";
import { Button } from "@/components/ui/Button";

function diasDoMes(ano: number, mes: number): string[] {
  const ultimo = new Date(ano, mes, 0).getDate();
  return Array.from({ length: ultimo }, (_, i) => {
    const d = String(i + 1).padStart(2, "0");
    const m = String(mes).padStart(2, "0");
    return `${ano}-${m}-${d}`;
  });
}

function nomeMes(ano: number, mes: number): string {
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function moverMes(mesParam: string, delta: number): string {
  const [ano, mes] = mesParam.split("-").map(Number);
  const d = new Date(ano, mes - 1 + delta, 1);
  const novoAno = d.getFullYear();
  const novoMes = d.getMonth() + 1;
  return `${novoAno}-${String(novoMes).padStart(2, "0")}`;
}

export default async function EscalasPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const usuario = await usuarioAtual();
  if (!usuario) return null;

  if (usuario.papel !== "CONFIGURADOR_ESCALA" && usuario.papel !== "ADMIN") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Esta área é exclusiva do configurador de escala e de administradores.
        </p>
      </div>
    );
  }

  const params = await searchParams;

  // Determina o mês ativo (padrão: mês atual)
  const hoje = new Date();
  const mesDefault = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const mesAtivo = params.mes && /^\d{4}-\d{2}$/.test(params.mes) ? params.mes : mesDefault;

  const [anoAtivo, mesNumero] = mesAtivo.split("-").map(Number);

  const inicio = new Date(anoAtivo, mesNumero - 1, 1);
  const fim = new Date(anoAtivo, mesNumero, 0, 23, 59, 59, 999);
  const dias = diasDoMes(anoAtivo, mesNumero);

  const mesAnterior = moverMes(mesAtivo, -1);
  const mesSeguinte = moverMes(mesAtivo, 1);

  const [usuarios, escalas] = await Promise.all([
    prisma.usuario.findMany({
      orderBy: { nomeCompleto: "asc" },
      select: { id: true, nomeCompleto: true, setor: true, temApp: true },
    }),
    prisma.escalaDia.findMany({
      where: { data: { gte: inicio, lte: fim } },
      select: { id: true, usuarioId: true, data: true, tipo: true, observacao: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Cabeçalho com navegação de mês */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold capitalize text-slate-900 dark:text-white">
            {nomeMes(anoAtivo, mesNumero)}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Escala da equipe — {usuarios.length} colaborador(es)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/escalas?mes=${mesAnterior}`}>
            <Button variant="outline" size="sm">
              ← Mês anterior
            </Button>
          </Link>
          <Link href="/dashboard/escalas">
            <Button variant="ghost" size="sm">
              Mês atual
            </Button>
          </Link>
          <Link href={`/dashboard/escalas?mes=${mesSeguinte}`}>
            <Button variant="outline" size="sm">
              Próximo mês →
            </Button>
          </Link>
        </div>
      </div>

      <EscalasBoard
        usuarios={usuarios}
        escalasIniciais={JSON.parse(JSON.stringify(escalas))}
        diasDoMes={dias}
      />
    </div>
  );
}
