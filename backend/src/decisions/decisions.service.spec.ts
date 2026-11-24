
import { Test, TestingModule } from '@nestjs/testing';
import { DecisionsService } from './decisions.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

describe('DecisionsService', () => {
  let service: DecisionsService;

  const mockPrisma: any = {
    decision: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),

    },
    decisionVersion: {
      findFirst: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((input: any): Promise<any> => {
      if (Array.isArray(input)) {
        return Promise.all(input);
      }

      return input(mockPrisma);
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DecisionsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<DecisionsService>(DecisionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return paginated decisions', async () => {
    const mockDecisions = [
      {
        id: 'decision-1',
        title: 'Choose PostgreSQL',
        status: 'ACCEPTED',
        owner: 'Niharika',
      },
    ];

    mockPrisma.decision.findMany.mockResolvedValue(mockDecisions);
    mockPrisma.decision.count.mockResolvedValue(1);

    const result = await service.findAll({
      page: 1,
      limit: 10,
    }, 'user-1');

    expect(result).toEqual({
      data: mockDecisions,
      pagination: {
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    });

    expect(mockPrisma.decision.findMany).toHaveBeenCalled();
    expect(mockPrisma.decision.count).toHaveBeenCalled();
  });
  it('should apply search and status filters', async () => {
    mockPrisma.decision.findMany.mockResolvedValue([]);
    mockPrisma.decision.count.mockResolvedValue(0);

    await service.findAll({
      search: 'PostgreSQL',
      status: 'ACCEPTED',
      page: 1,
      limit: 10,
    }, 'user-1');

    expect(mockPrisma.decision.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'ACCEPTED',

          OR: [
            { userId: 'user-1' },
            { visibility: 'PUBLIC' },
          ],

          AND: expect.arrayContaining([
            expect.objectContaining({
              OR: [
                {
                  title: {
                    contains: 'PostgreSQL',
                    mode: 'insensitive',
                  },
                },
                {
                  context: {
                    contains: 'PostgreSQL',
                    mode: 'insensitive',
                  },
                },
              ],
            }),
          ]),
        }),
      }),
    );
  });
  it('should throw NotFoundException when decision does not exist', async () => {
    mockPrisma.decision.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('non-existent-id', 'user-1'),
    ).rejects.toThrow(NotFoundException);
  });
  it('should reject invalid status transitions', async () => {
    mockPrisma.decision.findUnique.mockResolvedValue({
      id: 'decision-1',
      userId: 'user-1',
      title: 'Choose PostgreSQL',
      context: 'Database selection',
      options: null,
      decisionSummary: 'Use PostgreSQL',
      rationale: 'Reliable database',
      status: 'ACCEPTED',
      owner: 'Niharika',
    });

    mockPrisma.$transaction.mockImplementation(
      async (callback: any) => callback(mockPrisma),
    );

    await expect(
      service.update('decision-1', {
        status: 'PROPOSED',
      }, 'user-1'),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrisma.decision.update).not.toHaveBeenCalled();
  });
  it('should allow valid status transitions', async () => {
    const existingDecision = {
      id: 'decision-2',
      title: 'Choose database',
      context: 'Database selection',
      options: null,
      decisionSummary: 'Use PostgreSQL',
      rationale: 'Reliable database',
      status: 'PROPOSED',
      owner: 'Niharika',
    };

    const updatedDecision = {
      ...existingDecision,
      status: 'ACCEPTED',
    };

    mockPrisma.decision.findUnique.mockResolvedValue(existingDecision);
    mockPrisma.decision.update.mockResolvedValue(updatedDecision);

    mockPrisma.decisionVersion.findFirst.mockResolvedValue({
      versionNumber: 1,
    });

    mockPrisma.decisionVersion.create.mockResolvedValue({
      versionNumber: 2,
    });

    const result = await service.update('decision-2', {
      status: 'ACCEPTED',
    }, 'user-1');

    expect(result.status).toBe('ACCEPTED');

    expect(mockPrisma.decision.update).toHaveBeenCalled();

    expect(mockPrisma.decisionVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          versionNumber: 2,
          status: 'ACCEPTED',
        }),
      }),
    );
  });
  it('should return decision versions in descending order', async () => {
    mockPrisma.decision.findFirst.mockResolvedValue({
      id: 'decision-1',
    });

    const versions = [
      { versionNumber: 3, rationale: 'Latest rationale' },
      { versionNumber: 2, rationale: 'Updated rationale' },
      { versionNumber: 1, rationale: 'Original rationale' },
    ];

    mockPrisma.decisionVersion.findMany.mockResolvedValue(versions);

    const result = await service.findVersions('decision-1', 'user-1');

    expect(result).toEqual(versions);

    expect(mockPrisma.decisionVersion.findMany).toHaveBeenCalledWith({
      where: { decisionId: 'decision-1' },
      orderBy: { versionNumber: 'desc' },
    });
  });
  it('should compare two versions and return changed fields', async () => {
    mockPrisma.decision.findFirst.mockResolvedValue({
      id: 'decision-1',
      userId: 'user-1'
    });

    mockPrisma.decisionVersion.findUnique = jest
      .fn()
      .mockResolvedValueOnce({
        versionNumber: 1,
        title: 'Choose MySQL',
        rationale: 'Initially preferred MySQL',
        status: 'PROPOSED',
      })
      .mockResolvedValueOnce({
        versionNumber: 2,
        title: 'Choose PostgreSQL',
        rationale: 'PostgreSQL offers better features',
        status: 'PROPOSED',
      });

    const result = await service.compareVersions('decision-1', 1, 2, 'user-1');

    expect(result.changes).toEqual({
      title: {
        old: 'Choose MySQL',
        new: 'Choose PostgreSQL',
      },
      rationale: {
        old: 'Initially preferred MySQL',
        new: 'PostgreSQL offers better features',
      },
    });
  });
  it('should restore an older version and create a new version', async () => {
    const decision = {
      id: 'decision-1',
      title: 'Choose PostgreSQL',
      context: 'Database selection',
      options: null,
      decisionSummary: 'Use PostgreSQL',
      rationale: 'Current rationale',
      status: 'ACCEPTED',
      owner: 'Niharika',
    };

    const oldVersion = {
      decisionId: 'decision-1',
      versionNumber: 1,
      title: 'Choose MySQL',
      context: 'Original context',
      options: null,
      decisionSummary: 'Use MySQL',
      rationale: 'Original rationale',
      status: 'PROPOSED',
      owner: 'Niharika',
    };

    mockPrisma.decision.findFirst.mockResolvedValue(decision);

    mockPrisma.decisionVersion.findUnique.mockResolvedValue(oldVersion);

    mockPrisma.decisionVersion.findFirst.mockResolvedValue({
      versionNumber: 3,
    });

    mockPrisma.decision.update.mockResolvedValue({
      ...decision,
      title: oldVersion.title,
      context: oldVersion.context,
      decisionSummary: oldVersion.decisionSummary,
      rationale: oldVersion.rationale,
      status: oldVersion.status,
    });

    mockPrisma.decisionVersion.create.mockResolvedValue({
      versionNumber: 4,
      restoredFromVersion: 1,
    });

    const result = await service.restoreVersion(
      'decision-1',
      1,
      'Restore original decision',
      'user-1',
    );
    expect(mockPrisma.decision.update).toHaveBeenCalled();
    expect(mockPrisma.decisionVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          versionNumber: 4,
          restoredFromVersion: 1,
          commitMessage: 'Restore original decision',
        }),
      }),
    );
  });
  it('should create a decision with its initial version', async () => {
    const createdDecision = {
      id: 'decision-3',
      title: 'Choose PostgreSQL',
      context: 'Database selection',
      options: null,
      decisionSummary: 'Use PostgreSQL',
      rationale: 'Reliable database',
      status: 'PROPOSED',
      owner: 'Niharika',
    };

    mockPrisma.decision.create.mockResolvedValue(createdDecision);

    mockPrisma.decisionVersion.create.mockResolvedValue({
      versionNumber: 1,
    });

    const result = await service.create({
      title: 'Choose PostgreSQL',
      context: 'Database selection',
      decisionSummary: 'Use PostgreSQL',
      rationale: 'Reliable database',
      owner: 'Niharika',
      commitMessage: 'Initial database decision',
    }, 'user-1');

    expect(result).toEqual(createdDecision);

    expect(mockPrisma.decisionVersion.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          decisionId: 'decision-3',
          versionNumber: 1,
          commitMessage: 'Initial database decision',
        }),
      }),
    );
  });
});

