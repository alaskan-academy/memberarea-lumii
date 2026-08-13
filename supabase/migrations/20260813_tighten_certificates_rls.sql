-- Auditoria de RLS (2026-08-13): a policy "Verificacao publica por hash" em
-- certificates tinha qual: true, permitindo SELECT * sem nenhum filtro via
-- API REST direta (anon key) — dava pra dumpar a tabela inteira (user_id,
-- course_id, pdf_path de todo certificado emitido), ignorando o login que a
-- rota /verificar/[hash] já exige no app (proxy.ts). Restringe a exigir
-- sessão autenticada, mantendo a verificação por hash funcionando para
-- qualquer usuária logada — já é o único jeito de chegar nessa página.
DROP POLICY IF EXISTS "Verificacao publica por hash" ON public.certificates;

CREATE POLICY "Verificacao exige autenticacao"
ON public.certificates
FOR SELECT
USING (auth.uid() IS NOT NULL);
