import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Category } from '../../category/entities/category.entity';
import { Vote } from '../../vote/entities/vote.entity';

export enum ContestStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  CLOSED = 'closed',
  FINISHED = 'finished',
}

@Entity('contests')
export class Contest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nome: string;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ length: 100 })
  cidade: string;

  @Column()
  ano: number;

  @Column({ length: 255, nullable: true })
  imagem_capa: string;

  @Column({ type: 'timestamptz' })
  inicio: Date;

  @Column({ type: 'timestamptz' })
  encerramento: Date;

  @Column({ type: 'enum', enum: ContestStatus, default: ContestStatus.DRAFT })
  status: ContestStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => Category, (category) => category.contest)
  categories: Category[];

  @OneToMany(() => Vote, (vote) => vote.contest)
  votes: Vote[];
}
