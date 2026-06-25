import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirUsuario, exigirPapel } from "@/lib/rbac";
import { configAppSchema } from "@/lib/validations";
import { comTratamentoDeErro } from "@/lib/api";
import { registrarEvento } from "@/lib/log";

/** Configuração padrão (quando ainda não há nenhuma salva). */
const CONFIG_PADRAO = {
  notificacoes: {
    titulo: "",
    lead: { entrada: "", saida_almoco: "", retorno_almoco: "", saida_final: "" },
    confirm: { entrada: "", saida_almoco: "", retorno_almoco: "", saida_final: "" },
    botoes: { confirm: "", notYet: "", snooze: "" },
  },
  aleatorias: { ativo: false, quantidadePorDia: 0, horaInicio: 8, horaFim: 18, mensagens: [] as string[] },
};

/**
 * GET — qualquer usuário autenticado lê a config global (o app usa nos
 * lembretes/notificações). PUT — somente ADMIN (Dev Area) atualiza.
 */
export const GET = comTratamentoDeErro(async () => {
  await exigirUsuario();
  const row = await prisma.configuracaoApp.findUnique({ where: { id: "global" } });
  return NextResponse.json(row?.config ?? CONFIG_PADRAO);
});

export const PUT = comTratamentoDeErro(async (request: NextRequest) => {
  const admin = await exigirPapel("ADMIN");
  const dados = configAppSchema.parse(await request.json());
  // Normaliza para JSON puro (Prisma 7 exige isso no campo Json).
  const config = JSON.parse(JSON.stringify(dados));

  const salvo = await prisma.configuracaoApp.upsert({
    where: { id: "global" },
    create: { id: "global", config, atualizadoPorId: admin.id },
    update: { config, atualizadoPorId: admin.id },
  });

  await registrarEvento({ tipo: "CONFIG_APP_ALTERADA", usuarioId: admin.id });
  return NextResponse.json(salvo.config);
});
