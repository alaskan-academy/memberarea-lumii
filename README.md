# Lumii — Área de Membros

Plataforma de área de membros da Lumii, voltada à **educação infantil para pais e professores**: cursos em vídeo, materiais de apoio, comunidade, ferramentas práticas e certificados. Toda URL exige conta logada — o acesso é 100% fechado.

## Stack

- **Next.js 16** (App Router, Server Components/Actions, TypeScript strict)
- **Supabase** (Postgres + Auth + Storage + RLS)
- **Tailwind v4** (configuração CSS-first em `src/app/globals.css`, sem `tailwind.config`)
- **Resend** (e-mails transacionais)
- **Panda Video** (player e hospedagem dos vídeos das aulas)

## Comandos

```bash
npm run dev        # desenvolvimento (http://localhost:3000)
npm run build      # build de produção
npm run lint       # ESLint
npm test           # testes unitários (Vitest)
npm run test:e2e   # testes end-to-end (Playwright)
```

## Variáveis de ambiente

Copie `.env.local.example` → `.env.local` e preencha antes de rodar.

## Documentação

- [`CLAUDE.md`](CLAUDE.md) — decisões técnicas, convenções e histórico de correções.
- [`docs/brand/IDV-Lumii.md`](docs/brand/IDV-Lumii.md) — identidade visual (cores, fonte, tom de voz). Consulta obrigatória antes de qualquer alteração visual.
