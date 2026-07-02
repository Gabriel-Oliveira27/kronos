import { z } from "zod";

export const PapelEnum = z.enum(["ADMIN", "SUPORTE", "CONFIGURADOR_ESCALA", "USUARIO"], {
  error: "Papel inválido.",
});

// SABADO_REDUZIDO removido das regras de negócio (item 10).
// HOME_OFFICE é legado (aceito para compatibilidade, mas a UI não oferece).
export const TipoDiaEscalaEnum = z.enum(
  ["NORMAL", "PLANTAO", "HOME_OFFICE", "FOLGA", "DOMINGO_EFETIVO"],
  { error: "Tipo de dia inválido." }
);

// Tipos base permitidos para etiquetas personalizadas (sem HOME_OFFICE).
export const TipoBaseEtiquetaEnum = z.enum(["NORMAL", "PLANTAO", "FOLGA", "DOMINGO_EFETIVO"], {
  error: "Tipo de etiqueta inválido.",
});

export const VisibilidadeEnum = z.enum(["PUBLICO", "PRIVADO"], { error: "Visibilidade inválida." });

export const TemaBaseEnum = z.enum(["claro", "escuro", "noturno", "system"]).optional();

export const temaConfigSchema = z.object({
  textColor:      z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  borderColor:    z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  activeColor:    z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
}).optional();

export const loginSchema = z.object({
  username: z.string().min(1, "Informe o usuário."),
  senha: z.string().min(1, "Informe a senha."),
});

export const solicitacaoAcessoSchema = z.object({
  nomeCompleto: z.string().trim().min(3, "Informe o nome completo."),
  setor: z.string().trim().min(1, "Informe o setor."),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  observacoes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const criarUsuarioSchema = z.object({
  nomeCompleto: z.string().trim().min(3, "Informe o nome completo."),
  setor: z.string().trim().min(1, "Informe o setor."),
  setores: z.array(z.string().trim().min(1)).max(10).optional(),
  username: z
    .string()
    .trim()
    .min(3, "O usuário precisa ter ao menos 3 caracteres.")
    .regex(/^[a-z0-9._-]+$/i, "Use apenas letras, números, ponto, hífen ou underline."),
  senha: z.string().min(6, "A senha precisa ter ao menos 6 caracteres."),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  papel: PapelEnum.default("USUARIO"),
  temApp: z.boolean().default(false),
  ativo: z.boolean().default(true),
  ehGhost: z.boolean().default(false),
  fotoUrl: z.string().url().optional().or(z.literal("")),
  solicitacaoId: z.string().optional(),
  modeloHorarioId: z.string().optional().or(z.literal("")),
});

export const atualizarUsuarioSchema = z.object({
  nomeCompleto: z.string().trim().min(3).optional(),
  setor: z.string().trim().min(1).optional(),
  setores: z.array(z.string().trim().min(1)).max(10).optional(),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  papel: PapelEnum.optional(),
  temApp: z.boolean().optional(),
  ativo: z.boolean().optional(),
  ehGhost: z.boolean().optional(),
  fotoUrl: z.string().url().optional().or(z.literal("")),
  novaSenha: z.string().min(6, "A senha precisa ter ao menos 6 caracteres.").optional().or(z.literal("")),
  temaBase: TemaBaseEnum,
  corDestaque: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, "Use um hex de cor válido, ex: #22c55e.")
    .optional()
    .or(z.literal("")),
  temaConfig: temaConfigSchema,
  modeloHorarioId: z.string().optional().or(z.literal("")),
});

export const atualizarPerfilProprioSchema = z.object({
  temaBase: TemaBaseEnum,
  corDestaque: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i, "Use um hex de cor válido, ex: #22c55e.")
    .optional()
    .or(z.literal("")),
  temaConfig: temaConfigSchema,
  fotoUrl: z.string().url().optional().or(z.literal("")),
  senhaAtual: z.string().optional(),
  novaSenha: z.string().min(6, "A senha precisa ter ao menos 6 caracteres.").optional().or(z.literal("")),
});

export const escalaDiaSchema = z.object({
  usuarioId: z.string().min(1, "Selecione o colaborador."),
  data: z.coerce.date({ error: "Data inválida." }),
  tipo: TipoDiaEscalaEnum,
  etiquetaId: z.string().max(60).nullable().optional(),
  observacao: z.string().trim().max(500).optional().or(z.literal("")),
});

export const escalaDiaAtualizarSchema = z.object({
  tipo: TipoDiaEscalaEnum.optional(),
  observacao: z.string().trim().max(500).optional().or(z.literal("")),
});

// Salvamento em lote da escala: o front acumula as alterações no localStorage
// enquanto edita e envia tudo de uma vez ao concluir (menos requisições).
// `tipo: null` remove o dia da escala do colaborador.
export const escalasBulkSchema = z.object({
  mes: z.string().regex(/^\d{4}-\d{2}$/, "Mês inválido (use yyyy-mm)."),
  alteracoes: z
    .array(
      z.object({
        usuarioId: z.string().min(1),
        data: z.coerce.date({ error: "Data inválida." }),
        tipo: TipoDiaEscalaEnum.nullable(),
        // Etiqueta personalizada do setor (id dentro de Setor.etiquetas)
        etiquetaId: z.string().max(60).nullable().optional(),
      })
    )
    .max(1000),
});

// ── Setores gerenciados pelo admin ──
export const setorSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome do setor.").max(60),
});

// Palavra secreta da escala pública por setor. Vazio limpa a palavra.
export const palavraSecretaSetorSchema = z.object({
  setorId: z.string().optional(),
  setorNome: z.string().trim().min(1).optional(),
  palavraSecreta: z
    .string()
    .trim()
    .min(4, "A palavra secreta precisa ter ao menos 4 caracteres.")
    .max(100)
    .or(z.literal("")),
});

// Etiquetas de escala de um setor (nome/cor/comportamento editáveis).
export const etiquetasSetorSchema = z.object({
  // Configurador: informa o nome do próprio setor; admin pode usar qualquer um.
  setorNome: z.string().trim().min(1, "Informe o setor."),
  etiquetas: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(60),
        nome: z.string().trim().min(1, "Dê um nome à etiqueta.").max(40),
        cor: z.string().regex(/^#[0-9a-f]{6}$/i, "Use um hex de cor válido."),
        tipo: TipoBaseEtiquetaEnum,
      })
    )
    .min(1, "Mantenha ao menos uma etiqueta.")
    .max(12),
});

export const conhecimentoItemSchema = z.object({
  titulo: z.string().trim().min(1, "Informe um título.").max(200),
  conteudo: z.string().trim().min(1, "Informe o conteúdo."),
  categoria: z.string().trim().max(100).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
  visibilidade: VisibilidadeEnum.default("PRIVADO"),
});

export const conhecimentoItemAtualizarSchema = conhecimentoItemSchema.partial();

// ── Dev Area: configuração global do app (textos de notificação + aleatórias) ──
const textosPorEvento = z.object({
  entrada: z.string().max(200).default(""),
  saida_almoco: z.string().max(200).default(""),
  retorno_almoco: z.string().max(200).default(""),
  saida_final: z.string().max(200).default(""),
});

export const configAppSchema = z.object({
  // Comunicado global: aviso do admin que o app notifica uma vez por
  // publicação e mantém como banner na Home até o usuário dispensar.
  comunicado: z
    .object({
      ativo: z.boolean().default(false),
      titulo: z.string().trim().max(120).default(""),
      mensagem: z.string().trim().max(1000).default(""),
      atualizadoEm: z.string().nullable().default(null),
    })
    .optional(),
  // Legado (versões antigas do app ainda podem enviar/ler estes campos):
  notificacoes: z
    .object({
      titulo: z.string().max(120).default(""),
      lead: textosPorEvento,
      confirm: textosPorEvento,
      botoes: z.object({
        confirm: z.string().max(60).default(""),
        notYet: z.string().max(60).default(""),
        snooze: z.string().max(60).default(""),
      }),
    })
    .optional(),
  aleatorias: z
    .object({
      ativo: z.boolean().default(false),
      quantidadePorDia: z.number().int().min(0).max(10).default(0),
      horaInicio: z.number().int().min(0).max(23).default(8),
      horaFim: z.number().int().min(0).max(23).default(18),
      mensagens: z.array(z.string().trim().min(1).max(200)).max(50).default([]),
    })
    .optional(),
});

export const registroPontoWebSchema = z.object({
  data: z.coerce.date({ error: "Data inválida." }),
  tipoEvento: z.string().min(1, "Informe o tipo de evento."),
  horarioReal: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM inválido."),
});

export const registroPontoSyncSchema = z.object({
  cursor: z.coerce.date().optional(),
  registros: z
    .array(
      z.object({
        id: z.string().min(1),
        data: z.coerce.date(),
        tipoEvento: z.string().min(1),
        horarioReal: z.string().optional().or(z.literal("")),
        confirmado: z.boolean().default(false),
      })
    )
    .max(500)
    .default([]),
});

export const modeloHorarioSchema = z.object({
  nome: z.string().trim().min(1, "Informe um nome.").max(100),
  descricao: z.string().trim().max(500).optional().or(z.literal("")),
  horasSemanais: z.number().min(1).max(168).default(44),
  jornadaDiaria: z.number().min(1).max(24).default(8),
  jornadaPlantao: z.number().min(0).max(24).default(7.5),
  configuracao: z.unknown().optional(),
});
