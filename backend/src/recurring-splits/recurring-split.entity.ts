import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Split } from '../entities/split.entity';

export enum RecurrenceFrequency {
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
}

@Entity('recurring_splits')
export class RecurringSplit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  creatorId!: string; // Wallet address

  @Column({ type: 'uuid' })
  templateSplitId!: string; // Foreign key to Split (template)

  @Column({
    type: 'enum',
    enum: RecurrenceFrequency,
    default: RecurrenceFrequency.MONTHLY,
  })
  frequency!: RecurrenceFrequency;

  @Column({ type: 'timestamp' })
  nextOccurrence!: Date; // When the next split should be generated

  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date; // Optional end date for the recurring split

  @Column({ type: 'boolean', default: true })
  isActive!: boolean; // Can be paused/resumed

  @Column({ type: 'boolean', default: true })
  autoRemind!: boolean; // Send reminders before due date

  @Column({ type: 'int', default: 1 })
  reminderDaysBefore!: number; // Days before due date to send reminder

  @Column({ type: 'varchar', nullable: true })
  description?: string; // Description for the recurring split

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => Split, { eager: true })
  @JoinColumn({ name: 'templateSplitId' })
  templateSplit?: Split;

  @OneToMany(() => Split, (split) => split.id)
  generatedSplits?: Split[];
}
