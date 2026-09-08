# Plano: Ferramentas + Tiers da Lumii

**Status:** validado — pronto para implementar (decisões de tier/venda fechadas)
**Substitui:** `tiers-acesso.md` (aquele foi escrito para o contexto artesanato/Handify — resíduo do fork; não vale para a Lumii).
**Contexto do produto:** Lumii = plataforma de educação para **pais e professores** (não artesanato). Ferramentas atuais: "O que eu digo agora?" (scripts) e "Plano de Apoio" (por aluno/turma).

---

## Objetivo e princípio

Criar diferenciação real entre **cadastro grátis → aluna → Lumii Completo** para motivar compra e, principalmente, **renovação**.

> **A trava (dependência) = a Lumii virar o "sistema de registro" da professora sobre os alunos dela.** Ferramenta grátis cria o hábito; ferramenta paga faz os dados do ano morarem aqui; o Completo transforma esses dados no que ela **precisa** nos momentos em que é cobrada — conselho de classe, boletim, reunião de pais. Cancelar = perder o histórico do ano dos alunos. A pressão de renovação bate no pico ao fim de cada bimestre/ano.

**Restrição de projeto (CLAUDE.md):** ferramentas **sem IA no MVP** — banco de frases + templates + entrada estruturada → saída pronta, com revisão humana. IA fica como evolução.

---

# PARTE A — Fundação de acesso (tiers + Lumii Completo)

Adaptada do modelo já validado na Handify. **O tier nunca é armazenado — é sempre derivado** dos dados, para não dar inconsistência.

## A.1 — Os tiers

| Tier | Quem é | Como detectar |
|------|--------|---------------|
| `visitante` | sem conta | sem sessão → redireciona para `/login`. **Não há ferramenta pública**: todos os tiers exigem cadastro; o piso é o `gratis` |
| `gratis` | tem conta, nunca comprou | `profiles` existe, sem `enrollments` ativos e sem membership |
| `aluna` | comprou ≥1 curso avulso | tem `enrollments` ativa com `source != 'subscription'` |
| `completo` | assinatura anual ativa | tem `memberships` ativa (`plan = 'completo'`, `revoked_at is null`, não vencida) |
| `admin` | equipe | `profiles.role = 'admin'` |

Ordem de precedência: `admin > completo > aluna > gratis > visitante`. Derivado — **nenhuma coluna `plan` em `profiles`**.

Dois pontos de verdade que precisam concordar:
- **Banco:** `current_tier(uid)` (SECURITY DEFINER, revogada de anon/public) — para RLS.
- **TS:** `getTier(userId)` em `src/lib/access/getTier.ts` (server-only, via `createServiceClient`; entregue ao client como prop por Server Component, nunca por API pública).

```ts
export type Tier = "visitante" | "gratis" | "aluna" | "completo" | "admin";
export async function getTier(userId: string | null): Promise<Tier>;
```

## A.2 — Tabela `memberships` (nova)

Fonte da verdade do Completo (hoje a Lumii **não tem** isso — só um botão de promoção em `annual_promo`).

```sql
create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  plan        text not null default 'completo' check (plan in ('completo')),
  source      text not null check (source in ('payt','manual','bonus','migration')),
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz,               -- null = sem prazo; senão vence na renovação
  revoked_at  timestamptz,               -- revogar = marcar, NUNCA apagar (auditoria)
  granted_by  uuid references public.profiles(id),
  reason      text,
  created_at  timestamptz not null default now()
);

-- Uma ativa por aluna; histórico fica nas linhas revogadas
create unique index memberships_one_active
  on public.memberships (user_id, plan) where revoked_at is null;

alter table public.memberships enable row level security;
-- Aluna lê a própria; admin gerencia tudo; escrita só service_role/admin.
```

`has_active_membership(uid)` (SECURITY DEFINER): `revoked_at is null AND (expires_at is null OR expires_at > now())`.

## A.3 — `courses.in_plan` (nova coluna) + relação com `is_subscription_only`

```sql
alter table public.courses add column in_plan boolean not null default false;
```

| Flag | Significa |
|------|-----------|
| `in_plan` (nova) | curso **incluído no Lumii Completo** — marcar entra **na hora** para quem tem o plano, sem backfill |
| `is_subscription_only` (já existe) | curso **não é vendido avulso** (só via plano) |
| `product_codes` (já existe, array) | códigos que liberam o curso **avulso** (Payt) |

São ortogonais: um curso pode ser `in_plan=true` **e** vendido avulso (`product_codes` preenchido, `is_subscription_only=false`). Curso exclusivo do plano = `in_plan=true` + `is_subscription_only=true`.

## A.4 — `subscription_product_codes` (onde mora o código do plano)

Adicionar ao config já existente do plano anual (`annual_promo`, single-row, editado em `/admin/plano-anual`):

```sql
alter table public.annual_promo add column subscription_product_codes text[] not null default '{}';
```

*(De quebra, corrigir o texto padrão residual "Plano Anual Handify™" → Lumii.)*

**Os 3 campos que NÃO se confundem** (o erro fácil):

| O que você quer | Onde | Campo |
|---|---|---|
| Curso faz parte do plano | `/admin/cursos` (form do curso) | checkbox **"Incluído no Lumii Completo"** → `courses.in_plan` |
| Código que identifica a compra **do plano** | `/admin/plano-anual` | `annual_promo.subscription_product_codes` (um por linha) |
| Código que libera **um curso avulso** | `/admin/cursos` | `courses.product_codes` (array) |

## A.5 — O carimbo `granted_at` (o truque portável)

Ao conceder o Completo, **toda matrícula criada pelo plano nasce com o MESMO `granted_at` da membership**. Na revogação, expira-se **só as matrículas com aquele carimbo** — assim curso que a aluna comprou à parte (outro carimbo) **fica**. Sem isso não há como separar "veio com o plano" de "pagou avulso".

## A.6 — Acesso derivado: `is_enrolled()` / `hasCourseAccess()`

Estender a lógica existente para aceitar **membership + in_plan**, mesmo sem linha em `enrollments`:

> tem acesso ao curso **SE** existe enrollment ativa **OU** (`has_active_membership` **E** `courses.in_plan`).

A matrícula física é criada no **primeiro acesso** ao curso do plano, com `source = 'subscription'` (porque progresso, conclusão e certificado saem dela). Curso novo marcado `in_plan` entra na hora — sem backfill.

## A.7 — Liberação automática (via webhook Payt)

Reaproveita o pipeline atual (`route.ts` → `process_pending_payment_events` → `handle_new_user`).

- Nova função `sync_membership_from_payments(user_id)` (adaptada da Handify):
  - acha a 1ª compra paga de um código em `subscription_product_codes` que **não** foi desfeita por reembolso/cancelamento posterior (subquery `refund.created_at > compra.created_at`);
  - cria a membership com `granted_at` = **data da compra** (não a data em que descobrimos), `expires_at` = **data de renovação que a Payt manda no payload**, `source = 'payt'`;
  - matricula em todos os cursos `in_plan` com `source='subscription'` e o carimbo da membership;
  - **idempotente**: devolve `false` se já há membership ativa (serve também de backfill).
- No `route.ts`: se o `product_code` do evento bate com `subscription_product_codes` → aciona o fluxo de membership; senão → matrícula avulsa por curso (como hoje).
- Revogação (reembolso real — ver `classifyEvent`/`payment_status` já corrigido): marca `revoked_at` na membership **e** expira só as matrículas com o carimbo dela.

## A.8 — Liberação/revogação manual (admin)

Em `.../admin/alunos/[userId]/membership-actions.ts` (adaptado da Handify):
- `grantMembershipAction`: **motivo obrigatório** (Zod `min(1)`), `source` manual|bonus, `expires_at` opcional; recusa se já ativa; fecha vencida-não-revogada antes de abrir nova; matricula nos `in_plan` (não toca em curso já ativo comprado à parte; recria matrícula vencida; todas com o carimbo da membership); `audit_log` com motivo/quantos; **um** e-mail "Lumii Completo".
- `revokeMembershipAction`: inverso; expira só as matrículas com o carimbo da membership.

## A.9 — Backfill

Rodar `sync_membership_from_payments` para quem já comprou o plano antes desta feature (idempotente). Auditar via `payment_events`.

## A.10 — Fundação técnica no front

- `getTier()` (A.1).
- `<LockedFeature requiredTier="aluna" currentTier={tier}>…</LockedFeature>` — renderiza o conteúdo com overlay/blur + CTA se `currentTier < requiredTier`. Ordem: visitante < gratis < aluna < completo.
- Teste-chave: aluna com enrollment **vencida** cai em `gratis`, não `aluna`. Membership vencida cai fora de `completo`.

---

# PARTE B — Arquitetura de 4 blocos (as ferramentas)

De 14 tiles soltos para 4 blocos coerentes. O **aluno é o centro**; cadastro único e compartilhado (`teacher_students`, que já existe).

## Bloco 1 — 🧑‍🎓 Meus Alunos / Minha Turma  *(o centro de dados)*

Constrói sobre `teacher_students` (já existe: name, age, class_label) e `teacher_classes`. Cada aluno vira uma **ficha com abas**; a turma tem visões agregadas.

- **Ficha do aluno (abas):** Plano de Apoio *(já existe)* · Diário de bordo · Metas socioemocionais · Portfólio · Pareceres/boletim do aluno · histórico de comunicação com os pais.
- **Visão da turma:** Mapa socioemocional (dashboard que junta plano+diário+metas de cada aluno) · **Exportar relatório** de conselho/reunião (por aluno, puxando de tudo).

*(Cleanup: hoje `teacher_students.class_label` é texto livre e `teacher_classes` é tabela à parte — unificar via `class_id` FK.)*

## Bloco 2 — 📚 Planejamento  *(material reutilizável da prof)*

- Biblioteca de planos de aula/atividades (salva, reusa ano a ano)
- Rubricas de avaliação (template criado aqui, **aplicado** na ficha do aluno)
- Planejador anual/bimestral alinhado à **BNCC** (códigos de habilidade)

## Bloco 3 — ✍️ Geradores  *(entrada grátis que "pluga" nos hubs)*

- **Gerador de parecer descritivo / comentário de boletim** — avulso (grátis) **e** salvando por aluno (aluna+). Puxa do diário/metas/rubricas do aluno.
- **O que eu digo agora?** *(já existe)* — scripts para os pais; conecta à ficha (registra a comunicação).

## Bloco 4 — 🎲 Sala de aula  *(utilitários ao vivo, sem dados)*

- Sorteio de aluno/duplas/grupos · Cronômetro visual · Gerador de combinados/regras (cartaz)

## Onde ficam os tiers em cada bloco

| Bloco | 🆓 Grátis (cadastro) | 🎓 Aluna | 👑 Completo |
|---|---|---|---|
| Meus Alunos | — (sem cadastro de aluno) | cadastra turma + salva diário/plano/metas/pareceres | Mapa da turma, relatório de conselho/reunião, portfólio exportável, histórico do ano |
| Planejamento | ver 1 exemplo | biblioteca + rubricas (salvas) | planejador anual BNCC, exportações |
| Geradores | parecer avulso (1x, sem salvar) + scripts limitados | salva por aluno; boletim do bimestre | boletim do ano + exportar |
| Sala de aula | tudo (hook diário) | tudo | tudo |

**Fronteira do tier = o que se faz com o dado:** grátis usa avulso/sem salvar; aluna **salva por aluno**; completo desbloqueia a **agregação e relatório do ano**.

---

# PARTE C — Fluxos conectados (CTA + volta automática)

Padrão: o CTA carrega um **contexto de retorno** (`?voltar=<url>&aluno=<id>`); a ferramenta de destino abre **pré-preenchida** com o aluno e, **ao salvar, redireciona de volta** com o resultado **já vinculado**. Sem estado frágil — só query param + entidade ligada ao `teacher_students`.

Fluxos principais:
1. **Parecer** com poucas observações → *"Registrar observação no Diário"* → Diário (no aluno) → salva → volta ao parecer com a observação disponível.
2. **Diário** com ocorrência séria → *"Preparar conversa com os pais"* → *O que eu digo agora* → salva → volta à ficha com o script no histórico de comunicação.
3. **Diário/plano** com dificuldade recorrente → *"Criar Plano de Apoio para [aluno]"* → volta com o plano vinculado.
4. **Rubrica aplicada** ao aluno → notas **alimentam** o gerador de parecer.
5. **Relatório de conselho/reunião** puxa tudo; onde faltar dado, mostra o CTA para preencher no lugar certo.

Esse "ir-e-voltar" é o que faz os 4 blocos parecerem **um produto só** — e é a teia de dados que vira a trava.

---

# PARTE D — Modelo de dados (novas tabelas)

Todas com **RLS `teacher_id = auth.uid()`** (dados privados da professora; nenhuma política de leitura para terceiros).

```sql
-- Diário de bordo (por aluno)
student_log (id, teacher_id, student_id→teacher_students, tipo, texto, data, created_at)

-- Metas socioemocionais (por aluno/turma)
student_goals (id, teacher_id, student_id, meta, status, created_at)
student_goal_checkins (id, goal_id→student_goals, status, notes, created_at)

-- Portfólio (por aluno)
student_portfolio (id, teacher_id, student_id, titulo, descricao, anexo_url?, created_at)

-- Pareceres/boletim (por aluno)
student_reports (id, teacher_id, student_id, periodo, area, texto, fonte jsonb, created_at)

-- Comunicação com os pais (por aluno) — saída de "O que eu digo agora" salva
student_comms (id, teacher_id, student_id, contexto, script, created_at)

-- Biblioteca da prof (não por aluno)
lesson_resources (id, teacher_id, titulo, tipo, conteudo jsonb, tags text[], created_at)
rubrics (id, teacher_id, titulo, criterios jsonb, created_at)
rubric_scores (id, teacher_id, rubric_id, student_id, notas jsonb, created_at)
year_plans (id, teacher_id, ano, bimestre, bncc_codes text[], conteudo jsonb, created_at)
```

*(Nomes e colunas finais a refinar na implementação; a base é `teacher_students` como raiz.)*

---

# PARTE E — Ordem de implementação sugerida

1. **Fundação de acesso** (Parte A): `memberships` + `courses.in_plan` + `subscription_product_codes` + `getTier()`/`current_tier()` + `is_enrolled` estendida + webhook/sync + admin grant/revoke + backfill. *(Sem isso, nenhum tier "completo" é detectável.)*
2. **`<LockedFeature>` + hub de ferramentas** relido por tier.
3. **Gerador de parecer descritivo** (o melhor cavalo de entrada: dor gigante, tiers naturais, começa a dependência).
4. **Meus Alunos**: Diário de bordo (a ferramenta que mais cria dependência).
5. **Sala de aula** (hook grátis de uso diário — pode ir em paralelo, não depende dos tiers).
6. **Planejamento** (biblioteca, rubricas) e **relatórios do Completo** (conselho/reunião, mapa da turma).
7. Portfólio, planejador BNCC, metas.

---

# PARTE F — Adjacente: admin de alunas (3 situações + busca)

Da experiência Handify (o usuário sinalizou querer o mesmo): a tela `/admin/alunos` da Lumii deveria distinguir **três situações**, não duas, e ter **uma busca só**:

| Aba | Significa | De onde vem |
|---|---|---|
| Cadastradas | comprou e ativou | view com `tem_curso = true` |
| Sem ativação | comprou e não criou conta | `activation_tokens` não usados, menos quem já tem perfil |
| Sem cursos | só se cadastrou, não comprou | view com `tem_curso = false` |

- Criar `admin_alunas_view` (`security_invoker = true`) com `qtd_cursos`, `tem_curso`, `tem_completo` como colunas → paginar/contar/filtrar no banco.
- Regra da busca: **sem busca, a aba define o segmento; com busca, todos os grupos juntos** (`if (!q) filtra por aba`).
- Busca por **CPF** (11 dígitos) via `cpf_hash`; fallback no `payload->customer->>doc` de `payment_events` (acha quem comprou e ainda não tem conta).
- Tokens de "sem ativação" via `fetchAll` (paginação — o `src/lib/supabase/fetch-all.ts` já existe).

*(Não é ferramenta de aluna; é gestão. Fica registrado aqui porque compartilha a fundação de acesso — `tem_completo` = `has_active_membership`.)*

---

# Notas & decisões

- **Lumii Completo = assinatura anual, chega com `product_code`** (confirmado). Renovação anual → `expires_at` na membership; ao vencer, cai para `aluna`/`gratis` e perde acesso aos cursos `in_plan`.
- **Sem IA no MVP** — parecer e planos por banco de frases/templates + input estruturado.
- **Timing de renovação:** amarrar CTAs e e-mails ao calendário escolar (fim de bimestre/ano), quando os relatórios do Completo valem mais.
- **Decidido:** (a) **todos os tiers exigem cadastro** — nenhuma ferramenta pública sem login; o piso é o cadastro grátis. (b) **`expires_at` vem do payload da Payt** (data de renovação), não fixado +1 ano — ao vencer, a membership deixa de ser ativa e a aluna cai para `aluna`/`gratis`, perdendo os cursos `in_plan`.
