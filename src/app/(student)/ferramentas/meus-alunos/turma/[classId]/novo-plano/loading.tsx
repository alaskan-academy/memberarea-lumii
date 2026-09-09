export default function NovoPlanoTurmaLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
      {/* Cabeçalho */}
      <div className="mb-8 space-y-2">
        <div className="h-6 w-56 bg-gray-200 rounded" />
        <div className="h-4 w-72 bg-gray-200 rounded" />
      </div>

      {/* Formulário */}
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-24 w-full bg-gray-200 rounded-lg" />
          </div>
        ))}
        <div className="h-11 w-full bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
