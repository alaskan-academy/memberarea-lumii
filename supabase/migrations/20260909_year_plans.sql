-- Planejador anual/bimestral alinhado à BNCC (Bloco 2 "Planejamento" — Parte D).
-- Material de planejamento da professora: o que ensinar em cada bimestre, com os
-- códigos de habilidade da BNCC como tags. Tier Completo (gate no front).
--
-- Sem student_id — é material da prof (como lesson_resources/rubrics). Mesmo
-- padrão de RLS: teacher_id = auth.uid().

create table if not exists public.year_plans (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  titulo      text not null,
  ano         int not null,               -- ano letivo (ex.: 2026)
  bimestre    smallint not null default 0 check (bimestre between 0 and 4), -- 0 = plano anual
  componente  text,                       -- disciplina (Língua Portuguesa, Matemática...)
  bncc_codes  text[] not null default '{}',
  conteudo    jsonb not null default '{}'::jsonb, -- { texto } (jsonb p/ crescer depois)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists year_plans_teacher_idx
  on public.year_plans (teacher_id, ano desc, bimestre);

alter table public.year_plans enable row level security;

create policy "Professor gerencia seus planejamentos" on public.year_plans
  for all
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);
