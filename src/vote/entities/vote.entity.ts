import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Contest } from '../../contest/entities/contest.entity';
import { Candidate } from '../../candidate/entities/candidate.entity';

@Entity('votes')
@Unique(['contest_id', 'cpf_hash'])
export class Vote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contest_id: number;

  @ManyToOne(() => Contest, (contest) => contest.votes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'contest_id' })
  contest: Contest;

  @Index()
  @Column({ type: 'varchar', length: 64 })
  cpf_hash: string;

  @Column()
  candidate_adult_id: number;

  @ManyToOne(() => Candidate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidate_adult_id' })
  candidate_adult: Candidate;

  @Column()
  candidate_child_id: number;

  @ManyToOne(() => Candidate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'candidate_child_id' })
  candidate_child: Candidate;

  @Column({ length: 45, nullable: true })
  ip: string;

  @Column({ length: 255, nullable: true })
  user_agent: string;

  @CreateDateColumn({ type: 'timestamptz' })
  voted_at: Date;
}
