export interface AdminUser {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'operator' | 'reader';
  ativo: boolean;
}

export interface Contest {
  id: number;
  nome: string;
  descricao: string;
  cidade: string;
  ano: number;
  imagem_capa: string | null;
  inicio: string;
  encerramento: string;
  status: 'draft' | 'open' | 'closed' | 'finished';
}

export interface Category {
  id: number;
  contest_id: number;
  nome: string;
  tipo: 'infantil' | 'adulta';
  ativo: boolean;
  candidates?: AdminCandidate[];
}

export interface AdminCandidate {
  id: number;
  category_id: number;
  nome: string;
  foto: string | null;
  descricao: string | null;
  numero: number | null;
  ativo: boolean;
  category?: Category;
}

export interface Dashboard {
  concursoAtivo: {
    id: number;
    nome: string;
    status: string;
    inicio: string;
    encerramento: string;
    tempoRestante: string;
  } | null;
  totalConcursos: number;
  totalVotos: number;
  horarioAtual: string;
}
