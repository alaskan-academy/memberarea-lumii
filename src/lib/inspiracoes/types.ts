// ── Tipos base ────────────────────────────────────────────────────────────────

export type InspiracaoType = 'foto' | 'carrossel' | 'video' | 'atividade' | 'dica' | 'destaque'

export type InspiracaoNicho = string

export interface MediaItem {
  url: string
  alt?: string
  order: number
}

export interface ContentBlock {
  type: 'text' | 'html' | 'embed' | 'download' | 'video_meta'
  content: string
  position: number
}

export interface MaterialItem {
  item: string
  quantidade?: string
}

export interface AtividadeData {
  materiais?: MaterialItem[]        // materiais necessários para a atividade
  passo_a_passo?: string[]          // sequência de passos da atividade
  duracao?: string | null           // tempo estimado da atividade
  faixa_etaria?: string | null      // idade indicada
  objetivos?: string[]              // objetivos pedagógicos (opcional)
  dicas?: string | null             // dica para conduzir a atividade
}

// ── Row do banco ──────────────────────────────────────────────────────────────

export interface InspiracaoPostRow {
  id: string
  author_id: string
  type: InspiracaoType
  title: string
  body: string | null
  media: MediaItem[]
  video_url: string | null
  blocks: ContentBlock[]
  recipe_data: AtividadeData | null
  tags: string[]
  course_id: string | null
  course_ids: string[]
  featured_student_id: string | null
  published: boolean
  archived: boolean
  pinned: boolean
  created_at: string
  updated_at: string
}

// ── Post com dados extras para o feed ─────────────────────────────────────────

export interface InspiracaoPost extends InspiracaoPostRow {
  like_count: number
  comment_count: number
  is_liked: boolean       // pelo usuário atual
  is_bookmarked: boolean  // pelo usuário atual
  author?: {
    full_name: string | null
    avatar_url: string | null
  }
  featured_student?: {
    id: string
    full_name: string | null
    avatar_url: string | null
    bio: string | null
  } | null
}

// ── Comentário ────────────────────────────────────────────────────────────────

export interface InspiracaoComment {
  id: string
  post_id: string
  user_id: string
  body: string
  approved: boolean
  created_at: string
  parent_id?: string | null
  replies?: InspiracaoComment[]  // populado em getComments, não vem do banco
  profiles?: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

// ── Filtros do feed ───────────────────────────────────────────────────────────

export interface InspiracaoFiltros {
  tipo?: InspiracaoType | ''
  nicho?: string
  curso_id?: string
  busca?: string
}

// ── Paginação por cursor ──────────────────────────────────────────────────────

export interface InspiracaoCursor {
  created_at: string
  id: string
}

export interface InspiracaoPage {
  posts: InspiracaoPost[]
  next_cursor: InspiracaoCursor | null
  has_more: boolean
}

// ── Payload para criar/editar post (admin) ────────────────────────────────────

export interface UpsertInspiracaoPayload {
  id?: string
  type: InspiracaoType
  title: string
  body?: string
  media?: MediaItem[]
  video_url?: string
  blocks?: ContentBlock[]
  recipe_data?: AtividadeData
  tags?: string[]
  course_id?: string | null
  course_ids?: string[]
  featured_student_id?: string | null
  published?: boolean
  archived?: boolean
  pinned?: boolean
}
