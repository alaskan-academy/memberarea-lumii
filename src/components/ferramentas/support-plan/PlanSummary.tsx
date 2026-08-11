import { Target, PlayCircle, Repeat, Eye, MessageCircle } from "lucide-react";
import type { PlanoGerado } from "@/lib/ferramentas/support-plan/types";

export default function PlanSummary({ plano }: { plano: PlanoGerado }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#71c69a] mb-1">
          <Target className="w-3.5 h-3.5" />
          Objetivo das próximas 2 semanas
        </p>
        <p className="text-sm leading-relaxed">{plano.objetivo}</p>
      </div>
      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#f6614f] mb-1">
          <PlayCircle className="w-3.5 h-3.5" />
          Antes da atividade
        </p>
        <p className="text-sm leading-relaxed">{plano.antes_da_atividade}</p>
      </div>
      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#f6614f] mb-1">
          <PlayCircle className="w-3.5 h-3.5" />
          Durante
        </p>
        <p className="text-sm leading-relaxed">{plano.durante}</p>
      </div>
      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#eebc3e] mb-1">
          <Repeat className="w-3.5 h-3.5" />
          Se houver recusa
        </p>
        <p className="text-sm leading-relaxed">{plano.se_houver_recusa}</p>
      </div>
      <div>
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#6699F3] mb-1">
          <Eye className="w-3.5 h-3.5" />
          O que observar
        </p>
        <p className="text-sm leading-relaxed">{plano.o_que_observar}</p>
      </div>
      {plano.sugestao_coordenacao && (
        <div className="rounded-xl bg-[#6699F3]/5 border border-[#6699F3]/20 p-3">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#6699F3] mb-1">
            <MessageCircle className="w-3.5 h-3.5" />
            Vale conversar com a coordenação
          </p>
          <p className="text-sm leading-relaxed">{plano.sugestao_coordenacao}</p>
        </div>
      )}
    </div>
  );
}
