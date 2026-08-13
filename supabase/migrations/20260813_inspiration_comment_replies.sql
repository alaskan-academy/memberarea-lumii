-- Respostas a comentários de inspirações (threading de 1 nível)
alter table inspiration_comments
  add column if not exists parent_id uuid references inspiration_comments(id) on delete cascade;

create index if not exists idx_inspiration_comments_parent
  on inspiration_comments (parent_id) where parent_id is not null;
