export default function PlanoApoioHubLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-pulse">
      {/* Título */}
      <div className="mb-8 space-y-2">
        <div className="h-7 w-64 bg-gray-200 rounded" />
        <div className="h-4 w-80 bg-gray-200 rounded" />
      </div>

      {/* Lista de alunos/turmas */}
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, section) => (
          <div key={section} className="space-y-3">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-40 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
