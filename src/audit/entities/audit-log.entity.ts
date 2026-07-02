import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Admin } from '../../admin/entities/admin.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  admin_id: number;

  @ManyToOne(() => Admin, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;

  @Column({ length: 100 })
  acao: string;

  @Column({ type: 'jsonb', nullable: true })
  detalhes: Record<string, any>;

  @Column({ length: 45, nullable: true })
  ip: string;

  @CreateDateColumn({ type: 'timestamptz' })
  data_hora: Date;
}
