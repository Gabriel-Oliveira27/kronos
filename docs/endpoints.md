# Kronos — Referência de Endpoints da API

> Cobre **todas** as rotas sob `/api/v1`. As seções detalhadas focam no que o app mobile
> (Expo/React Native) consome: sincronização de ponto, escalas, conhecimento, perfil e fotos.

---

## URL base

```
Produção:  https://kronos-eletronic.vercel.app/api/v1
Local:     http://localhost:3000/api/v1
```

> O app mobile lê esta URL de `expo.extra.apiBaseUrl` (em `apk/kronos-app/app.json`),
> com fallback para a produção acima. Para apontar a um backend local em dev, troque
> por `http://<ip-da-maquina>:3000/api/v1` (não use `localhost` no dispositivo físico).

---

## Autenticação

JWT (expira em **7 dias**), entregue de **duas formas** para o mesmo login servir web e app:

- **Web:** cookie httpOnly `kronos_session` (definido na resposta do login).
- **App mobile:** o login também devolve o `token` no corpo; o app o envia em
  `Authorization: Bearer <token>` nas chamadas seguintes.

```
POST /auth/login   { "username": "...", "senha": "..." }  → define o cookie + { id, nomeCompleto, papel, token }
POST /auth/logout  (sem body)                              → apaga o cookie
```

Escolha **um** dos dois transportes por chamada autenticada:

```ts
// App mobile (Expo/React Native) — Bearer token
fetch(url, { headers: { Authorization: `Bearer ${token}` } });

// Web — cookie
fetch(url, { credentials: "include" });   // fetch nativo
axios.defaults.withCredentials = true;    // axios
```

- **401** quando o cookie/token está ausente ou expirado → o cliente deve redirecionar para o login.
- **403 `CONTA_DESATIVADA`** no login quando o usuário está inativo.
- Usuário desativado é tratado como não autenticado em toda a API.
- Sem refresh token: após expirar (401), o usuário loga de novo.

---

## Formato de erro padrão

```json
{ "error": "Mensagem legível.", "code": "CODIGO_MAQUINA", "detalhes": [] }
```

`detalhes` é opcional (issues do Zod em erros 400). Códigos HTTP: **400** validação · **401** não
autenticado · **403** sem permissão / conta desativada · **404** não encontrado · **409** conflito ·
**500** erro interno.

---

## Referência completa de rotas

Papéis: `USUARIO`, `CONFIGURADOR_ESCALA` (config.), `SUPORTE`, `ADMIN`.

### Públicas
| Rota | Método | Observação |
|---|---|---|
| `/auth/login` | POST | login (define cookie) |
| `/auth/logout` | POST | logout |
| `/solicitacoes-acesso` | POST | cria solicitação de acesso |
| `/escala-publica?ps=&mes=` | GET | escala somente leitura; exige `PALAVRA_SECRETA_ESCALA` (`ps`) |

### Autenticadas (qualquer usuário — escopo sempre do próprio)
| Rota | Método | Observação |
|---|---|---|
| `/usuarios/me` | GET, PATCH | perfil próprio (tema, cor, foto, senha) |
| `/ponto` | GET, POST | ponto do próprio usuário (usado pela web) |
| `/ponto/[id]` | PUT, DELETE | edita/exclui batida própria |
| `/sync/registros-ponto` | GET, POST | sync incremental do app mobile (cursor) |
| `/sync/registros-ponto/[id]` | DELETE | soft delete de batida |
| `/escalas` | GET | usuário lê a própria; config./admin veem a equipe |
| `/conhecimento` | GET, POST | GET respeita visibilidade; POST cria (autor = usuário) |
| `/conhecimento/[id]` | PUT, DELETE | **só o autor** |
| `/fotos/upload` | POST | `multipart/form-data`, campo `arquivo` (→ Cloudinary) |
| `/fotos/[fileId]` | GET | **legado** (Cloudinary usa URL pública direta) |

### Escala / configurador
| Rota | Método | Observação |
|---|---|---|
| `/escalas` | POST | criar/atualizar dia — **config./admin** |
| `/escalas/[id]` | PUT, DELETE | editar/remover dia — **config./admin** |
| `/escalas/export?mes=yyyy-mm` | GET | planilha de fim de semana (.xlsx) — **config./admin** |
| `/modelos-horario` | GET, POST | GET config./admin/suporte · POST config./admin |
| `/modelos-horario/[id]` | PUT, DELETE | **config./admin** |
| `/admin/usuarios/avulso` | POST | adiciona membro avulso à escala — **config./admin** |

### Administração
| Rota | Método | Observação |
|---|---|---|
| `/admin/usuarios` | GET, POST | GET **admin+suporte** · POST **admin** |
| `/admin/usuarios/[id]` | PUT | editar usuário — **admin** |
| `/admin/solicitacoes-acesso` | GET | **admin** |
| `/admin/solicitacoes-acesso/[id]` | PATCH | aprovar/rejeitar — **admin** |
| `/admin/logs` | GET | logs/auditoria — **admin+suporte** |
| `/admin/registros-excluidos` | GET | snapshots de exclusões — **admin** |

---

## Perfil do usuário logado

### `GET /usuarios/me`
Retorna o usuário autenticado (sem `senhaHash`).

```json
{
  "id": "clx9...", "nomeCompleto": "João Silva", "setor": "Operações",
  "email": "joao@empresa.com", "username": "joao.silva", "papel": "USUARIO",
  "temApp": true,
  "fotoUrl": "https://res.cloudinary.com/<cloud>/image/upload/.../usuario_clx9_...webp",
  "temaBase": "escuro",
  "corDestaque": "#22c55e",
  "temaConfig": { "textColor": "#0f172a", "borderColor": "#e2e8f0", "activeColor": "#2563eb", "secondaryColor": "#f1f5f9" }
}
```

### `PATCH /usuarios/me`
Atualiza tema/cores/foto/senha do próprio usuário (todos opcionais):

```json
{
  "temaBase": "escuro",
  "corDestaque": "#2563eb",
  "temaConfig": { "textColor": "#ffffff" },
  "fotoUrl": "https://res.cloudinary.com/...",
  "senhaAtual": "...", "novaSenha": "..."
}
```

- `temaBase` ∈ `"claro" | "escuro" | "noturno" | "system"`.
- `novaSenha` exige `senhaAtual` (senão 400).

---

## Sincronização de ponto ⭐ (foco do app)

Incremental por timestamp: o app guarda o `proximoCursor` e o reenvia para baixar só o que mudou.

### `GET /sync/registros-ponto?cursor=<ISO_DATE>`
Baixa registros do usuário com `atualizadoEm > cursor` (inclui tombstones: `deletadoEm ≠ null`).
Sem cursor, traz tudo. Máx. **500** por chamada — repita com o `proximoCursor` enquanto vier 500.

```json
{
  "registros": [{
    "id": "clx9...", "usuarioId": "clx8...", "data": "2026-06-17T00:00:00.000Z",
    "tipoEvento": "ENTRADA", "horarioReal": "08:02", "confirmado": true,
    "deletadoEm": null, "atualizadoEm": "2026-06-17T08:05:12.000Z"
  }],
  "proximoCursor": "2026-06-17T08:05:12.000Z"
}
```

### `POST /sync/registros-ponto`
Upsert em lote. O `usuarioId` é **sempre** o do autenticado (o do corpo é ignorado); ids que já
pertencem a outro usuário voltam em `ignorados`.

```json
{ "registros": [{ "id": "uuid-do-app", "data": "2026-06-17T00:00:00.000Z", "tipoEvento": "ENTRADA", "horarioReal": "08:02", "confirmado": false }] }
```
→ `{ "sincronizados": 3, "registros": [...], "ignorados": [] }`

### `DELETE /sync/registros-ponto/:id`
Soft delete (`deletadoEm` preenchido; `atualizadoEm` atualizado → vira tombstone no próximo GET). → `{ "ok": true }`

---

## Escalas (leitura para usuário comum)

### `GET /escalas?inicio=yyyy-mm-dd&fim=yyyy-mm-dd[&usuarioId=]`
Usuário comum recebe só a própria escala (o `usuarioId` é forçado). Config./admin podem ver a equipe
e filtrar por `usuarioId`.

```json
[{
  "id": "clx9...", "usuarioId": "clx8...", "data": "2026-06-27T00:00:00.000Z",
  "tipo": "FOLGA", "observacao": null, "criadoPorId": "clx7...",
  "atualizadoEm": "2026-06-01T10:00:00.000Z",
  "usuario": { "id": "clx8...", "nomeCompleto": "João Silva", "setor": "Operações", "temApp": true }
}]
```

**Tipos de dia (`tipo`):** `NORMAL` · `PLANTAO` · `HOME_OFFICE` · `FOLGA`.
(`SABADO_REDUZIDO` foi removido.) Home office cumpre **14h–22h**.

---

## Base de conhecimento

- `GET /conhecimento?q=&categoria=` — públicos + próprios; **admin/suporte veem todos** (inclusive privados).
- `POST /conhecimento` — cria (autor = usuário). Body: `{ titulo, conteudo, categoria?, tags[], visibilidade }`.
- `PUT /conhecimento/:id` — **só o autor**.
- `DELETE /conhecimento/:id` — **só o autor** (soft delete).

`visibilidade` ∈ `"PUBLICO" | "PRIVADO"`.

---

## Fotos de perfil (Cloudinary)

### `POST /fotos/upload`
`multipart/form-data`, campo `arquivo` (JPEG/PNG/WebP, máx. 5 MB). O backend envia ao **Cloudinary**
(recorte 400×400 no rosto, WebP otimizado) e devolve uma **URL pública HTTPS**.

```json
{ "driveFileId": "kronos/fotos/usuario_clx9_...", "url": "https://res.cloudinary.com/.../usuario_clx9_...webp" }
```

> `url` é pública — use direto em `<Image source={{ uri }} />` (sem cookie) e salve em `fotoUrl` via
> `PATCH /usuarios/me`. (`driveFileId` é o `public_id` do Cloudinary; nome de campo mantido por legado.)

### `GET /fotos/:fileId` — **legado**
Mantido por retrocompatibilidade. Fotos novas são URLs públicas do Cloudinary e não passam por aqui.

---

## Modelos de dados

### Usuario
```ts
{
  id: string; nomeCompleto: string; setor: string; email: string | null; username: string;
  papel: "ADMIN" | "SUPORTE" | "CONFIGURADOR_ESCALA" | "USUARIO";
  ativo: boolean; temApp: boolean;
  fotoUrl: string | null;       // URL pública do Cloudinary
  temaBase: "claro" | "escuro" | "noturno" | "system" | null;
  corDestaque: string | null;   // hex, ex.: "#22c55e"
  temaConfig: { textColor?: string; borderColor?: string; activeColor?: string; secondaryColor?: string } | null;
  modeloHorarioId: string | null;
  criadoEm: string; atualizadoEm: string;
}
```

### RegistroPonto
```ts
{
  id: string;          // gerado pelo APP antes de enviar (UUID v4 ou CUID)
  usuarioId: string;
  data: string;        // ISO 8601 em UTC midnight (ex.: "2026-06-17T00:00:00.000Z")
  tipoEvento: string;  // "ENTRADA" | "SAIDA" | "ENTRADA_INTERVALO" | "SAIDA_INTERVALO" | "EXTRA"
  horarioReal: string | null; // "HH:MM"
  confirmado: boolean;
  origem: string;      // "app" | "web"
  deletadoEm: string | null;  // null = ativo; preenchido = tombstone
  atualizadoEm: string;
}
```

### EscalaDia
```ts
{
  id: string; usuarioId: string;
  data: string;        // ISO 8601 (UTC)
  tipo: "NORMAL" | "PLANTAO" | "HOME_OFFICE" | "FOLGA";
  observacao: string | null; criadoPorId: string; atualizadoEm: string;
}
```

---

## Regras de negócio (cálculo de horas)

A semana-padrão é **44h = 8h × seg–sex (40h) + 4h no sábado**. Para o saldo:

- **Dia normal (seg–sex):** meta 8h, conta as batidas.
- **Sábado expediente** (NORMAL no sábado): meta **4h**.
- **Sábado de Folga:** meta 4h, batidas 0 → **−4h de débito**.
- **Plantão e Home office:** **fora do cálculo** (abonados — a falta é abonada no home office).
- **Folga em dia de semana:** não gera débito.

Outras regras:
- **Sábado:** quem está Folga/Home office no sábado não pode ser escalado como presencial (`NORMAL`/`PLANTAO`) — a API retorna **409** nesse caso.
- **Soft delete de ponto:** recuperável por 24h (regra de exibição aplicada pelo app); o servidor nunca apaga fisicamente.
- **IDs de ponto** são gerados pelo app (permite criar offline e sincronizar sem conflito).
- **Cookie de sessão:** 7 dias, sem refresh token — após expirar (401), logar de novo.

---

## Checklist de integração (app)
- [ ] `credentials: "include"` em toda chamada autenticada.
- [ ] Interceptor de 401 → tela de login.
- [ ] Salvar `proximoCursor` após cada GET de sync; gerar `id` no app antes de enviar.
- [ ] Tratar `deletadoEm !== null` (tombstones) e a janela de 24h.
- [ ] Refletir o cálculo de horas (sábado 4h, sábado folga −4h, plantão/home office abonados).
- [ ] `fotoUrl` é URL pública do Cloudinary — usar direto na `<Image>`.
