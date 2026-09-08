'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, X, Image as ImageIcon, Play, Blocks,
  Lightbulb, Star, GalleryHorizontal, Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminUpsertPost, adminDeletePost } from '@/lib/inspiracoes/actions'
import type { InspiracaoType, InspiracaoPostRow, AtividadeData, MaterialItem } from '@/lib/inspiracoes/types'
import { ImageUploader } from './ImageUploader'

const RichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  { ssr: false, loading: () => <div className="h-32 rounded-lg border border-border/60 bg-muted/30 animate-pulse" /> }
)

// ── Constantes ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: InspiracaoType; icon: React.ElementType; label: string; desc: string }[] = [
  { value: 'foto',      icon: ImageIcon,          label: 'Foto',      desc: 'Imagem única com legenda' },
  { value: 'carrossel', icon: GalleryHorizontal,  label: 'Carrossel', desc: '2+ imagens swipeable' },
  { value: 'video',     icon: Play,               label: 'Vídeo',     desc: 'YouTube ou Panda Video' },
  { value: 'atividade', icon: Blocks,             label: 'Atividade', desc: 'Materiais e passo a passo' },
  { value: 'dica',      icon: Lightbulb,          label: 'Dica',      desc: 'Texto rico / HTML' },
  { value: 'destaque',  icon: Star,               label: 'Destaque',  desc: 'Aluna em destaque' },
]


const FAIXA_ETARIA_OPTIONS = ['0–2 anos', '3–5 anos', '6–8 anos', '9–12 anos']

const INPUT_CLS = "w-full px-3 py-2 text-sm rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-lumii-coral/30 focus:border-lumii-coral bg-white"
const LABEL_CLS = "block text-xs font-medium text-foreground mb-1"

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  post?: InspiracaoPostRow
  adminId: string
  courses: { id: string; title: string }[]
  categories?: { id: string; name: string; slug: string }[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getYouTubeId(url: string) {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m?.[1] ?? null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function InspiracaoForm({ post, adminId, courses, categories = [] }: Props) {
  const router = useRouter()
  const isEdit = !!post

  // Common fields
  const [type, setType]           = useState<InspiracaoType>(post?.type ?? 'foto')
  const [title, setTitle]         = useState(post?.title ?? '')
  const [body, setBody]           = useState(post?.body ?? '')
  const [tags, setTags]           = useState<Set<string>>(new Set(post?.tags ?? []))
  const [courseIds, setCourseIds] = useState<Set<string>>(new Set(post?.course_ids ?? []))
  const [published, setPublished] = useState(post?.published ?? false)
  const [pinned, setPinned]       = useState(post?.pinned ?? false)
  const [archived, setArchived]   = useState(post?.archived ?? false)

  // Foto / Carrossel
  const initialUrls = post?.media?.length
    ? post.media.map((m) => m.url)
    : ['']
  const [mediaUrls, setMediaUrls] = useState<string[]>(initialUrls)

  // Video
  const [videoUrl, setVideoUrl] = useState(post?.video_url ?? '')
  const [videoAspect, setVideoAspect] = useState<'16/9' | '9/16' | '1/1'>(
    ((post?.blocks ?? []).find((b) => b.type === 'video_meta')?.content as '16/9' | '9/16' | '1/1') ?? '16/9'
  )

  // Dica — bloco HTML
  const [htmlBlock, setHtmlBlock] = useState(
    (post?.blocks ?? []).find((b) => b.type === 'html')?.content ?? ''
  )

  // Dica / Destaque — imagem de capa opcional
  const [coverImage, setCoverImage] = useState(
    (post?.type === 'dica' || post?.type === 'destaque') ? (post?.media?.[0]?.url ?? '') : ''
  )

  // Atividade
  const rd: AtividadeData | undefined = post?.recipe_data ?? undefined
  const [atividadeMedia, setAtividadeMedia] = useState(post?.media?.[0]?.url ?? '')
  const [materiais, setMateriais] = useState<{ item: string; quantidade: string }[]>(
    rd?.materiais?.length
      ? rd.materiais.map(m => ({ item: m.item, quantidade: m.quantidade ?? '' }))
      : [{ item: '', quantidade: '' }]
  )
  const [passos, setPassos]       = useState<string[]>(
    rd?.passo_a_passo?.length ? rd.passo_a_passo : ['']
  )
  const [objetivos, setObjetivos] = useState<string[]>(
    rd?.objetivos?.length ? rd.objetivos : ['']
  )
  const [duracao, setDuracao]     = useState(rd?.duracao ?? '')
  const [faixaEtaria, setFaixaEtaria] = useState(rd?.faixa_etaria ?? '')
  const [dicas, setDicas]         = useState(rd?.dicas ?? '')

  // Destaque
  const [featuredStudentId, setFeaturedStudentId] = useState(post?.featured_student_id ?? '')

  const [loading, setLoading]   = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState('')

  // ── Materiais ─────────────────────────────────────────────────────────────
  function addMaterial() {
    setMateriais(prev => [...prev, { item: '', quantidade: '' }])
  }
  function removeMaterial(i: number) {
    setMateriais(prev => prev.filter((_, idx) => idx !== i))
  }
  function updateMaterial(i: number, key: 'item' | 'quantidade', val: string) {
    setMateriais(prev => prev.map((mat, idx) => idx === i ? { ...mat, [key]: val } : mat))
  }

  // ── Passos ──────────────────────────────────────────────────────────────────
  function addPasso() { setPassos(prev => [...prev, '']) }
  function removePasso(i: number) { setPassos(prev => prev.filter((_, idx) => idx !== i)) }
  function updatePasso(i: number, val: string) {
    setPassos(prev => prev.map((p, idx) => idx === i ? val : p))
  }

  // ── Objetivos ─────────────────────────────────────────────────────────────
  function addObjetivo() { setObjetivos(prev => [...prev, '']) }
  function removeObjetivo(i: number) { setObjetivos(prev => prev.filter((_, idx) => idx !== i)) }
  function updateObjetivo(i: number, val: string) {
    setObjetivos(prev => prev.map((o, idx) => idx === i ? val : o))
  }

  // ── Media URLs (carrossel) ──────────────────────────────────────────────────
  function addMediaUrl() { setMediaUrls(prev => [...prev, '']) }
  function removeMediaUrl(i: number) { setMediaUrls(prev => prev.filter((_, idx) => idx !== i)) }
  function updateMediaUrl(i: number, val: string) {
    setMediaUrls(prev => prev.map((u, idx) => idx === i ? val : u))
  }

  // ── Tags ────────────────────────────────────────────────────────────────────
  function toggleTag(key: string) {
    setTags(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  function toggleCourse(id: string) {
    setCourseIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('Título obrigatório.'); return }
    setLoading(true)
    setError('')

    try {
      // Monta media
      let media: { url: string; alt: string; order: number }[] = []
      if (type === 'foto') {
        if (mediaUrls[0]?.trim()) media = [{ url: mediaUrls[0].trim(), alt: title, order: 0 }]
      } else if (type === 'carrossel') {
        media = mediaUrls
          .map((u, i) => ({ url: u.trim(), alt: `${title} ${i + 1}`, order: i }))
          .filter(m => m.url)
      } else if (type === 'atividade') {
        if (atividadeMedia.trim()) media = [{ url: atividadeMedia.trim(), alt: title, order: 0 }]
      } else if (type === 'dica' || type === 'destaque') {
        if (coverImage.trim()) media = [{ url: coverImage.trim(), alt: title, order: 0 }]
      }

      // Monta recipe_data (mantém o nome da coluna do banco; conteúdo = atividade)
      let recipe_data: AtividadeData | undefined = undefined
      if (type === 'atividade') {
        const materiaisLimpos: MaterialItem[] = materiais
          .filter(mat => mat.item.trim())
          .map(mat => ({
            item: mat.item.trim(),
            quantidade: mat.quantidade.trim() || undefined,
          }))
        recipe_data = {
          materiais: materiaisLimpos,
          passo_a_passo: passos.filter(p => p.trim()),
          objetivos: objetivos.filter(o => o.trim()),
          duracao: duracao.trim() || undefined,
          faixa_etaria: faixaEtaria || undefined,
          dicas: dicas.trim() || undefined,
        }
      }

      // Monta blocks
      let blocks: { type: 'html' | 'video_meta'; content: string; position: number }[] | undefined = undefined
      if (type === 'dica' && htmlBlock.trim() && htmlBlock.trim() !== '<p></p>') {
        blocks = [{ type: 'html', content: htmlBlock.trim(), position: 0 }]
      }
      if (type === 'video') {
        blocks = [{ type: 'video_meta', content: videoAspect, position: 0 }]
      }

      await adminUpsertPost(adminId, {
        id: post?.id,
        type,
        title: title.trim(),
        body: (body.trim() && body.trim() !== '<p></p>') ? body.trim() : undefined,
        media,
        video_url: type === 'video' ? videoUrl.trim() || undefined : undefined,
        blocks,
        recipe_data,
        tags: [...tags],
        course_ids: [...courseIds],
        featured_student_id: type === 'destaque' ? featuredStudentId.trim() || undefined : undefined,
        published,
        pinned,
        archived,
      })

      router.push('/admin/inspiracoes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar.')
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!post?.id) return
    if (!confirm(`Excluir "${post.title}"? Esta ação não pode ser desfeita.`)) return
    setDeleting(true)
    await adminDeletePost(post.id)
    router.push('/admin/inspiracoes')
  }

  // ── YouTube embed preview ────────────────────────────────────────────────────
  const ytId = type === 'video' ? getYouTubeId(videoUrl) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/inspiracoes" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-xl font-bold">
            {isEdit ? 'Editar post' : 'Novo post de inspiração'}
          </h1>
        </div>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs px-3 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            {deleting ? 'Excluindo...' : 'Excluir'}
          </button>
        )}
      </div>

      {/* Tipo */}
      <div className="bg-white rounded-xl border border-border/60 p-5">
        <h2 className="text-sm font-semibold mb-3">Tipo de post</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TYPE_OPTIONS.map(opt => {
            const Icon = opt.icon
            const active = type === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-colors ${
                  active
                    ? 'border-lumii-coral bg-lumii-coral/8 text-lumii-coral'
                    : 'border-border/60 hover:border-lumii-coral/40 text-foreground'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  active ? 'bg-lumii-coral/15' : 'bg-muted'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</p>
                </div>
                {active && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="bg-white rounded-xl border border-border/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold">Conteúdo</h2>

        {/* Título */}
        <div>
          <label htmlFor="inspiracao-titulo" className={LABEL_CLS}>Título *</label>
          <input
            id="inspiracao-titulo"
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            className={INPUT_CLS}
            placeholder="Ex: Caça ao tesouro das cores"
          />
        </div>

        {/* Legenda / corpo */}
        <div>
          <label className={LABEL_CLS}>Legenda / corpo</label>
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="Descrição do post, contexto, dicas gerais..."
            minHeight={120}
            ariaLabel="Legenda / corpo do post"
          />
        </div>

        {/* ── Mídia: foto ───────────────────────────────────────────────── */}
        {type === 'foto' && (
          <ImageUploader
            label="Imagem"
            value={mediaUrls[0] ?? ''}
            onChange={url => updateMediaUrl(0, url)}
          />
        )}

        {/* ── Mídia: carrossel ─────────────────────────────────────────── */}
        {type === 'carrossel' && (
          <div>
            <label className={LABEL_CLS}>Imagens do carrossel</label>
            <div className="space-y-4">
              {mediaUrls.map((url, i) => (
                <div key={i} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Imagem {i + 1}
                    </span>
                    {mediaUrls.length > 1 && (
                      <button type="button" onClick={() => removeMediaUrl(i)}
                        className="text-[10px] text-red-500 hover:underline flex items-center gap-1">
                        <X className="w-3 h-3" />
                        Remover
                      </button>
                    )}
                  </div>
                  <ImageUploader
                    value={url}
                    onChange={newUrl => updateMediaUrl(i, newUrl)}
                  />
                </div>
              ))}
              <button type="button" onClick={addMediaUrl}
                className="flex items-center gap-1.5 text-xs text-lumii-coral hover:underline">
                <Plus className="w-3.5 h-3.5" />
                Adicionar imagem
              </button>
            </div>
          </div>
        )}

        {/* ── Vídeo ────────────────────────────────────────────────────── */}
        {type === 'video' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="inspiracao-video-url" className={LABEL_CLS}>URL do vídeo (YouTube ou Panda Video)</label>
              <input
                id="inspiracao-video-url"
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className={INPUT_CLS}
                placeholder="https://youtube.com/watch?v=... ou https://player.pandavideo.com.br/..."
              />
            </div>
            <div>
              <label className={LABEL_CLS}>Proporção do vídeo</label>
              <div className="flex gap-2">
                {([['16/9', 'Horizontal (16:9)'], ['9/16', 'Vertical (9:16)'], ['1/1', 'Quadrado (1:1)']] as const).map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setVideoAspect(val)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      videoAspect === val
                        ? 'bg-lumii-coral text-white border-lumii-coral'
                        : 'bg-white text-foreground/70 border-border hover:border-lumii-coral/50'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {ytId && (
              <div className="rounded-xl overflow-hidden border border-border/40 aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title="Pré-visualização do vídeo do YouTube"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {videoUrl && !ytId && videoUrl.includes('pandavideo') && (
              <div
                className="rounded-xl overflow-hidden border border-border/40"
                style={{ aspectRatio: videoAspect, maxHeight: '80vh' }}
              >
                <iframe src={videoUrl} title="Pré-visualização do vídeo do Panda Video" className="w-full h-full" allowFullScreen style={{ border: 'none' }} />
              </div>
            )}
          </div>
        )}

        {/* ── Destaque ─────────────────────────────────────────────────── */}
        {type === 'destaque' && (
          <div className="space-y-4">
            <ImageUploader
              label="Imagem de capa (opcional)"
              value={coverImage}
              onChange={setCoverImage}
            />
            <div>
              <label htmlFor="inspiracao-featured-student" className={LABEL_CLS}>ID da aluna em destaque (UUID do perfil)</label>
              <input
                id="inspiracao-featured-student"
                value={featuredStudentId}
                onChange={e => setFeaturedStudentId(e.target.value)}
                className={INPUT_CLS}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Encontre o UUID da aluna na página de Alunas do admin.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Seção atividade ───────────────────────────────────────────────────── */}
      {type === 'atividade' && (
        <div className="bg-white rounded-xl border border-border/60 p-5 space-y-5">
          <h2 className="text-sm font-semibold">Atividade</h2>

          {/* Imagem da atividade */}
          <div>
            <ImageUploader
              label="Imagem da atividade"
              value={atividadeMedia}
              onChange={setAtividadeMedia}
            />
          </div>

          {/* Materiais */}
          <div>
            <label className={LABEL_CLS}>Materiais</label>
            <div className="space-y-2">
              {materiais.map((mat, i) => (
                <div key={i} className="flex gap-2">
                  <label htmlFor={`material-nome-${i}`} className="sr-only">Nome do material {i + 1}</label>
                  <input
                    id={`material-nome-${i}`}
                    value={mat.item}
                    onChange={e => updateMaterial(i, 'item', e.target.value)}
                    className={`${INPUT_CLS} flex-1`}
                    placeholder="Ex: Cartolina colorida"
                  />
                  <label htmlFor={`material-quantidade-${i}`} className="sr-only">Quantidade do material {i + 1}</label>
                  <input
                    id={`material-quantidade-${i}`}
                    value={mat.quantidade}
                    onChange={e => updateMaterial(i, 'quantidade', e.target.value)}
                    className="w-32 shrink-0 px-3 py-2 text-sm rounded-lg border border-border/60 focus:outline-none focus:ring-2 focus:ring-lumii-coral/30 focus:border-lumii-coral bg-white"
                    placeholder="Ex: 2 folhas"
                  />
                  {materiais.length > 1 && (
                    <button type="button" onClick={() => removeMaterial(i)}
                      aria-label="Remover material"
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addMaterial}
                className="flex items-center gap-1.5 text-xs text-lumii-coral hover:underline">
                <Plus className="w-3.5 h-3.5" />
                Adicionar material
              </button>
            </div>
          </div>

          {/* Passo a passo */}
          <div>
            <label className={LABEL_CLS}>Passo a passo</label>
            <div className="space-y-2">
              {passos.map((passo, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="mt-2.5 text-xs font-bold text-muted-foreground w-5 shrink-0 text-right">
                      {i + 1}.
                    </span>
                    <label htmlFor={`passo-${i}`} className="sr-only">Passo {i + 1}</label>
                    <textarea
                      id={`passo-${i}`}
                      value={passo}
                      onChange={e => updatePasso(i, e.target.value)}
                      rows={2}
                      className={`${INPUT_CLS} resize-none flex-1`}
                      placeholder={`Passo ${i + 1}...`}
                    />
                  </div>
                  {passos.length > 1 && (
                    <button type="button" onClick={() => removePasso(i)}
                      aria-label="Remover passo"
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors shrink-0 mt-1">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addPasso}
                className="flex items-center gap-1.5 text-xs text-lumii-coral hover:underline">
                <Plus className="w-3.5 h-3.5" />
                Adicionar passo
              </button>
            </div>
          </div>

          {/* Objetivos pedagógicos (opcional) */}
          <div>
            <label className={LABEL_CLS}>Objetivos pedagógicos (opcional)</label>
            <div className="space-y-2">
              {objetivos.map((obj, i) => (
                <div key={i} className="flex gap-2">
                  <label htmlFor={`objetivo-${i}`} className="sr-only">Objetivo {i + 1}</label>
                  <input
                    id={`objetivo-${i}`}
                    value={obj}
                    onChange={e => updateObjetivo(i, e.target.value)}
                    className={`${INPUT_CLS} flex-1`}
                    placeholder="Ex: Desenvolver coordenação motora fina"
                  />
                  {objetivos.length > 1 && (
                    <button type="button" onClick={() => removeObjetivo(i)}
                      aria-label="Remover objetivo"
                      className="p-2 text-muted-foreground hover:text-red-500 transition-colors shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addObjetivo}
                className="flex items-center gap-1.5 text-xs text-lumii-coral hover:underline">
                <Plus className="w-3.5 h-3.5" />
                Adicionar objetivo
              </button>
            </div>
          </div>

          {/* Metadados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inspiracao-faixa-etaria" className={LABEL_CLS}>Faixa etária</label>
              <select id="inspiracao-faixa-etaria" value={faixaEtaria} onChange={e => setFaixaEtaria(e.target.value)} className={INPUT_CLS}>
                <option value="">Selecionar...</option>
                {FAIXA_ETARIA_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="inspiracao-duracao" className={LABEL_CLS}>Duração</label>
              <input id="inspiracao-duracao" value={duracao} onChange={e => setDuracao(e.target.value)}
                className={INPUT_CLS} placeholder="Ex: 30 min" />
            </div>
          </div>

          {/* Dicas */}
          <div>
            <label htmlFor="inspiracao-dicas" className={LABEL_CLS}>Dica da atividade</label>
            <textarea
              id="inspiracao-dicas"
              value={dicas}
              onChange={e => setDicas(e.target.value)}
              rows={3}
              className={`${INPUT_CLS} resize-none`}
              placeholder="Dica importante para o sucesso da atividade..."
            />
          </div>
        </div>
      )}

      {/* ── Seção dica (bloco HTML) ──────────────────────────────────────────── */}
      {type === 'dica' && (
        <div className="bg-white rounded-xl border border-border/60 p-5 space-y-4">
          <h2 className="text-sm font-semibold">Conteúdo Rico</h2>
          <ImageUploader
            label="Imagem de capa (opcional)"
            value={coverImage}
            onChange={setCoverImage}
          />
          <div>
            <label htmlFor="inspiracao-html" className={LABEL_CLS}>Conteúdo HTML</label>
            <textarea
              id="inspiracao-html"
              value={htmlBlock}
              onChange={e => setHtmlBlock(e.target.value)}
              rows={12}
              className={`${INPUT_CLS} resize-y font-mono text-xs`}
              placeholder={'<h2>Título da dica</h2>\n<p>Explicação...</p>\n<ul>\n  <li>Item 1</li>\n</ul>'}
              spellCheck={false}
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Digite HTML diretamente. Tags suportadas: h1–h4, p, ul, ol, li, strong, em, a, img, blockquote, table, div, span.
            </p>
          </div>
          {htmlBlock.trim() && htmlBlock.trim() !== '<p></p>' && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Preview</p>
              <div
                className="prose prose-sm max-w-none border border-border/40 rounded-lg p-4 bg-muted/20 text-foreground/80"
                dangerouslySetInnerHTML={{ __html: htmlBlock }}
              />
            </div>
          )}
        </div>
      )}

      {/* Tags de categoria */}
      {categories.length > 0 && (
        <div className="bg-white rounded-xl border border-border/60 p-5 space-y-3">
          <h2 className="text-sm font-semibold">Categorias</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map(({ slug, name }) => (
              <button
                key={slug}
                type="button"
                onClick={() => toggleTag(slug)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  tags.has(slug)
                    ? 'bg-lumii-coral text-white border-lumii-coral'
                    : 'bg-white text-muted-foreground border-border/60 hover:border-lumii-coral/60'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Cursos relacionados */}
      {courses.length > 0 && (
        <div className="bg-white rounded-xl border border-border/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Cursos relacionados (opcional)</h2>
            {courseIds.size > 0 && (
              <span className="text-xs text-lumii-coral font-medium">{courseIds.size} selecionado{courseIds.size > 1 ? 's' : ''}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {courses.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCourse(c.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  courseIds.has(c.id)
                    ? 'bg-lumii-yellow text-[#6b4f00] border-lumii-yellow'
                    : 'bg-white text-muted-foreground border-border/60 hover:border-lumii-yellow/60'
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opções de publicação */}
      <div className="bg-white rounded-xl border border-border/60 p-5 space-y-3">
        <h2 className="text-sm font-semibold">Opções</h2>
        <Toggle label="Publicado" value={published} onChange={setPublished} />
        <Toggle label="Fixado no topo do feed" value={pinned} onChange={setPinned} />
        {isEdit && <Toggle label="Arquivado" value={archived} onChange={setArchived} />}
      </div>

      {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-3">
        <Link href="/admin/inspiracoes"
          className="flex-1 text-center py-2.5 text-sm font-medium border border-border/60 rounded-lg hover:bg-muted transition-colors">
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2.5 text-sm font-medium bg-lumii-coral text-white rounded-lg hover:bg-lumii-coral-hover disabled:opacity-50 transition-colors"
        >
          {loading ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar post'}
        </button>
      </div>
    </form>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <div
        onClick={() => onChange(!value)}
        className={`w-10 h-6 rounded-full transition-colors relative ${value ? 'bg-lumii-coral' : 'bg-muted-foreground/30'}`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-[left] ${value ? 'left-5' : 'left-1'}`} />
      </div>
      <span className="text-xs font-medium">{label}</span>
    </label>
  )
}
