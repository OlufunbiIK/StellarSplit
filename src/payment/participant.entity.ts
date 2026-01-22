import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Payment } from '../../payments/entities/payment.entity';

@Entity('participants')
export class Participant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ length: 56 })
  stellarAddress: string;

  // Relationship to payments
  @OneToMany(() => Payment, (payment) => payment.participant)
  payments: Payment[];
}