import { Test, TestingModule } from '@nestjs/testing';
import { DecisionsController } from './decisions.controller';
import { DecisionsService } from './decisions.service';

describe('DecisionsController', () => {
  let controller: DecisionsController;

  const mockDecisionsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    findVersions: jest.fn(),
    findVersion: jest.fn(),
    compareVersions: jest.fn(),
    restoreVersion: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DecisionsController],
      providers: [
        {
          provide: DecisionsService,
          useValue: mockDecisionsService,
        },
      ],
    }).compile();

    controller = module.get<DecisionsController>(DecisionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
