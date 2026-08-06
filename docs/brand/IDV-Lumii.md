# Identidade Visual — Lumii

> Fonte oficial: [`Lumii - Marca.pdf`](./Lumii%20-%20Marca.pdf) (11/09/2025, Lucas Veiga).
> **Esta é a IDV definitiva do projeto. Nunca fugir dela** — qualquer peça, tela ou componente visual da Lumii deve usar exatamente estas cores, fonte e tom.

## Marca

- **Nome:** Lumii
- **Categoria:** EdTech para pais e professores
- **Origem do nome:** vem de "luz" — clareza, direção e esperança na jornada da infância. Sonoridade curta (lu-mi), universal em português/inglês/espanhol.
- **Tagline oficial:** "Cuidar de quem cuida da infância."

## Cores

| Cor | Hex | Uso |
|-----|-----|-----|
| Verde | `#71c69a` | Cor primária do gradiente do logo |
| Amarelo | `#eebc3e` | Cor intermediária do gradiente do logo |
| Vermelho/coral | `#f6614f` | Cor final do gradiente do logo; cor primária de ação (botões, links, CTAs) |
| Azul-marinho (dark, PDF) | `#212d42` | Fundo escuro / cor institucional de contraste (valor original do PDF da marca) |
| **Azul Lumii (fundo do produto)** | **`#243149`** | **Fundo padrão de todo o produto (site/app) — definido em 2026-08-06. Substitui fundo claro/branco em toda a aplicação.** |

O logotipo "Lumii" usa gradiente diagonal verde → amarelo → coral. Fundo de marca padrão: `#212d42` (azul-marinho escuro, conforme PDF), com o logo em gradiente sobre ele.

**Fundo do produto (site/app):** `#243149` é o azul oficial de fundo de toda a aplicação (área da aluna e admin) — telas não usam mais fundo claro/branco como superfície padrão. Textos e superfícies internas (cards, inputs) devem usar tons claros/off-white para contraste sobre esse azul.

## Tipografia

**Poppins** (família completa — Bold para títulos/wordmark, Regular para corpo, Light para texto de apoio).

## Logo

- Wordmark "Lumii" em gradiente (verde → amarelo → coral) sobre fundo azul-marinho `#212d42`.
- Ícone de app: mesmo wordmark centralizado em fundo `#212d42` com cantos arredondados (squircle).
- Versão sobre fundo claro: manter o gradiente do texto; não achatar em cor sólida.
- **Arte oficial (arquivo real, não recriar em texto/CSS):** [`logo-lumii.png`](./logo-lumii.png) — PNG recortado e com fundo transparente, extraído do material enviado em 2026-08-06. Usado em `public/logo-lumii.png` via o componente [`src/components/brand/Logo.tsx`](../../src/components/brand/Logo.tsx). **Nunca recriar o wordmark com texto/SVG aproximado** — usar sempre este arquivo (ou uma exportação vetorial oficial futura, se enviada).

## Iconografia de apoio

Ícones de linha (outline) oficiais da marca, um em cada cor do gradiente — remetem ao universo infantil e devem ser usados (não recriados com outros ícones genéricos) sempre que fizer sentido: empty states, telas de boas-vindas, materiais de marketing, seções decorativas.

| Ícone | Cor | Arquivo |
|-------|-----|---------|
| Ursinho de pelúcia | Verde `#71c69a` | [`ursinho.png`](./ursinho.png) — também em `public/icons/brand/ursinho.png` |
| Cavalo de balanço | Amarelo `#eebc3e` | [`cavalo-balanco.png`](./cavalo-balanco.png) — também em `public/icons/brand/cavalo-balanco.png` |
| Blocos ABC/123 | Coral `#f6614f` | [`blocos-abc.png`](./blocos-abc.png) — também em `public/icons/brand/blocos-abc.png` |

Todos em PNG com fundo transparente, prontos para uso direto (`<Image src="/icons/brand/ursinho.png" .../>`). Extraídos do material oficial enviado em 2026-08-06.

## Regra não-negociável

**Nunca fugir desta IDV.** Qualquer nova tela, componente, e-mail, PDF ou material da Lumii deve usar apenas as cores, fonte (Poppins) e tom de voz definidos aqui. Não introduzir cores, fontes ou variações de logo fora deste documento sem antes atualizar oficialmente a IDV.
