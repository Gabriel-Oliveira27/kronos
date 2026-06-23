import { z } from "zod";

export const PapelEnum = z.enum(["ADMIN", "SUPORTE", "CONFIGURADOR_ESCALA", "USUARIO"], {
  error: "Papel inválido.",
});

// SABADO_REDUZIDO removido das regras de negócio (item 10)
export const TipoDiaEscalaEnum = z.enum(
  ["NORMAL", "PLANTAO", "HOME_OFFICE", "FOLGA"],
  { error: "Tipo de dia inválido." }
);

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
  fotoUrl: z.string().url().optional().or(z.literal("")),
  solicitacaoId: z.string().optional(),
  modeloHorarioId: z.string().optional().or(z.literal("")),
});

export const atualizarUsuarioSchema = z.object({
  nomeCompleto: z.string().trim().min(3).optional(),
  setor: z.string().trim().min(1).optional(),
  email: z.string().trim().email("E-mail inválido.").optional().or(z.literal("")),
  papel: PapelEnum.optional(),
  temApp: z.boolean().optional(),
  ativo: z.boolean().optional(),
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
  observacao: z.string().trim().max(500).optional().or(z.literal("")),
});

export const escalaDiaAtualizarSchema = z.object({
  tipo: TipoDiaEscalaEnum.optional(),
  observacao: z.string().trim().max(500).optional().or(z.literal("")),
});

export const conhecimentoItemSchema = z.object({
  titulo: z.string().trim().min(1, "Informe um título.").max(200),
  conteudo: z.string().trim().min(1, "Informe o conteúdo."),
  categoria: z.string().trim().max(100).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1)).max(20).default([]),
  visibilidade: VisibilidadeEnum.default("PRIVADO"),
});

export const conhecimentoItemAtualizarSchema = conhecimentoItemSchema.partial();

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
  configuracao: z.unknown().optional(),
});
