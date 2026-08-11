# Plano — Ferramentas MVP (Fase 1): "O que eu digo agora?" + "Plano Individual de Apoio ao Aluno"

> Documento de referência para implementação das duas primeiras Ferramentas da Lumii.
> Não alterar nenhum arquivo de código sem consultar este plano.
> Leitura rápida (cheat sheet) em: `CLAUDE-ferramentas.md`

---

## 1. Contexto e objetivo

A seção **Ferramentas** ainda não existe no produto — este é o primeiro material da área. Princípio de produto (vale para toda ferramenta futura, não só estas duas):

> **"Tenho essa situação agora → abro a ferramenta → em 2 minutos sei o que fazer."**

Duas ferramentas neste MVP:

1. **"O que eu digo agora?"** — pais, assistente de conversas difíceis. Conteúdo 100% estático.
2. **"Plano Individual de Apoio ao Aluno"** — professores, plano de ação recorrente por aluno com histórico. Conteúdo estático no MVP (ver decisão abaixo), IA fica para Fase 2.

A Ferramenta 2 é a prioridade estratégica de retenção: diferente de um gerador pontual, ela acumula histórico por aluno e faz o professor voltar (check-in, novo plano). Esse mecanismo de retenção **não depende de IA** — depende do ciclo cadastrar → gerar → salvar → voltar para check-in, que funciona igual com conteúdo estático ou gerado.

---

## 2. Contexto e Decisões

### O que muda
| Antes | Depois |
|---|---|
| Sem seção Ferramentas | `/ferramentas` — hub com cards das duas ferramentas |
| `profiles.role` só distingue `student`/`admin` | Duas novas colunas booleanas opcionais (`is_parent`, `is_teacher`) para personalização — **não é controle de acesso** |
| — | Duas novas famílias de tabelas: scripts para pais + planos de apoio para professores |

### Decisões fixadas (divergências deliberadas do PRD original — ver justificativa em cada uma)

1. **Nenhuma das duas ferramentas usa IA no MVP.** A Ferramenta 1 já nasceu estática no PRD. A Ferramenta 2 muda de "geração via Claude" para **templates estáticos por `dificuldade_principal`** (8 valores fixos → 8 templates), pelo mesmo motivo de custo/latência/previsibilidade da Ferramenta 1, e por pedido explícito do usuário nesta sessão. Ver seção 8 para o ponto de extensão que permite trocar por IA na Fase 2 sem mudar schema, Server Actions ou UI.
2. **`profiles.role` (enum `student`/`admin`) não é tocado.** Esse enum controla acesso à área admin — misturar "pai"/"professor" nele criaria uma dependência perigosa entre controle de acesso e preferência de conteúdo. Em vez do `role text check (in 'pai','professor','ambos')` sugerido no PRD, uso duas colunas booleanas independentes e opcionais: `profiles.is_parent`, `profiles.is_teacher` (nullable, sem default forçado). Motivo: um valor único de 3 opções obriga a UI a resolver ambiguidade toda vez que precisar checar "é professor?" (`role === 'professor' || role === 'ambos'`); dois booleanos independentes são diretos de consultar e mais fáceis de estender se um dia existir um terceiro perfil.
3. **Nenhuma ferramenta é bloqueada por perfil declarado.** `is_parent`/`is_teacher` alimentam personalização (ex: ordem dos cards no hub, analytics) e nada mais — qualquer conta logada acessa as duas ferramentas. Reduz fricção (uma mãe que também dá aula não fica presa a uma escolha binária) e elimina a necessidade de route guards por papel no MVP.
4. **Sem rotas de API dedicadas (`/api/tools/...`).** O CLAUDE.md raiz já fixa o padrão do projeto: *"Server Actions para mutações; API routes apenas para webhooks externos"*. A seção 11 do PRD original (tabela de rotas REST) é substituída pela tabela de Server Actions na seção 9. Leituras (lista de alunos, histórico, plano ativo) acontecem direto em Server Components, sem round-trip de API.
5. **Tabela `students` renomeada para `teacher_students`.** "Students" colide com o vocabulário que a Lumii já usa para as próprias alunas da plataforma (`profiles`, `enrollments`). `teacher_students` deixa explícito que é o cadastro particular do professor dentro da ferramenta, sem relação com matrícula em curso.
6. **Modelo de IA, quando entrar na Fase 2, será `claude-sonnet-5`** (nome do PRD — `claude-sonnet-4-6` — está desatualizado; confirmado na sessão de implementação).

---

## 3. Modelo de dados (Supabase)

### Migration única: `supabase/migrations/20260811_ferramentas_mvp.sql`

```sql
-- Perfil: tags opcionais de uso — NÃO é controle de acesso (isso continua em profiles.role)
alter table public.profiles
  add column if not exists is_parent boolean,
  add column if not exists is_teacher boolean;

-- ══════════════════════════════════════════════════════════════════
-- FERRAMENTA 1: "O que eu digo agora?"
-- Conteúdo estático em lib/ferramentas/parent-scripts/content.ts — NÃO fica no banco.
-- Tabelas abaixo são só uso/favoritos, referenciando o conteúdo por script_key.
-- ══════════════════════════════════════════════════════════════════

create table public.parent_script_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  script_key text not null,
  created_at timestamptz not null default now()
);

create table public.parent_script_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  script_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, script_key)
);

-- ══════════════════════════════════════════════════════════════════
-- FERRAMENTA 2: "Plano Individual de Apoio ao Aluno"
-- Conteúdo-base estático em lib/ferramentas/support-plan/content.ts (8 templates,
-- um por dificuldade_principal). plano_gerado grava o resultado (editado ou não)
-- em jsonb — schema pensado para não mudar quando a Fase 2 trocar por IA.
-- ══════════════════════════════════════════════════════════════════

-- Cadastro mínimo do professor. NÃO confundir com profiles/enrollments (alunas da Lumii).
create table public.teacher_students (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  age int,
  class_label text,
  created_at timestamptz not null default now()
);

create table public.support_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.teacher_students(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  dificuldade_principal text not null,
  dificuldade_principal_outro text,
  tambem_apresenta text[] not null default '{}',
  ponto_forte text,
  ja_tentei text,
  plano_gerado jsonb not null,
  status text not null default 'ativo' check (status in ('ativo', 'encerrado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.support_plan_checkins (
  id uuid primary key default gen_random_uuid(),
  support_plan_id uuid not null references public.support_plans(id) on delete cascade,
  status text not null check (status in ('melhorou', 'igual', 'piorou')),
  notes text,
  created_at timestamptz not null default now()
);

create index parent_script_views_user_idx on public.parent_script_views (user_id, script_key);
create index parent_script_favorites_user_idx on public.parent_script_favorites (user_id);
create index teacher_students_teacher_idx on public.teacher_students (teacher_id);
create index support_plans_teacher_status_idx on public.support_plans (teacher_id, status);
create index support_plans_student_idx on public.support_plans (student_id);
create index support_plan_checkins_plan_idx on public.support_plan_checkins (support_plan_id);

-- RLS: cada usuário só vê/edita seus próprios registros
alter table public.parent_script_views enable row level security;
alter table public.parent_script_favorites enable row level security;
alter table public.teacher_students enable row level security;
alter table public.support_plans enable row level security;
alter table public.support_plan_checkins enable row level security;

create policy "Aluna gerencia seus proprios views" on public.parent_script_views
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Aluna gerencia seus proprios favoritos" on public.parent_script_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Professor gerencia seus proprios alunos" on public.teacher_students
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create policy "Professor gerencia seus proprios planos" on public.support_plans
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create policy "Professor gerencia checkins dos seus planos" on public.support_plan_checkins
  for all using (
    auth.uid() = (select teacher_id from public.support_plans where id = support_plan_id)
  ) with check (
    auth.uid() = (select teacher_id from public.support_plans where id = support_plan_id)
  );
```

---

## 4. Estrutura de pastas

```
src/
  app/
    (student)/
      ferramentas/
        page.tsx                        -- hub: cards das duas ferramentas
        o-que-eu-digo-agora/
          page.tsx                      -- seleção situação + idade → resultado estático
          favoritos/
            page.tsx
        plano-apoio-aluno/
          page.tsx                      -- lista de alunos do professor + cadastro rápido
          [studentId]/
            page.tsx                    -- detalhe: plano ativo + histórico + check-in
            novo-plano/
              page.tsx                  -- formulário → preview editável → salvar

  components/
    ferramentas/
      hub/
        FerramentaCard.tsx
      parent-scripts/
        SituacaoGrid.tsx
        IdadeSelector.tsx
        ScriptResultCard.tsx
        FavoritoButton.tsx
        CopiarTextoButton.tsx
      support-plan/
        StudentCard.tsx
        NovoAlunoModal.tsx
        SupportPlanForm.tsx
        PlanResultCard.tsx             -- preview editável antes de salvar
        CheckinModal.tsx
        PlanHistoryTimeline.tsx

  lib/
    ferramentas/
      parent-scripts/
        content.ts                     -- as 50 entradas estáticas (schema seção 5)
        types.ts
        actions.ts                     -- toggleFavorite, logView
      support-plan/
        content.ts                     -- os 8 templates estáticos (schema seção 6.3)
        types.ts
        actions.ts                     -- CRUD + buildSupportPlanDraft (lookup, não IA)

supabase/
  migrations/
    20260811_ferramentas_mvp.sql
```

**Fase 2 (não criar agora):** `lib/anthropic/client.ts` + `lib/ferramentas/support-plan/prompt.ts` — ver seção 8.

---

## 5. Ferramenta 1 — "O que eu digo agora?"

### 5.1 Fluxo do usuário
1. Abre a ferramenta a partir do hub `/ferramentas`.
2. Seleciona a situação em uma grade de botões (`SituacaoGrid`).
3. Informa a idade da criança (seletor numérico 0–17) — mapeada internamente para faixa etária.
4. Resultado aparece na hora — é leitura de conteúdo local, sem chamada de rede, sem loading perceptível.
5. Pode: copiar texto, favoritar, voltar e escolher outra situação.

Sem campo de contexto livre no MVP — o conteúdo é pré-escrito, não há nada que processe texto livre.

### 5.2 Inputs

```typescript
type Situacao =
  | 'nao_quer_dormir' | 'fazendo_birra' | 'bateu_no_irmao'
  | 'nao_quer_ir_escola' | 'nao_quer_guardar_brinquedos' | 'mentiu'
  | 'esta_com_medo' | 'esta_chorando' | 'nao_aceita_desligar_celular'
  | 'falou_desrespeitoso';

type FaixaEtaria = '2_4' | '5_7' | '8_10' | '11_13' | '14_17';

interface ParentScriptInput {
  situacao: Situacao;
  idade_crianca: number; // 0-17, convertido para FaixaEtaria na UI
}
```

### 5.3 Conteúdo estático — schema

`lib/ferramentas/parent-scripts/content.ts` — 10 situações × 5 faixas = **50 entradas**. Produção de conteúdo é trabalho de especialista em parentalidade positiva, em paralelo ao desenvolvimento (UI se constrói com 3-4 entradas de exemplo, conteúdo final entra depois sem mudar código).

```typescript
interface ParentScriptEntry {
  key: string;                 // "nao_quer_dormir__5_7"
  situacao: Situacao;
  faixa_etaria: FaixaEtaria;
  validacao: string;
  limite: string;
  escolha: string;
  se_persistir: string;
  evitar: { frase: string; motivo: string };
}
```

**Checklist de revisão humana (aplicar às 50 entradas antes de publicar):**
- [ ] Nenhuma linguagem de diagnóstico clínico.
- [ ] Nenhum tom culpabilizador em relação aos pais.
- [ ] Linguagem adequada à faixa etária.
- [ ] Frases curtas, primeira pessoa, prontas para serem ditas literalmente.
- [ ] Campo `evitar` sempre presente, com motivo breve.

**Disclaimer fixo** em todo resultado (não varia por entrada): *"Se essa situação está muito frequente ou intensa e te preocupa, vale conversar com um profissional (pediatra ou psicólogo infantil)."*

### 5.4 Estados de UI
- Vazio (seleção de situação)
- Idade selecionada → resultado (sem loading real)
- Fallback silencioso (combinação sem conteúdo cadastrado não deve acontecer com as 50 completas, mas o código trata sem quebrar)

### 5.5 Extras
- Botão "Copiar texto" (texto simples formatado).
- Botão "☆ Favoritar" → `parent_script_favorites`.
- Tela "Meus favoritos" — resolve cada `script_key` salvo no conteúdo estático.

---

## 6. Ferramenta 2 — "Plano Individual de Apoio ao Aluno"

### 6.1 Fluxo do usuário
1. Professor abre a ferramenta a partir do hub.
2. Sem alunos cadastrados → convite para cadastrar o primeiro (nome + idade opcional + turma opcional).
3. Seleciona o aluno (ou cadastra um novo).
4. Preenche o formulário: dificuldade principal, também apresenta (chips), ponto forte, o que já tentou.
5. Gera o plano — **lookup instantâneo no template estático da dificuldade selecionada**, sem loading real (mesma filosofia da Ferramenta 1).
6. Visualiza o plano pré-preenchido em campos editáveis — aqui é onde o professor personaliza de fato, incorporando `também apresenta`/`ponto forte`/`o que já tentei` manualmente ao texto, já que a geração não é dinâmica.
7. Marca opcionalmente "Sugerir conversa com a coordenação" (checkbox — anexa uma nota fixa e neutra ao plano; substitui o campo `sugestao_coordenacao` que na versão com IA seria inferido automaticamente).
8. Salva. Plano fica ativo, associado ao aluno.
9. Quando o professor decidir (sem bloqueio de tempo no MVP), volta e faz **check-in**: melhorou / igual / piorou + nota opcional.
10. Histórico de planos + check-ins fica visível na tela do aluno.

### 6.2 Inputs

```typescript
type DificuldadePrincipal =
  | 'iniciar_atividades' | 'manter_atencao' | 'seguir_instrucoes'
  | 'controlar_frustracao' | 'interagir_com_colegas' | 'participar_em_grupo'
  | 'concluir_tarefas' | 'lidar_com_mudancas_rotina' | 'outro';

interface SupportPlanInput {
  student_id: string;
  dificuldade_principal: DificuldadePrincipal;
  dificuldade_principal_outro?: string;  // obrigatório se 'outro'
  tambem_apresenta: string[];            // chips: distração, frustração, ansiedade,
                                          // dificuldade social, dificuldade de linguagem,
                                          // dificuldade motora, dificuldade de atenção, outro
  ponto_forte?: string;
  ja_tentei?: string;
  sugerir_coordenacao?: boolean;         // checkbox, ver 6.1 passo 7
}
```

`dificuldade_principal === 'outro'` não tem template correspondente — nesse caso o formulário pula direto para os campos editáveis com uma estrutura em branco (títulos da seção 6.4 sem conteúdo pré-preenchido) em vez de tentar casar com um template errado.

### 6.3 Conteúdo estático — schema

`lib/ferramentas/support-plan/content.ts` — **8 templates**, um por `DificuldadePrincipal` (exceto `outro`). Mesmo processo de revisão humana da Ferramenta 1, adaptado ao contexto pedagógico.

```typescript
interface SupportPlanTemplate {
  dificuldade_principal: Exclude<DificuldadePrincipal, 'outro'>;
  objetivo: string;             // objetivo claro e mensurável para ~2 semanas
  antes_da_atividade: string;
  durante: string;
  se_houver_recusa: string;
  o_que_observar: string;
}
```

**Checklist de revisão humana:**
- [ ] Nenhuma linguagem de diagnóstico clínico (nunca citar TDAH, autismo, ansiedade como condição etc. — tratar sempre como comportamento observável em contexto pedagógico).
- [ ] Nenhum tom acusatório em relação ao aluno.
- [ ] Estratégias de natureza pedagógica/comportamental, aplicáveis por um professor em sala, sem formação clínica.
- [ ] Específico e prático — nunca generalidades como "tenha paciência" sem dizer como.

**Nota fixa de coordenação** (usada quando `sugerir_coordenacao = true`, mesmo texto sempre): *"Se essa dificuldade for muito intensa, persistente ou impactar bastante o dia a dia do aluno, vale conversar com a coordenação pedagógica ou orientação escolar."*

**Disclaimer fixo** (`DISCLAIMER_SUPPORT_PLAN`, exibido em todo plano — diferente da nota acima, que é opcional/condicional): *"Este plano é uma sugestão pedagógica geral — não é um diagnóstico nem substitui avaliação profissional. Ajuste sempre com base no que você conhece do aluno."*

**Base conceitual dos templates** (documentada no cabeçalho de `content.ts`, não exibida ao professor): cada bloco do template mapeia pra uma prática com respaldo estabelecido — estrutura antecedente→comportamento (Suporte Comportamental Positivo/ABA), oferecer escolha para reduzir resistência (Teoria da Autodeterminação), dividir tarefa em etapas (Cognitive Load Theory), nomear o sentimento em voz baixa (neurociência do desenvolvimento infantil, "nomear para regular"), aviso prévio de mudança de rotina (prática consolidada em inclusão escolar). As 8 categorias de dificuldade se aproximam dos domínios de função executiva do BRIEF. Termos como "coordenação pedagógica"/"orientação escolar" são os nomes usados nas escolas brasileiras, e nenhuma estratégia pressupõe recursos que a escola típica brasileira não tem (sala extra, auxiliar 1:1).

### 6.4 Formato de output (UI)

```
🎯 Objetivo das próximas 2 semanas
{objetivo}

ANTES DA ATIVIDADE
{antes_da_atividade}

DURANTE
{durante}

SE HOUVER RECUSA
{se_houver_recusa}

O QUE OBSERVAR
{o_que_observar}

[se sugerir_coordenacao === true:]
💬 Vale conversar com a coordenação
{nota fixa da seção 6.3}
```

Estrutura salva em `support_plans.plano_gerado` (jsonb):

```typescript
interface PlanoGerado {
  objetivo: string;
  antes_da_atividade: string;
  durante: string;
  se_houver_recusa: string;
  o_que_observar: string;
  sugestao_coordenacao: string | null;
}
```

Esse shape é deliberadamente idêntico ao que a versão com IA (Fase 2, seção 8) produziria — só muda **quem preenche os campos** (template + edição manual vs. geração automática).

### 6.5 Sistema de check-in e histórico
- Tela do aluno: plano ativo (botão "Fazer check-in") + planos anteriores encerrados + linha do tempo de check-ins.
- Check-in: 3 botões grandes (Melhorou 🟢 / Igual 🟡 / Piorou 🔴) + nota opcional. Sem geração — só registro.
- Professor encerra um plano manualmente (`status = 'encerrado'`) e cria um novo a qualquer momento — isso constrói o histórico, que é o diferencial de retenção da ferramenta.

### 6.6 Estados de UI
- Sem alunos cadastrados (onboarding do primeiro aluno)
- Lista de alunos
- Formulário de novo plano
- Plano (pré-preenchido pelo template ou em branco se `outro`), editável, aguardando salvar
- Tela do aluno (plano ativo + histórico)
- Modal de check-in

---

## 7. Onboarding leve de perfil (pai/professor)

Ao visitar `/ferramentas` pela primeira vez com `is_parent` e `is_teacher` ambos `null`, exibir um banner discreto e dispensável: *"Você é mãe/pai, professor(a), ou os dois?"* com checkboxes. Salva via Server Action simples (`updateToolsProfile`). **Nunca bloqueia** acesso a nenhuma ferramenta — serve só para personalizar a ordem dos cards no hub e para analytics (seção 10). Se dispensado sem responder, não insiste na mesma sessão.

---

## 8. Ponto de extensão para IA (Fase 2 — não implementar agora)

A única peça que muda quando a Ferramenta 2 ganhar IA é a função que constrói o rascunho do plano:

```typescript
// lib/ferramentas/support-plan/actions.ts — assinatura estável entre MVP e Fase 2
function buildSupportPlanDraft(input: SupportPlanInput): PlanoGerado
```

- **MVP (hoje):** lookup síncrono em `content.ts` pelo `dificuldade_principal`. Sem chamada de rede, sem custo, sem risco de a resposta fugir do tom.
- **Fase 2:** mesma assinatura, implementação troca para uma chamada à API da Anthropic (`claude-sonnet-5`), usando `tambem_apresenta`/`ponto_forte`/`ja_tentei` como contexto real de personalização (hoje esses campos só ficam salvos e visíveis para o professor editar manualmente). UI, Server Actions que chamam `buildSupportPlanDraft`, schema do banco e componente de preview **não mudam** — só o corpo dessa função.

O system prompt já foi rascunhado no PRD original desta feature (guardrails: nunca diagnosticar, estratégias pedagógicas/comportamentais, sugestão de coordenação condicional, sempre JSON estruturado) — guardar esse texto como referência para quando a Fase 2 for implementada, em vez de reescrever do zero. Não criar `lib/anthropic/` nem pedir `ANTHROPIC_API_KEY` agora.

---

## 9. Server Actions (resumo)

Sem rotas de API — tudo Server Actions, seguindo o padrão do projeto (Zod valida input; `createClient()` respeita RLS; nenhuma ação precisa de service client, pois professor/pai só mexe nos próprios dados).

| Action | Arquivo | O que faz |
|---|---|---|
| `toggleParentScriptFavorite(scriptKey)` | `lib/ferramentas/parent-scripts/actions.ts` | Insere/remove favorito |
| `logParentScriptView(scriptKey)` | idem | Grava analytics de visualização (fire-and-forget) |
| `createTeacherStudent(input)` | `lib/ferramentas/support-plan/actions.ts` | Cadastra aluno do professor logado |
| `saveSupportPlan(studentId, input, planoEditado)` | idem | Grava em `support_plans` |
| `updateSupportPlan(planId, planoEditado)` | idem | Edita o `plano_gerado` de um plano existente (ativo ou encerrado) |
| `deleteSupportPlan(planId)` | idem | Exclui o plano (cascade apaga os check-ins) — UI pede confirmação antes |
| `createCheckin(planId, status, notes)` | idem | Grava em `support_plan_checkins` |
| `closeSupportPlan(planId)` | idem | `status = 'encerrado'` |
| `updateToolsProfile({is_parent, is_teacher})` | `lib/ferramentas/actions.ts` | Grava preferência de perfil (seção 7) |

`buildSupportPlanDraft(input)` **não é** Server Action — é uma função síncrona pura em `lib/ferramentas/support-plan/draft.ts` (lookup no template estático da seção 8, sem chamada de rede). Vira Server Action só quando a Fase 2 trocar por IA.

Leituras (lista de alunos, detalhe do aluno com histórico) acontecem direto em Server Components (`page.tsx`), sem Server Action dedicada.

---

## 10. Diretrizes de design/UI

- Mobile-first, botões grandes — uso em momento de estresse/pressa, não é hora de UI delicada.
- Fundo navy institucional (`#243149`, regra vigente desde 06/08/2026 na IDV) com cards off-white para contraste — **consultar `docs/brand/IDV-Lumii.md` antes de qualquer tela nova**, cor primária de ação é o coral `#f6614f`.
- Seleção por botões/chips em vez de texto livre sempre que possível.
- Resultado gerado sempre em blocos visualmente escaneáveis (títulos curtos + frase em destaque), nunca parágrafo corrido — replicar o padrão já usado em `DownloadBlock` (cards com ícone + label).
- Fonte Poppins, tom acolhedor — nunca "corporativo"/frio, público é pai/mãe e professor em momento de dificuldade.
- Textareas editáveis (planos de apoio) nunca têm scroll interno — usar `AutoGrowTextarea` (`components/ferramentas/support-plan/AutoGrowTextarea.tsx`), que cresce pra caber o conteúdo. Nunca voltar a `rows` fixo com `resize-none` sem auto-grow — corta texto e obriga a rolar dentro do campo, ruim em mobile.
- Todo plano de apoio salvo (ativo ou no histórico) é editável e excluível pelo professor (`PlanCard.tsx`) — excluir sempre passa por `window.confirm()` antes, mesmo padrão usado em exclusões do admin (`course-content-manager.tsx`).

---

## 11. Analytics mínimo

- Situações/faixas mais visualizadas na Ferramenta 1 (`parent_script_views`) — ajuda a priorizar quais entradas revisar/expandir primeiro.
- Taxa de favoritado por entrada.
- Ferramenta 2: número médio de check-ins por plano, distribuição melhorou/igual/piorou, planos que geraram um segundo plano para o mesmo aluno (sinal de retenção real).

Sem dashboard dedicado no MVP — consultas diretas via SQL bastam por ora.

---

## 12. Fases de implementação

### Fase 1 — Banco e conteúdo base
- [ ] Migration `20260811_ferramentas_mvp.sql` (seção 3)
- [ ] `lib/ferramentas/parent-scripts/content.ts` com 3-4 entradas de exemplo (schema seção 5.3)
- [ ] `lib/ferramentas/support-plan/content.ts` com os 8 templates (schema seção 6.3)
- [ ] `types.ts` de cada ferramenta

### Fase 2 — Ferramenta 1 completa
- [ ] Hub `/ferramentas` (cards das duas ferramentas)
- [ ] `SituacaoGrid` + `IdadeSelector` + `ScriptResultCard`
- [ ] Favoritar + tela de favoritos
- [ ] Onboarding leve de perfil (seção 7)

### Fase 3 — Ferramenta 2 completa
- [ ] Cadastro/lista de `teacher_students`
- [ ] `SupportPlanForm` → `buildSupportPlanDraft` → `PlanResultCard` editável → salvar
- [ ] Tela do aluno: plano ativo + histórico
- [ ] Check-in (modal) + encerrar plano

### Fase 4 — Conteúdo final e revisão
- [ ] 50 entradas da Ferramenta 1 escritas e revisadas (checklist seção 5.3)
- [ ] 8 templates da Ferramenta 2 escritos e revisados (checklist seção 6.3)
- [ ] Nenhuma combinação cai no fallback genérico

### Fase 5 — Polimento
- [ ] Item "Ferramentas" no `menu_items` (nav é backend-first — não hardcodar link)
- [ ] Teste real em mobile (não só resize de desktop)
- [ ] Analytics (seção 11) validados com dados reais

---

## 13. Fora de escopo do MVP (backlog)

- **IA na Ferramenta 2** (seção 8) — ponto de extensão pronto, implementação fica para Fase 2 futura.
- Camada de IA opcional sobre o conteúdo estático da Ferramenta 1 (personalização em cima do script pré-escrito).
- Painel admin para editar o conteúdo estático sem deploy (hoje vive em código — ver nota no CLAUDE.md raiz).
- Módulo completo de "Turma" (cadastro em massa, importação de lista).
- Geração de PDF com identidade visual da Lumii.
- Sugestão automática de novo plano com base no histórico de check-ins.
- Compartilhamento do script/plano por WhatsApp/e-mail.
- Dashboard de analytics dedicado (por ora, consulta SQL direta).
- As demais ferramentas do brainstorm original (Rotina Infantil, Combinados da Família, Plano de Aula, Parecer Descritivo, Radar da Turma, etc.).

---

## 14. Critérios de aceite

- [ ] Pai chega da seleção de situação + idade ao script completo instantaneamente (sem loading perceptível).
- [ ] Todas as 50 combinações da Ferramenta 1 têm conteúdo cadastrado e revisado; nenhuma cai no fallback.
- [ ] Todos os 8 templates da Ferramenta 2 têm conteúdo cadastrado e revisado.
- [ ] Professor cadastra aluno, gera plano, edita, salva, sai e volta depois para check-in sem perder dados.
- [ ] Professor vê histórico de planos anteriores de um mesmo aluno.
- [ ] RLS validado: um usuário não vê dados de outro mesmo manipulando URL/ID.
- [ ] Layout funcional em mobile (teste real em celular).
- [ ] Nenhuma chamada de rede/IA acontece em nenhum dos dois fluxos de geração (validar via aba Network do browser).

---

## 15. Checklist de segurança

- [ ] RLS ativo em `parent_script_views`, `parent_script_favorites`, `teacher_students`, `support_plans`, `support_plan_checkins`
- [ ] Server Actions verificam `auth.uid()` antes de qualquer mutação (RLS é a segunda camada, não a única)
- [ ] Zod valida todo input de formulário (`SupportPlanInput`, `ParentScriptInput`, cadastro de aluno)
- [ ] `profiles.is_parent`/`is_teacher` nunca usados para decisão de acesso, só personalização — reforçar em code review
