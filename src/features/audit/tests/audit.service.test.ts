import { AuditService } from '../audit.service';
import { AuditRepository } from '../audit.repository';
import { rabbitMQService } from '../../../services/rabbitmq.service';
import { AuditTopic } from '../audit.topics';
import { AuditLog } from '../audit.entity';
import { AuditLogData } from '../audit.types';

jest.mock('../audit.repository');
jest.mock('../../../services/rabbitmq.service');

const mockAuditLog: AuditLog = {
  id: 1,
  eventType: AuditTopic.NOTE_CREATED,
  entityType: 'note',
  entityId: 'note1',
  userId: 'user1',
  oldData: undefined,
  newData: { id: 'note1', title: 'Test Note' },
  metadata: undefined,
  createdAt: new Date('2023-01-01T00:00:00.000Z')
} as any;

const mockEventData: AuditLogData = {
  eventType: AuditTopic.NOTE_CREATED,
  entityType: 'note',
  entityId: 'note1',
  userId: 'user1',
  oldData: undefined,
  newData: { id: 'note1', title: 'Test Note' },
  metadata: undefined,
  timestamp: new Date('2023-01-01T00:00:00.000Z')
};

describe('AuditService', () => {
  let auditService: AuditService;
  let auditRepository: jest.Mocked<AuditRepository>;
  let rabbitMQServiceMock: jest.Mocked<typeof rabbitMQService>;

  beforeEach(() => {
    auditRepository = new (AuditRepository as any)();
    rabbitMQServiceMock = rabbitMQService as any;
    auditService = new AuditService();
    
    // Inject mocks
    (auditService as any).auditRepository = auditRepository;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAuditLog', () => {
    it('should create an audit log', async () => {
      auditRepository.createAuditLog.mockResolvedValue(mockAuditLog);
      
      const result = await auditService.createAuditLog({
        eventType: AuditTopic.NOTE_CREATED,
        entityType: 'note',
        entityId: 'note1',
        userId: 'user1'
      });
      
      expect(auditRepository.createAuditLog).toHaveBeenCalledWith({
        eventType: AuditTopic.NOTE_CREATED,
        entityType: 'note',
        entityId: 'note1',
        userId: 'user1'
      });
      expect(result).toEqual(mockAuditLog);
    });

    it('should handle repository errors', async () => {
      auditRepository.createAuditLog.mockRejectedValue(new Error('DB error'));
      
      await expect(auditService.createAuditLog({
        eventType: AuditTopic.NOTE_CREATED,
        entityType: 'note',
        entityId: 'note1',
        userId: 'user1'
      })).rejects.toThrow('DB error');
    });
  });

  describe('logEvent', () => {
    it('should publish event to RabbitMQ', async () => {
      rabbitMQServiceMock.publishEvent.mockResolvedValue(undefined);
      
      await auditService.logEvent(
        AuditTopic.NOTE_CREATED,
        'note',
        'note1',
        'user1',
        undefined,
        { id: 'note1', title: 'Test Note' },
        { source: 'test' }
      );
      
      expect(rabbitMQServiceMock.publishEvent).toHaveBeenCalledWith(
        AuditTopic.NOTE_CREATED,
        expect.objectContaining({
          eventType: AuditTopic.NOTE_CREATED,
          entityType: 'note',
          entityId: 'note1',
          userId: 'user1',
          oldData: undefined,
          newData: { id: 'note1', title: 'Test Note' },
          metadata: { source: 'test' },
          timestamp: expect.any(Date)
        })
      );
    });

    it('should handle RabbitMQ errors', async () => {
      rabbitMQServiceMock.publishEvent.mockRejectedValue(new Error('RabbitMQ error'));
      
      await expect(auditService.logEvent(
        AuditTopic.NOTE_CREATED,
        'note',
        'note1',
        'user1'
      )).rejects.toThrow('RabbitMQ error');
    });

    it('should create event data with current timestamp', async () => {
      rabbitMQServiceMock.publishEvent.mockResolvedValue(undefined);
      const beforeCall = new Date();
      
      await auditService.logEvent(
        AuditTopic.NOTE_CREATED,
        'note',
        'note1',
        'user1'
      );
      
      const afterCall = new Date();
      const callArgs = rabbitMQServiceMock.publishEvent.mock.calls[0];
      const eventData = callArgs[1] as AuditLogData;
      
      expect(eventData.timestamp).toBeInstanceOf(Date);
      expect(eventData.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(eventData.timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });

  describe('getEntityHistory', () => {
    it('should return entity history', async () => {
      auditRepository.findByEntity.mockResolvedValue([mockAuditLog]);
      
      const result = await auditService.getEntityHistory('note', 'note1');
      
      expect(auditRepository.findByEntity).toHaveBeenCalledWith('note', 'note1');
      expect(result).toEqual([mockAuditLog]);
    });

    it('should return empty array when no history found', async () => {
      auditRepository.findByEntity.mockResolvedValue([]);
      
      const result = await auditService.getEntityHistory('note', 'nonexistent');
      
      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      auditRepository.findByEntity.mockRejectedValue(new Error('DB error'));
      
      await expect(auditService.getEntityHistory('note', 'note1'))
        .rejects.toThrow('DB error');
    });
  });

  describe('getEntityTypeHistory', () => {
    it('should return entity type history', async () => {
      auditRepository.findByEntityType.mockResolvedValue([mockAuditLog]);
      
      const result = await auditService.getEntityTypeHistory('note');
      
      expect(auditRepository.findByEntityType).toHaveBeenCalledWith('note');
      expect(result).toEqual([mockAuditLog]);
    });

    it('should return empty array when no history found', async () => {
      auditRepository.findByEntityType.mockResolvedValue([]);
      
      const result = await auditService.getEntityTypeHistory('nonexistent');
      
      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      auditRepository.findByEntityType.mockRejectedValue(new Error('DB error'));
      
      await expect(auditService.getEntityTypeHistory('note'))
        .rejects.toThrow('DB error');
    });
  });

  describe('getEventHistory', () => {
    it('should return event history', async () => {
      auditRepository.findByEventType.mockResolvedValue([mockAuditLog]);
      
      const result = await auditService.getEventHistory(AuditTopic.NOTE_CREATED);
      
      expect(auditRepository.findByEventType).toHaveBeenCalledWith(AuditTopic.NOTE_CREATED);
      expect(result).toEqual([mockAuditLog]);
    });

    it('should return empty array when no history found', async () => {
      auditRepository.findByEventType.mockResolvedValue([]);
      
      const result = await auditService.getEventHistory(AuditTopic.NOTE_DELETED);
      
      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      auditRepository.findByEventType.mockRejectedValue(new Error('DB error'));
      
      await expect(auditService.getEventHistory(AuditTopic.NOTE_CREATED))
        .rejects.toThrow('DB error');
    });
  });

  describe('getDateRangeHistory', () => {
    it('should return date range history', async () => {
      auditRepository.findByDateRange.mockResolvedValue([mockAuditLog]);
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      const result = await auditService.getDateRangeHistory(startDate, endDate);
      
      expect(auditRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      expect(result).toEqual([mockAuditLog]);
    });

    it('should return empty array when no history found in date range', async () => {
      auditRepository.findByDateRange.mockResolvedValue([]);
      const startDate = new Date('2023-02-01');
      const endDate = new Date('2023-02-28');
      
      const result = await auditService.getDateRangeHistory(startDate, endDate);
      
      expect(result).toEqual([]);
    });

    it('should handle repository errors', async () => {
      auditRepository.findByDateRange.mockRejectedValue(new Error('DB error'));
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      await expect(auditService.getDateRangeHistory(startDate, endDate))
        .rejects.toThrow('DB error');
    });

    it('should handle invalid date ranges', async () => {
      const startDate = new Date('2023-01-31');
      const endDate = new Date('2023-01-01'); // End before start
      
      const result = await auditService.getDateRangeHistory(startDate, endDate);
      
      expect(auditRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      // Note: The service doesn't validate date ranges, it just passes them to the repository
    });
  });
}); 