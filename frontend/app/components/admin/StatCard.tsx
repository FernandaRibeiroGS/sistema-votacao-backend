interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: 'amber' | 'green' | 'blue' | 'red';
}

export function StatCard({ label, value, icon, color = 'amber' }: StatCardProps) {
  const colors = {
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
  };

  return (
    <div className={`rounded-2xl border p-5 ${colors[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm mt-1 opacity-80">{label}</p>
    </div>
  );
}
