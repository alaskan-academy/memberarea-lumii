-- courses.product_code virou courses.product_codes (text[]) numa migration
-- anterior, mas process_pending_payment_events continuou comparando com a
-- coluna antiga. Como essa funcao roda dentro do trigger on_auth_user_created,
-- o erro 42703 abortava a transacao inteira e impedia a criacao de QUALQUER
-- conta nova (link de ativacao e modal do admin), com qualquer senha.
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
    where buyer_email = p_email and processed = false and error is null
  loop
    -- product_codes e text[]: o code do evento precisa estar contido no array
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

-- Rede de seguranca: a conciliacao de pagamentos e secundaria; se ela falhar
-- por qualquer motivo, nao pode mais derrubar a criacao da conta.
create or replace function public.handle_new_user()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));

  begin
    perform public.process_pending_payment_events(new.email);
  exception when others then
    raise warning 'process_pending_payment_events falhou para %: % (%)',
      new.email, sqlerrm, sqlstate;
  end;

  return new;
end;
$function$;

revoke execute on function public.process_pending_payment_events(text) from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
