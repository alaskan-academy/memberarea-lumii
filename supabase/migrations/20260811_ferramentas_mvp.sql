-- Ferramentas MVP: "O que eu digo agora?" (pais) + "Plano Individual de Apoio ao Aluno" (professores)
-- Ver PLAN-ferramentas.md e CLAUDE-ferramentas.md para contexto completo.
-- Rodado manualmente em produção via MCP em 2026-08-11.

-- Perfil: tags opcionais de uso — NÃO é controle de acesso (isso continua em profiles.role)
alter table public.profiles
  add column if not exists is_parent boolean,
  add column if not exists is_teacher boolean;

-- FERRAMENTA 1: "O que eu digo agora?"
-- Conteúdo estático em lib/ferramentas/parent-scripts/content.ts — NÃO fica no banco.
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

-- FERRAMENTA 2: "Plano Individual de Apoio ao Aluno"
-- Conteúdo-base estático em lib/ferramentas/support-plan/content.ts (8 templates).
-- teacher_students != profiles/enrollments (aluna da Lumii) — é o cadastro particular do professor.
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
