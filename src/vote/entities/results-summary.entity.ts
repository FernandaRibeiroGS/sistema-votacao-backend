import {
  Entity,
  PrimaryColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Candidate } from '../../candidate/entities/candidate.entity';

@Entity('results_summary')
export class ResultsSummary {
  @PrimaryColumn()
  candidate_id: number;

  @OneToOne(() => Candidate, (candidate) => candidate.results_summary, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @Column({ type: 'bigint', default: 0 })
  total_votes: number;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
