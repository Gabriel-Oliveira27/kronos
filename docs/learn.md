# Guia de trabalho no Kronos Web (para agentes e devs)

Este documento ensina **como trabalhar neste código**: a arquitetura, os padrões que se repetem,
as regras de negócio que não dá pra adivinhar e as pegadinhas que já morderam. Leia antes de editar.
Idioma do código: **português** (nomes de variáveis, funções, comentários, mensagens).

---

## 1. Mental model em uma frase

App **Next.js 16 (App Router)** com **Server Components** que falam direto com o **Prisma/Neon**, e
**Client Components** (`"use client"`) chamados de "boards" para a interatividade. A API REST em
`src/app/api/v1/**` serve o próprio front **e** o app mobile. Autenticação por **JWT em cookie httpOnly**.

Regra de ouro: **decisão de permissão é sempre contra o banco** (papel atual), nunca contra o token.

---

## 2. Stack e armadilhas de versão (não "corrigir" achando que é bug)

- **Next 16**: não existe `middleware.ts` — o equivalente é **`src/proxy.ts`** (roda em Node, só checa
  sessão e redireciona; matcher só cobre `/dashboard` e `/login`). Permissão fina fica nas rotas/páginas.
- **Prisma 7**: exige **driver adapter**. O client é criado em `src/lib/prisma.ts` com `PrismaNeon` e
  `DATABASE_URL` (string **com** `-pooler`). Não tente `new PrismaClient()` puro nem `url` no datasource.
- **Tailwind v4**: configuração via `@theme` dentro de `src/app/globals.css`. **Não existe**
  `tailwind.config.js`. Cores de marca e tokens de tema são CSS vars (ver seção 8).
- **React 19 + Server Components**: páginas em `app/**/page.tsx` são server por padrão; só vira client
  com `"use client"`. Componentes client podem ser importados em server components (ex.: a landing
  importa `ThemeToggle`).

---

## 3. Mapa do repositório (onde mexer)

- `src/lib/` — núcleo:
  - `prisma.ts` (singleton do client), `auth.ts` (bcrypt + JWT `jose`), `session.ts`
    (`usuarioAtual`, cookies), `rbac.ts` (`exigirUsuario`, `exigirPapel`), `api.ts`
    (`comTratamentoDeErro`, `ApiError`), `validations.ts` (schemas Zod), `log.ts` (`registrarEvento`),
    `cloudinary.ts` (upload de foto), `utils.ts` (`cn`, datas, `ROTULOS_*`, `horarioDoTipo`, `escurecerHex`).
- `src/app/api/v1/**/route.ts` — rotas de API (sempre via `comTratamentoDeErro`).
- `src/app/dashboard/**/page.tsx` — páginas protegidas (server) que buscam dados e passam para um board.
- `src/components/dashboard/*Board.tsx` — UI interativa client (recebe dados iniciais como props).
- `src/components/ui/` — primitivos reutilizáveis. **Reuse-os** em vez de criar inputs/botões novos.
- `src/components/layout/` — `DashboardShell` (sidebar + topbar + overlays), `Sidebar`,
  `ThemeToggle`, `PerfilDropdown`, `NavLoadingOverlay`.

Padrão de página de dashboard: **page (server)** valida papel + busca via Prisma →
`JSON.parse(JSON.stringify(...))` para serializar Dates → passa para o **board (client)**.

---

## 4. Modelo de domínio (Prisma — `prisma/schema.prisma`)

- `Usuario` — `papel` (enum `Papel`), `ativo`, `temApp`, `fotoUrl`, `temaBase`, `corDestaque`,
  `temaConfig` (Json), `modeloHorarioId`.
- `EscalaDia` — **um tipo por usuário/dia**; `tipo` (enum `TipoDiaEscala`: `NORMAL | PLANTAO |
  HOME_OFFICE | FOLGA`). Hard delete.
- `RegistroPonto` — batidas (`tipoEvento`, `horarioReal`, `confirmado`, `origem`), soft delete (`deletadoEm`).
- `ModeloHorario` — `horasSemanais`, `jornadaDiaria`, `configuracao` (Json: `{ diasUteis, avisos:[{hora,mensagem,dias?}] }`).
- `ConhecimentoItem` — `visibilidade` (`PUBLICO | PRIVADO`), `autorId`, soft delete.
- `LogEvento` — `tipo` (string, ver `TipoLog` em `lib/log.ts`), `detalhe` (Json).
- `RegistroExcluido` — snapshot de exclusões (auditoria).

Enums e tipos novos: o enum vive no schema **e** no Zod (`lib/validations.ts`). `TipoLog` é uma union
de strings (não enum do Prisma) de propósito.

---

## 5. Autenticação, sessão e RBAC (o padrão canônico)

- Login (`api/v1/auth/login`): valida com Zod, confere senha (`verificarSenha`), **rejeita conta
  inativa (403)**, assina JWT (`assinarSessao`) e grava cookie (`definirCookieSessao`).
- **`usuarioAtual()`** (`lib/session.ts`) é a fonte da verdade: lê o cookie, valida o JWT **e** busca o
  registro no banco; retorna `null` se o token é inválido **ou** se `ativo === false`. Use sempre isto
  em páginas/rotas, não as claims do token isoladas.
- Em rotas de API: `await exigirUsuario()` (401 se não logado) ou
  `await exigirPapel("ADMIN","SUPORTE")` (403 se papel não permitido). Ambos em `lib/rbac.ts`.
- Logout: limpa o cookie; no client, use `window.location.href = "/"` (recarga real relê o cookie).

---

## 6. Padrão de rota de API (siga sempre)

```ts
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/rbac";
import { algumSchema } from "@/lib/validations";
import { comTratamentoDeErro, ApiError } from "@/lib/api";

export const POST = comTratamentoDeErro(async (request: NextRequest) => {
  const usuario = await exigirPapel("ADMIN");          // ou exigirUsuario()
  const dados = algumSchema.parse(await request.json()); // Zod valida e lança ZodError (→ 400)
  // ... regra de negócio ...
  return NextResponse.json(resultado, { status: 201 });
});
```

- **Sempre** envolva o handler em `comTratamentoDeErro` — ele converte `ApiError`/`ZodError` em
  respostas JSON padronizadas e loga erros inesperados (`ERRO_API`) sem vazar detalhes (500 genérico).
- Tipos de `where` do Prisma: importe `import type { Prisma } from "@prisma/client"` e use
  `Prisma.XWhereInput` (não faça cast de `Parameters<...>`).
- Para tipos `Json` no Prisma 7, normalize com `JSON.parse(JSON.stringify(valor))` antes de gravar
  (ver `lib/log.ts`, rota de `usuarios/me`, modelos-horario).

---

## 7. Regras de negócio críticas (não dá pra adivinhar)

- **Fuso horário (importante):** datas de escala/ponto são gravadas em **UTC midnight**. Para montar
  janelas de mês/dia use **strings ISO explícitas em UTC** (`new Date(\`${ano}-${mes}-01T00:00:00.000Z\`)`)
  e `getUTCDay()`. Usar `new Date(ano, mes-1, dia)` (hora local) **pula registros** no Brasil (UTC-3).
  Procure os comentários `FIX TIMEZONE`. `inicioDoDia/fimDoDia` em `lib/utils.ts` usam `setUTCHours`.
- **Cálculo de horas (`PontoBoard.tsx`, função `metaDoDia`):** semana de **44h = 8h × seg–sex + 4h
  sábado**. Sábado (expediente ou folga) = 4h; **Folga no sábado = −4h de débito**; **Plantão e Home
  office ficam fora do cálculo** (abonados); folga em dia de semana não gera débito.
- **Home office = 14h–22h:** fonte única em `lib/utils.ts` (`HORARIO_POR_TIPO` / `horarioDoTipo`),
  exibida em todas as telas que mostram tipo.
- **Sábado:** quem está Folga/Home office no sábado **não pode** ser marcado como presencial
  (`NORMAL`/`PLANTAO`) — bloqueio na UI (`EscalasBoard`) **e** na API (`api/v1/escalas` POST, 409).
- **Visão de fim de semana** (`EscalaFimDeSemana.tsx`): derivada da escala — Plantão FDS (plantão no
  sáb/dom), Sábado Expediente (NORMAL no sáb), Sábado de Folga (FOLGA no sáb), nota de home office.
- **Conhecimento:** `GET` mostra público + próprios; admin/suporte veem **tudo** (use
  `...(isAdmin ? {} : { OR: [...] })` — objeto vazio dentro de `OR` no Prisma **não** é confiável para "ver tudo").
- **Sync de ponto** (`api/v1/sync/registros-ponto`): upsert em lote, `usuarioId` sempre do dono,
  ignora ids que pertencem a outros; GET incremental por `atualizadoEm` (cursor).

---

## 8. Sistema de temas (sutil — leia antes de mexer)

- Tokens de tema são CSS vars em `globals.css`: `--tema-bg-page`, `--tema-bg-surface`, `--tema-text`,
  `--tema-border`, `--tema-active`, `--tema-secondary`, redefinidos por `[data-tema="claro|escuro|noturno"]`.
- Há também as classes legadas `.dark` e `.night`. **A maioria da UI usa utilitários `dark:` do
  Tailwind**, que dependem da classe `.dark` (compartilhada por escuro e noturno). Para o noturno ser
  mais escuro que o escuro, `.night` redefine a paleta `--color-slate-*` (Tailwind v4).
- **Resolução sem flicker:** um `<script>` inline no `<body>` (em `app/layout.tsx`) roda antes da
  pintura e define o tema por: tema salvo (`localStorage 'kronos-tema'`) → preferência do navegador →
  **padrão claro**. Só roda quando o servidor **não** aplicou um tema explícito do banco
  (`data-tema-explicito`). Logado, o tema vem do banco; deslogado, do localStorage/navegador.
- **Persistência:** `ThemeToggle` e `PerfilDropdown` gravam no `localStorage` **e** via
  `PATCH /api/v1/usuarios/me`. Cores customizadas (`temaConfig`: textColor, borderColor, activeColor,
  secondaryColor) + `corDestaque` (cor principal) são aplicadas como `--user-*` / `--accent-override`.
  ⚠️ A rota PATCH precisa gravar `temaConfig` no `data` (foi um bug: validava mas não gravava).

---

## 9. Convenções de UI

- **Reuse os primitivos** de `components/ui/` (`Button`, `Input`, `PasswordInput`, `Select`/`Textarea`
  em `Field`, `Card`/`Badge`, `Logo`, `ColorPicker`). `cn(...)` (clsx) para classes condicionais.
- **Dark mode**: escreva `text-slate-900 dark:text-white`, `bg-white dark:bg-slate-900`,
  `border-slate-200 dark:border-slate-800`. Em páginas públicas, o padrão é claro (não fixe `bg-[#0B1220]`).
- **Responsivo**: o padrão de layout com painel lateral é `flex flex-col gap-4 lg:flex-row` + painel
  `w-full lg:w-72 lg:shrink-0` (evita overflow no celular). Tabelas em `Card` com `overflow-x-auto`.
- **Animações** em `globals.css`: `animate-painel`, `animate-overlay`, `animate-modal`, `animate-drawer`.
- O `NavLoadingOverlay` mostra um overlay ao navegar (intercepta cliques em `<a href="/...">`); ele
  **ignora** links com `download` e `/api/` (senão o overlay fica infinito, pois não há mudança de rota).

---

## 10. Exportação de escala (padrão)

- **Excel (.xlsx)**: rota servidor `api/v1/escalas/export` com `exceljs` (`runtime = "nodejs"`) —
  fica **fora do bundle do cliente**. Gera o formato de planilha de fim de semana.
- **PDF**: cliente, `jspdf` + `jspdf-autotable` (tabela nativa, texto real) — `import()` dinâmico.
- **PNG**: cliente, `html-to-image` capturando o DOM da visão de fim de semana — `import()` dinâmico.
- Bibliotecas pesadas de export **sempre** via `await import(...)` para code-split.

---

## 11. Fluxo de trabalho e verificação

- **Tipos**: `npx tsc --noEmit` (rápido, pega a maioria dos erros).
- **Build**: `npx next build`. **Não rode com o `npm run dev` ativo** — sobrescreve o `.next` do dev e
  causa **404 em todas as telas**. Se acontecer: pare o dev, `rm -rf .next`, suba o dev de novo.
  (Erros de tsc em `.next/dev/types/*` = `.next` corrompido, não erro do seu código.)
- **Preview**: a ferramenta de preview sobe o dev (porta 3000) e permite screenshot/eval. O dashboard
  exige login (não dá pra ver sem credenciais); rotas públicas (`/`, `/login`, `/escala`) dá.
- **Git no Windows**: avisos `LF will be replaced by CRLF` são normais. Commits/push só quando pedido.

---

## 12. Receitas rápidas

- **Nova rota de API**: criar `src/app/api/v1/.../route.ts`, exportar `GET/POST/...` envolvidos em
  `comTratamentoDeErro`, validar com Zod, autorizar com `exigirUsuario`/`exigirPapel`.
- **Nova página de dashboard**: `app/dashboard/x/page.tsx` (server) valida papel + busca dados →
  passa serializado para um board client; adicionar item na `Sidebar` (com `papeis`).
- **Novo campo de preferência do usuário**: schema Prisma → `atualizarPerfilProprioSchema` (Zod) →
  gravar no `data` do `PATCH usuarios/me` **e** incluir no `select` → threadar do
  `dashboard/layout` → `DashboardShell` → componente.
- **Novo rótulo/horário de tipo de escala**: `ROTULOS_TIPO_DIA` / `HORARIO_POR_TIPO` em `lib/utils.ts`
  (fonte única) e os mapas de cor onde o tipo é exibido.

---

## 13. Pegadinhas conhecidas (lista de verificação)

- ❌ `new Date(ano, mes-1, dia)` para janelas de escala → use UTC ISO. (timezone)
- ❌ Objeto vazio `{}` dentro de `OR` no Prisma para "ver tudo" → use `...(cond ? {} : { OR: [...] })`.
- ❌ Rodar `next build` com `next dev` ativo → 404 geral.
- ❌ Esquecer de gravar campos `Json` (ex.: `temaConfig`) no `data` do update.
- ❌ Fixar `bg-[#0B1220]` em página pública → quebra o tema claro; use tokens/`dark:`.
- ❌ Bibliotecas de export no topo do arquivo → use `import()` dinâmico (bundle).
- ❌ Confiar no papel do token → cheque sempre via `usuarioAtual()`/`exigirPapel`.
- ✅ Antes de finalizar: `tsc --noEmit` limpo; se mexeu em rota/escala, conferir as regras da seção 7.
