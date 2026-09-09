-- Rubricas de avaliação (Bloco 2 "Planejamento" — Parte D). Dois passos:
--   1) rubrics: o TEMPLATE (critérios × escala) que a prof monta e reusa.
--   2) rubric_scores: a APLICAÇÃO do template a um aluno (nota por critério).
-- rubric_scores tem student_id (→ teacher_students) — é a rubrica "aplicada na
-- ficha do aluno". Mesmo padrão de RLS: teacher_id = auth.uid(), sem terceiros.

create table if not exists public.rubrics (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  titulo      text not null,
  -- { escala: string[] (níveis, colunas), itens: [{id, nome}] (critérios, linhas) }
  criterios   jsonb not null default '{"escala":[],"itens":[]}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists rubrics_teacher_idx
  on public.rubrics (teacher_id, created_at desc);

alter table public.rubrics enable row level security;

create policy "Professor gerencia suas proprias rubricas" on public.rubrics
  for all
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);

create table if not exists public.rubric_scores (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  rubric_id   uuid not null references public.rubrics(id) on delete cascade,
  student_id  uuid not null references public.teacher_students(id) on delete cascade,
  -- { niveis: { [criterioId]: indice na escala }, comentario?: string }
  notas       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists rubric_scores_rubric_idx
  on public.rubric_scores (rubric_id, created_at desc);
create index if not exists rubric_scores_student_idx
  on public.rubric_scores (student_id);
create index if not exists rubric_scores_teacher_idx
  on public.rubric_scores (teacher_id);

alter table public.rubric_scores enable row level security;

create policy "Professor gerencia suas proprias avaliacoes" on public.rubric_scores
  for all
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);
