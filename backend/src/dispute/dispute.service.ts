import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dispute, DisputeStatus, DisputeType } from './entities/dispute.entity';
import {
  CreateDisputeDto,
  UpdateDisputeStatusDto,
  AddEvidenceDto,
  ResolveDisputeDto,
  AppealDisputeDto,
  DisputeQueryDto,
} from './dto/dispute.dto';
import { NotificationService } from '../notification/notification.service';
import { SplitService } from '../split/split.service';

@Injectable()
export class DisputeService {
  private readonly MAX_APPEAL_COUNT = 2; // Maximum times a dispute can be appealed

  constructor(
    @InjectRepository(Dispute)
    private disputeRepository: Repository<Dispute>,
    private notificationService: NotificationService,
    private splitService: SplitService,
  ) {}

  /**
   * Create a new dispute and freeze the associated split
   */
  async createDispute(createDisputeDto: CreateDisputeDto): Promise<Dispute> {
    // Verify split exists and user is a participant
    const split = await this.splitService.findOne(createDisputeDto.splitId);
    if (!split) {
      throw new NotFoundException(`Split ${createDisputeDto.splitId} not found`);
    }

    // Check if user is part of the split
    const isParticipant = await this.splitService.isParticipant(
      createDisputeDto.splitId,
      createDisputeDto.raisedBy,
    );
    if (!isParticipant) {
      throw new ForbiddenException('Only split participants can raise disputes');
    }

    // Check for existing open disputes on this split
    const existingDispute = await this.disputeRepository.findOne({
      where: {
        splitId: createDisputeDto.splitId,
        status: DisputeStatus.OPEN,
      },
    });

    if (existingDispute) {
      throw new BadRequestException('An open dispute already exists for this split');
    }

    // Create the dispute
    const dispute = this.disputeRepository.create({
      ...createDisputeDto,
      status: DisputeStatus.OPEN,
    });

    const savedDispute = await this.disputeRepository.save(dispute);

    // Freeze the split
    await this.splitService.freezeSplit(createDisputeDto.splitId, savedDispute.id);

    // Notify all participants
    await this.notifyParticipants(savedDispute, 'dispute_created');

    return savedDispute;
  }

  /**
   * Find all disputes with optional filtering
   */
  async findAll(query: DisputeQueryDto): Promise<{ disputes: Dispute[]; total: number }> {
    const { page = 1, limit = 20, ...filters } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.disputeRepository.createQueryBuilder('dispute');

    if (filters.splitId) {
      queryBuilder.andWhere('dispute.splitId = :splitId', { splitId: filters.splitId });
    }

    if (filters.status) {
      queryBuilder.andWhere('dispute.status = :status', { status: filters.status });
    }

    if (filters.raisedBy) {
      queryBuilder.andWhere('dispute.raisedBy = :raisedBy', { raisedBy: filters.raisedBy });
    }

    if (filters.disputeType) {
      queryBuilder.andWhere('dispute.disputeType = :disputeType', {
        disputeType: filters.disputeType,
      });
    }

    queryBuilder
      .leftJoinAndSelect('dispute.split', 'split')
      .orderBy('dispute.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [disputes, total] = await queryBuilder.getManyAndCount();

    return { disputes, total };
  }

  /**
   * Find a dispute by ID
   */
  async findOne(id: string): Promise<Dispute> {
    const dispute = await this.disputeRepository.findOne({
      where: { id },
      relations: ['split'],
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute ${id} not found`);
    }

    return dispute;
  }

  /**
   * Add evidence to an existing dispute
   */
  async addEvidence(
    id: string,
    addEvidenceDto: AddEvidenceDto,
    walletAddress: string,
  ): Promise<Dispute> {
    const dispute = await this.findOne(id);

    // Only the person who raised the dispute can add evidence during OPEN status
    if (dispute.status === DisputeStatus.OPEN && dispute.raisedBy !== walletAddress) {
      throw new ForbiddenException('Only the dispute raiser can add evidence');
    }

    // Merge new evidence with existing
    const currentEvidence = dispute.evidence || {};
    const updatedEvidence = {
      images: [
        ...(currentEvidence.images || []),
        ...(addEvidenceDto.images || []),
      ],
      receipts: [
        ...(currentEvidence.receipts || []),
        ...(addEvidenceDto.receipts || []),
      ],
      description: addEvidenceDto.description || currentEvidence.description,
      metadata: currentEvidence.metadata,
    };

    dispute.evidence = updatedEvidence;
    const savedDispute = await this.disputeRepository.save(dispute);

    // Notify participants of new evidence
    await this.notifyParticipants(savedDispute, 'evidence_added');

    return savedDispute;
  }

  /**
   * Update dispute status (for admin/system use)
   */
  async updateStatus(
    id: string,
    updateStatusDto: UpdateDisputeStatusDto,
  ): Promise<Dispute> {
    const dispute = await this.findOne(id);

    // Validate status transition
    this.validateStatusTransition(dispute.status, updateStatusDto.status);

    dispute.status = updateStatusDto.status;

    if (updateStatusDto.status === DisputeStatus.UNDER_REVIEW) {
      // Notify that dispute is being reviewed
      await this.notifyParticipants(dispute, 'under_review');
    }

    return await this.disputeRepository.save(dispute);
  }

  /**
   * Resolve a dispute with a decision
   */
  async resolveDispute(
    id: string,
    resolveDto: ResolveDisputeDto,
  ): Promise<Dispute> {
    const dispute = await this.findOne(id);

    if (dispute.status !== DisputeStatus.UNDER_REVIEW && dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('Only disputes under review or open can be resolved');
    }

    // Update dispute with resolution
    dispute.status = DisputeStatus.RESOLVED;
    dispute.resolution = {
      decision: resolveDto.decision,
      reasoning: resolveDto.reasoning,
      adjustments: resolveDto.adjustments,
      compensations: resolveDto.compensations,
    };
    dispute.resolvedBy = resolveDto.resolvedBy;
    dispute.resolvedAt = new Date();

    const savedDispute = await this.disputeRepository.save(dispute);

    // Unfreeze the split
    await this.splitService.unfreezeSplit(dispute.splitId);

    // Apply adjustments if any
    if (resolveDto.adjustments && resolveDto.adjustments.length > 0) {
      await this.splitService.applyDisputeAdjustments(
        dispute.splitId,
        resolveDto.adjustments,
      );
    }

    // Notify all participants
    await this.notifyParticipants(savedDispute, 'dispute_resolved');

    return savedDispute;
  }

  /**
   * Reject a dispute
   */
  async rejectDispute(
    id: string,
    reasoning: string,
    rejectedBy: string,
  ): Promise<Dispute> {
    const dispute = await this.findOne(id);

    if (dispute.status !== DisputeStatus.UNDER_REVIEW && dispute.status !== DisputeStatus.OPEN) {
      throw new BadRequestException('Only disputes under review or open can be rejected');
    }

    dispute.status = DisputeStatus.REJECTED;
    dispute.resolution = {
      decision: 'rejected',
      reasoning,
    };
    dispute.resolvedBy = rejectedBy;
    dispute.resolvedAt = new Date();

    const savedDispute = await this.disputeRepository.save(dispute);

    // Unfreeze the split
    await this.splitService.unfreezeSplit(dispute.splitId);

    // Notify all participants
    await this.notifyParticipants(savedDispute, 'dispute_rejected');

    return savedDispute;
  }

  /**
   * Appeal a resolved or rejected dispute
   */
  async appealDispute(
    id: string,
    appealDto: AppealDisputeDto,
  ): Promise<Dispute> {
    const originalDispute = await this.findOne(id);

    // Check if dispute can be appealed
    if (
      originalDispute.status !== DisputeStatus.RESOLVED &&
      originalDispute.status !== DisputeStatus.REJECTED
    ) {
      throw new BadRequestException('Only resolved or rejected disputes can be appealed');
    }

    if (originalDispute.appealCount >= this.MAX_APPEAL_COUNT) {
      throw new BadRequestException(
        `Maximum appeal limit (${this.MAX_APPEAL_COUNT}) reached`,
      );
    }

    // Verify appealer is a participant
    const isParticipant = await this.splitService.isParticipant(
      originalDispute.splitId,
      appealDto.appealedBy,
    );
    if (!isParticipant) {
      throw new ForbiddenException('Only split participants can appeal disputes');
    }

    // Create new dispute as an appeal
    const appeal = this.disputeRepository.create({
      splitId: originalDispute.splitId,
      raisedBy: appealDto.appealedBy,
      disputeType: originalDispute.disputeType,
      description: originalDispute.description,
      evidence: {
        ...originalDispute.evidence,
        ...appealDto.additionalEvidence,
      },
      status: DisputeStatus.APPEALED,
      appealedFromDisputeId: originalDispute.id,
      appealReason: appealDto.appealReason,
    });

    const savedAppeal = await this.disputeRepository.save(appeal);

    // Update original dispute
    originalDispute.appealCount += 1;
    await this.disputeRepository.save(originalDispute);

    // Freeze the split again
    await this.splitService.freezeSplit(originalDispute.splitId, savedAppeal.id);

    // Notify participants
    await this.notifyParticipants(savedAppeal, 'dispute_appealed');

    return savedAppeal;
  }

  /**
   * Get dispute statistics
   */
  async getStatistics(splitId?: string): Promise<{
    total: number;
    byStatus: Record<DisputeStatus, number>;
    byType: Record<DisputeType, number>;
    averageResolutionTime: number;
  }> {
    const queryBuilder = this.disputeRepository.createQueryBuilder('dispute');

    if (splitId) {
      queryBuilder.where('dispute.splitId = :splitId', { splitId });
    }

    const disputes = await queryBuilder.getMany();

    const stats = {
      total: disputes.length,
      byStatus: {} as Record<DisputeStatus, number>,
      byType: {} as Record<DisputeType, number>,
      averageResolutionTime: 0,
    };

    // Initialize counters
    Object.values(DisputeStatus).forEach(status => {
      stats.byStatus[status] = 0;
    });
    Object.values(DisputeType).forEach(type => {
      stats.byType[type] = 0;
    });

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    disputes.forEach(dispute => {
      stats.byStatus[dispute.status]++;
      stats.byType[dispute.disputeType]++;

      if (dispute.resolvedAt) {
        const resolutionTime =
          dispute.resolvedAt.getTime() - dispute.createdAt.getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    });

    if (resolvedCount > 0) {
      stats.averageResolutionTime = totalResolutionTime / resolvedCount / 1000 / 60 / 60; // in hours
    }

    return stats;
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: DisputeStatus,
    newStatus: DisputeStatus,
  ): void {
    const validTransitions: Record<DisputeStatus, DisputeStatus[]> = {
      [DisputeStatus.OPEN]: [DisputeStatus.UNDER_REVIEW, DisputeStatus.REJECTED],
      [DisputeStatus.UNDER_REVIEW]: [
        DisputeStatus.RESOLVED,
        DisputeStatus.REJECTED,
      ],
      [DisputeStatus.RESOLVED]: [DisputeStatus.APPEALED],
      [DisputeStatus.REJECTED]: [DisputeStatus.APPEALED],
      [DisputeStatus.APPEALED]: [
        DisputeStatus.UNDER_REVIEW,
        DisputeStatus.RESOLVED,
        DisputeStatus.REJECTED,
      ],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  /**
   * Notify all participants about dispute events
   */
  private async notifyParticipants(
    dispute: Dispute,
    event: string,
  ): Promise<void> {
    try {
      const participants = await this.splitService.getParticipants(dispute.splitId);

      const notificationPromises = participants.map(participant =>
        this.notificationService.sendDisputeNotification({
          recipientAddress: participant.walletAddress,
          disputeId: dispute.id,
          splitId: dispute.splitId,
          event,
          disputeType: dispute.disputeType,
          status: dispute.status,
        }),
      );

      await Promise.allSettled(notificationPromises);
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to send notifications:', error);
    }
  }

  /**
   * Automatic dispute resolution (for simple cases)
   * This could be triggered by a cron job or event
   */
  async autoResolveDisputes(): Promise<void> {
    const openDisputes = await this.disputeRepository.find({
      where: { status: DisputeStatus.OPEN },
      relations: ['split'],
    });

    for (const dispute of openDisputes) {
      // Check if dispute is older than evidence collection period (e.g., 7 days)
      const daysSinceCreated =
        (Date.now() - dispute.createdAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceCreated >= 7) {
        // Move to under review
        await this.updateStatus(dispute.id, {
          status: DisputeStatus.UNDER_REVIEW,
        });

        // Here you could implement automated resolution logic
        // based on evidence, dispute type, etc.
      }
    }
  }
}