'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Search, SlidersHorizontal, Loader2, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getInspiracoesFeed } from '@/lib/inspiracoes/actions'
import type { InspiracaoPost, InspiracaoType, InspiracaoCursor } from '@/lib/inspiracoes/types'
import { InspiracaoFeedItem } from './InspiracaoFeedItem'

const TIPOS: { value: InspiracaoType | ''; label: string }[] = [
  { value: '',          label: 'Todos' },
  { value: 'foto',      label: 'Fotos' },
  { value: 'carrossel', label: 'Carrossel' },
  { value: 'video',     label: 'Vídeos' },
  { value: 'atividade', label: 'Atividades' },
  { value: 'dica',      label: 'Dicas' },
  { value: 'destaque',  label: 'Destaques' },
]

interface Props {
  userId: string
  initialPosts: InspiracaoPost[]
  initialCursor: InspiracaoCursor | null
  initialHasMore: boolean
  courses?: { id: string; title: string }[]
  categories?: { id: string; name: string; slug: string }[]
}

export function InspiracaoFeed({ userId, initialPosts, initialCursor, initialHasMore, courses = [], categories = [] }: Props) {
  const [tipo, setTipo] = useState<InspiracaoType | ''>('')
  const [nicho, setNicho] = useState('')
  const [courseId, setCourseId] = useState('')
  const [busca, setBusca] = useState('')
  const [debouncedBusca, setDebouncedBusca] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [posts, setPosts] = useState(initialPosts)
  const [cursor, setCursor] = useState(initialCursor)
  const [hasMore, setHasMore] = useState(initialHasMore)

  const activeFilterCount = (tipo !== '' ? 1 : 0) + (nicho !== '' ? 1 : 0) + (courseId !== '' ? 1 : 0)

  const [isFetching, startFetch] = useTransition()
  const [isLoadingMore, startLoadMore] = useTransition()

  const isFirst = useRef(true)

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedBusca(busca), 450)
    return () => clearTimeout(t)
  }, [busca])

  // Re-fetch when filters change (skip initial mount)
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }

    startFetch(async () => {
      const page = await getInspiracoesFeed(userId, {
        tipo: tipo || undefined,
        nicho: nicho || undefined,
        curso_id: courseId || undefined,
        busca: debouncedBusca || undefined,
      })
      setPosts(page.posts)
      setCursor(page.next_cursor)
      setHasMore(page.has_more)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, nicho, courseId, debouncedBusca])

  function loadMore() {
    if (!hasMore || !cursor) return
    startLoadMore(async () => {
      const page = await getInspiracoesFeed(
        userId,
        { tipo: tipo || undefined, nicho: nicho || undefined, curso_id: courseId || undefined, busca: debouncedBusca || undefined },
        cursor
      )
      setPosts(prev => [...prev, ...page.posts])
      setCursor(page.next_cursor)
      setHasMore(page.has_more)
    })
  }

  return (
    <>
      {/* Filtros */}
      <div className="mb-5 space-y-2">
        {/* Linha: busca + botão filtros */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <label htmlFor="inspiracoes-busca" className="sr-only">Buscar inspirações</label>
            <input
              id="inspiracoes-busca"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar inspirações..."
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-border bg-white focus:outline-none focus:ring-2 focus:ring-lumii-coral/40 transition-shadow"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(v => !v)}
            aria-label="Filtros"
            aria-expanded={filtersOpen}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors',
              filtersOpen || activeFilterCount > 0
                ? 'border-lumii-coral text-lumii-coral bg-lumii-coral/5'
                : 'border-border text-foreground/60 hover:border-lumii-coral/50 hover:text-lumii-coral'
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-lumii-coral text-white text-[10px] font-bold flex items-center justify-center leading-none">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', filtersOpen && 'rotate-180')} />
          </button>
        </div>

        {/* Painel retrátil */}
        {filtersOpen && (
          <div className="bg-white rounded-xl border border-border/70 p-4 space-y-4">
            {/* Tipo */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tipo</p>
              <div className="flex flex-wrap gap-1.5">
                {TIPOS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => setTipo(t.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      tipo === t.value
                        ? 'bg-lumii-coral text-white shadow-sm'
                        : 'bg-muted/60 text-foreground/70 hover:bg-lumii-coral/10 hover:text-lumii-coral'
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Categoria */}
            {categories.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Categorias</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setNicho('')}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      nicho === ''
                        ? 'bg-lumii-green text-white shadow-sm'
                        : 'bg-muted/60 text-foreground/70 hover:bg-lumii-green/15 hover:text-[#2a9d5a]'
                    )}
                  >
                    Todos
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.slug}
                      onClick={() => setNicho(c.slug)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                        nicho === c.slug
                          ? 'bg-lumii-green text-white shadow-sm'
                          : 'bg-muted/60 text-foreground/70 hover:bg-lumii-green/15 hover:text-[#2a9d5a]'
                      )}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Curso */}
            {courses.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Curso</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setCourseId('')}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                      courseId === ''
                        ? 'bg-lumii-yellow text-[#6b4f00] shadow-sm'
                        : 'bg-muted/60 text-foreground/70 hover:bg-lumii-yellow/20 hover:text-[#6b4f00]'
                    )}
                  >
                    Todos
                  </button>
                  {courses.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCourseId(c.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                        courseId === c.id
                          ? 'bg-lumii-yellow text-[#6b4f00] shadow-sm'
                          : 'bg-muted/60 text-foreground/70 hover:bg-lumii-yellow/20 hover:text-[#6b4f00]'
                      )}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Limpar */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => { setTipo(''); setNicho(''); setCourseId('') }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
                Limpar filtros
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid */}
      {isFetching ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-lumii-coral animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <SlidersHorizontal className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-medium text-sm">Nenhuma inspiração encontrada</p>
          <p className="text-xs mt-1">Tente outros filtros</p>
        </div>
      ) : (
        <>
          <div className="max-w-2xl mx-auto space-y-5">
            {posts.map(post => (
              <InspiracaoFeedItem
                key={post.id}
                post={post}
                userId={userId}
              />
            ))}
          </div>

          {hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-lumii-coral border border-lumii-coral/40 rounded-xl hover:bg-lumii-coral/5 transition-colors disabled:opacity-50"
              >
                {isLoadingMore ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Carregando...</>
                ) : (
                  'Carregar mais'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}
