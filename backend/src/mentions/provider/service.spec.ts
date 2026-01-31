import { SplitCommentService } from '@/split-comments/provider/provider.service';
import { Test, TestingModule } from '@nestjs/testing';

describe('Service', () => {
  let provider: SplitCommentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SplitCommentService],
    }).compile();

    provider = module.get<SplitCommentService>(SplitCommentService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
