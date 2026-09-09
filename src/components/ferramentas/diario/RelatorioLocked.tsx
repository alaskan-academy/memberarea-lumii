import { Lock, BookOpen, ClipboardList, ClipboardCheck } from "lucide-react";

/**
 * Teaser do relatório para quem ainda não tem o Lumii Completo. Mostra o valor
 * (o que ele consolida) sem expor dado nenhum. A venda da assinatura ainda não
 * existe, então não há CTA de checkout — só o convite.
 */
export default function RelatorioLocked({ studentName }: { studentName: string }) {
  return (
    <div className="lumii-card p-6 text-center">
      <div className="brand-stripe -mx-6 -mt-6 mb-5"><span /><span /><span /></div>
      <div className="w-12 h-12 rounded-full bg-lumii-coral/12 flex items-center justify-center mx-auto mb-3">
        <Lock className="w-5 h-5 text-lumii-coral" />
      </div>
      <p className="font-bold text-foreground">Relatório de acompanhamento</p>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-sm mx-auto">
        Junte tudo sobre {studentName.split(" ")[0]} — diário, planos de apoio e avaliações — num relatório
        pronto para o conselho de classe e a reunião de pais.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> Diário</span>
        <span className="inline-flex items-center gap-1"><ClipboardList className="w-3.5 h-3.5" /> Planos</span>
        <span className="inline-flex items-center gap-1"><ClipboardCheck className="w-3.5 h-3.5" /> Avaliações</span>
      </div>

      <p className="inline-flex items-center gap-1.5 mt-5 px-3 py-1.5 rounded-full bg-lumii-yellow/15 text-[#8a6410] text-xs font-bold">
        Disponível no Lumii Completo
      </p>
    </div>
  );
}
