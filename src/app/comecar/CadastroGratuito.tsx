"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { cadastroAction } from "../(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/common/PasswordInput";
import { Label } from "@/components/ui/label";

/**
 * Cadastro da landing pública de ferramentas grátis (/comecar). Quatro campos e
 * pronto: nome, WhatsApp, e-mail e senha. Sem CPF — ele é pedido quando a pessoa
 * compra um curso, que é quando serve para alguma coisa (certificado).
 *
 * Reaproveita a mesma cadastroAction do cadastro comum; o hidden `origem=comecar`
 * faz a action usar o schema sem CPF e redirecionar para /ferramentas no fim.
 */

const initialState = { error: undefined, success: undefined, fieldErrors: undefined };

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  // Vermelho escuro (não o token --destructive, que é rosa p/ o navy dos outros
  // forms): aqui o form fica sobre o .lumii-card BRANCO, então precisa de um
  // vermelho que passe no contraste AA sobre branco.
  return <p role="alert" className="text-xs text-red-700 mt-1">{msg}</p>;
}

function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function CadastroGratuito() {
  const [state, formAction, isPending] = useActionState(cadastroAction, initialState);
  const [telefone, setTelefone] = useState("");
  const fe = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4 text-left">
      <input type="hidden" name="origem" value="comecar" />

      {state?.error && (
        <div
          role="alert"
          className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="full_name">Seu nome</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          placeholder="Como você quer ser chamado(a)"
          autoComplete="name"
          required
          disabled={isPending}
          aria-invalid={!!fe.full_name}
        />
        <FieldError msg={fe.full_name} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">WhatsApp</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
          placeholder="(11) 99999-9999"
          inputMode="tel"
          autoComplete="tel"
          required
          disabled={isPending}
          aria-invalid={!!fe.phone}
        />
        <FieldError msg={fe.phone} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Seu e-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="voce@email.com"
          autoComplete="email"
          required
          disabled={isPending}
          aria-invalid={!!fe.email}
        />
        <FieldError msg={fe.email} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Crie uma senha</Label>
          <PasswordInput
            id="password"
            name="password"
            placeholder="Ao menos 6 caracteres"
            autoComplete="new-password"
            required
            disabled={isPending}
            aria-invalid={!!fe.password}
          />
          <FieldError msg={fe.password} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm_password">Repita a senha</Label>
          <PasswordInput
            id="confirm_password"
            name="confirm_password"
            placeholder="A mesma de novo"
            autoComplete="new-password"
            required
            disabled={isPending}
            aria-invalid={!!fe.confirm_password}
          />
          <FieldError msg={fe.confirm_password} />
        </div>
      </div>

      <Button type="submit" className="w-full min-h-[52px] text-base" disabled={isPending}>
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Criar minha conta grátis <ArrowRight className="w-5 h-5" />
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        É grátis e leva um minuto. Não pedimos cartão nem CPF.
        <br />
        Já tem conta?{" "}
        <Link href="/login" className="text-lumii-coral font-semibold underline-offset-4 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
