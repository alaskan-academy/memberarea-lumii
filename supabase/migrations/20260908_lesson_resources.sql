-- Biblioteca de planos e atividades (Bloco 2 "Planejamento" — Parte D do plano
-- ferramentas-e-tiers-lumii). Material reutilizável da professora: salva um
-- plano/atividade e reusa/adapta ano a ano. É trava de dependência: o acervo do
-- ano mora aqui.
--
-- Mesmo padrão de support_plans/student_log: keyed em teacher_id, RLS
-- teacher_id = auth.uid() (embrulhado em select), nenhuma leitura por terceiros.
-- Diferente do diário: NÃO tem student_id — é material da prof, não do aluno.

create table if not exists public.lesson_resources (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  titulo      text not null,
  -- Vocabulário controlado (espelhado em src/lib/ferramentas/planejamento/types.ts).
  tipo        text not null default 'plano'
                check (tipo in ('plano','atividade','sequencia','avaliacao','projeto','material','outro')),
  -- Conteúdo em jsonb para poder ganhar estrutura no futuro; hoje { texto }.
  conteudo    jsonb not null default '{}'::jsonb,
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists lesson_resources_teacher_idx
  on public.lesson_resources (teacher_id, created_at desc);

alter table public.lesson_resources enable row level security;

create policy "Professor gerencia sua propria biblioteca" on public.lesson_resources
  for all
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);
