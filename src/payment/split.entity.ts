import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Payment } from '../../payments/entities/payment.entity';

@Entity('splits')
export class Split {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 20, scale: 7 })
  totalAmount: number;

  @Column()
  description: string;

  // Relationship to payments
  @OneToMany(() => Payment, (payment) => payment.split)
  payments: Payment[];
}