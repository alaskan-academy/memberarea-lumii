-- Auditoria (2026-08-16): as páginas de métricas do admin
-- (/admin/metricas, /admin/metricas/alunas, /admin/metricas/engajamento)
-- faziam SELECT sem .limit()/.range() em tabelas inteiras (lesson_progress,
-- enrollments, payment_events, certificates, forum_posts, etc.) e agregavam
-- (GROUP BY, ranking, contagem distinta) em JavaScript no servidor Next.js.
-- Isso escala mal — o Node baixa a tabela inteira a cada carregamento da
-- página. Move a agregação para o Postgres via RPC, retornando só as linhas
-- já somadas/ordenadas/limitadas.
--
-- SECURITY DEFINER porque estas funções são chamadas com o client anon/authenticated
-- do App Router (não sempre o service role) e o admin já foi validado em
-- app code (getCurrentAdmin) antes de qualquer chamada — mas fixamos
-- search_path por segurança padrão do Postgres/Supabase para funções DEFINER.

-- ── Top cursos por matrículas ativas (join enrollments + courses) ──────────
create or replace function public.admin_top_courses_by_enrollments(limit_n int default 8)
returns table(course_id uuid, title text, slug text, thumbnail_url text, enrollment_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.title, c.slug, c.thumbnail_url, count(*)::bigint as enrollment_count
  from enrollments e
  join courses c on c.id = e.course_id
  where e.expires_at is null or e.expires_at >= now()
  group by c.id, c.title, c.slug, c.thumbnail_url
  order by enrollment_count desc
  limit limit_n;
$$;

-- ── Matrículas ativas agrupadas por fonte (payt/manual/subscription) ───────
create or replace function public.admin_enrollments_by_source()
returns table(source text, enrollment_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select e.source, count(*)::bigint as enrollment_count
  from enrollments e
  where e.expires_at is null or e.expires_at >= now()
  group by e.source
  order by enrollment_count desc;
$$;

-- ── Contagem distinta de alunas com push ativo em ao menos um dispositivo ──
create or replace function public.admin_push_active_students_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct user_id) from push_subscriptions;
$$;

-- ── Rankings de /admin/metricas/alunas — top N alunas por atividade ────────
create or replace function public.admin_top_students_by_lessons(limit_n int default 10)
returns table(user_id uuid, full_name text, email text, avatar_url text, lesson_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.email, p.avatar_url, count(*)::bigint as lesson_count
  from lesson_progress lp
  join profiles p on p.id = lp.user_id
  where lp.completed = true
  group by p.id, p.full_name, p.email, p.avatar_url
  order by lesson_count desc
  limit limit_n;
$$;

create or replace function public.admin_top_students_by_certificates(limit_n int default 10)
returns table(user_id uuid, full_name text, email text, avatar_url text, certificate_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.email, p.avatar_url, count(*)::bigint as certificate_count
  from certificates c
  join profiles p on p.id = c.user_id
  group by p.id, p.full_name, p.email, p.avatar_url
  order by certificate_count desc
  limit limit_n;
$$;

create or replace function public.admin_top_students_by_enrollments(limit_n int default 10)
returns table(user_id uuid, full_name text, email text, avatar_url text, enrollment_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.email, p.avatar_url, count(*)::bigint as enrollment_count
  from enrollments e
  join profiles p on p.id = e.user_id
  group by p.id, p.full_name, p.email, p.avatar_url
  order by enrollment_count desc
  limit limit_n;
$$;

create or replace function public.admin_recently_active_students(limit_n int default 10)
returns table(user_id uuid, full_name text, email text, avatar_url text, last_active timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.full_name, p.email, p.avatar_url, max(lp.updated_at) as last_active
  from lesson_progress lp
  join profiles p on p.id = lp.user_id
  group by p.id, p.full_name, p.email, p.avatar_url
  order by last_active desc
  limit limit_n;
$$;

-- Contagens distintas usadas pelos cards de estatística de /admin/metricas/alunas
create or replace function public.admin_students_with_progress_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct user_id) from lesson_progress;
$$;

create or replace function public.admin_students_with_certificate_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct user_id) from certificates;
$$;

-- ── /admin/metricas/engajamento — ranking ponderado + totais ───────────────
-- Mesma fórmula de score usada antes em JS: posts*3 + comentarios*2 +
-- sugestoes*3 + aulas_concluidas*1 + likes*1 + bookmarks*2 + comentarios_insp*3
--
-- NOTA: a tabela "supplier_suggestions" referenciada no código JS original
-- (src/app/(admin)/admin/metricas/engajamento/page.tsx) não existe no banco
-- de produção — a query já retornava sempre vazio silenciosamente (bug
-- pré-existente, fora do escopo desta migração). Omitida aqui para manter a
-- função válida; contribui 0 ao score, igual ao comportamento atual.
create or replace function public.admin_engagement_ranking(since timestamptz default null, limit_n int default 20)
returns table(
  user_id uuid, full_name text, email text, avatar_url text,
  forum_posts bigint, forum_comments bigint, suggestions bigint,
  lessons_completed bigint, insp_likes bigint, insp_bookmarks bigint, insp_comments bigint,
  score bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with fp as (
    select user_id, count(*) as cnt from forum_posts
    where since is null or created_at >= since
    group by user_id
  ), fc as (
    select user_id, count(*) as cnt from forum_comments
    where since is null or created_at >= since
    group by user_id
  ), lp as (
    select user_id, count(*) as cnt from lesson_progress
    where completed = true and (since is null or updated_at >= since)
    group by user_id
  ), il as (
    select user_id, count(*) as cnt from inspiration_likes
    where since is null or created_at >= since
    group by user_id
  ), ib as (
    select user_id, count(*) as cnt from inspiration_bookmarks
    where since is null or created_at >= since
    group by user_id
  ), ic as (
    select user_id, count(*) as cnt from inspiration_comments
    where approved = true and (since is null or created_at >= since)
    group by user_id
  ), combined as (
    select user_id from fp
    union select user_id from fc
    union select user_id from lp
    union select user_id from il
    union select user_id from ib
    union select user_id from ic
  )
  select
    p.id, p.full_name, p.email, p.avatar_url,
    coalesce(fp.cnt, 0), coalesce(fc.cnt, 0), 0::bigint,
    coalesce(lp.cnt, 0), coalesce(il.cnt, 0), coalesce(ib.cnt, 0), coalesce(ic.cnt, 0),
    (coalesce(fp.cnt, 0) * 3 + coalesce(fc.cnt, 0) * 2
      + coalesce(lp.cnt, 0) + coalesce(il.cnt, 0) * 1 + coalesce(ib.cnt, 0) * 2
      + coalesce(ic.cnt, 0) * 3)::bigint as score
  from combined
  join profiles p on p.id = combined.user_id
  left join fp on fp.user_id = combined.user_id
  left join fc on fc.user_id = combined.user_id
  left join lp on lp.user_id = combined.user_id
  left join il on il.user_id = combined.user_id
  left join ib on ib.user_id = combined.user_id
  left join ic on ic.user_id = combined.user_id
  order by score desc
  limit limit_n;
$$;

create or replace function public.admin_engagement_totals(since timestamptz default null)
returns table(
  posts bigint, comments bigint, suggestions bigint, lessons_completed bigint,
  active_students bigint, insp_likes bigint, insp_bookmarks bigint, insp_comments bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with fp as (select user_id from forum_posts where since is null or created_at >= since),
       fc as (select user_id from forum_comments where since is null or created_at >= since),
       lp as (select user_id from lesson_progress where completed = true and (since is null or updated_at >= since)),
       il as (select user_id from inspiration_likes where since is null or created_at >= since),
       ib as (select user_id from inspiration_bookmarks where since is null or created_at >= since),
       ic as (select user_id from inspiration_comments where approved = true and (since is null or created_at >= since))
  select
    (select count(*) from fp),
    (select count(*) from fc),
    0::bigint,
    (select count(*) from lp),
    (select count(*) from (
      select user_id from fp union select user_id from fc
      union select user_id from lp union select user_id from il union select user_id from ib
      union select user_id from ic
    ) all_active),
    (select count(*) from il),
    (select count(*) from ib),
    (select count(*) from ic);
$$;
