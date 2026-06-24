# Otimizações e melhorias — Kronos Web

Backlog de melhorias de **segurança**, **performance**, **dependências** e **qualidade**
levantado numa análise geral do código. Cada item traz prioridade, arquivos
envolvidos, o problema e o como-fazer, para ser aplicado isoladamente.

Legenda de prioridade: 🔴 alta · 🟡 média · 🟢 baixa · ✅ já feito.

---

## Segurança

### ✅ Usuário inativo bloqueado em login e API (feito)
- **Arquivos:** `src/lib/session.ts`, `src/app/api/v1/auth/login/route.ts`.
- `usuarioAtual()` retorna `null` se `ativo === false` (inativo = não autenticado em API e páginas);
  o login rejeita conta desativada (403) após validar a senha.

### 🟡 Rate limiting em login e escala pública
- **Arquivos:** `src/app/api/v1/auth/login/route.ts`, `src/app/api/v1/escala-publica/route.ts`.
- **Problema:** sem limite de tentativas → brute-force de senha e da `PALAVRA_SECRETA_ESCALA`.
- **Fix:** limitar tentativas por IP/usuário. Em serverless, usar um store externo
  (ex.: Upstash Redis com `@upstash/ratelimit`) — algo como 5–10 tentativas/min por IP.
  Alternativa simples: atraso incremental após N falhas.

### 🟡 Upload de foto carrega o arquivo inteiro antes de validar tamanho
- **Arquivo:** `src/app/api/v1/fotos/upload/route.ts` (+ `src/lib/cloudinary.ts`).
- **Problema:** `Buffer.from(await arquivo.arrayBuffer())` lê tudo na memória; o limite de 5 MB
  só é checado depois (em `cloudinary.ts`). Upload gigante pode estourar memória (DoS).
- **Fix:** validar `request.headers.get("content-length")` e/ou `arquivo.size` ANTES de
  bufferizar; rejeitar acima de ~6 MB de cara.

### 🟢 Comparação da palavra secreta não é constant-time
- **Arquivo:** `src/app/api/v1/escala-publica/route.ts`.
- **Problema:** `senha !== correta` vaza timing (baixo risco, é um segredo compartilhado).
- **Fix:** comparação em tempo constante (`crypto.timingSafeEqual` com buffers do mesmo tamanho).

### 🟢 Escala pública expõe todos os usuários
- Por design (escala pública com palavra secreta). Apenas ciência: nome, setor, foto e escala
  de todos ficam acessíveis a quem tem a palavra. Reavaliar se a sensibilidade mudar.

---

## Performance

### 🔴 `public/hero-phone.png` tem ~1.8 MB (LCP da landing)
- **Arquivos:** `public/hero-phone.png`, `src/components/marketing/HeroMockup.tsx`.
- **Problema:** imagem pesada carregando no hero — ruim no celular (LCP/dados).
- **Fix:** comprimir e converter para WebP/AVIF (alvo < 250 KB) **ou** usar `next/image`
  (otimiza imagem local automaticamente: formato, tamanho responsivo, lazy). Trocar o `<img>`
  por `<Image fill>`/dimensões fixas.

### 🟢 Avatares usam `<img>` em vez de `next/image`
- **Arquivos:** `EscalasBoard.tsx`, `escala/page.tsx`, `UsuariosBoard.tsx`, etc.
- As fotos do Cloudinary já vêm recortadas/otimizadas (400×400, quality auto), então o ganho é
  pequeno. Se quiser uniformizar, `next/image` (o domínio já está em `next.config.ts`).

### 🟢 Consultas de escala carregam o mês inteiro
- **Arquivos:** `dashboard/escalas/page.tsx`, `api/v1/escala-publica/route.ts`, `api/v1/escalas/export/route.ts`.
- OK para times pequenos. Se a base crescer muito, considerar paginação/seleção de campos mínimos.

### ✅ Já bom (não mexer)
- `exceljs` roda **só no servidor** (`runtime = "nodejs"` na rota de export) — não entra no bundle do cliente.
- `jspdf`, `jspdf-autotable` e `html-to-image` são `import()` dinâmico — code-split, só baixam quando exportar.

---

## Dependências (`npm audit`: 7 moderate)

### 🟢 Não rodar `npm audit fix --force`
- As 7 advisories são **transitivas e de dev/build**, e o "fix" faz downgrades quebrados
  (next@9, prisma@6, exceljs@3.4). Manter como está e atualizar quando os pacotes-pai lançarem patch.
- `@hono/node-server` ← `@prisma/dev` (CLI do Prisma; não vai para produção).
- `postcss` ← `next` (ferramenta de build; XSS no stringify sem entrada de usuário).
- `uuid` ← `exceljs` (não passamos `buf`; sem risco real).

---

## Qualidade / manutenção

### 🟢 Limpeza de artefatos de iteração
- `src/app/app-mockup/page.tsx` + `src/components/marketing/AppScreen.tsx`: rota utilitária usada só
  para exportar a tela do app — pode ser removida (rota pública sem uso real).
- `public/hero-phone-a.jpg`: candidata antiga (tela em branco) sem uso.

### 🟢 Fechamento animado do menu mobile
- **Arquivo:** `src/components/layout/DashboardShell.tsx`.
- A abertura já anima (slide-in). O fechamento ainda é instantâneo (unmount direto). Para animar a
  saída: manter montado com um estado `saindo` + `onAnimationEnd` antes de desmontar.

### 🟢 `next build` x `next dev`
- Não rodar `next build` enquanto o `npm run dev` está ativo — sobrescreve o `.next` do dev e causa
  404 em todas as telas. Se acontecer: parar o dev, `rm -rf .next`, subir o dev de novo.

---

## Preparação para conectar o app mobile

### 🔴 Auth por token para o app (RN/Expo)
- **Arquivos:** `src/app/api/v1/auth/login/route.ts`, `src/lib/auth.ts`, `src/lib/session.ts`.
- **Problema:** hoje o JWT só sai como **cookie httpOnly**; o login não devolve o token no corpo.
  Um app mobile precisa de um token para mandar em `Authorization: Bearer` nas chamadas.
- **Fix:** devolver o JWT no corpo do login (ou criar `/api/v1/auth/login` com modo mobile) e aceitar
  `Authorization: Bearer <jwt>` além do cookie em `obterClaimsSessao()`.

### ✅ Endpoint de sync já pronto
- `src/app/api/v1/sync/registros-ponto/route.ts`: upsert em lote, força `usuarioId` do dono, ignora
  ids de terceiros, cursor incremental. Pronto para o app consumir.

### 🟡 Ao subir o app no repositório
- Pasta sugerida: `/mobile/kronos-app/` (ou `/apk/` se preferir).
- **Não commitar:** `node_modules/`, `.expo/`, builds, e **segredos** (`.env`, `google-services.json`,
  keystores `.jks/.keystore`). Adicionar `.gitignore` próprio na pasta.
- Garantir que o build do Vercel continue buildando só o web (o subdiretório do app fora do build do Next).
