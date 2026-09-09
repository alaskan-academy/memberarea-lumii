-- Diário de bordo (Bloco 1 "Meus Alunos" — Parte D do plano ferramentas-e-tiers-lumii)
-- Registro corrido da professora sobre CADA aluno da sua turma particular
-- (teacher_students — NÃO é a aluna da Lumii). É a trava de dependência: o
-- histórico do ano dos alunos passa a morar aqui.
--
-- Espelha FIELMENTE o padrão já validado de support_plans (20260811_ferramentas_mvp.sql):
--   tabela keyed em teacher_id + FK student_id → teacher_students, RLS teacher_id = auth.uid().
-- A chamada auth.uid() vem embrulhada em (select ...) desde o início — mesmo
-- padrão de performance aplicado às demais policies em 20260817_rls_wrap_auth_calls.sql.

create table if not exists public.student_log (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  student_id  uuid not null references public.teacher_students(id) on delete cascade,
  -- Vocabulário controlado (espelhado em src/lib/ferramentas/diario/types.ts).
  -- Neutro e acolhedor, no mesmo tom do gerador de parecer: "atencao" (ponto de
  -- atenção), não "problema"/"ocorrência".
  tipo        text not null default 'registro'
                check (tipo in ('registro','positivo','atencao','aprendizagem','socioemocional','familia')),
  texto       text not null,
  -- data do fato (a professora pode registrar algo de ontem); created_at = quando digitou.
  data        date not null default current_date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Timeline por aluno: mais recente primeiro (data, depois hora do registro).
create index if not exists student_log_student_idx
  on public.student_log (student_id, data desc, created_at desc);
create index if not exists student_log_teacher_idx
  on public.student_log (teacher_id);

alter table public.student_log enable row level security;

-- Cada professor só vê/edita o diário dos próprios alunos. Nenhuma leitura por
-- terceiros — dado privado da professora (igual support_plans).
create policy "Professor gerencia o diario dos seus alunos" on public.student_log
  for all
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);
