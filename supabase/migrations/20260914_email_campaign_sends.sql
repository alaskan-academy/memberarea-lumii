-- Registro de envios de campanhas de e-mail por usuária.
-- Usado como TRAVA: o cron de reengajamento consulta esta tabela para não
-- exceder o teto de envios na vida da aluna nem reenviar dentro do intervalo
-- mínimo. Campanha do reengajamento: 'reengajamento-1' .. 'reengajamento-4'.
-- Genérica de propósito (coluna `campaign`) para servir a outras campanhas.

create table if not exists public.email_campaign_sends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  campaign text not null,
  sent_at timestamptz not null default now()
);

-- Suporta a leitura em lote do cron: filtra por user_id (várias candidatas de
-- uma vez) e por prefixo de campanha.
create index if not exists email_campaign_sends_user_campaign_idx
  on public.email_campaign_sends (user_id, campaign);

-- RLS ativo sem policies: só o service client (cron) lê/escreve — o service
-- role ignora RLS. Nega qualquer acesso de anon/authenticated.
alter table public.email_campaign_sends enable row level security;
