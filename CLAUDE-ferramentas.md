# Ferramentas MVP — Notas de Implementação

> Leia este arquivo antes de qualquer alteração relacionada às Ferramentas (`/ferramentas`).
> Plano completo em: `PLAN-ferramentas.md`

## Escopo desta feature

Primeiras duas Ferramentas da Lumii — seção nova, não existia nada antes:

- **"O que eu digo agora?"** (`/ferramentas/o-que-eu-digo-agora`) — pais, script de conversa por situação + idade
- **"Plano Individual de Apoio ao Aluno"** (`/ferramentas/plano-apoio-aluno`) — professores, plano de ação por aluno com histórico e check-ins

## Regra crítica: nenhuma das duas usa IA no MVP

**Não adicionar `ANTHROPIC_API_KEY`, SDK da Anthropic, nem chamadas de rede para gerar conteúdo.** As duas ferramentas funcionam com conteúdo estático revisado por especialista:

- Ferramenta 1: `lib/ferramentas/parent-scripts/content.ts` — 50 entradas (10 situações × 5 faixas etárias)
- Ferramenta 2: `lib/ferramentas/support-plan/content.ts` — 8 templates (um por `dificuldade_principal`)

O ponto de extensão para IA futura é a função `buildSupportPlanDraft(input)` em `lib/ferramentas/support-plan/actions.ts` — hoje faz lookup síncrono no template, na Fase 2 pode virar uma chamada Claude sem mudar assinatura, schema ou UI. Detalhe completo em `PLAN-ferramentas.md` seção 8. **Não implementar essa troca sem pedido explícito.**

## `profiles.is_parent` / `profiles.is_teacher` — o que são e o que não são

Duas colunas booleanas nullable, só para personalização (ordem dos cards no hub, analytics). **Nunca usar para bloquear acesso** a nenhuma ferramenta — qualquer conta logada vê as duas. Não confundir com `profiles.role` (`student`/`admin`), que continua controlando acesso à área admin e não é tocado por esta feature.

## Tabelas novas (migration `20260811_ferramentas_mvp.sql`)

```
parent_script_views       ← analytics de visualização (Ferramenta 1)
parent_script_favorites   ← favoritos (Ferramenta 1)
teacher_students           ← cadastro mínimo do professor — NÃO é a mesma coisa que profiles/enrollments
support_plans               ← plano por aluno, jsonb em plano_gerado
support_plan_checkins       ← histórico de check-in (melhorou/igual/piorou)
```

`teacher_students` existe só dentro desta ferramenta — não confundir com "aluna" (cliente da Lumii, `profiles`). É o cadastro particular do professor.

## Pastas e arquivos

```
src/app/(student)/ferramentas/           ← hub + rotas das duas ferramentas
src/components/ferramentas/              ← componentes (hub/, parent-scripts/, support-plan/)
src/lib/ferramentas/parent-scripts/      ← content.ts + types.ts + actions.ts
src/lib/ferramentas/support-plan/        ← content.ts + types.ts + actions.ts
supabase/migrations/20260811_ferramentas_mvp.sql
```

## Padrões obrigatórios

- Sem rotas de API — tudo Server Action (`lib/ferramentas/**/actions.ts`), seguindo a convenção do projeto (CLAUDE.md raiz: "Server Actions para mutações; API routes só para webhooks externos")
- Zod valida todo input de formulário antes de gravar
- `createClient()` (respeita RLS) em todas as actions — nenhuma delas precisa de `createServiceClient`, pai/professor só mexe nos próprios dados
- Leituras de lista/detalhe (alunos do professor, histórico) acontecem direto no Server Component — não criar Server Action só para ler
- Conteúdo estático das duas ferramentas é **exceção deliberada** ao princípio Backend-first do CLAUDE.md raiz — ver nota lá. Não mover para tabela sem decisão explícita (perderia a garantia de revisão humana pré-publicação)
- Fundo navy (`#243149`) + cards off-white + coral `#f6614f` como cor de ação — ver `docs/brand/IDV-Lumii.md` antes de estilizar qualquer tela nova
- Item de nav "Ferramentas" entra via `menu_items` (admin CRUD) — nunca hardcodar link na sidebar

## Ordem de implementação (não pular fases)

1. Migration `20260811_ferramentas_mvp.sql` (banco primeiro, sempre)
2. `content.ts` + `types.ts` de cada ferramenta (com 3-4 entradas de exemplo — conteúdo final vem depois)
3. Ferramenta 1 completa (mais simples, valida o padrão de UI)
4. Ferramenta 2 completa (cadastro de aluno → plano → check-in → histórico)
5. Conteúdo final das 50 + 8 entradas, revisado (checklists em `PLAN-ferramentas.md` seções 5.3 e 6.3)
6. Nav (`menu_items`) + polimento mobile

## Checklist de segurança

- [ ] RLS ativo nas 5 tabelas novas
- [ ] Server Actions verificam `auth.uid()` antes de mutar (não confiar só em RLS)
- [ ] `is_parent`/`is_teacher` nunca usados para gate de acesso
- [ ] Zod em todo input (`SupportPlanInput`, `ParentScriptInput`, cadastro de `teacher_students`)
