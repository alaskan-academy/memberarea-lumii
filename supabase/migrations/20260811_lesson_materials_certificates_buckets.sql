-- Buckets de Storage ausentes causando "Bucket not found" em upload de materiais
-- e falha silenciosa na emissão de certificados. As tabelas/RLS já existiam
-- (criadas por outro caminho, fora da sequência 005/006 deste diretório);
-- só o bucket em si e as policies de storage.objects nunca foram criados
-- no projeto Supabase da Lumii. Rodado manualmente em produção em 2026-08-11.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lesson-materials',
  'lesson-materials',
  false,
  52428800,
  array['application/pdf','application/zip','image/png','image/jpeg','image/webp',
        'video/mp4','audio/mpeg','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'certificates',
  'certificates',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do nothing;

-- lesson-materials: admin faz upload/delete (sempre via service role, mas policy fica por consistência),
-- aluna acessa via signed URL (gerado com client de sessão em getMaterialSignedUrl)
create policy "Admin faz upload de materiais" on storage.objects
  for insert with check (
    bucket_id = 'lesson-materials' and public.is_admin()
  );

create policy "Admin deleta materiais" on storage.objects
  for delete using (
    bucket_id = 'lesson-materials' and public.is_admin()
  );

create policy "Aluna acessa materiais via signed URL" on storage.objects
  for select using (
    bucket_id = 'lesson-materials' and auth.role() = 'authenticated'
  );

-- certificates: acesso só via service_role (upload e signed URL sempre passam por createServiceClient),
-- mantém consistente com o padrão de bucket privado sem policy de select para authenticated
create policy "Aluna acessa proprio certificado via signed URL" on storage.objects
  for select using (
    bucket_id = 'certificates' and (storage.foldername(name))[1] = auth.uid()::text
  );
