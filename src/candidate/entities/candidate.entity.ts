import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { ResultsSummary } from '../../vote/entities/results-summary.entity';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  category_id: number;

  @ManyToOne(() => Category, (category) => category.candidates, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ length: 150 })
  nome: string;

  @Column({ length: 255, nullable: true })
  foto: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ nullable: true })
  numero: number;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToOne(() => ResultsSummary, (summary) => summary.candidate)
  results_summary: ResultsSummary;
}
