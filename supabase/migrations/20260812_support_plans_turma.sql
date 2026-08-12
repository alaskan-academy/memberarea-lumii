-- Turma como segundo alvo possível de um plano de apoio (professor escolhe aluno OU turma).
-- Rodado manualmente em produção via MCP em 2026-08-12.

create table public.teacher_classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index teacher_classes_teacher_idx on public.teacher_classes (teacher_id);

alter table public.teacher_classes enable row level security;
create policy "Professor gerencia suas proprias turmas" on public.teacher_classes
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

-- support_plans passa a aceitar student_id OU class_id (nunca os dois, nunca nenhum)
alter table public.support_plans
  alter column student_id drop not null,
  add column class_id uuid references public.teacher_classes(id) on delete cascade,
  add constraint support_plans_target_xor check (
    (student_id is not null and class_id is null) or
    (student_id is null and class_id is not null)
  );

create index support_plans_class_idx on public.support_plans (class_id);

-- RLS de support_plans já usa teacher_id (não student_id), continua valendo sem alteração
