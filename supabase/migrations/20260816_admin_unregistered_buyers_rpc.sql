-- Auditoria (2026-08-16): a aba "Sem cadastro" de /admin/alunos buscava
-- TODOS os activation_tokens não usados sem .limit()/.range() e agrupava por
-- e-mail em JavaScript (uma compradora pode ter vários tokens, um por
-- curso). SemCadastroClient.tsx então filtrava a lista inteira no cliente.
-- Move o agrupamento por e-mail + busca + paginação para o Postgres,
-- retornando só a página atual de compradoras já agrupadas com seus cursos
-- pendentes em jsonb.
create or replace function public.admin_unregistered_buyers(
  search text default null,
  limit_n int default 25,
  offset_n int default 0
)
returns table(
  email text,
  buyer_name text,
  buyer_phone text,
  created_at timestamptz,
  courses jsonb,
  total_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with base as (
    select at.*, lower(at.email) as email_lc
    from activation_tokens at
    where at.used = false
      and not exists (
        select 1 from profiles p where lower(p.email) = lower(at.email)
      )
      and (
        search is null or search = ''
        or at.email ilike '%' || search || '%'
        or at.buyer_name ilike '%' || search || '%'
      )
  ), grouped as (
    select
      b.email_lc,
      (array_agg(b.email order by b.created_at desc))[1] as email,
      (array_agg(b.buyer_name order by b.created_at desc))[1] as buyer_name,
      (array_agg(b.buyer_phone order by b.created_at desc))[1] as buyer_phone,
      max(b.created_at) as created_at,
      jsonb_agg(jsonb_build_object(
        'id', c.id, 'title', c.title, 'slug', c.slug,
        'token', b.token, 'expires_at', b.expires_at
      )) as courses
    from base b
    left join courses c on c.id = b.course_id
    group by b.email_lc
  )
  select
    g.email, g.buyer_name, g.buyer_phone, g.created_at, g.courses,
    count(*) over()::bigint as total_count
  from grouped g
  order by g.created_at desc
  limit limit_n offset offset_n;
$$;
