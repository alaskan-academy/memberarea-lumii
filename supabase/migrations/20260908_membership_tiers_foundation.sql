-- ============================================================================
-- FUNDAÇÃO DE ACESSO — Lumii Completo (assinatura anual) + tiers derivados
-- Ver .claude/plans/ferramentas-e-tiers-lumii.md (Parte A).
--
-- Este arquivo é só a FUNDAÇÃO (passo 1): tabela memberships, courses.in_plan,
-- annual_promo.subscription_product_codes e as funções de acesso.
-- O tratamento do objeto `subscription` do webhook Payt (passo 2) vem depois.
--
-- Princípios (adaptados do modelo Handify):
--   • o tier NUNCA é armazenado — é derivado (current_tier / getTier).
--   • revogar membership = marcar revoked_at, NUNCA apagar (histórico/auditoria).
--   • uma membership ativa por aluna (índice único parcial).
-- Idempotente: pode rodar mais de uma vez sem quebrar.
-- ============================================================================

-- ── 1. Tabela memberships (fonte da verdade do "Completo") ───────────────────
create table if not exists public.memberships (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  plan        text not null default 'completo' check (plan in ('completo')),
  source      text not null check (source in ('payt','manual','bonus','migration')),
  granted_at  timestamptz not null default now(),
  expires_at  timestamptz,
  revoked_at  timestamptz,
  granted_by  uuid references public.profiles(id),
  reason      text,
  created_at  timestamptz not null default now()
);

comment on column public.memberships.granted_at is 'Data da compra (transaction.paid_at no fluxo Payt). Carimba as matrículas do plano p/ separá-las de compras avulsas na revogação.';
comment on column public.memberships.expires_at is 'Data-limite de acesso. Para source=payt = subscription.next_charge_at + carência. Null = sem prazo.';
comment on column public.memberships.revoked_at is 'Revogar = marcar aqui; NUNCA apagar a linha (histórico/auditoria).';

-- Uma membership ativa por aluna; histórico fica nas linhas com revoked_at preenchido
create unique index if not exists memberships_one_active
  on public.memberships (user_id, plan) where revoked_at is null;
create index if not exists memberships_user_idx on public.memberships (user_id);

-- RLS: aluna lê a própria; admin lê/gerencia tudo; as concessões automáticas
-- usam o service_role (que ignora RLS).
alter table public.memberships enable row level security;

drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists memberships_admin_mutate on public.memberships;
create policy memberships_admin_mutate on public.memberships
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ── 2. courses.in_plan (curso incluído no Lumii Completo) ────────────────────
alter table public.courses add column if not exists in_plan boolean not null default false;
comment on column public.courses.in_plan is 'Incluído no Lumii Completo. Marcar concede na hora a quem tem membership ativa (via is_enrolled), sem backfill. Ortogonal a is_subscription_only (=não vende avulso).';

create index if not exists courses_in_plan_idx on public.courses (in_plan) where in_plan;

-- ── 3. annual_promo.subscription_product_codes (código da compra do plano) ───
alter table public.annual_promo add column if not exists subscription_product_codes text[] not null default '{}';
comment on column public.annual_promo.subscription_product_codes is 'product_codes da Payt que identificam a compra do Lumii Completo (assinatura anual). Distinto de courses.product_codes (avulso) e courses.in_plan (incluído no plano).';

-- Corrige o texto residual "Handify™" herdado do fork (só onde ainda não foi editado)
alter table public.annual_promo alter column modal_title set default 'Assine o Plano Anual Lumii';
update public.annual_promo
   set modal_title = replace(replace(modal_title, 'Handify™', 'Lumii'), 'Handify', 'Lumii')
 where modal_title like '%Handify%';

-- ── 4. Funções de acesso ─────────────────────────────────────────────────────
-- has_active_membership(uid): membership não revogada e dentro do prazo.
-- SECURITY DEFINER + revoke de anon/public/authenticated (recebe uid explícito,
-- então não pode ser usada por terceiros para sondar o tier alheio). É chamada
-- internamente por is_enrolled (que roda como definer) e pelo getTier (service_role).
create or replace function public.has_active_membership(p_user_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to 'public'
as $$
  select exists (
    select 1 from public.memberships
    where user_id = p_user_id
      and revoked_at is null
      and (expires_at is null or expires_at > now())
  );
$$;
revoke execute on function public.has_active_membership(uuid) from public, anon, authenticated;
grant  execute on function public.has_active_membership(uuid) to service_role;

-- current_tier(uid): tier derivado. Precedência admin > completo > aluna > gratis > visitante.
-- "aluna" = tem enrollment ativa que NÃO é de assinatura (source <> 'subscription').
-- Revogada de anon/public/authenticated; getTier() (service_role) passa o uid explícito.
create or replace function public.current_tier(p_user_id uuid default auth.uid())
 returns text
 language sql
 stable
 security definer
 set search_path to 'public'
as $$
  select case
    when p_user_id is null then 'visitante'
    when exists (select 1 from public.profiles where id = p_user_id and role = 'admin') then 'admin'
    when public.has_active_membership(p_user_id) then 'completo'
    when exists (
      select 1 from public.enrollments
      where user_id = p_user_id
        and source <> 'subscription'
        and (expires_at is null or expires_at > now())
    ) then 'aluna'
    when exists (select 1 from public.profiles where id = p_user_id) then 'gratis'
    else 'visitante'
  end;
$$;
revoke execute on function public.current_tier(uuid) from public, anon, authenticated;
grant  execute on function public.current_tier(uuid) to service_role;

-- is_enrolled(course): ESTENDIDA — acesso por matrícula avulsa OU (membership ativa E curso in_plan).
-- Assinante enxerga o curso do plano mesmo sem linha em enrollments (a matrícula física
-- com source='subscription' é criada no 1º acesso — passo 2).
-- IMPORTANTE: a matrícula source='subscription' NÃO concede acesso pelo 1º ramo — ela é
-- permanente (expires_at null) e sobreviveria ao fim da assinatura, vazando acesso a quem
-- perdeu o plano. Por isso o 1º ramo exclui source='subscription': acesso a curso de plano
-- depende SÓ da membership ativa (2º ramo), mantendo is_enrolled coerente com current_tier
-- e o princípio "tier nunca armazenado". (Achado da revisão adversarial da fundação.)
-- Continua usando auth.uid() internamente (só revela sobre a própria aluna), mantém os grants atuais.
create or replace function public.is_enrolled(p_course_id uuid)
 returns boolean
 language sql
 stable
 security definer
 set search_path to 'public'
as $$
  select
    exists (
      select 1 from public.enrollments
      where user_id = auth.uid()
        and course_id = p_course_id
        and source <> 'subscription'
        and (expires_at is null or expires_at > now())
    )
    or (
      public.has_active_membership(auth.uid())
      and exists (select 1 from public.courses where id = p_course_id and in_plan = true)
    );
$$;
