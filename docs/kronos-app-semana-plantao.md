# Kronos App — Semana de plantão, Domingo efetivo e etiquetas (ajustes futuros)

> Gerado em jul/2026 junto com a rodada "fixes_complexos v2" do backend/web.
> Este documento lista o que precisa ser ajustado no app mobile (`apk/kronos-app`)
> para acompanhar as mudanças já entregues no backend.

## 1. Aviso de semana de plantão (prioridade)

**Regra de negócio** (já implementada no web, em `src/lib/escala.ts` + `src/app/dashboard/page.tsx`):

- Se o colaborador tem um dia com `tipo = "PLANTAO"` no **fim de semana da semana
  corrente** (sábado/domingo que encerram a semana — ex.: plantão nos dias 11–12
  → aviso vale nos dias úteis 6–10), ele está na **"semana de plantão"**.
- Nessa semana, a jornada diária dele é **reduzida**: o valor vem de
  `modeloHorario.jornadaPlantao` (horas decimais; `7.5` = 7h30; padrão 7.5).

**O que fazer no app:**

1. **Aviso ao abrir o app**: banner/cartão na Home (mesmo tom do
   `DailyBalanceBanner`) quando `runSync`/abertura detectar semana de plantão:
   _"Semana de plantão — jornada de 7h30 por dia. Você está escalado para o
   plantão de DD/MM e DD/MM."_
2. **Notificação local**: agendar uma notificação na segunda-feira da semana de
   plantão (ex.: 08h) com o mesmo texto. Usar o `reminderService` existente
   (canal Android HIGH já configurado).
3. **Cálculo de saldo**: em `services/escalasService.ts` (`metaParaDia`), nos
   dias úteis da semana de plantão, usar `jornadaPlantao` como meta do dia em
   vez da meta do modelo/workDays.

**De onde vem o dado:**

- `GET /api/v1/usuarios/me` agora devolve `modeloHorario: { nome, jornadaPlantao }`.
- As escalas já sincronizam via cache `escala_dias` — basta procurar `PLANTAO`
  no sábado/domingo da semana corrente (mesma lógica de
  `sabadoDaSemana`/`parFimDeSemana` em `src/lib/escala.ts` do web — portar).

## 2. Novo tipo de dia: `DOMINGO_EFETIVO`

- Enum `TipoDiaEscala` ganhou `DOMINGO_EFETIVO` (exclusivo de domingos; indica
  que a pessoa trabalha naquele domingo). **HOME_OFFICE não é mais oferecido**
  na UI web (dias antigos continuam existindo no banco — tratar como legado).
- Ajustar no app: `src/utils/escalaUI.ts` (cor/rótulo do novo tipo, ex.: roxo
  `#8b5cf6` / "Domingo efetivo"), `metaParaDia` (domingo efetivo = dia
  trabalhado; definir meta conforme regra de negócio) e a `EscalaScreen`.
- Regra de pareamento: no web, marcar PLANTÃO num sábado **ou** domingo marca o
  **par completo** (sáb+dom). O `EscalaEditModal` do app deveria replicar isso
  ao editar fim de semana (o endpoint `POST /escalas` aceita um dia por vez —
  enviar as duas datas).

## 3. Etiquetas de escala por setor

- Cada `Setor` agora tem `etiquetas Json?`: lista de `{ id, nome, cor (hex),
  tipo }`, onde `tipo ∈ NORMAL | PLANTAO | FOLGA | DOMINGO_EFETIVO` define o
  comportamento. `null` → conjunto padrão (ver `ETIQUETAS_PADRAO` em
  `src/lib/escala.ts`).
- `EscalaDia` ganhou `etiquetaId` (id dentro do JSON do setor; sem FK).
- O app hoje exibe por `tipo` — continua funcionando. Para exibir o **nome
  personalizado** da etiqueta, será preciso sincronizar as etiquetas do setor
  do usuário (novo endpoint a criar, ex.: `GET /setores/etiquetas?setor=X`, ou
  embutir no `GET /usuarios/me`).

## 4. Multi-setor

- `Usuario.setores: string[]` (o `setor` continua sendo o principal).
- `GET /escalas/colaboradores` agora recorta por setores do configurador — o
  seletor de colaborador do app já respeita isso automaticamente.

## Checklist resumido

- [ ] Banner de semana de plantão na Home (abrir app).
- [ ] Notificação local na segunda-feira da semana de plantão.
- [ ] `metaParaDia` usa `jornadaPlantao` nos dias úteis da semana de plantão.
- [ ] Suporte a `DOMINGO_EFETIVO` (cor, rótulo, meta, edição).
- [ ] Pareamento sáb+dom ao marcar plantão no fim de semana pelo app.
- [ ] (Opcional) Sincronizar etiquetas personalizadas do setor.
