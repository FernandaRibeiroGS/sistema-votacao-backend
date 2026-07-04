import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Votação — Festa do Peão',
  description: 'Vote na sua candidata favorita para Rainha da Festa do Peão.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-stone-900 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
