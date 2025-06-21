import { Request, Response } from 'express';
import { AuditController } from '../audit.controller';
import { AuditService } from '../audit.service';
import { AuditTopic } from '../audit.topics';
import { AuditLog } from '../audit.entity';

// Mock console.error to suppress expected error logging during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock the response-utils module
jest.mock('../../../utils/response-utils', () => ({
  sendSuccess: jest.fn(),
  sendError: jest.fn()
}));

jest.mock('../audit.service');

const { sendSuccess, sendError } = require('../../../utils/response-utils');

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

describe('AuditController', () => {
  let auditController: AuditController;
  let auditService: jest.Mocked<AuditService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    auditService = new (AuditService as any)();
    auditController = new AuditController();
    
    // Inject mock service
    (auditController as any).auditService = auditService;

    mockRequest = {
      params: {},
      query: {}
    };

    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    jest.clearAllMocks();
  });

  describe('getEntityHistory', () => {
    it('should return entity history successfully', async () => {
      mockRequest.params = { entityType: 'note', entityId: 'note1' };
      auditService.getEntityHistory.mockResolvedValue([mockAuditLog]);

      await auditController.getEntityHistory(mockRequest as Request, mockResponse as Response);

      expect(auditService.getEntityHistory).toHaveBeenCalledWith('note', 'note1');
      expect(sendSuccess).toHaveBeenCalledWith(mockRequest, mockResponse, [mockAuditLog]);
    });

    it('should handle service errors', async () => {
      mockRequest.params = { entityType: 'note', entityId: 'note1' };
      const error = new Error('Service error');
      auditService.getEntityHistory.mockRejectedValue(error);

      await auditController.getEntityHistory(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Failed to fetch entity history',
        500,
        { errorMessage: 'Service error', exc_info: error.stack }
      );
    });

    it('should handle missing parameters', async () => {
      mockRequest.params = { entityType: 'note' }; // Missing entityId

      await auditController.getEntityHistory(mockRequest as Request, mockResponse as Response);

      expect(auditService.getEntityHistory).toHaveBeenCalledWith('note', undefined);
    });
  });

  describe('getEntityTypeHistory', () => {
    it('should return entity type history successfully', async () => {
      mockRequest.params = { entityType: 'note' };
      auditService.getEntityTypeHistory.mockResolvedValue([mockAuditLog]);

      await auditController.getEntityTypeHistory(mockRequest as Request, mockResponse as Response);

      expect(auditService.getEntityTypeHistory).toHaveBeenCalledWith('note');
      expect(mockResponse.json).toHaveBeenCalledWith([mockAuditLog]);
    });

    it('should handle service errors', async () => {
      mockRequest.params = { entityType: 'note' };
      const error = new Error('Service error');
      auditService.getEntityTypeHistory.mockRejectedValue(error);

      await auditController.getEntityTypeHistory(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Failed to fetch entity history',
        500,
        { errorMessage: 'Service error', exc_info: error.stack }
      );
    });

    it('should return empty array when no history found', async () => {
      mockRequest.params = { entityType: 'nonexistent' };
      auditService.getEntityTypeHistory.mockResolvedValue([]);

      await auditController.getEntityTypeHistory(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith([]);
    });
  });

  describe('getEventHistory', () => {
    it('should return event history successfully', async () => {
      mockRequest.params = { eventType: AuditTopic.NOTE_CREATED };
      auditService.getEventHistory.mockResolvedValue([mockAuditLog]);

      await auditController.getEventHistory(mockRequest as Request, mockResponse as Response);

      expect(auditService.getEventHistory).toHaveBeenCalledWith(AuditTopic.NOTE_CREATED);
      expect(sendSuccess).toHaveBeenCalledWith(mockRequest, mockResponse, [mockAuditLog]);
    });

    it('should handle service errors', async () => {
      mockRequest.params = { eventType: AuditTopic.NOTE_CREATED };
      const error = new Error('Service error');
      auditService.getEventHistory.mockRejectedValue(error);

      await auditController.getEventHistory(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Failed to fetch event history',
        500,
        { errorMessage: 'Service error', exc_info: error.stack }
      );
    });

    it('should handle invalid event types', async () => {
      mockRequest.params = { eventType: 'INVALID_EVENT' };
      auditService.getEventHistory.mockResolvedValue([]);

      await auditController.getEventHistory(mockRequest as Request, mockResponse as Response);

      expect(auditService.getEventHistory).toHaveBeenCalledWith('INVALID_EVENT');
    });
  });

  describe('getDateRangeHistory', () => {
    it('should return date range history successfully', async () => {
      mockRequest.query = {
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-01-31T23:59:59.999Z'
      };
      auditService.getDateRangeHistory.mockResolvedValue([mockAuditLog]);

      await auditController.getDateRangeHistory(mockRequest as Request, mockResponse as Response);

      expect(auditService.getDateRangeHistory).toHaveBeenCalledWith(
        new Date('2023-01-01T00:00:00.000Z'),
        new Date('2023-01-31T23:59:59.999Z')
      );
      expect(sendSuccess).toHaveBeenCalledWith(mockRequest, mockResponse, [mockAuditLog]);
    });

    it('should return 400 error when startDate is missing', async () => {
      mockRequest.query = { endDate: '2023-01-31T23:59:59.999Z' };

      await auditController.getDateRangeHistory(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Missing required query parameters: startDate and endDate',
        400
      );
      expect(auditService.getDateRangeHistory).not.toHaveBeenCalled();
    });

    it('should return 400 error when endDate is missing', async () => {
      mockRequest.query = { startDate: '2023-01-01T00:00:00.000Z' };

      await auditController.getDateRangeHistory(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Missing required query parameters: startDate and endDate',
        400
      );
      expect(auditService.getDateRangeHistory).not.toHaveBeenCalled();
    });

    it('should return 400 error when both dates are missing', async () => {
      mockRequest.query = {};

      await auditController.getDateRangeHistory(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Missing required query parameters: startDate and endDate',
        400
      );
      expect(auditService.getDateRangeHistory).not.toHaveBeenCalled();
    });

    it('should handle service errors', async () => {
      mockRequest.query = {
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-01-31T23:59:59.999Z'
      };
      const error = new Error('Service error');
      auditService.getDateRangeHistory.mockRejectedValue(error);

      await auditController.getDateRangeHistory(mockRequest as Request, mockResponse as Response);

      expect(sendError).toHaveBeenCalledWith(
        mockRequest,
        mockResponse,
        'Failed to fetch date range history',
        500,
        { errorMessage: 'Service error', exc_info: error.stack }
      );
    });

    it('should handle invalid date formats', async () => {
      mockRequest.query = {
        startDate: 'invalid-date',
        endDate: '2023-01-31T23:59:59.999Z'
      };
      auditService.getDateRangeHistory.mockResolvedValue([]);

      await auditController.getDateRangeHistory(mockRequest as Request, mockResponse as Response);

      expect(auditService.getDateRangeHistory).toHaveBeenCalledWith(
        expect.any(Date),
        new Date('2023-01-31T23:59:59.999Z')
      );
      // Note: The controller doesn't validate date formats, it just passes them to the service
    });

    it('should return empty array when no history found in date range', async () => {
      mockRequest.query = {
        startDate: '2023-02-01T00:00:00.000Z',
        endDate: '2023-02-28T23:59:59.999Z'
      };
      auditService.getDateRangeHistory.mockResolvedValue([]);

      await auditController.getDateRangeHistory(mockRequest as Request, mockResponse as Response);

      expect(sendSuccess).toHaveBeenCalledWith(mockRequest, mockResponse, []);
    });
  });
}); 