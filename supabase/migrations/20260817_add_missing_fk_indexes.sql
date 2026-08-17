-- Performance: adiciona indice de cobertura pras 21 foreign keys sem indice
-- (Supabase Performance Advisor, unindexed_foreign_keys). Sem indice, joins,
-- deletes em cascata e updates na tabela referenciada fazem sequential scan
-- na tabela filha. Operacao puramente aditiva, sem risco.

CREATE INDEX IF NOT EXISTS idx_courses_forum_id ON public.courses(forum_id);
CREATE INDEX IF NOT EXISTS idx_lesson_content_blocks_lesson_id ON public.lesson_content_blocks(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson_id ON public.lesson_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_parent_id ON public.menu_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_news_posts_author_id ON public.news_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_user_id ON public.news_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_forum_id ON public.forum_posts(forum_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON public.forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_parent_id ON public.forum_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_user_id ON public.forum_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_comments_user_id ON public.lesson_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON public.audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_activation_tokens_course_id ON public.activation_tokens(course_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_posts_author_id ON public.inspiration_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_posts_featured_student_id ON public.inspiration_posts(featured_student_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_likes_user_id ON public.inspiration_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_inspiration_comments_user_id ON public.inspiration_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_created_by ON public.notification_campaigns(created_by);
