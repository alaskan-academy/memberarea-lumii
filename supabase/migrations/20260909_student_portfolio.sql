-- Portfólio do aluno (Bloco 1 "Meus Alunos" — Parte D). Registro do trabalho do
-- aluno: título + descrição + FOTO opcional (desenho, projeto...). A foto vai
-- para um bucket PRIVADO, acessível só por URL assinada — dado de criança, nunca
-- público.
--
-- Tabela espelha student_log (teacher_id + FK student_id → teacher_students, RLS
-- teacher_id). Bucket + RLS espelham o padrão de certificates (privado, pasta
-- por dono via storage.foldername(name)[1] = auth.uid()).

create table if not exists public.student_portfolio (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  student_id  uuid not null references public.teacher_students(id) on delete cascade,
  titulo      text not null,
  descricao   text,
  -- caminho no bucket privado 'portfolio' (null = item só de texto). MIME guardado
  -- para o front saber renderizar.
  anexo_path  text,
  anexo_mime  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists student_portfolio_student_idx
  on public.student_portfolio (student_id, created_at desc);
create index if not exists student_portfolio_teacher_idx
  on public.student_portfolio (teacher_id);

alter table public.student_portfolio enable row level security;

create policy "Professor gerencia o portfolio dos seus alunos" on public.student_portfolio
  for all
  using ((select auth.uid()) = teacher_id)
  with check ((select auth.uid()) = teacher_id);

-- Bucket privado, só imagens, 10 MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio', 'portfolio', false, 10485760,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

-- Cada professor só acessa a PRÓPRIA pasta: caminho = {auth.uid()}/{student_id}/{arquivo}.
-- foldername(name)[1] é o primeiro segmento = o id do professor.
create policy "Portfolio: professor gerencia a propria pasta" on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
