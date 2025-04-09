/// <reference types="jest" />
import { Browserable } from './index';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Browserable SDK', () => {
  let browserable: Browserable;
  const mockApiKey = 'test-api-key';
  let mockAxiosInstance: jest.Mocked<typeof axios>;

  beforeEach(() => {
    mockAxiosInstance = {
      ...mockedAxios,
      post: jest.fn(),
      get: jest.fn(),
      put: jest.fn(),
    } as any;
    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    browserable = new Browserable({ apiKey: mockApiKey });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { taskId: 'test-task-id' }
        }
      };
      mockAxiosInstance.post.mockResolvedValueOnce(mockResponse);

      const result = await browserable.createTask({
        task: 'Test task'
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/task/create', {
        task: 'Test task'
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('listTasks', () => {
    it('should list tasks with pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'task-1',
              status: 'active',
              readable_name: 'Test Task 1'
            }
          ],
          total: 1,
          page: 1,
          limit: 10
        }
      };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await browserable.listTasks({
        page: 1,
        limit: 10
      });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/tasks', {
        params: { page: 1, limit: 10 }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('check', () => {
    it('should verify API key successfully', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: 'ok'
        }
      };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const result = await browserable.check();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/check');
      expect(result).toEqual(mockResponse.data);
    });
  });
}); 