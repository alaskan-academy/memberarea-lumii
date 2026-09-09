-- Metas socioemocionais (Bloco 1 "Meus Alunos" — Parte D do plano). Por aluno:
-- a professora define uma meta (ex.: "esperar a vez de falar") numa área
-- socioemocional e acompanha com check-ins de progresso. Alimenta o mapa
-- socioemocional e o relatório de conselho.
--
-- Espelha support_plans + support_plan_checkins:
--   student_goals keyed em teacher_id + FK student_id → teacher_students;
--   student_goal_checkins SEM teacher_id, posse checada via subquery à meta pai.
-- RLS com (select auth.uid()) desde o início (padrão 20260817).

create table if not exists public.student_goals (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  student_id  uuid not null references public.teacher_students(id) on delete cascade,
  -- Área socioemocional (vocabulário espelhado em src/lib/ferramentas/metas/types.ts).
  area        text not null default 'convivencia'
                check (area in ('convivencia','autorregulacao','autonomia','participacao','comunicacao','outra')),
  meta        text not null,
  status      text not null default 'em_andamento'
                check (status in ('em_andamento','alcancada','pausada')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists student_goals_student_idx
  on public.student_goals (student_id, created_at desc);
create index if not exists student_goals_teacher_idx
  on public.student_goals (teacher_id);

alter table public.student_goals enable row level security;

create policy "Professor gerencia as metas dos seus alunos" on public.student_goals
  for all
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);

create table if not exists public.student_goal_checkins (
  id          uuid primary key default gen_random_uuid(),
  goal_id     uuid not null references public.student_goals(id) on delete cascade,
  status      text not null check (status in ('avancou','estavel','recuou')),
  nota        text,
  created_at  timestamptz not null default now()
);

create index if not exists student_goal_checkins_goal_idx
  on public.student_goal_checkins (goal_id, created_at desc);

alter table public.student_goal_checkins enable row level security;

create policy "Professor gerencia os check-ins das suas metas" on public.student_goal_checkins
  for all
  using ((select auth.uid()) = (select teacher_id from public.student_goals where id = goal_id))
  with check ((select auth.uid()) = (select teacher_id from public.student_goals where id = goal_id));
