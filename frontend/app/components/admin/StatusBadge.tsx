const statusConfig = {
  draft:    { label: 'Rascunho',  className: 'bg-stone-700 text-stone-300' },
  open:     { label: 'Aberto',    className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  closed:   { label: 'Encerrado', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
  finished: { label: 'Finalizado',className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status as keyof typeof statusConfig] ?? statusConfig.draft;
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
