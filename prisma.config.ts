import "dotenv/config";
import { defineConfig } from "prisma/config";

// Usado apenas pela CLI do Prisma (migrate, studio, db pull, etc).
// O app em runtime NÃO usa este arquivo — ele se conecta via driver
// adapter em src/lib/prisma.ts, usando a connection string com pooling.
//
// DIRECT_URL deve ser a connection string SEM "-pooler" no host (a Neon
// disponibiliza as duas no painel "Connect").
//
// Importante: usamos `process.env.DIRECT_URL` direto (não o helper `env()`
// do Prisma), de propósito. O helper `env()` lança erro já no carregamento
// deste arquivo se a variável não existir — e esse arquivo é carregado por
// QUALQUER comando da CLI, inclusive `prisma generate`, que nem usa essa URL
// (só lê o schema, não conecta a nada). Com `process.env`, falta de
// DIRECT_URL só vira um erro de conexão mais claro quando algo que
// realmente precisa dela (migrate/studio) for executado — `generate`
// continua funcionando mesmo antes do .env existir, como no
// `postinstall` deste projeto.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DIRECT_URL ?? "",
  },
});
