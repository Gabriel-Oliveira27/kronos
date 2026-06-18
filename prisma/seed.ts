import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

// Script standalone (roda via `npm run db:seed`, fora do runtime do
// Next.js) — por isso instancia o próprio PrismaClient em vez de importar
// de src/lib/prisma.ts, evitando depender de alias de path em tempo de
// execução do tsx.

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida. Configure o .env antes de rodar o seed.");
  }

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const username = process.env.ADMIN_USERNAME ?? "admin";
  const senha = process.env.ADMIN_PASSWORD ?? "kronos123";
  const nomeCompleto = process.env.ADMIN_NOME ?? "Administrador Kronos";
  const setor = process.env.ADMIN_SETOR ?? "TI";

  const existente = await prisma.usuario.findUnique({ where: { username } });
  if (existente) {
    console.log(`Usuário admin "${username}" já existe (id ${existente.id}) — nada a fazer.`);
    await prisma.$disconnect();
    return;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const admin = await prisma.usuario.create({
    data: { nomeCompleto, setor, username, senhaHash, papel: "ADMIN" },
  });

  console.log("Usuário ADMIN criado com sucesso:");
  console.log(`  usuário: ${admin.username}`);
  console.log(`  senha:   ${senha}`);
  console.log("Troque essa senha assim que possível (defina ADMIN_PASSWORD no .env antes do primeiro seed para usar outra).");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
