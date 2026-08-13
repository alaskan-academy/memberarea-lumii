// Cria (ou reaproveita) a conta de teste usada pelos testes E2E, e matricula
// ela num curso real publicado para os testes de player de aula terem algo
// de verdade pra exercitar. Nunca via SQL direto — usa a Admin API do
// Supabase (auth.admin.createUser), que preenche corretamente os campos
// internos de auth (confirmação, tokens etc.) que um INSERT manual não cobre.
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = process.env.E2E_TEST_EMAIL || "e2e-test@lumiieduca.com.br";
const PASSWORD = process.env.E2E_TEST_PASSWORD || "SenhaTesteE2E2026!";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local antes de rodar."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const authDir = path.resolve(__dirname, ".auth");
fs.mkdirSync(authDir, { recursive: true });

async function ensureUser() {
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", EMAIL)
    .maybeSingle();

  if (existing) {
    console.log(`Conta de teste já existe (${EMAIL}), id=${existing.id}.`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Aluna Teste E2E" },
  });

  if (error) {
    console.error("Erro ao criar conta de teste:", error.message);
    process.exit(1);
  }

  console.log(`Conta de teste criada: ${EMAIL} (id=${data.user.id})`);
  return data.user.id;
}

async function ensureEnrollment(userId) {
  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title")
    .eq("published", true)
    .limit(1)
    .maybeSingle();

  if (!course) {
    console.warn("Nenhum curso publicado encontrado — testes de aula ficarão limitados a rotas de erro.");
    return { courseId: null, courseSlug: null, lessonId: null };
  }

  await supabase.from("enrollments").upsert(
    {
      user_id: userId,
      course_id: course.id,
      source: "manual",
      granted_at: new Date().toISOString(),
      expires_at: null,
    },
    { onConflict: "user_id,course_id" }
  );

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, modules!inner(course_id)")
    .eq("modules.course_id", course.id)
    .limit(1)
    .maybeSingle();

  console.log(`Matriculada em "${course.title}"${lesson ? ` — aula de teste: ${lesson.id}` : " (sem aulas)"}`);

  return { courseId: course.id, courseSlug: course.slug, lessonId: lesson?.id ?? null };
}

const userId = await ensureUser();
const testData = await ensureEnrollment(userId);

fs.writeFileSync(
  path.resolve(authDir, "test-data.json"),
  JSON.stringify(testData, null, 2)
);

console.log("\nAdicione ao .env.local (se ainda não estiver lá):");
console.log(`E2E_TEST_EMAIL=${EMAIL}`);
console.log(`E2E_TEST_PASSWORD=${PASSWORD}`);
console.log("\nDados de teste salvos em e2e/.auth/test-data.json");
