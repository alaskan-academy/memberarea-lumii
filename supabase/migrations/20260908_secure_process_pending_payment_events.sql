-- SEGURANÇA: process_pending_payment_events matriculava para QUALQUER evento
-- pendente (processed=false AND error IS NULL), SEM checar se o pagamento foi
-- aprovado. Eventos não-pagos (waiting_payment, expired, canceled) são gravados
-- exatamente nesse estado pelo webhook (route.ts, ramo action="ignore"),
-- carregando o product_code real do curso. Como esta função roda no trigger
-- on_auth_user_created e o /cadastro é self-service (sem token), bastava:
-- gerar um PIX de um curso e NÃO pagar → criar conta grátis com o mesmo e-mail
-- → process_pending_payment_events concedia matrícula vitalícia ao curso pago.
-- Idêntico ao vetor corrigido na plataforma-irmã.
--
-- Correção: só reprocessa eventos cujo event_type é um status de pagamento
-- APROVADO — mesma lista de GRANT_STATUSES em src/lib/payments/payt.ts
-- ('paid','approved','completed','confirmed'). Eventos não-pagos nunca mais
-- liberam acesso. (A migration 20260828 só corrigiu o rename product_code→
-- product_codes; a checagem de status faltava desde 005_triggers.sql.)
create or replace function public.process_pending_payment_events(p_email text)
 returns void
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare
  v_event     record;
  v_course_id uuid;
  v_user_id   uuid;
begin
  select id into v_user_id from public.profiles where email = p_email;
  if v_user_id is null then return; end if;

  for v_event in
    select * from public.payment_events
    where buyer_email = p_email
      and processed = false
      and error is null
      -- só pagamento aprovado libera matrícula; nunca waiting_payment/expired/canceled
      and lower(event_type) = any (array['paid', 'approved', 'completed', 'confirmed'])
  loop
    -- product_codes é text[]: o code do evento precisa estar contido no array
    select c.id into v_course_id
    from public.courses c
    where v_event.product_code = any(c.product_codes)
    limit 1;

    if v_course_id is not null then
      insert into public.enrollments (user_id, course_id, source)
      values (v_user_id, v_course_id, 'payt')
      on conflict (user_id, course_id) do nothing;

      update public.payment_events set processed = true where id = v_event.id;
    end if;

    v_course_id := null;
  end loop;
end;
$function$;

-- create or replace preserva as permissões existentes, mas reafirmamos por segurança:
revoke execute on function public.process_pending_payment_events(text) from public, anon, authenticated;
