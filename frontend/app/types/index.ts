export interface Candidate {
  id: number;
  nome: string;
  foto: string | null;
  descricao: string | null;
  numero: number | null;
}

export interface VoteOptions {
  contestId: number;
  contestNome: string;
  encerramento: string;
  categorias: {
    infantil: Candidate[];
    adulta: Candidate[];
  };
}

export interface RankedCandidate extends Candidate {
  votos: number;
  percentual: number;
  colocacao: number;
}

export interface LiveResults {
  contestId: number;
  contestNome: string;
  status: string;
  encerramento: string;
  totalVotos: number;
  atualizadoEm: string;
  categorias: {
    infantil: RankedCandidate[];
    adulta: RankedCandidate[];
  };
}

export type VoteStep = 'cpf' | 'voting' | 'confirm' | 'success';
