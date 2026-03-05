import { Test, TestingModule } from "@nestjs/testing";
import { FriendshipController } from "./friendship.controller";
import { FriendshipService } from "./provider/service";

describe("FriendshipController", () => {
  let controller: FriendshipController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [FriendshipController],
      providers: [
        {
          provide: FriendshipService,
          useValue: {
            /* mock methods */
          },
        },
      ],
    }).compile();

    controller = module.get<FriendshipController>(FriendshipController);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });
});
