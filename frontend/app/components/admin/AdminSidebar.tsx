'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Trophy, Users, Tag, LogOut, ChevronRight, BarChart2 } from 'lucide-react';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/results', label: 'Apuração Ao Vivo', icon: BarChart2 },
  { href: '/admin/contests', label: 'Concursos', icon: Trophy },
  { href: '/admin/categories', label: 'Categorias', icon: Tag },
  { href: '/admin/candidates', label: 'Candidatas', icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  }

  return (
    <aside className="w-64 bg-stone-900 border-r border-stone-800 flex flex-col min-h-screen">
      <div className="p-6 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🤠</span>
          <div>
            <p className="text-white font-bold text-sm">Festa do Peão</p>
            <p className="text-stone-500 text-xs">Painel Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800'
                }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-stone-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-stone-400 hover:text-red-400 hover:bg-red-400/10 transition-all w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
