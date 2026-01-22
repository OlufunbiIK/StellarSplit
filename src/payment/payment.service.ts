import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  /**
   * Create a new payment record
   */
  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // Check if transaction hash already exists
    const existingPayment = await this.paymentRepository.findOne({
      where: { stellarTxHash: createPaymentDto.stellarTxHash },
    });

    if (existingPayment) {
      throw new ConflictException(
        `Payment with transaction hash ${createPaymentDto.stellarTxHash} already exists`,
      );
    }

    const payment = this.paymentRepository.create(createPaymentDto);
    return await this.paymentRepository.save(payment);
  }

  /**
   * Find all payments with optional filters
   */
  async findAll(queryDto?: QueryPaymentsDto): Promise<Payment[]> {
    const where: FindOptionsWhere<Payment> = {};

    if (queryDto?.splitId) {
      where.splitId = queryDto.splitId;
    }
    if (queryDto?.participantId) {
      where.participantId = queryDto.participantId;
    }
    if (queryDto?.status) {
      where.status = queryDto.status;
    }
    if (queryDto?.asset) {
      where.asset = queryDto.asset;
    }
    if (queryDto?.stellarTxHash) {
      where.stellarTxHash = queryDto.stellarTxHash;
    }

    return await this.paymentRepository.find({
      where,
      relations: ['split', 'participant'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find payments by split ID
   */
  async findBySplit(splitId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { splitId },
      relations: ['participant'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find payments by participant ID
   */
  async findByParticipant(participantId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { participantId },
      relations: ['split'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find a single payment by ID
   */
  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['split', 'participant'],
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  /**
   * Find payment by Stellar transaction hash
   */
  async findByTxHash(stellarTxHash: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { stellarTxHash },
      relations: ['split', 'participant'],
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment with transaction hash ${stellarTxHash} not found`,
      );
    }

    return payment;
  }

  /**
   * Update a payment
   */
  async update(id: string, updatePaymentDto: UpdatePaymentDto): Promise<Payment> {
    const payment = await this.findOne(id);

    // Auto-set confirmedAt when status changes to confirmed
    if (
      updatePaymentDto.status === PaymentStatus.CONFIRMED &&
      payment.status !== PaymentStatus.CONFIRMED
    ) {
      updatePaymentDto.confirmedAt = new Date();
    }

    Object.assign(payment, updatePaymentDto);
    return await this.paymentRepository.save(payment);
  }

  /**
   * Confirm a payment (shortcut method)
   */
  async confirmPayment(id: string): Promise<Payment> {
    return await this.update(id, {
      status: PaymentStatus.CONFIRMED,
      confirmedAt: new Date(),
    });
  }

  /**
   * Mark a payment as failed (shortcut method)
   */
  async failPayment(id: string): Promise<Payment> {
    return await this.update(id, {
      status: PaymentStatus.FAILED,
    });
  }

  /**
   * Get payment statistics for a split
   */
  async getSplitStats(splitId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    failed: number;
    totalAmount: number;
  }> {
    const payments = await this.findBySplit(splitId);

    return {
      total: payments.length,
      pending: payments.filter((p) => p.status === PaymentStatus.PENDING).length,
      confirmed: payments.filter((p) => p.status === PaymentStatus.CONFIRMED).length,
      failed: payments.filter((p) => p.status === PaymentStatus.FAILED).length,
      totalAmount: payments
        .filter((p) => p.status === PaymentStatus.CONFIRMED)
        .reduce((sum, p) => sum + Number(p.amount), 0),
    };
  }

  /**
   * Get payment statistics for a participant
   */
  async getParticipantStats(participantId: string): Promise<{
    total: number;
    pending: number;
    confirmed: number;
    failed: number;
    totalAmount: number;
  }> {
    const payments = await this.findByParticipant(participantId);

    return {
      total: payments.length,
      pending: payments.filter((p) => p.status === PaymentStatus.PENDING).length,
      confirmed: payments.filter((p) => p.status === PaymentStatus.CONFIRMED).length,
      failed: payments.filter((p) => p.status === PaymentStatus.FAILED).length,
      totalAmount: payments
        .filter((p) => p.status === PaymentStatus.CONFIRMED)
        .reduce((sum, p) => sum + Number(p.amount), 0),
    };
  }

  /**
   * Delete a payment
   */
  async remove(id: string): Promise<void> {
    const payment = await this.findOne(id);

    if (payment.status === PaymentStatus.CONFIRMED) {
      throw new BadRequestException('Cannot delete confirmed payments');
    }

    await this.paymentRepository.remove(payment);
  }

  /**
   * Count payments by status
   */
  async countByStatus(status: PaymentStatus): Promise<number> {
    return await this.paymentRepository.count({ where: { status } });
  }
}