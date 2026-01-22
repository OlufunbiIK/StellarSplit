import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payment, PaymentStatus, StellarAsset } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { QueryPaymentsDto } from './dto/query-payments.dto';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let service: PaymentsService;

  const mockPayment: Payment = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    splitId: '123e4567-e89b-12d3-a456-426614174001',
    participantId: '123e4567-e89b-12d3-a456-426614174002',
    fromAddress: 'GDJXQYEWDPGYK4LGCLFEV6HBIW3M22IK6NN2WQONHP3ELH6HINIKBVY7',
    toAddress: 'GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5',
    amount: 100.5,
    asset: StellarAsset.XLM,
    stellarTxHash:
      'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    status: PaymentStatus.PENDING,
    memo: 'Test payment',
    createdAt: new Date(),
    confirmedAt: null,
    split: null,
    participant: null,
  };

  const mockPaymentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findBySplit: jest.fn(),
    findByParticipant: jest.fn(),
    findOne: jest.fn(),
    findByTxHash: jest.fn(),
    update: jest.fn(),
    confirmPayment: jest.fn(),
    failPayment: jest.fn(),
    remove: jest.fn(),
    getSplitStats: jest.fn(),
    getParticipantStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [
        {
          provide: PaymentsService,
          useValue: mockPaymentsService,
        },
      ],
    }).compile();

    controller = module.get<PaymentsController>(PaymentsController);
    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new payment', async () => {
      const createPaymentDto: CreatePaymentDto = {
        splitId: mockPayment.splitId,
        participantId: mockPayment.participantId,
        fromAddress: mockPayment.fromAddress,
        toAddress: mockPayment.toAddress,
        amount: mockPayment.amount,
        asset: mockPayment.asset,
        stellarTxHash: mockPayment.stellarTxHash,
        memo: mockPayment.memo,
      };

      mockPaymentsService.create.mockResolvedValue(mockPayment);

      const result = await controller.create(createPaymentDto);

      expect(result).toEqual(mockPayment);
      expect(service.create).toHaveBeenCalledWith(createPaymentDto);
    });
  });

  describe('findAll', () => {
    it('should return all payments', async () => {
      const payments = [mockPayment];
      mockPaymentsService.findAll.mockResolvedValue(payments);

      const result = await controller.findAll({});

      expect(result).toEqual(payments);
      expect(service.findAll).toHaveBeenCalledWith({});
    });

    it('should return filtered payments', async () => {
      const queryDto: QueryPaymentsDto = {
        splitId: mockPayment.splitId,
        status: PaymentStatus.CONFIRMED,
      };
      const payments = [mockPayment];
      mockPaymentsService.findAll.mockResolvedValue(payments);

      const result = await controller.findAll(queryDto);

      expect(result).toEqual(payments);
      expect(service.findAll).toHaveBeenCalledWith(queryDto);
    });
  });

  describe('findBySplit', () => {
    it('should return payments for a specific split', async () => {
      const payments = [mockPayment];
      mockPaymentsService.findBySplit.mockResolvedValue(payments);

      const result = await controller.findBySplit(mockPayment.splitId);

      expect(result).toEqual(payments);
      expect(service.findBySplit).toHaveBeenCalledWith(mockPayment.splitId);
    });
  });

  describe('findByParticipant', () => {
    it('should return payments for a specific participant', async () => {
      const payments = [mockPayment];
      mockPaymentsService.findByParticipant.mockResolvedValue(payments);

      const result = await controller.findByParticipant(mockPayment.participantId);

      expect(result).toEqual(payments);
      expect(service.findByParticipant).toHaveBeenCalledWith(
        mockPayment.participantId,
      );
    });
  });

  describe('getSplitStats', () => {
    it('should return split statistics', async () => {
      const stats = {
        total: 5,
        pending: 2,
        confirmed: 3,
        failed: 0,
        totalAmount: 500,
      };
      mockPaymentsService.getSplitStats.mockResolvedValue(stats);

      const result = await controller.getSplitStats(mockPayment.splitId);

      expect(result).toEqual(stats);
      expect(service.getSplitStats).toHaveBeenCalledWith(mockPayment.splitId);
    });
  });

  describe('getParticipantStats', () => {
    it('should return participant statistics', async () => {
      const stats = {
        total: 3,
        pending: 1,
        confirmed: 2,
        failed: 0,
        totalAmount: 300,
      };
      mockPaymentsService.getParticipantStats.mockResolvedValue(stats);

      const result = await controller.getParticipantStats(mockPayment.participantId);

      expect(result).toEqual(stats);
      expect(service.getParticipantStats).toHaveBeenCalledWith(
        mockPayment.participantId,
      );
    });
  });

  describe('findByTxHash', () => {
    it('should return payment by transaction hash', async () => {
      mockPaymentsService.findByTxHash.mockResolvedValue(mockPayment);

      const result = await controller.findByTxHash(mockPayment.stellarTxHash);

      expect(result).toEqual(mockPayment);
      expect(service.findByTxHash).toHaveBeenCalledWith(mockPayment.stellarTxHash);
    });
  });

  describe('findOne', () => {
    it('should return a payment by ID', async () => {
      mockPaymentsService.findOne.mockResolvedValue(mockPayment);

      const result = await controller.findOne(mockPayment.id);

      expect(result).toEqual(mockPayment);
      expect(service.findOne).toHaveBeenCalledWith(mockPayment.id);
    });
  });

  describe('update', () => {
    it('should update a payment', async () => {
      const updatePaymentDto: UpdatePaymentDto = {
        status: PaymentStatus.CONFIRMED,
      };
      const updatedPayment = { ...mockPayment, ...updatePaymentDto };
      mockPaymentsService.update.mockResolvedValue(updatedPayment);

      const result = await controller.update(mockPayment.id, updatePaymentDto);

      expect(result).toEqual(updatedPayment);
      expect(service.update).toHaveBeenCalledWith(mockPayment.id, updatePaymentDto);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm a payment', async () => {
      const confirmedPayment = {
        ...mockPayment,
        status: PaymentStatus.CONFIRMED,
        confirmedAt: new Date(),
      };
      mockPaymentsService.confirmPayment.mockResolvedValue(confirmedPayment);

      const result = await controller.confirmPayment(mockPayment.id);

      expect(result).toEqual(confirmedPayment);
      expect(service.confirmPayment).toHaveBeenCalledWith(mockPayment.id);
    });
  });

  describe('failPayment', () => {
    it('should mark a payment as failed', async () => {
      const failedPayment = { ...mockPayment, status: PaymentStatus.FAILED };
      mockPaymentsService.failPayment.mockResolvedValue(failedPayment);

      const result = await controller.failPayment(mockPayment.id);

      expect(result).toEqual(failedPayment);
      expect(service.failPayment).toHaveBeenCalledWith(mockPayment.id);
    });
  });

  describe('remove', () => {
    it('should delete a payment', async () => {
      mockPaymentsService.remove.mockResolvedValue(undefined);

      await controller.remove(mockPayment.id);

      expect(service.remove).toHaveBeenCalledWith(mockPayment.id);
    });
  });
});