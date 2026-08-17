-- Correção de segurança (2026-08-16): as funções admin_* criadas na
-- migração anterior (20260816_admin_metrics_rpc.sql e
-- 20260816_admin_unregistered_buyers_rpc.sql) são SECURITY DEFINER e o
-- Supabase Advisor apontou que ficaram expostas via PostgREST para os roles
-- `anon` e `authenticated` — ou seja, qualquer requisição com a anon key
-- pública (ex: POST /rest/v1/rpc/admin_top_students_by_lessons) conseguiria
-- ler nome/e-mail de alunas, sem estar logada como admin.
--
-- Essas funções só são chamadas server-side pelo service role client
-- (createServiceClient(), ver src/lib/supabase/service.ts) depois que a
-- página admin já validou getCurrentAdmin(). Não há motivo para expô-las a
-- anon/authenticated. Revoga o EXECUTE desses roles e mantém apenas para
-- service_role (que já ignora GRANT/REVOKE de EXECUTE por bypassar RLS, mas
-- fixamos explicitamente por clareza).
revoke execute on function public.admin_top_courses_by_enrollments(int) from anon, authenticated;
revoke execute on function public.admin_enrollments_by_source() from anon, authenticated;
revoke execute on function public.admin_push_active_students_count() from anon, authenticated;
revoke execute on function public.admin_top_students_by_lessons(int) from anon, authenticated;
revoke execute on function public.admin_top_students_by_certificates(int) from anon, authenticated;
revoke execute on function public.admin_top_students_by_enrollments(int) from anon, authenticated;
revoke execute on function public.admin_recently_active_students(int) from anon, authenticated;
revoke execute on function public.admin_students_with_progress_count() from anon, authenticated;
revoke execute on function public.admin_students_with_certificate_count() from anon, authenticated;
revoke execute on function public.admin_engagement_ranking(timestamptz, int) from anon, authenticated;
revoke execute on function public.admin_engagement_totals(timestamptz) from anon, authenticated;
revoke execute on function public.admin_unregistered_buyers(text, int, int) from anon, authenticated;

grant execute on function public.admin_top_courses_by_enrollments(int) to service_role;
grant execute on function public.admin_enrollments_by_source() to service_role;
grant execute on function public.admin_push_active_students_count() to service_role;
grant execute on function public.admin_top_students_by_lessons(int) to service_role;
grant execute on function public.admin_top_students_by_certificates(int) to service_role;
grant execute on function public.admin_top_students_by_enrollments(int) to service_role;
grant execute on function public.admin_recently_active_students(int) to service_role;
grant execute on function public.admin_students_with_progress_count() to service_role;
grant execute on function public.admin_students_with_certificate_count() to service_role;
grant execute on function public.admin_engagement_ranking(timestamptz, int) to service_role;
grant execute on function public.admin_engagement_totals(timestamptz) to service_role;
grant execute on function public.admin_unregistered_buyers(text, int, int) to service_role;
