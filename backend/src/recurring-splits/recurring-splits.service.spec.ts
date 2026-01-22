import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringSplitsService, CreateRecurringSplitDto, UpdateRecurringSplitDto } from './recurring-splits.service';
import { RecurringSplit, RecurrenceFrequency } from './recurring-split.entity';
import { Split } from '../entities/split.entity';
import { Participant } from '../entities/participant.entity';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';

describe('RecurringSplitsService', () => {
  let service: RecurringSplitsService;
  let recurringSplitRepository: Repository<RecurringSplit>;
  let splitRepository: Repository<Split>;
  let participantRepository: Repository<Participant>;

  const mockRecurringSplitRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockSplitRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockParticipantRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecurringSplitsService,
        {
          provide: getRepositoryToken(RecurringSplit),
          useValue: mockRecurringSplitRepository,
        },
        {
          provide: getRepositoryToken(Split),
          useValue: mockSplitRepository,
        },
        {
          provide: getRepositoryToken(Participant),
          useValue: mockParticipantRepository,
        },
      ],
    }).compile();

    service = module.get<RecurringSplitsService>(RecurringSplitsService);
    recurringSplitRepository = module.get<Repository<RecurringSplit>>(
      getRepositoryToken(RecurringSplit),
    );
    splitRepository = module.get<Repository<Split>>(
      getRepositoryToken(Split),
    );
    participantRepository = module.get<Repository<Participant>>(
      getRepositoryToken(Participant),
    );

    jest.clearAllMocks();
  });

  describe('createRecurringSplit', () => {
    it('should create a recurring split successfully', async () => {
      const dto: CreateRecurringSplitDto = {
        creatorId: 'creator123',
        templateSplitId: 'split123',
        frequency: RecurrenceFrequency.MONTHLY,
        autoRemind: true,
        description: 'Monthly rent',
      };

      const mockSplit = { id: 'split123', totalAmount: 1000 } as Split;
      const mockRecurringSplit = {
        ...dto,
        id: 'recurring123',
        nextOccurrence: expect.any(Date),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as RecurringSplit;

      jest.spyOn(splitRepository, 'findOne').mockResolvedValue(mockSplit);
      jest.spyOn(recurringSplitRepository, 'save').mockResolvedValue(mockRecurringSplit);

      const result = await service.createRecurringSplit(dto);

      expect(result).toBeDefined();
      expect(result.id).toBe('recurring123');
      expect(result.creatorId).toBe('creator123');
      expect(result.frequency).toBe(RecurrenceFrequency.MONTHLY);
      expect(recurringSplitRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if template split does not exist', async () => {
      const dto: CreateRecurringSplitDto = {
        creatorId: 'creator123',
        templateSplitId: 'nonexistent',
        frequency: RecurrenceFrequency.MONTHLY,
      };

      jest.spyOn(splitRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createRecurringSplit(dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException if end date is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const dto: CreateRecurringSplitDto = {
        creatorId: 'creator123',
        templateSplitId: 'split123',
        frequency: RecurrenceFrequency.MONTHLY,
        endDate: pastDate,
      };

      const mockSplit = { id: 'split123' } as Split;
      jest.spyOn(splitRepository, 'findOne').mockResolvedValue(mockSplit);

      await expect(service.createRecurringSplit(dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getRecurringSplitsByCreator', () => {
    it('should return all recurring splits for a creator', async () => {
      const creatorId = 'creator123';
      const mockSplits = [
        {
          id: 'recurring1',
          creatorId,
          frequency: RecurrenceFrequency.MONTHLY,
        } as RecurringSplit,
        {
          id: 'recurring2',
          creatorId,
          frequency: RecurrenceFrequency.WEEKLY,
        } as RecurringSplit,
      ];

      jest.spyOn(recurringSplitRepository, 'find').mockResolvedValue(mockSplits);

      const result = await service.getRecurringSplitsByCreator(creatorId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('recurring1');
      expect(result[1].id).toBe('recurring2');
      expect(recurringSplitRepository.find).toHaveBeenCalled();
    });

    it('should return empty array if creator has no recurring splits', async () => {
      jest.spyOn(recurringSplitRepository, 'find').mockResolvedValue([]);

      const result = await service.getRecurringSplitsByCreator('creator123');

      expect(result).toEqual([]);
    });
  });

  describe('getRecurringSplitById', () => {
    it('should return a recurring split by ID', async () => {
      const mockSplit = {
        id: 'recurring123',
        creatorId: 'creator123',
      } as RecurringSplit;

      jest.spyOn(recurringSplitRepository, 'findOne').mockResolvedValue(mockSplit);

      const result = await service.getRecurringSplitById('recurring123');

      expect(result.id).toBe('recurring123');
      expect(recurringSplitRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'recurring123' },
        relations: ['templateSplit'],
      });
    });

    it('should throw NotFoundException if recurring split does not exist', async () => {
      jest.spyOn(recurringSplitRepository, 'findOne').mockResolvedValue(null);

      await expect(service.getRecurringSplitById('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRecurringSplit', () => {
    it('should update a recurring split', async () => {
      const id = 'recurring123';
      const dto: UpdateRecurringSplitDto = {
        frequency: RecurrenceFrequency.WEEKLY,
        autoRemind: false,
      };

      const mockExisting = {
        id,
        creatorId: 'creator123',
        frequency: RecurrenceFrequency.MONTHLY,
      } as RecurringSplit;

      jest.spyOn(recurringSplitRepository, 'findOne').mockResolvedValue(mockExisting);
      jest.spyOn(recurringSplitRepository, 'save').mockResolvedValue({
        ...mockExisting,
        ...dto,
      } as RecurringSplit);

      const result = await service.updateRecurringSplit(id, dto);

      expect(result.frequency).toBe(RecurrenceFrequency.WEEKLY);
      expect(result.autoRemind).toBe(false);
      expect(recurringSplitRepository.save).toHaveBeenCalled();
    });

    it('should throw BadRequestException if end date is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const dto: UpdateRecurringSplitDto = {
        endDate: pastDate,
      };

      const mockExisting = {
        id: 'recurring123',
      } as RecurringSplit;

      jest.spyOn(recurringSplitRepository, 'findOne').mockResolvedValue(mockExisting);

      await expect(service.updateRecurringSplit('recurring123', dto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('pauseRecurringSplit', () => {
    it('should pause an active recurring split', async () => {
      const mockSplit = {
        id: 'recurring123',
        isActive: true,
      } as RecurringSplit;

      jest.spyOn(recurringSplitRepository, 'findOne').mockResolvedValue(mockSplit);
      jest.spyOn(recurringSplitRepository, 'save').mockResolvedValue({
        ...mockSplit,
        isActive: false,
      } as RecurringSplit);

      const result = await service.pauseRecurringSplit('recurring123');

      expect(result.isActive).toBe(false);
      expect(recurringSplitRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if already paused', async () => {
      const mockSplit = {
        id: 'recurring123',
        isActive: false,
      } as RecurringSplit;

      jest.spyOn(recurringSplitRepository, 'findOne').mockResolvedValue(mockSplit);

      await expect(service.pauseRecurringSplit('recurring123')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('resumeRecurringSplit', () => {
    it('should resume a paused recurring split', async () => {
      const mockSplit = {
        id: 'recurring123',
        isActive: false,
        frequency: RecurrenceFrequency.MONTHLY,
        nextOccurrence: new Date(),
      } as RecurringSplit;

      jest.spyOn(recurringSplitRepository, 'findOne').mockResolvedValue(mockSplit);
      jest.spyOn(recurringSplitRepository, 'save').mockResolvedValue({
        ...mockSplit,
        isActive: true,
      } as RecurringSplit);

      const result = await service.resumeRecurringSplit('recurring123');

      expect(result.isActive).toBe(true);
      expect(recurringSplitRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if already active', async () => {
      const mockSplit = {
        id: 'recurring123',
        isActive: true,
      } as RecurringSplit;

      jest.spyOn(recurringSplitRepository, 'findOne').mockResolvedValue(mockSplit);

      await expect(service.resumeRecurringSplit('recurring123')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('deleteRecurringSplit', () => {
    it('should delete a recurring split', async () => {
      const mockSplit = {
        id: 'recurring123',
      } as RecurringSplit;

      jest.spyOn(recurringSplitRepository, 'findOne').mockResolvedValue(mockSplit);
      jest.spyOn(recurringSplitRepository, 'remove').mockResolvedValue(undefined);

      await expect(service.deleteRecurringSplit('recurring123')).resolves.toBeUndefined();
      expect(recurringSplitRepository.remove).toHaveBeenCalledWith(mockSplit);
    });
  });

  describe('generateSplitFromTemplate', () => {
    it('should generate a new split from template', async () => {
      const mockRecurringSplit = {
        id: 'recurring123',
        isActive: true,
        frequency: RecurrenceFrequency.MONTHLY,
        nextOccurrence: new Date(),
        templateSplitId: 'split123',
      } as RecurringSplit;

      const mockTemplate = {
        id: 'split123',
        totalAmount: 1000,
        description: 'Rent',
        participants: [],
      } as Split;

      const mockGeneratedSplit = {
        id: 'split456',
        totalAmount: 1000,
        amountPaid: 0,
        status: 'active',
      } as Split;

      jest.spyOn(recurringSplitRepository, 'findOne').mockResolvedValue(mockRecurringSplit);
      jest.spyOn(splitRepository, 'findOne').mockResolvedValue(mockTemplate);
      jest.spyOn(splitRepository, 'save').mockResolvedValue(mockGeneratedSplit);
      jest.spyOn(participantRepository, 'save').mockResolvedValue([]);
      jest.spyOn(recurringSplitRepository, 'save').mockResolvedValue(mockRecurringSplit);

      const result = await service.generateSplitFromTemplate('recurring123');

      expect(result.id).toBe('split456');
      expect(result.totalAmount).toBe(1000);
      expect(splitRepository.save).toHaveBeenCalled();
    });

    it('should not generate if recurring split is inactive', async () => {
      const mockRecurringSplit = {
        id: 'recurring123',
        isActive: false,
      } as RecurringSplit;

      jest.spyOn(recurringSplitRepository, 'findOne').mockResolvedValue(mockRecurringSplit);

      const result = await service.generateSplitFromTemplate('recurring123');

      expect(result).toBeNull();
      expect(splitRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getRecurringSplitStats', () => {
    it('should return stats for a creator', async () => {
      const creatorId = 'creator123';
      const mockSplits = [
        {
          id: 'recurring1',
          isActive: true,
          nextOccurrence: new Date(Date.now() + 86400000),
        } as RecurringSplit,
        {
          id: 'recurring2',
          isActive: false,
          nextOccurrence: new Date(),
        } as RecurringSplit,
        {
          id: 'recurring3',
          isActive: true,
          nextOccurrence: new Date(Date.now() + 172800000),
        } as RecurringSplit,
      ];

      jest.spyOn(recurringSplitRepository, 'find').mockResolvedValue(mockSplits);

      const result = await service.getRecurringSplitStats(creatorId);

      expect(result.total).toBe(3);
      expect(result.active).toBe(2);
      expect(result.paused).toBe(1);
      expect(result.nextOccurrences).toHaveLength(2);
    });
  });
});
