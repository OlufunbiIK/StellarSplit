import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
  JoinColumn,
} from 'typeorm';
import { Split } from '../../splits/entities/split.entity';
import { Participant } from '../../participants/entities/participant.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export enum StellarAsset {
  XLM = 'XLM',
  USDC = 'USDC',
}

@Entity('payments')
@Index(['splitId'])
@Index(['participantId'])
@Index(['stellarTxHash'], { unique: true })
@Index(['status'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  splitId: string;

  @Column({ type: 'uuid' })
  participantId: string;

  @Column({ type: 'varchar', length: 56 })
  fromAddress: string;

  @Column({ type: 'varchar', length: 56 })
  toAddress: string;

  @Column({ type: 'decimal', precision: 20, scale: 7 })
  amount: number;

  @Column({
    type: 'enum',
    enum: StellarAsset,
    default: StellarAsset.XLM,
  })
  asset: StellarAsset;

  @Column({ type: 'varchar', length: 64, unique: true })
  stellarTxHash: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 28, nullable: true })
  memo?: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  confirmedAt?: Date;

  // Relationships
  @ManyToOne(() => Split, (split) => split.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'splitId' })
  split: Split;

  @ManyToOne(() => Participant, (participant) => participant.payments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'participantId' })
  participant: Participant;
}