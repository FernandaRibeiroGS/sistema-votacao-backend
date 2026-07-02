import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum AdminRole {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  READER = 'reader',
}

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 150 })
  nome: string;

  @Column({ unique: true, length: 200 })
  email: string;

  @Column({ length: 255 })
  senha_hash: string;

  @Column({ type: 'enum', enum: AdminRole, default: AdminRole.READER })
  role: AdminRole;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
