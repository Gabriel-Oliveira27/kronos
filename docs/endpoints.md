# Kronos — Referência de Endpoints (App Mobile)

> Documento gerado para o desenvolvedor do app mobile (Expo/React Native).
> Cobre todos os endpoints necessários para sincronização de ponto, leitura de
> escalas, base de conhecimento e perfil do usuário.

---

## URL base

```
https://<seu-dominio-na-vercel>.vercel.app/api/v1
```

Em desenvolvimento local:

```
http://localhost:3000/api/v1
```

---

## Autenticação

O Kronos usa sessão via **cookie httpOnly** — não há Bearer token nos headers.

### Fluxo de login

```
POST /auth/login
```

**Body:**

```json
{ "username": "joao.silva", "senha": "senha123" }
```

**Resposta de sucesso (200):**

```json
{
  "id": "clx9...",
  "nomeCompleto": "João Silva",
  "papel": "USUARIO"
}
```

O servidor define automaticamente o cookie `kronos_session` na resposta.
O app deve armazená-lo (o `fetch` nativo e o `axios` fazem isso com `credentials: "include"`).

**Resposta de erro (401):**

```json
{ "error": "Usuário ou senha inválidos.", "code": "CREDENCIAIS_INVALIDAS" }
```

### Configuração do cliente HTTP

Toda chamada autenticada deve incluir as credenciais do cookie:

```ts
// fetch nativo
fetch(url, { credentials: "include" })

// axios
axios.defaults.withCredentials = true;
```

### Logout

```
POST /auth/logout
```

Sem body. Apaga o cookie de sessão no servidor.

---

## Formato de Erro Padrão

Todos os erros retornam JSON com esta estrutura:

```json
{
  "error": "Mensagem legível para o usuário.",
  "code": "CODIGO_MAQUINA",
  "detalhes": [] // opcional — array de issues de validação (Zod)
}
```

Códigos HTTP relevantes:

| Status | Significado |
|--------|-------------|
| 400 | Dados inválidos (falha de validação) |
| 401 | Não autenticado (cookie ausente ou expirado) |
| 403 | Sem permissão para esta ação |
| 404 | Registro não encontrado |
| 409 | Conflito (ex: username duplicado) |
| 500 | Erro interno do servidor |

---

## Endpoints

---

### Perfil do Usuário Logado

#### `GET /usuarios/me`

Retorna os dados do usuário autenticado (sem senhaHash).

**Resposta (200):**

```json
{
  "id": "clx9...",
  "nomeCompleto": "João Silva",
  "setor": "Operações",
  "email": "joao@empresa.com",
  "username": "joao.silva",
  "papel": "USUARIO",
  "temApp": true,
  "fotoUrl": "/api/v1/fotos/1abc...",
  "temaBase": "dark",
  "corDestaque": "#22c55e"
}
```

#### `PATCH /usuarios/me`

Atualiza tema, cor de destaque, foto e senha do próprio usuário.

**Body (todos opcionais):**

```json
{
  "temaBase": "dark",
  "corDestaque": "#2563eb",
  "fotoUrl": "/api/v1/fotos/1abc...",
  "senhaAtual": "senha-atual",
  "novaSenha": "nova-senha-123"
}
```

> `novaSenha` exige `senhaAtual`. Se informar apenas `novaSenha` sem a atual, retorna 400.

---

### Sincronização de Ponto ⭐ (foco principal do app)

O protocolo é incremental por timestamp: o app guarda o `proximoCursor` da última
sincronização e usa-o nas próximas chamadas para baixar apenas o que mudou.

#### `GET /sync/registros-ponto?cursor=<ISO_DATE>`

Baixa os registros do usuário autenticado alterados **após** o cursor.

Inclui criações, atualizações e exclusões (soft delete — `deletadoEm` ≠ null).

**Parâmetros:**

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `cursor` | ISO 8601 | Não | Traz só registros com `atualizadoEm > cursor`. Sem cursor: traz tudo. |

**Resposta (200):**

```json
{
  "registros": [
    {
      "id": "clx9...",
      "usuarioId": "clx8...",
      "data": "2026-06-17T00:00:00.000Z",
      "tipoEvento": "ENTRADA",
      "horarioReal": "08:02",
      "confirmado": true,
      "deletadoEm": null,
      "atualizadoEm": "2026-06-17T08:05:12.000Z"
    }
  ],
  "proximoCursor": "2026-06-17T08:05:12.000Z"
}
```

> Retorna no máximo 500 registros por chamada. Se `registros.length === 500`,
> faça outra chamada com o `proximoCursor` retornado até receber menos de 500.

#### `POST /sync/registros-ponto`

Envia batidas do app para o servidor (upsert em lote).

O `usuarioId` no servidor é sempre o do usuário autenticado —
**não confie no `usuarioId` do cliente, ele é ignorado.**

**Body:**

```json
{
  "registros": [
    {
      "id": "uuid-gerado-pelo-app",
      "data": "2026-06-17T00:00:00.000Z",
      "tipoEvento": "ENTRADA",
      "horarioReal": "08:02",
      "confirmado": false
    }
  ]
}
```

> O `id` deve ser gerado pelo app (UUID v4 ou CUID). Se já existir no servidor,
> o registro é atualizado. Se não existir, é criado.

**Resposta (200):**

```json
{
  "sincronizados": 3,
  "registros": [...],
  "ignorados": []
}
```

> `ignorados` lista IDs que já pertenciam a outro usuário e foram ignorados
> como medida de segurança.

#### `DELETE /sync/registros-ponto/:id`

Soft delete de um registro de ponto. O registro continua no banco com
`deletadoEm` preenchido — fica visível na lixeira do app por 24h.

**Resposta (200):**

```json
{ "ok": true }
```

---

### Escalas (somente leitura para usuário comum)

#### `GET /escalas`

Retorna a escala do usuário autenticado. Para CONFIGURADOR_ESCALA e ADMIN,
pode retornar a escala de toda a equipe.

**Parâmetros (query string):**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `inicio` | yyyy-mm-dd | Data inicial do intervalo |
| `fim` | yyyy-mm-dd | Data final do intervalo |
| `usuarioId` | string | (só CONFIGURADOR/ADMIN) Filtra por colaborador |

**Exemplo para o próprio mês:**

```
GET /escalas?inicio=2026-06-01&fim=2026-06-30
```

**Resposta (200):**

```json
[
  {
    "id": "clx9...",
    "usuarioId": "clx8...",
    "data": "2026-06-23T00:00:00.000Z",
    "tipo": "PLANTAO",
    "observacao": null,
    "criadoPorId": "clx7...",
    "atualizadoEm": "2026-06-01T10:00:00.000Z",
    "usuario": {
      "id": "clx8...",
      "nomeCompleto": "João Silva",
      "setor": "Operações",
      "temApp": true
    }
  }
]
```

**Tipos de dia (`tipo`):**

| Valor | Descrição | Meta diária |
|-------|-----------|-------------|
| `NORMAL` | Dia comum | 8h |
| `PLANTAO` | Plantão | **7h30** |
| `HOME_OFFICE` | Home office | 8h |
| `FOLGA` | Folga | 0h |
| `SABADO_REDUZIDO` | Sábado reduzido | (a definir) |

> ⚠️ Quando `tipo === "PLANTAO"`, a meta diária cai de 8h para **7h30**.
> O app deve usar essa informação ao calcular o saldo de horas.

---

### Base de Conhecimento

#### `GET /conhecimento`

Lista itens visíveis para o usuário autenticado:
- Itens **PUBLICO**: visíveis para todos.
- Itens **PRIVADO**: visíveis só para o próprio autor (e ADMIN/SUPORTE).

**Parâmetros (query string):**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `q` | string | Busca por título ou conteúdo |
| `categoria` | string | Filtra por categoria |

**Resposta (200):**

```json
[
  {
    "id": "clx9...",
    "autorId": "clx8...",
    "titulo": "Como fechar o caixa",
    "conteudo": "Passo 1: ...",
    "categoria": "Financeiro",
    "tags": ["caixa", "fechamento"],
    "visibilidade": "PUBLICO",
    "deletadoEm": null,
    "atualizadoEm": "2026-06-10T14:30:00.000Z",
    "criadoEm": "2026-05-01T09:00:00.000Z",
    "autor": {
      "id": "clx8...",
      "nomeCompleto": "Maria Santos"
    }
  }
]
```

#### `POST /conhecimento`

Cria um novo item. O `autorId` é sempre o usuário autenticado.

**Body:**

```json
{
  "titulo": "Procedimento de abertura",
  "conteudo": "1. Ligar os equipamentos...",
  "categoria": "Operacional",
  "tags": ["abertura", "procedimento"],
  "visibilidade": "PUBLICO"
}
```

**Resposta (201):** o item criado.

#### `PUT /conhecimento/:id`

Atualiza um item. Só o autor pode editar.

**Body (todos opcionais):**

```json
{
  "titulo": "Novo título",
  "conteudo": "Novo conteúdo",
  "visibilidade": "PRIVADO"
}
```

#### `DELETE /conhecimento/:id`

Soft delete. Só o autor pode excluir. O item fica com `deletadoEm` preenchido
e é recuperável por 24h (regra aplicada pelo app na lixeira).

---

### Fotos de Perfil

#### `POST /fotos/upload`

Envia uma foto de perfil. O upload é feito via `multipart/form-data`.
O backend faz o upload para o Google Drive via Service Account e retorna
uma URL relativa que é servida pelo próprio servidor (proxy autenticado).

**Request:**

```
Content-Type: multipart/form-data
Campo: arquivo (File — JPEG, PNG ou WebP, máx 5MB)
```

**Exemplo com fetch:**

```ts
const form = new FormData();
form.append("arquivo", file); // File ou Blob
const res = await fetch("/api/v1/fotos/upload", {
  method: "POST",
  body: form,
  credentials: "include",
});
const { url } = await res.json();
// url: "/api/v1/fotos/1abc..."
// Use essa URL para exibir e salve em PATCH /usuarios/me como fotoUrl
```

**Resposta (201):**

```json
{
  "driveFileId": "1abc...",
  "url": "/api/v1/fotos/1abc..."
}
```

#### `GET /fotos/:fileId`

Serve o conteúdo da foto. Requer autenticação (cookie de sessão).
Use diretamente como `source` de imagem:

```ts
<Image source={{ uri: "https://dominio.vercel.app/api/v1/fotos/1abc..." }} />
```

> A requisição de imagem deve incluir o cookie de sessão. No Expo com
> `expo-image`, use um fetch autenticado e cache local se necessário.

---

## Protocolo de Sincronização Incremental (Ponto)

O protocolo foi desenhado para funcionar bem com conectividade intermitente.

### Sincronização inicial (primeiro uso)

```
GET /sync/registros-ponto
→ { registros: [...todos...], proximoCursor: "2026-06-17T08:05:12.000Z" }
```

Salve `proximoCursor` localmente (AsyncStorage, SQLite, etc).

### Sincronizações seguintes

```
GET /sync/registros-ponto?cursor=<proximoCursor-salvo>
→ { registros: [...só o que mudou...], proximoCursor: "..." }
```

Atualize o cursor local com o `proximoCursor` retornado.

### Upload de batidas locais

```
POST /sync/registros-ponto
Body: { registros: [<batidas pendentes>] }
```

Faça isso:
1. Quando o usuário bater ponto (imediato se tiver rede)
2. Em background quando a conexão voltar (batch das batidas offline)

### Tombstones (registros excluídos)

Quando um registro é excluído via `DELETE /sync/registros-ponto/:id`, o servidor
faz um soft delete: `deletadoEm` fica preenchido, `atualizadoEm` é atualizado.

Na próxima sincronização incremental, esse registro aparece no GET com
`deletadoEm !== null`. O app deve:
1. Marcar o item local como excluído / movê-lo para a lixeira
2. Exibi-lo como "excluído" por 24h a partir de `deletadoEm`
3. Removê-lo definitivamente após as 24h

### Diagrama

```
App                          API
 │                            │
 ├──GET /sync?cursor=X──────► │ Retorna só o que mudou desde X
 │◄── { registros, cursor } ──┤
 │                            │
 ├──POST /sync (batidas) ────► │ Upsert em lote (max 500/req)
 │◄── { sincronizados: N } ───┤
 │                            │
 ├──DELETE /sync/:id─────────► │ Soft delete + auditoria
 │◄── { ok: true } ───────────┤
```

---

## Modelos de Dados

### Usuario

```ts
{
  id: string         // CUID
  nomeCompleto: string
  setor: string
  email: string | null
  username: string
  papel: "ADMIN" | "SUPORTE" | "CONFIGURADOR_ESCALA" | "USUARIO"
  temApp: boolean
  fotoUrl: string | null  // "/api/v1/fotos/<fileId>"
  temaBase: string | null // "light" | "dark" | "system"
  corDestaque: string | null // hex, ex: "#22c55e"
  criadoEm: string    // ISO 8601
  atualizadoEm: string
}
```

### RegistroPonto

```ts
{
  id: string         // CUID — gerado pelo app antes de enviar
  usuarioId: string
  data: string       // ISO 8601, normalize para meia-noite local
  tipoEvento: string // "ENTRADA" | "SAIDA" | ou outro string livre
  horarioReal: string | null  // "HH:MM" — horário real da batida
  confirmado: boolean
  deletadoEm: string | null   // null = ativo; preenchido = excluído
  atualizadoEm: string
}
```

### EscalaDia

```ts
{
  id: string
  usuarioId: string
  data: string       // ISO 8601
  tipo: "NORMAL" | "PLANTAO" | "HOME_OFFICE" | "FOLGA" | "SABADO_REDUZIDO"
  observacao: string | null
  criadoPorId: string
  atualizadoEm: string
}
```

### ConhecimentoItem

```ts
{
  id: string
  autorId: string
  titulo: string
  conteudo: string
  categoria: string | null
  tags: string[]
  visibilidade: "PUBLICO" | "PRIVADO"
  deletadoEm: string | null
  atualizadoEm: string
  criadoEm: string
  autor: { id: string; nomeCompleto: string }
}
```

---

## Regras de Negócio Relevantes para o App

1. **Meta diária por tipo de escala**
   - `NORMAL`, `HOME_OFFICE`: 8h
   - `PLANTAO`: **7h30** (30 min a menos)
   - `FOLGA`: 0h (não há batidas esperadas)

2. **Soft delete de ponto**
   - Excluídos via `DELETE /sync/registros-ponto/:id`
   - Ficam disponíveis por 24h via `deletadoEm` (mostrar como "lixeira" no app)
   - Após 24h, filtrar da view principal (o servidor nunca os apaga fisicamente)

3. **Visibilidade de conhecimento**
   - `PUBLICO`: todos os usuários veem
   - `PRIVADO`: só o autor vê (e ADMIN/SUPORTE — mas isso é irrelevante no app mobile que só lida com o próprio usuário)

4. **Cookie de sessão**
   - Expira em 7 dias
   - O app deve lidar com 401 redirecionando para a tela de login
   - Não há refresh token — após expirar, o usuário precisa logar novamente

5. **IDs dos registros de ponto**
   - São gerados pelo **app** (não pelo servidor)
   - Use CUID (`@paralleldrive/cuid2`) ou UUID v4
   - Isso permite criar registros offline e sincronizá-los depois sem conflito de ID

---

## Checklist de Integração

- [ ] Configurar `credentials: "include"` em todas as requisições autenticadas
- [ ] Implementar interceptor de 401 → redirecionar para login
- [ ] Salvar `proximoCursor` localmente após cada GET de sincronização
- [ ] Gerar IDs no app antes de enviar (CUID ou UUID)
- [ ] Tratar `deletadoEm !== null` nos registros de ponto (tombstones)
- [ ] Usar `tipo === "PLANTAO"` para ajustar meta diária para 7h30
- [ ] Sincronizar em background quando a conexão voltar (registros offline)
- [ ] `PATCH /usuarios/me` com `{ temaBase: "dark" }` ao usuário trocar tema
