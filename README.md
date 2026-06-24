# Kronos — Web App

Central web do Kronos: **gestão de usuários, escalas de trabalho, controle de ponto e base de
conhecimento** da equipe — além da **API** que o app mobile (Expo/React Native) consome para
sincronizar o ponto. Inclui também uma **escala pública** (somente leitura, protegida por palavra
secreta) e uma landing page.

> 📚 Documentação detalhada em [`docs/`](docs/):
> - [`docs/endpoints.md`](docs/endpoints.md) — referência completa da API.
> - [`docs/learn.md`](docs/learn.md) — guia de arquitetura/onboarding (pessoas **e** agentes de IA).
> - [`docs/otimizar.md`](docs/otimizar.md) — backlog de otimizações e melhorias.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** — hospedado na Vercel.
- **Prisma 7** + **Neon Postgres** (serverless) via `@prisma/adapter-neon` (driver adapter obrigatório).
- **Autenticação própria**: `bcryptjs` (hash) + **JWT** (`jose`) em cookie httpOnly. Sem OAuth de terceiros.
- **Tailwind CSS v4** — configurado via `@theme` em `src/app/globals.css` (não há `tailwind.config.js`).
- **Zod v4** — validação de toda entrada de API.
- **Cloudinary** — upload e hospedagem de fotos de perfil (URL pública direta).
- **Exportação de escala**: `exceljs` (xlsx, no servidor) + `jspdf`/`jspdf-autotable` + `html-to-image` (PDF/PNG, no cliente, via import dinâmico).

> ⚠️ Versões recentes mudam comportamento: o Next 16 trocou `middleware.ts` por **`src/proxy.ts`**;
> o Prisma 7 **exige driver adapter** e não aceita mais `url` direto no `datasource`. Os pontos que
> mudam comportamento estão comentados no próprio código.

## Funcionalidades

- **Autenticação e papéis** (`ADMIN`, `SUPORTE`, `CONFIGURADOR_ESCALA`, `USUARIO`) com RBAC checado
  sempre contra o banco (mudança de papel tem efeito imediato). Usuário desativado é bloqueado em
  login e API.
- **Escalas da equipe** (configurador/admin): calendário mensal editável + **visão de fim de semana**
  (estilo planilha: Plantão FDS / Sábado Expediente / Sábado de Folga) + **exportação** em Excel, PDF e PNG.
- **Meu ponto**: registro de batidas e **cálculo de saldo** (semana de 44h = 8h × seg–sex + 4h sábado;
  Sábado de Folga gera −4h; plantão e home office são abonados).
- **Base de conhecimento**: itens públicos/privados (admin/suporte veem todos), grid de 3 colunas,
  toggle cadeado→público.
- **Modelos de horário** reutilizáveis, com avisos por dia da semana.
- **Auditoria**: aba unificada de logs (alterações + acessos/erros) e registros excluídos.
- **Temas** claro / escuro / noturno, com cores personalizáveis por usuário (principal, texto, bordas,
  item ativo, secundária) e seletor visual de cor. Resolvido antes da pintura (sem flicker) e persistido.
- **Escala pública** por palavra secreta e **landing page**.
- **Kronos App**: download direto do APK (`public/kronos.apk`) e sincronização de ponto via API.

## Estrutura

```
prisma/
  schema.prisma          modelo de dados (tabelas em snake_case via @@map)
  seed.ts                cria o primeiro usuário ADMIN (variáveis ADMIN_*)
prisma.config.ts         conexão da CLI do Prisma (migrate/studio) — usa DIRECT_URL
src/
  proxy.ts               substituto do middleware no Next 16 — só checa sessão e redireciona
  lib/                    prisma, auth (bcrypt+JWT), session, rbac, api (wrapper de erro),
                          validations (zod), log, cloudinary, utils
  components/
    ui/                   primitivos (Button, Input, Field, Card/Badge, Logo, ColorPicker, ...)
    layout/               shell do dashboard (Sidebar, Topbar, ThemeToggle, PerfilDropdown, overlays)
    dashboard/            boards client-side (Usuários, Escalas, FimDeSemana, Ponto, Conhecimento,
                          ModelosHorario, Auditoria, ...)
    marketing/            landing (HeroMockup) e formulários públicos
  app/
    page.tsx              landing
    login/, solicitar-acesso/, escala/   páginas públicas
    dashboard/            layout protegido + páginas por funcionalidade
    api/v1/               todas as rotas de API
docs/                     endpoints.md · learn.md · otimizar.md
```

## Configuração inicial

```bash
npm install
```

Crie um `.env` na raiz com:

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Neon **com** pooling (host `-pooler`) — usado em runtime serverless |
| `DIRECT_URL` | Neon **sem** pooling — usado pela CLI do Prisma (migrate/studio) |
| `JWT_SECRET` | string aleatória longa (`openssl rand -base64 32`) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | upload de fotos (opcional; o resto funciona sem) |
| `PALAVRA_SECRETA_ESCALA` | palavra que libera a escala pública (`/escala`) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_NOME`, `ADMIN_SETOR` | usados pelo `db:seed` para criar o 1º admin |

Depois:

```bash
npm run db:migrate    # cria as tabelas no Neon a partir do schema.prisma
npm run db:seed       # cria o primeiro usuário ADMIN
npm run dev           # http://localhost:3000
```

`npm run build` e o `postinstall` já rodam `prisma generate` automaticamente.

> ⚠️ **Não** rode `npm run build` com o `npm run dev` ativo: o build de produção sobrescreve o `.next`
> do dev e causa **404 em todas as telas**. Se acontecer: pare o dev, `rm -rf .next` e suba o dev de novo.

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento (Turbopack) |
| `npm run build` / `npm start` | build de produção / servir |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:deploy` | `prisma migrate deploy` (produção) |
| `npm run db:seed` | cria o primeiro admin |
| `npm run db:studio` | Prisma Studio |

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure as mesmas variáveis do `.env` (Settings → Environment Variables).
3. Build e install ficam nos defaults (`npm run build` já inclui `prisma generate`).
4. Após o 1º deploy, rode `npm run db:deploy` apontando para o banco de produção (a Vercel não roda migrations sozinha).

## Decisões e regras de negócio (resumo)

- **Papéis em camadas**, não 4 dashboards estanques: todo usuário tem a base (própria escala, ponto,
  conhecimento) e papéis elevados ganham seções extras na mesma sidebar. ADMIN é superusuário.
- **Fuso horário**: datas são salvas/consultadas em **UTC explícito** (strings ISO `...T00:00:00.000Z`)
  para não pular registros gravados em meia-noite UTC. Veja os comentários `FIX TIMEZONE`.
- **EscalaDia** = um tipo por usuário/dia (`NORMAL | PLANTAO | HOME_OFFICE | FOLGA`), hard delete.
- **Sábado**: vale 4h; Folga no sábado não pode ser escalada como presencial (bloqueio na UI e na API).
- **Conhecimento**: edição/exclusão só do autor; admin/suporte **veem** privados de todos (auditoria).
- **Sync de ponto**: incremental por `atualizadoEm` (cursor); o `usuarioId` é sempre o do dono.

Detalhes acionáveis (segurança, performance, dependências) estão em [`docs/otimizar.md`](docs/otimizar.md).
