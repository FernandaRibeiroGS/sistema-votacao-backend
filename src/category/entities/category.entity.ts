import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Contest } from '../../contest/entities/contest.entity';
import { Candidate } from '../../candidate/entities/candidate.entity';

export enum CategoryType {
  INFANTIL = 'infantil',
  ADULTA = 'adulta',
}

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contest_id: number;

  @ManyToOne(() => Contest, (contest) => contest.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'contest_id' })
  contest: Contest;

  @Column({ length: 100 })
  nome: string;

  @Column({ type: 'enum', enum: CategoryType })
  tipo: CategoryType;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Candidate, (candidate) => candidate.category)
  candidates: Candidate[];
}
