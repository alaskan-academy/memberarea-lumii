'use client'

import { useState, useEffect, useTransition } from 'react'
import { Send, MessageCircle, Loader2 } from 'lucide-react'
import { getComments, submitComment } from '@/lib/inspiracoes/actions'
import type { InspiracaoComment } from '@/lib/inspiracoes/types'

interface Props {
  postId: string
  userId: string
}

export function ComentariosPanel({ postId, userId }: Props) {
  const [comments, setComments] = useState<InspiracaoComment[]>([])
  const [isLoading, startLoad] = useTransition()
  const [body, setBody] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, startSubmit] = useTransition()

  // Só um formulário de resposta fica aberto por vez.
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyBody, setReplyBody] = useState('')
  const [replySentFor, setReplySentFor] = useState<string | null>(null)
  const [replyError, setReplyError] = useState<string | null>(null)
  const [isReplySubmitting, startReplySubmit] = useTransition()

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)

  useEffect(() => {
    startLoad(async () => {
      const c = await getComments(postId)
      setComments(c)
    })
  }, [postId])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    setError(null)

    startSubmit(async () => {
      const result = await submitComment(userId, postId, trimmed)
      if (result.error) {
        setError(result.error)
      } else {
        setBody('')
        setSent(true)
        const c = await getComments(postId)
        setComments(c)
      }
    })
  }

  function openReply(commentId: string) {
    setReplyingTo(replyingTo === commentId ? null : commentId)
    setReplyBody('')
    setReplyError(null)
  }

  function handleReplySubmit(e: React.FormEvent, parentId: string) {
    e.preventDefault()
    const trimmed = replyBody.trim()
    if (!trimmed) return
    setReplyError(null)

    startReplySubmit(async () => {
      const result = await submitComment(userId, postId, trimmed, parentId)
      if (result.error) {
        setReplyError(result.error)
      } else {
        setReplyBody('')
        setReplySentFor(parentId)
        const c = await getComments(postId)
        setComments(c)
        setTimeout(() => {
          setReplySentFor(null)
          setReplyingTo(null)
        }, 2500)
      }
    })
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-[#f6614f]" />
        Comentários
        {!isLoading && totalCount > 0 && (
          <span className="text-xs font-normal text-muted-foreground">({totalCount})</span>
        )}
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-4 h-4 text-[#f6614f] animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground mb-4">Seja a primeira a comentar!</p>
      ) : (
        <div className="space-y-4 mb-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#f6614f]/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-[#f6614f] uppercase">
                {(c.profiles?.full_name ?? 'A').charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold leading-none mb-1">{c.profiles?.full_name ?? 'Aluna'}</p>
                <p className="text-xs text-foreground/75 leading-relaxed">{c.body}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(c.created_at).toLocaleDateString('pt-BR', { timeZone: "America/Sao_Paulo" })}
                  </p>
                  <button
                    type="button"
                    onClick={() => openReply(c.id)}
                    className="text-[10px] font-semibold text-[#f6614f] hover:underline"
                  >
                    Responder
                  </button>
                </div>

                {replyingTo === c.id && (
                  <div className="mt-2">
                    {replySentFor === c.id ? (
                      <div className="rounded-lg bg-[#f6614f]/8 border border-[#f6614f]/20 px-3 py-2">
                        <p className="text-[11px] text-[#f6614f] font-medium">
                          Resposta enviada! Aguarda aprovação.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={(e) => handleReplySubmit(e, c.id)} className="flex gap-2">
                        <input
                          autoFocus
                          value={replyBody}
                          onChange={e => setReplyBody(e.target.value)}
                          placeholder={`Responder a ${c.profiles?.full_name ?? 'Aluna'}...`}
                          maxLength={2000}
                          className="flex-1 text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#f6614f]/40 transition-shadow min-h-[38px]"
                        />
                        <button
                          type="submit"
                          disabled={!replyBody.trim() || isReplySubmitting}
                          aria-label="Enviar resposta"
                          className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-[#f6614f] text-white disabled:opacity-40 hover:bg-[#5588e8] transition-colors"
                        >
                          {isReplySubmitting
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Send className="w-3 h-3" />
                          }
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyingTo(null)}
                          className="shrink-0 px-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          Cancelar
                        </button>
                      </form>
                    )}
                    {replyError && <p className="text-[10px] text-red-500 mt-1">{replyError}</p>}
                  </div>
                )}

                {c.replies && c.replies.length > 0 && (
                  <div className="mt-2.5 pl-3 border-l-2 border-[#f6614f]/15 space-y-2.5">
                    {c.replies.map(r => (
                      <div key={r.id} className="flex gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#f6614f]/10 flex items-center justify-center shrink-0 text-[9px] font-bold text-[#f6614f] uppercase">
                          {(r.profiles?.full_name ?? 'A').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold leading-none mb-1">{r.profiles?.full_name ?? 'Aluna'}</p>
                          <p className="text-[11px] text-foreground/75 leading-relaxed">{r.body}</p>
                          <p className="text-[9px] text-muted-foreground mt-1">
                            {new Date(r.created_at).toLocaleDateString('pt-BR', { timeZone: "America/Sao_Paulo" })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {sent && (
        <div className="rounded-xl bg-[#f6614f]/8 border border-[#f6614f]/20 px-3 py-2.5 mb-3">
          <p className="text-xs text-[#f6614f] font-medium">
            Comentário enviado! Aguarda aprovação da equipe.
          </p>
        </div>
      )}

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={body}
          onChange={e => { setBody(e.target.value); setSent(false) }}
          placeholder="Escreva um comentário..."
          maxLength={2000}
          className="flex-1 text-xs px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#f6614f]/40 transition-shadow min-h-[44px]"
        />
        <button
          type="submit"
          disabled={!body.trim() || isSubmitting}
          aria-label="Enviar comentário"
          className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg bg-[#f6614f] text-white disabled:opacity-40 hover:bg-[#5588e8] transition-colors"
        >
          {isSubmitting
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Send className="w-3.5 h-3.5" />
          }
        </button>
      </form>
    </div>
  )
}
