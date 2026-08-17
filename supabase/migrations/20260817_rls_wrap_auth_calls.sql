-- Performance: envolve auth.uid()/auth.role() em subquery nas policies de RLS.
-- Sem isso, o Postgres reavalia a chamada auth.<fn>() linha a linha durante o
-- scan; envolvida em (select ...) vira um InitPlan calculado uma única vez
-- por query. Achado pelo Supabase Performance Advisor (auth_rls_initplan),
-- 44 policies afetadas em 27 tabelas. Nenhuma condição de acesso muda —
-- é reescrita puramente sintática, gerada programaticamente a partir da
-- definição atual de cada policy (ver pg_policies) pra evitar erro de
-- transcrição manual em SQL de segurança.

DROP POLICY "Admin gerencia annual_promo" ON public.annual_promo;
CREATE POLICY "Admin gerencia annual_promo" ON public.annual_promo FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type)))));

DROP POLICY "Ver proprios certificados" ON public.certificates;
CREATE POLICY "Ver proprios certificados" ON public.certificates FOR SELECT USING (((select auth.uid()) = user_id));

DROP POLICY "Verificacao exige autenticacao" ON public.certificates;
CREATE POLICY "Verificacao exige autenticacao" ON public.certificates FOR SELECT USING (((select auth.uid()) IS NOT NULL));

DROP POLICY "Ver proprias matriculas" ON public.enrollments;
CREATE POLICY "Ver proprias matriculas" ON public.enrollments FOR SELECT USING (((select auth.uid()) = user_id));

DROP POLICY "Deletar proprio comentario forum" ON public.forum_comments;
CREATE POLICY "Deletar proprio comentario forum" ON public.forum_comments FOR DELETE USING (((select auth.uid()) = user_id));

DROP POLICY "Matriculada comenta no forum" ON public.forum_comments;
CREATE POLICY "Matriculada comenta no forum" ON public.forum_comments FOR INSERT WITH CHECK ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM forum_posts fp
  WHERE ((fp.id = forum_comments.post_id) AND is_enrolled(fp.course_id))))));

DROP POLICY "Admin gerencia posts do forum" ON public.forum_posts;
CREATE POLICY "Admin gerencia posts do forum" ON public.forum_posts FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type)))));

DROP POLICY "Aluna cria post no forum" ON public.forum_posts;
CREATE POLICY "Aluna cria post no forum" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (((user_id = (select auth.uid())) AND (((forum_id IS NOT NULL) AND is_forum_member(forum_id)) OR ((forum_id IS NULL) AND (course_id IS NOT NULL) AND is_enrolled(course_id)))));

DROP POLICY "Aluna deleta proprio post no forum" ON public.forum_posts;
CREATE POLICY "Aluna deleta proprio post no forum" ON public.forum_posts FOR DELETE TO authenticated USING ((user_id = (select auth.uid())));

DROP POLICY "Aluna le post do forum" ON public.forum_posts;
CREATE POLICY "Aluna le post do forum" ON public.forum_posts FOR SELECT USING ((((approved = true) OR (user_id = (select auth.uid()))) AND (((forum_id IS NOT NULL) AND is_forum_member(forum_id)) OR ((forum_id IS NULL) AND (course_id IS NOT NULL) AND is_enrolled(course_id)))));

DROP POLICY "Admin gerencia forums" ON public.forums;
CREATE POLICY "Admin gerencia forums" ON public.forums FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type)))));

DROP POLICY "Membro le forum acessivel" ON public.forums;
CREATE POLICY "Membro le forum acessivel" ON public.forums FOR SELECT TO authenticated USING (((archived = false) AND (EXISTS ( SELECT 1
   FROM (courses c
     JOIN enrollments e ON ((e.course_id = c.id)))
  WHERE ((c.forum_id = forums.id) AND (e.user_id = (select auth.uid())) AND ((e.expires_at IS NULL) OR (e.expires_at > now())))))));

DROP POLICY "Admins gerenciam bookmarks" ON public.inspiration_bookmarks;
CREATE POLICY "Admins gerenciam bookmarks" ON public.inspiration_bookmarks FOR ALL USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type)))));

DROP POLICY "Alunas gerenciam proprios bookmarks" ON public.inspiration_bookmarks;
CREATE POLICY "Alunas gerenciam proprios bookmarks" ON public.inspiration_bookmarks FOR ALL USING ((user_id = (select auth.uid())));

DROP POLICY "Admins gerenciam comentarios de inspiracao" ON public.inspiration_comments;
CREATE POLICY "Admins gerenciam comentarios de inspiracao" ON public.inspiration_comments FOR ALL USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type)))));

DROP POLICY "Alunas inserem proprio comentario de inspiracao" ON public.inspiration_comments;
CREATE POLICY "Alunas inserem proprio comentario de inspiracao" ON public.inspiration_comments FOR INSERT WITH CHECK (((user_id = (select auth.uid())) AND ((select auth.role()) = 'authenticated'::text)));

DROP POLICY "Alunas veem comentarios aprovados de inspiracao" ON public.inspiration_comments;
CREATE POLICY "Alunas veem comentarios aprovados de inspiracao" ON public.inspiration_comments FOR SELECT USING (((approved = true) AND ((select auth.role()) = 'authenticated'::text)));

DROP POLICY "Admins gerenciam likes" ON public.inspiration_likes;
CREATE POLICY "Admins gerenciam likes" ON public.inspiration_likes FOR ALL USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type)))));

DROP POLICY "Alunas inserem proprio like" ON public.inspiration_likes;
CREATE POLICY "Alunas inserem proprio like" ON public.inspiration_likes FOR INSERT WITH CHECK (((user_id = (select auth.uid())) AND ((select auth.role()) = 'authenticated'::text)));

DROP POLICY "Alunas removem proprio like" ON public.inspiration_likes;
CREATE POLICY "Alunas removem proprio like" ON public.inspiration_likes FOR DELETE USING ((user_id = (select auth.uid())));

DROP POLICY "Alunas veem likes" ON public.inspiration_likes;
CREATE POLICY "Alunas veem likes" ON public.inspiration_likes FOR SELECT USING (((select auth.role()) = 'authenticated'::text));

DROP POLICY "Admins gerenciam posts de inspiracao" ON public.inspiration_posts;
CREATE POLICY "Admins gerenciam posts de inspiracao" ON public.inspiration_posts FOR ALL USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type)))));

DROP POLICY "Alunas veem posts publicados de inspiracao" ON public.inspiration_posts;
CREATE POLICY "Alunas veem posts publicados de inspiracao" ON public.inspiration_posts FOR SELECT USING (((published = true) AND (archived = false) AND ((select auth.role()) = 'authenticated'::text)));

DROP POLICY "Deletar proprio comentario de aula" ON public.lesson_comments;
CREATE POLICY "Deletar proprio comentario de aula" ON public.lesson_comments FOR DELETE USING (((select auth.uid()) = user_id));

DROP POLICY "Matriculada comenta na aula" ON public.lesson_comments;
CREATE POLICY "Matriculada comenta na aula" ON public.lesson_comments FOR INSERT WITH CHECK ((((select auth.uid()) = user_id) AND (EXISTS ( SELECT 1
   FROM (lessons l
     JOIN modules m ON ((m.id = l.module_id)))
  WHERE ((l.id = lesson_comments.lesson_id) AND is_enrolled(m.course_id))))));

DROP POLICY "Ver e editar proprio progresso" ON public.lesson_progress;
CREATE POLICY "Ver e editar proprio progresso" ON public.lesson_progress FOR ALL USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY "Menu student para autenticados" ON public.menu_items;
CREATE POLICY "Menu student para autenticados" ON public.menu_items FOR SELECT USING ((((select auth.uid()) IS NOT NULL) AND (visible_to = ANY (ARRAY['guest'::menu_visibility, 'student'::menu_visibility])) AND (active = true)));

DROP POLICY "Comentar no feed" ON public.news_comments;
CREATE POLICY "Comentar no feed" ON public.news_comments FOR INSERT WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY "Deletar proprio comentario" ON public.news_comments;
CREATE POLICY "Deletar proprio comentario" ON public.news_comments FOR DELETE USING (((select auth.uid()) = user_id));

DROP POLICY "Ver comentarios do feed" ON public.news_comments;
CREATE POLICY "Ver comentarios do feed" ON public.news_comments FOR SELECT USING (((select auth.uid()) IS NOT NULL));

DROP POLICY "Posts publicados visiveis a autenticados" ON public.news_posts;
CREATE POLICY "Posts publicados visiveis a autenticados" ON public.news_posts FOR SELECT USING (((published = true) AND ((select auth.uid()) IS NOT NULL)));

DROP POLICY admins_manage_campaigns ON public.notification_campaigns;
CREATE POLICY admins_manage_campaigns ON public.notification_campaigns FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type)))));

DROP POLICY "Marcar como lida" ON public.notifications;
CREATE POLICY "Marcar como lida" ON public.notifications FOR UPDATE USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY "Ver proprias notificacoes" ON public.notifications;
CREATE POLICY "Ver proprias notificacoes" ON public.notifications FOR SELECT USING (((select auth.uid()) = user_id));

DROP POLICY "Aluna gerencia seus proprios favoritos" ON public.parent_script_favorites;
CREATE POLICY "Aluna gerencia seus proprios favoritos" ON public.parent_script_favorites FOR ALL USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY "Aluna gerencia seus proprios views" ON public.parent_script_views;
CREATE POLICY "Aluna gerencia seus proprios views" ON public.parent_script_views FOR ALL USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY "Curtir" ON public.post_likes;
CREATE POLICY "Curtir" ON public.post_likes FOR INSERT WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY "Descurtir" ON public.post_likes;
CREATE POLICY "Descurtir" ON public.post_likes FOR DELETE USING (((select auth.uid()) = user_id));

DROP POLICY "Ver curtidas" ON public.post_likes;
CREATE POLICY "Ver curtidas" ON public.post_likes FOR SELECT USING (((select auth.uid()) IS NOT NULL));

DROP POLICY "Atualizar proprio perfil" ON public.profiles;
CREATE POLICY "Atualizar proprio perfil" ON public.profiles FOR UPDATE USING (((select auth.uid()) = id)) WITH CHECK ((((select auth.uid()) = id) AND (role = ( SELECT profiles_1.role
   FROM profiles profiles_1
  WHERE (profiles_1.id = (select auth.uid()))))));

DROP POLICY "Leitura proprio perfil" ON public.profiles;
CREATE POLICY "Leitura proprio perfil" ON public.profiles FOR SELECT USING (((select auth.uid()) = id));

DROP POLICY push_subs_admin_read ON public.push_subscriptions;
CREATE POLICY push_subs_admin_read ON public.push_subscriptions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.role = 'admin'::role_type)))));

DROP POLICY push_subs_own ON public.push_subscriptions;
CREATE POLICY push_subs_own ON public.push_subscriptions FOR ALL USING (((select auth.uid()) = user_id)) WITH CHECK (((select auth.uid()) = user_id));

DROP POLICY "Reportar conteudo" ON public.reports;
CREATE POLICY "Reportar conteudo" ON public.reports FOR INSERT WITH CHECK (((select auth.uid()) = reporter_id));

DROP POLICY "Professor gerencia checkins dos seus planos" ON public.support_plan_checkins;
CREATE POLICY "Professor gerencia checkins dos seus planos" ON public.support_plan_checkins FOR ALL USING (((select auth.uid()) = ( SELECT support_plans.teacher_id
   FROM support_plans
  WHERE (support_plans.id = support_plan_checkins.support_plan_id)))) WITH CHECK (((select auth.uid()) = ( SELECT support_plans.teacher_id
   FROM support_plans
  WHERE (support_plans.id = support_plan_checkins.support_plan_id))));

DROP POLICY "Professor gerencia seus proprios planos" ON public.support_plans;
CREATE POLICY "Professor gerencia seus proprios planos" ON public.support_plans FOR ALL USING (((select auth.uid()) = teacher_id)) WITH CHECK (((select auth.uid()) = teacher_id));

DROP POLICY "Professor gerencia suas proprias turmas" ON public.teacher_classes;
CREATE POLICY "Professor gerencia suas proprias turmas" ON public.teacher_classes FOR ALL USING (((select auth.uid()) = teacher_id)) WITH CHECK (((select auth.uid()) = teacher_id));

DROP POLICY "Professor gerencia seus proprios alunos" ON public.teacher_students;
CREATE POLICY "Professor gerencia seus proprios alunos" ON public.teacher_students FOR ALL USING (((select auth.uid()) = teacher_id)) WITH CHECK (((select auth.uid()) = teacher_id));
