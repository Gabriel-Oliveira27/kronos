# Kronos — Web App

Ecossistema web do Kronos: gestão de usuários, escalas de trabalho (plantão / home office / folga / sábado reduzido) e base de conhecimento da equipe, além da API que o app mobile (Expo/React Native, fora deste repositório) consome para sincronizar o ponto.

Construído a partir do briefing original, com a identidade visual (cores e logo) aplicada exatamente como especificado.

## Stack

- **Next.js 16** (App Router, Turbopack) + React 19 + TypeScript, hospedado na Vercel
- **Prisma 7** como ORM, com **Neon Postgres** serverless via `@prisma/adapter-neon`
- **Autenticação própria**: bcrypt + JWT em cookie httpOnly (sem OAuth de terceiros)
- **Tailwind CSS v4** (config via `@theme` em CSS, não `tailwind.config.js`)
- **Zod v4** para validação de toda entrada de API
- **googleapis** para upload de fotos ao Google Drive via Service Account

Essas são versões correntes no momento em que este repositório foi gerado — bem mais novas do que muita documentação/tutorial em volta ainda reflete (Next 16 trocou `middleware.ts` por `proxy.ts`; Prisma 7 exige driver adapter e não aceita mais `url` direto no `datasource`). Os detalhes que mudam comportamento estão comentados no próprio código onde importam.

## Estrutura

```
prisma/
  schema.prisma       modelo de dados (igual ao briefing, + @@map para nomes de tabela em snake_case)
  seed.ts              cria o primeiro usuário ADMIN
prisma.config.ts        conexão usada pela CLI do Prisma (migrate/studio) — usa DIRECT_URL
src/
  proxy.ts               substituto do middleware.ts no Next 16 — só checa sessão e redireciona
  lib/                    prisma client, auth (hash+JWT), sessão, RBAC, logs, validações zod, drive
  components/
    ui/                   primitivos (Button, Input, Card, Badge, Logo...)
    layout/                shell do dashboard (sidebar, topbar, tema, menu do usuário)
    dashboard/              boards client-side (usuários, escalas, conhecimento, solicitações)
    marketing/               landing page e formulários públicos
  app/
    page.tsx                landing
    login/, solicitar-acesso/
    dashboard/               layout protegido + páginas por funcionalidade
    api/v1/                  todas as rotas de API
```

## Como peguei algumas decisões do briefing

O briefing pede "4 dashboards por papel". Implementei isso como **navegação em camadas** em vez de 4 áreas estanques: todo usuário autenticado (inclusive admin/suporte/configurador) começa com a base comum — própria escala, base de conhecimento, meu ponto — porque toda pessoa no sistema é, antes de tudo, um `Usuario` que também tem escala e pode ter notas de conhecimento. Os papéis elevados ganham seções extras na mesma sidebar (Usuários, Solicitações, Logs, Registros excluídos, Escalas da equipe) em vez de um dashboard isolado. ADMIN vê todas as seções extras, inclusive a do configurador de escala — tratei admin como superusuário, já que o briefing não diz o contrário e operacionalmente parecia um buraco deixar admin sem conseguir corrigir uma escala na ausência do configurador.

Outras decisões registradas no código (procure pelos comentários):
- **Fotos não ficam públicas no Drive.** Em vez do link direto do Google (que já quebrou várias vezes e nunca foi oficialmente suportado), o arquivo fica privado e é servido via proxy autenticado em `GET /api/v1/fotos/[fileId]` — mais alinhado ainda com "usuário final nunca interage com login do Google" do que um link público teria sido.
- **Edição/exclusão de conhecimento é só do autor.** O briefing dá ao admin/suporte visibilidade de privados para auditoria, mas não fala de poder de edição — não estendi essa permissão.
- **EscalaDia usa hard delete, não soft delete.** A regra de soft delete do briefing (seção 6) cita explicitamente "ponto ou conhecimento"; remover um dia de escala errado é operação rotineira do configurador, não uma exclusão sensível.
- **Mudança de papel tem efeito imediato**, não só no próximo login: toda checagem de permissão em rota de API/Server Component busca o papel atual no banco, não confia no claim do JWT.
- Há um `npm run db:seed` porque o briefing não define como o **primeiro** admin é criado (a tela de aprovação de solicitação já pressupõe um admin existente).

## Configuração inicial

```bash
npm install
```

Copie `.env.example` para `.env` e preencha (instruções de cada variável estão comentadas no próprio arquivo):

```bash
cp .env.example .env
```

Você vai precisar, no mínimo:
1. Um projeto Neon (free tier) — copie as duas connection strings (com e sem `-pooler`) para `DATABASE_URL` e `DIRECT_URL`.
2. Um `JWT_SECRET` aleatório (`openssl rand -base64 32`).
3. Uma Service Account do Google com a Drive API ativada, se for usar upload de foto (o resto do app funciona sem isso).

Depois:

```bash
npm run db:migrate    # cria as tabelas no Neon a partir do schema.prisma
npm run db:seed       # cria o primeiro usuário ADMIN (usuário/senha no console)
npm run dev
```

O `npm run build` (e o `postinstall`) já rodam `prisma generate` automaticamente.

## Deploy na Vercel

1. Importe o repositório na Vercel.
2. Configure as mesmas variáveis de ambiente do `.env` (Settings → Environment Variables) — `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, e as três do Google se for usar upload de foto.
3. Build command e install command podem ficar nos defaults (`npm run build` já inclui `prisma generate`).
4. Depois do primeiro deploy, rode `npm run db:migrate` e `npm run db:seed` localmente (apontando para o `.env` com as credenciais de produção) — a Vercel não roda migrations automaticamente.

## Endpoints da API (para o app mobile / integrações futuras)

Todas sob `/api/v1`. Exceto login/logout/solicitação de acesso, todas exigem o cookie de sessão.

| Rota | Método | Observação |
|---|---|---|
| `/auth/login`, `/auth/logout` | POST | público / autenticado |
| `/solicitacoes-acesso` | POST | público |
| `/admin/solicitacoes-acesso` | GET | admin |
| `/admin/solicitacoes-acesso/[id]` | PATCH | admin — `{ status: "rejeitada" }` |
| `/admin/usuarios` | GET, POST | GET: admin+suporte · POST: admin |
| `/admin/usuarios/[id]` | PUT | admin |
| `/usuarios/me` | GET, PATCH | próprio usuário — tema, cor, foto, senha |
| `/escalas` | GET, POST | GET: usuário só lê a própria · POST: configurador/admin |
| `/escalas/[id]` | PUT, DELETE | configurador/admin |
| `/conhecimento` | GET, POST | GET respeita regra de visibilidade · POST: autenticado |
| `/conhecimento/[id]` | PUT, DELETE | só o autor |
| `/sync/registros-ponto` | GET, POST | incremental por `atualizadoEm` (cursor) — usado pelo app mobile |
| `/sync/registros-ponto/[id]` | DELETE | soft delete (com auditoria) |
| `/fotos/upload` | POST | autenticado — `multipart/form-data`, campo `arquivo` |
| `/fotos/[fileId]` | GET | autenticado — proxy do conteúdo do Drive |
| `/admin/logs` | GET | admin+suporte |
| `/admin/registros-excluidos` | GET | admin |

## O que validei antes de entregar

Não tive acesso a um Neon real nem à internet liberada para baixar o engine de schema do Prisma neste ambiente de geração — então validei o equivalente:
- Aplicação manual do DDL (traduzido 1:1 do `schema.prisma`) num Postgres real, incluindo enums, índices e `String[]`/`Json`.
- As regras de negócio mais delicadas (visibilidade de conhecimento, soft delete + auditoria em transação, sync incremental por timestamp) testadas com dados reais nesse mesmo banco.
- Hash de senha (bcrypt) e assinatura/verificação de JWT (jose) executados de ponta a ponta, incluindo rejeição de assinatura inválida.
- Build completo do Next (`next build`) e smoke test em runtime (`next start` + requisições reais) usando um client do Prisma "dublê" só para conseguir compilar sem o engine — isso pegou e corrigiu dois bugs reais (um de tipos no wrapper de erro das rotas, outro de tipos estritos num componente) e uma chave de config do Turbopack que tinha mudado de lugar entre versões do Next.

O que isso **não** cobre: uma migration de verdade contra o Neon e o fluxo de upload pro Google Drive (ambos exigem credenciais que só vocês têm). Vale rodar `npm run db:migrate` e testar o upload de foto com atenção no primeiro uso.

## Limitações conhecidas / próximos passos sugeridos

- Sem rate limiting no login (o briefing não pediu, mas é uma adição barata e recomendável antes de produção real).
- Sem paginação nas listagens (usuários, logs, conhecimento) — não é problema com poucas dezenas/centenas de registros, mas vale revisar se a equipe crescer bastante.
- Sem página de "meu perfil" para o próprio usuário trocar senha/foto/cor de destaque pela UI — a rota de API (`PATCH /usuarios/me`) já existe e suporta isso, falta só a tela.
- Lint (ESLint) não foi configurado neste repositório.
