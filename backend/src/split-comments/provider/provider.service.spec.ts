import { Test, TestingModule } from '@nestjs/testing';
import { SplitCommentService } from './provider.service';

describe('SplitCommentService', () => {
  let service: SplitCommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SplitCommentService],
    }).compile();

    service = module.get<SplitCommentService>(SplitCommentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
