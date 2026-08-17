-- Consolida policies RLS permissivas sobrepostas (multiple_permissive_policies).
-- Gerado programaticamente a partir de pg_policies -- cada policy final
-- combina via OR as condicoes de TODAS as policies originais que se
-- aplicavam aquela (tabela, acao) -- comportamento identico ao atual,
-- ja que o Postgres ja combina policies permissivas via OR internamente.
-- Autoverificado: toda condicao original aparece textualmente na policy
-- consolidada correspondente.

-- DROP (policies antigas, superpostas)
DROP POLICY "Admin gerencia annual_promo" ON public.annual_promo;
DROP POLICY "Aluna le annual_promo ativo" ON public.annual_promo;
DROP POLICY "Admin gerencia banners" ON public.banners;
DROP POLICY "Banners ativos visiveis" ON public.banners;
DROP POLICY "Admin gerencia categorias" ON public.categories;
DROP POLICY "Categorias publicas" ON public.categories;
DROP POLICY "Admin ve todos os certificados" ON public.certificates;
DROP POLICY "Ver proprios certificados" ON public.certificates;
DROP POLICY "Verificacao exige autenticacao" ON public.certificates;
DROP POLICY "Admin gerencia cursos" ON public.courses;
DROP POLICY "Admin ve todos os cursos" ON public.courses;
DROP POLICY "Cursos publicados visiveis a todos" ON public.courses;
DROP POLICY "Admin gerencia matriculas" ON public.enrollments;
DROP POLICY "Admin ve todas as matriculas" ON public.enrollments;
DROP POLICY "Ver proprias matriculas" ON public.enrollments;
DROP POLICY "Admin gerencia comentarios do forum" ON public.forum_comments;
DROP POLICY "Matriculada ve comentarios do forum" ON public.forum_comments;
DROP POLICY "Matriculada comenta no forum" ON public.forum_comments;
DROP POLICY "Deletar proprio comentario forum" ON public.forum_comments;
DROP POLICY "Admin gerencia posts do forum" ON public.forum_posts;
DROP POLICY "Aluna le post do forum" ON public.forum_posts;
DROP POLICY "Aluna cria post no forum" ON public.forum_posts;
DROP POLICY "Aluna deleta proprio post no forum" ON public.forum_posts;
DROP POLICY "Admin gerencia forums" ON public.forums;
DROP POLICY "Membro le forum acessivel" ON public.forums;
DROP POLICY "Admins gerenciam bookmarks" ON public.inspiration_bookmarks;
DROP POLICY "Alunas gerenciam proprios bookmarks" ON public.inspiration_bookmarks;
DROP POLICY "Admins gerenciam comentarios de inspiracao" ON public.inspiration_comments;
DROP POLICY "Alunas veem comentarios aprovados de inspiracao" ON public.inspiration_comments;
DROP POLICY "Alunas inserem proprio comentario de inspiracao" ON public.inspiration_comments;
DROP POLICY "Admins gerenciam likes" ON public.inspiration_likes;
DROP POLICY "Alunas veem likes" ON public.inspiration_likes;
DROP POLICY "Alunas inserem proprio like" ON public.inspiration_likes;
DROP POLICY "Alunas removem proprio like" ON public.inspiration_likes;
DROP POLICY "Admins gerenciam posts de inspiracao" ON public.inspiration_posts;
DROP POLICY "Alunas veem posts publicados de inspiracao" ON public.inspiration_posts;
DROP POLICY "Admin gerencia comentarios de aulas" ON public.lesson_comments;
DROP POLICY "Matriculada ve comentarios da aula" ON public.lesson_comments;
DROP POLICY "Matriculada comenta na aula" ON public.lesson_comments;
DROP POLICY "Deletar proprio comentario de aula" ON public.lesson_comments;
DROP POLICY "Admin gerencia blocos" ON public.lesson_content_blocks;
DROP POLICY "Acesso a blocos = acesso a aula" ON public.lesson_content_blocks;
DROP POLICY "Admin gerencia materiais" ON public.lesson_materials;
DROP POLICY "Matriculada acessa materiais" ON public.lesson_materials;
DROP POLICY "Ver e editar proprio progresso" ON public.lesson_progress;
DROP POLICY "Admin ve todo o progresso" ON public.lesson_progress;
DROP POLICY "Admin gerencia aulas" ON public.lessons;
DROP POLICY "Matriculada ve aulas" ON public.lessons;
DROP POLICY "Previa publica" ON public.lessons;
DROP POLICY "Admin gerencia menu" ON public.menu_items;
DROP POLICY "Menu admin para admins" ON public.menu_items;
DROP POLICY "Menu publico para guest" ON public.menu_items;
DROP POLICY "Menu student para autenticados" ON public.menu_items;
DROP POLICY "Admin gerencia modulos" ON public.modules;
DROP POLICY "Modulos de cursos publicados" ON public.modules;
DROP POLICY "Admin gerencia comentarios do feed" ON public.news_comments;
DROP POLICY "Ver comentarios do feed" ON public.news_comments;
DROP POLICY "Comentar no feed" ON public.news_comments;
DROP POLICY "Deletar proprio comentario" ON public.news_comments;
DROP POLICY "Admin gerencia feed de noticias" ON public.news_posts;
DROP POLICY "Posts publicados visiveis a autenticados" ON public.news_posts;
DROP POLICY "Admin le todos os perfis" ON public.profiles;
DROP POLICY "Leitura proprio perfil" ON public.profiles;
DROP POLICY "Admin atualiza qualquer perfil" ON public.profiles;
DROP POLICY "Atualizar proprio perfil" ON public.profiles;
DROP POLICY "push_subs_own" ON public.push_subscriptions;
DROP POLICY "push_subs_admin_read" ON public.push_subscriptions;
DROP POLICY "Admin gerencia reports" ON public.reports;
DROP POLICY "Reportar conteudo" ON public.reports;
DROP POLICY "Admin gerencia vitrine" ON public.showcase_courses;
DROP POLICY "Vitrine publica" ON public.showcase_courses;
DROP POLICY "Admin gerencia paginas" ON public.static_pages;
DROP POLICY "Paginas publicadas visiveis" ON public.static_pages;

-- CREATE (policies novas)
CREATE POLICY "annual_promo_select_consolidada" ON public.annual_promo FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR ((active = true)));
CREATE POLICY "annual_promo_insert_admin" ON public.annual_promo FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "annual_promo_update_admin" ON public.annual_promo FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "annual_promo_delete_admin" ON public.annual_promo FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "banners_select_consolidada" ON public.banners FOR SELECT USING ((is_admin()) OR (((active = true) AND ((starts_at IS NULL) OR (starts_at <= now())) AND ((ends_at IS NULL) OR (ends_at >= now())))));
CREATE POLICY "banners_insert_admin" ON public.banners FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "banners_update_admin" ON public.banners FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "banners_delete_admin" ON public.banners FOR DELETE USING (is_admin());
CREATE POLICY "categories_select_consolidada" ON public.categories FOR SELECT USING ((is_admin()) OR (true));
CREATE POLICY "categories_insert_admin" ON public.categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "categories_update_admin" ON public.categories FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "categories_delete_admin" ON public.categories FOR DELETE USING (is_admin());
CREATE POLICY "certificates_select_consolidada" ON public.certificates FOR SELECT USING ((is_admin()) OR ((( SELECT auth.uid() AS uid) = user_id)) OR ((( SELECT auth.uid() AS uid) IS NOT NULL)));
CREATE POLICY "courses_select_consolidada" ON public.courses FOR SELECT USING ((is_admin()) OR ((published = true)));
CREATE POLICY "courses_insert_admin" ON public.courses FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "courses_update_admin" ON public.courses FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "courses_delete_admin" ON public.courses FOR DELETE USING (is_admin());
CREATE POLICY "enrollments_select_consolidada" ON public.enrollments FOR SELECT USING ((is_admin()) OR ((( SELECT auth.uid() AS uid) = user_id)));
CREATE POLICY "enrollments_insert_admin" ON public.enrollments FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "enrollments_update_admin" ON public.enrollments FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "enrollments_delete_admin" ON public.enrollments FOR DELETE USING (is_admin());
CREATE POLICY "forum_comments_select_consolidada" ON public.forum_comments FOR SELECT USING ((is_admin()) OR ((EXISTS ( SELECT 1
   FROM forum_posts fp
  WHERE ((fp.id = forum_comments.post_id) AND is_enrolled(fp.course_id))))));
CREATE POLICY "forum_comments_insert_consolidada" ON public.forum_comments FOR INSERT WITH CHECK ((is_admin()) OR (((( SELECT auth.uid() AS uid) = user_id) AND (EXISTS ( SELECT 1
   FROM forum_posts fp
  WHERE ((fp.id = forum_comments.post_id) AND is_enrolled(fp.course_id)))))));
CREATE POLICY "forum_comments_update_admin" ON public.forum_comments FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "forum_comments_delete_consolidada" ON public.forum_comments FOR DELETE USING ((is_admin()) OR ((( SELECT auth.uid() AS uid) = user_id)));
CREATE POLICY "forum_posts_select_consolidada" ON public.forum_posts FOR SELECT USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR ((((approved = true) OR (user_id = ( SELECT auth.uid() AS uid))) AND (((forum_id IS NOT NULL) AND is_forum_member(forum_id)) OR ((forum_id IS NULL) AND (course_id IS NOT NULL) AND is_enrolled(course_id))))));
CREATE POLICY "forum_posts_insert_consolidada" ON public.forum_posts FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR (((user_id = ( SELECT auth.uid() AS uid)) AND (((forum_id IS NOT NULL) AND is_forum_member(forum_id)) OR ((forum_id IS NULL) AND (course_id IS NOT NULL) AND is_enrolled(course_id))))));
CREATE POLICY "forum_posts_update_admin" ON public.forum_posts FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "forum_posts_delete_consolidada" ON public.forum_posts FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR ((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "forums_select_consolidada" ON public.forums FOR SELECT TO authenticated USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR (((archived = false) AND (EXISTS ( SELECT 1
   FROM (courses c
     JOIN enrollments e ON ((e.course_id = c.id)))
  WHERE ((c.forum_id = forums.id) AND (e.user_id = ( SELECT auth.uid() AS uid)) AND ((e.expires_at IS NULL) OR (e.expires_at > now()))))))));
CREATE POLICY "forums_insert_admin" ON public.forums FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "forums_update_admin" ON public.forums FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "forums_delete_admin" ON public.forums FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "inspiration_bookmarks_select_consolidada" ON public.inspiration_bookmarks FOR SELECT USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR ((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "inspiration_bookmarks_insert_consolidada" ON public.inspiration_bookmarks FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR ((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "inspiration_bookmarks_update_consolidada" ON public.inspiration_bookmarks FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR ((user_id = ( SELECT auth.uid() AS uid)))) WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR ((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "inspiration_bookmarks_delete_consolidada" ON public.inspiration_bookmarks FOR DELETE USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR ((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "inspiration_comments_select_consolidada" ON public.inspiration_comments FOR SELECT USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR (((approved = true) AND (( SELECT auth.role() AS role) = 'authenticated'::text))));
CREATE POLICY "inspiration_comments_insert_consolidada" ON public.inspiration_comments FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR (((user_id = ( SELECT auth.uid() AS uid)) AND (( SELECT auth.role() AS role) = 'authenticated'::text))));
CREATE POLICY "inspiration_comments_update_admin" ON public.inspiration_comments FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "inspiration_comments_delete_admin" ON public.inspiration_comments FOR DELETE USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "inspiration_likes_select_consolidada" ON public.inspiration_likes FOR SELECT USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR ((( SELECT auth.role() AS role) = 'authenticated'::text)));
CREATE POLICY "inspiration_likes_insert_consolidada" ON public.inspiration_likes FOR INSERT WITH CHECK (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR (((user_id = ( SELECT auth.uid() AS uid)) AND (( SELECT auth.role() AS role) = 'authenticated'::text))));
CREATE POLICY "inspiration_likes_update_admin" ON public.inspiration_likes FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "inspiration_likes_delete_consolidada" ON public.inspiration_likes FOR DELETE USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR ((user_id = ( SELECT auth.uid() AS uid))));
CREATE POLICY "inspiration_posts_select_consolidada" ON public.inspiration_posts FOR SELECT USING (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) OR (((published = true) AND (archived = false) AND (( SELECT auth.role() AS role) = 'authenticated'::text))));
CREATE POLICY "inspiration_posts_insert_admin" ON public.inspiration_posts FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "inspiration_posts_update_admin" ON public.inspiration_posts FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "inspiration_posts_delete_admin" ON public.inspiration_posts FOR DELETE USING ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type)))));
CREATE POLICY "lesson_comments_select_consolidada" ON public.lesson_comments FOR SELECT USING ((is_admin()) OR ((EXISTS ( SELECT 1
   FROM (lessons l
     JOIN modules m ON ((m.id = l.module_id)))
  WHERE ((l.id = lesson_comments.lesson_id) AND is_enrolled(m.course_id))))));
CREATE POLICY "lesson_comments_insert_consolidada" ON public.lesson_comments FOR INSERT WITH CHECK ((is_admin()) OR (((( SELECT auth.uid() AS uid) = user_id) AND (EXISTS ( SELECT 1
   FROM (lessons l
     JOIN modules m ON ((m.id = l.module_id)))
  WHERE ((l.id = lesson_comments.lesson_id) AND is_enrolled(m.course_id)))))));
CREATE POLICY "lesson_comments_update_admin" ON public.lesson_comments FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "lesson_comments_delete_consolidada" ON public.lesson_comments FOR DELETE USING ((is_admin()) OR ((( SELECT auth.uid() AS uid) = user_id)));
CREATE POLICY "lesson_content_blocks_select_consolidada" ON public.lesson_content_blocks FOR SELECT USING ((is_admin()) OR ((EXISTS ( SELECT 1
   FROM (lessons l
     JOIN modules m ON ((m.id = l.module_id)))
  WHERE ((l.id = lesson_content_blocks.lesson_id) AND ((l.is_preview = true) OR is_enrolled(m.course_id)))))));
CREATE POLICY "lesson_content_blocks_insert_admin" ON public.lesson_content_blocks FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "lesson_content_blocks_update_admin" ON public.lesson_content_blocks FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "lesson_content_blocks_delete_admin" ON public.lesson_content_blocks FOR DELETE USING (is_admin());
CREATE POLICY "lesson_materials_select_consolidada" ON public.lesson_materials FOR SELECT USING ((is_admin()) OR ((EXISTS ( SELECT 1
   FROM (lessons l
     JOIN modules m ON ((m.id = l.module_id)))
  WHERE ((l.id = lesson_materials.lesson_id) AND is_enrolled(m.course_id))))));
CREATE POLICY "lesson_materials_insert_admin" ON public.lesson_materials FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "lesson_materials_update_admin" ON public.lesson_materials FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "lesson_materials_delete_admin" ON public.lesson_materials FOR DELETE USING (is_admin());
CREATE POLICY "lesson_progress_select_consolidada" ON public.lesson_progress FOR SELECT USING (((( SELECT auth.uid() AS uid) = user_id)) OR (is_admin()));
CREATE POLICY "lesson_progress_insert_admin" ON public.lesson_progress FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "lesson_progress_update_admin" ON public.lesson_progress FOR UPDATE USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "lesson_progress_delete_admin" ON public.lesson_progress FOR DELETE USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "lessons_select_consolidada" ON public.lessons FOR SELECT USING ((is_admin()) OR (is_enrolled(( SELECT modules.course_id
   FROM modules
  WHERE (modules.id = lessons.module_id)))) OR ((is_preview = true)));
CREATE POLICY "lessons_insert_admin" ON public.lessons FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "lessons_update_admin" ON public.lessons FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "lessons_delete_admin" ON public.lessons FOR DELETE USING (is_admin());
CREATE POLICY "menu_items_select_consolidada" ON public.menu_items FOR SELECT USING ((is_admin()) OR (((visible_to = 'guest'::menu_visibility) AND (active = true))) OR (((( SELECT auth.uid() AS uid) IS NOT NULL) AND (visible_to = ANY (ARRAY['guest'::menu_visibility, 'student'::menu_visibility])) AND (active = true))));
CREATE POLICY "menu_items_insert_admin" ON public.menu_items FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "menu_items_update_admin" ON public.menu_items FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "menu_items_delete_admin" ON public.menu_items FOR DELETE USING (is_admin());
CREATE POLICY "modules_select_consolidada" ON public.modules FOR SELECT USING ((is_admin()) OR ((EXISTS ( SELECT 1
   FROM courses
  WHERE ((courses.id = modules.course_id) AND (courses.published = true))))));
CREATE POLICY "modules_insert_admin" ON public.modules FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "modules_update_admin" ON public.modules FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "modules_delete_admin" ON public.modules FOR DELETE USING (is_admin());
CREATE POLICY "news_comments_select_consolidada" ON public.news_comments FOR SELECT USING ((is_admin()) OR ((( SELECT auth.uid() AS uid) IS NOT NULL)));
CREATE POLICY "news_comments_insert_consolidada" ON public.news_comments FOR INSERT WITH CHECK ((is_admin()) OR ((( SELECT auth.uid() AS uid) = user_id)));
CREATE POLICY "news_comments_update_admin" ON public.news_comments FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "news_comments_delete_consolidada" ON public.news_comments FOR DELETE USING ((is_admin()) OR ((( SELECT auth.uid() AS uid) = user_id)));
CREATE POLICY "news_posts_select_consolidada" ON public.news_posts FOR SELECT USING ((is_admin()) OR (((published = true) AND (( SELECT auth.uid() AS uid) IS NOT NULL))));
CREATE POLICY "news_posts_insert_admin" ON public.news_posts FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "news_posts_update_admin" ON public.news_posts FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "news_posts_delete_admin" ON public.news_posts FOR DELETE USING (is_admin());
CREATE POLICY "profiles_select_consolidada" ON public.profiles FOR SELECT USING ((is_admin()) OR ((( SELECT auth.uid() AS uid) = id)));
CREATE POLICY "profiles_update_consolidada" ON public.profiles FOR UPDATE USING ((is_admin()) OR ((( SELECT auth.uid() AS uid) = id))) WITH CHECK ((is_admin()) OR (((( SELECT auth.uid() AS uid) = id) AND (role = ( SELECT profiles_1.role
   FROM profiles profiles_1
  WHERE (profiles_1.id = ( SELECT auth.uid() AS uid)))))));
CREATE POLICY "push_subscriptions_select_consolidada" ON public.push_subscriptions FOR SELECT USING (((( SELECT auth.uid() AS uid) = user_id)) OR ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = ( SELECT auth.uid() AS uid)) AND (profiles.role = 'admin'::role_type))))));
CREATE POLICY "push_subscriptions_insert_admin" ON public.push_subscriptions FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "push_subscriptions_update_admin" ON public.push_subscriptions FOR UPDATE USING ((( SELECT auth.uid() AS uid) = user_id)) WITH CHECK ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "push_subscriptions_delete_admin" ON public.push_subscriptions FOR DELETE USING ((( SELECT auth.uid() AS uid) = user_id));
CREATE POLICY "reports_select_admin" ON public.reports FOR SELECT USING (is_admin());
CREATE POLICY "reports_insert_consolidada" ON public.reports FOR INSERT WITH CHECK ((is_admin()) OR ((( SELECT auth.uid() AS uid) = reporter_id)));
CREATE POLICY "reports_update_admin" ON public.reports FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "reports_delete_admin" ON public.reports FOR DELETE USING (is_admin());
CREATE POLICY "showcase_courses_select_consolidada" ON public.showcase_courses FOR SELECT USING ((is_admin()) OR ((active = true)));
CREATE POLICY "showcase_courses_insert_admin" ON public.showcase_courses FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "showcase_courses_update_admin" ON public.showcase_courses FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "showcase_courses_delete_admin" ON public.showcase_courses FOR DELETE USING (is_admin());
CREATE POLICY "static_pages_select_consolidada" ON public.static_pages FOR SELECT USING ((is_admin()) OR ((published = true)));
CREATE POLICY "static_pages_insert_admin" ON public.static_pages FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "static_pages_update_admin" ON public.static_pages FOR UPDATE USING (is_admin()) WITH CHECK (is_admin());
CREATE POLICY "static_pages_delete_admin" ON public.static_pages FOR DELETE USING (is_admin());