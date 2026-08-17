-- Correção (2026-08-16, parte 2): a revogação anterior
-- (20260816_lock_down_admin_rpc.sql) fez REVOKE FROM anon, authenticated,
-- mas o Postgres concede EXECUTE a PUBLIC por padrão na criação da função —
-- e anon/authenticated herdam de PUBLIC. Sem revogar de PUBLIC
-- explicitamente, o grant implícito continua valendo, como confirmado pelo
-- Supabase Advisor (mesmos warnings depois da primeira tentativa).
revoke execute on function public.admin_top_courses_by_enrollments(int) from public;
revoke execute on function public.admin_enrollments_by_source() from public;
revoke execute on function public.admin_push_active_students_count() from public;
revoke execute on function public.admin_top_students_by_lessons(int) from public;
revoke execute on function public.admin_top_students_by_certificates(int) from public;
revoke execute on function public.admin_top_students_by_enrollments(int) from public;
revoke execute on function public.admin_recently_active_students(int) from public;
revoke execute on function public.admin_students_with_progress_count() from public;
revoke execute on function public.admin_students_with_certificate_count() from public;
revoke execute on function public.admin_engagement_ranking(timestamptz, int) from public;
revoke execute on function public.admin_engagement_totals(timestamptz) from public;
revoke execute on function public.admin_unregistered_buyers(text, int, int) from public;
