import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Split } from '../../split/entities/split.entity';

export enum DisputeType {
  INCORRECT_AMOUNT = 'incorrect_amount',
  MISSING_PAYMENT = 'missing_payment',
  WRONG_ITEMS = 'wrong_items',
  OTHER = 'other',
}

export enum DisputeStatus {
  OPEN = 'open',
  UNDER_REVIEW = 'under_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
  APPEALED = 'appealed',
}

export interface DisputeEvidence {
  images?: string[]; // URLs to uploaded images
  receipts?: string[]; // URLs to receipt images
  description?: string;
  metadata?: Record<string, any>;
}

export interface DisputeResolution {
  decision: string;
  reasoning: string;
  adjustments?: {
    participantId: string;
    originalAmount: number;
    newAmount: number;
  }[];
  compensations?: {
    participantId: string;
    amount: number;
    reason: string;
  }[];
}

@Entity('disputes')
@Index(['splitId', 'status'])
@Index(['raisedBy', 'status'])
@Index(['createdAt'])
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  splitId: string;

  @ManyToOne(() => Split, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'splitId' })
  split: Split;

  @Column({ type: 'varchar', length: 256 })
  @Index()
  raisedBy: string; // Stellar wallet address

  @Column({
    type: 'enum',
    enum: DisputeType,
  })
  disputeType: DisputeType;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  @Index()
  status: DisputeStatus;

  @Column({ type: 'jsonb', nullable: true })
  evidence: DisputeEvidence;

  @Column({ type: 'jsonb', nullable: true })
  resolution: DisputeResolution;

  @Column({ type: 'varchar', length: 256, nullable: true })
  resolvedBy: string; // Admin wallet address or system identifier

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  // Appeal tracking
  @Column({ type: 'uuid', nullable: true })
  appealedFromDisputeId: string; // If this is an appeal, reference to original dispute

  @Column({ type: 'text', nullable: true })
  appealReason: string;

  @Column({ type: 'int', default: 0 })
  appealCount: number; // Track number of times this dispute has been appealed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}