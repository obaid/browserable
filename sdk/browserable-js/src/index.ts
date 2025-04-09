import axios, { AxiosInstance } from 'axios';
import {
  BrowserableConfig,
  CreateTaskOptions,
  PaginationOptions,
  Task,
  TaskRun,
  TaskRunStatus,
  TaskRunResult,
  ApiResponse,
  WaitForRunOptions,
} from './types';

export class Browserable {
  private client: AxiosInstance;
  private static DEFAULT_BASE_URL = 'https://api.browserable.ai/api/v1';

  constructor(config: BrowserableConfig) {
    this.client = axios.create({
      baseURL: config.baseURL || Browserable.DEFAULT_BASE_URL,
      headers: {
        'x-api-key': config.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create a new task
   */
  async createTask(options: CreateTaskOptions): Promise<ApiResponse<{ taskId: string }>> {
    const response = await this.client.post<ApiResponse<{ taskId: string }>>('/task/create', options);
    return response.data;
  }

  /**
   * List all tasks
   */
  async listTasks(options?: PaginationOptions): Promise<ApiResponse<Task[]>> {
    const response = await this.client.get<ApiResponse<Task[]>>('/tasks', {
      params: options,
    });
    return response.data;
  }

  /**
   * List all runs for a task
   */
  async listTaskRuns(taskId: string, options?: PaginationOptions): Promise<ApiResponse<TaskRun[]>> {
    const response = await this.client.get<ApiResponse<TaskRun[]>>(`/task/${taskId}/runs`, {
      params: options,
    });
    return response.data;
  }

  /**
   * Get task run status
   */
  async getTaskRunStatus(taskId: string, runId?: string): Promise<ApiResponse<TaskRunStatus>> {
    const response = await this.client.get<ApiResponse<TaskRunStatus>>(`/task/${taskId}/run/status`, {
      params: { runId },
    });
    return response.data;
  }

  /**
   * Get task run result
   */
  async getTaskRunResult(taskId: string, runId?: string): Promise<ApiResponse<TaskRunResult>> {
    const response = await this.client.get<ApiResponse<TaskRunResult>>(`/task/${taskId}/run/result`, {
      params: { runId },
    });
    return response.data;
  }

  /**
   * Stop a task run
   */
  async stopTaskRun(taskId: string, runId?: string): Promise<ApiResponse<void>> {
    const response = await this.client.put<ApiResponse<void>>(`/task/${taskId}/run/stop`, null, {
      params: { runId },
    });
    return response.data;
  }

  /**
   * Stop a task
   */
  async stopTask(taskId: string): Promise<ApiResponse<void>> {
    const response = await this.client.put<ApiResponse<void>>(`/task/${taskId}/stop`, null);
    return response.data;
  }

  /**
   * Check if API key is valid
   */
  async check(): Promise<ApiResponse<'ok'>> {
    const response = await this.client.get<ApiResponse<'ok'>>('/check');
    return response.data;
  }

  /**
   * Wait for a task run to complete or error out
   */
  async waitForRun(taskId: string, runId?: string, options: WaitForRunOptions = {}): Promise<ApiResponse<TaskRunResult>> {
    const {
      pollInterval = 1000,
      timeout = 300000, // 5 minutes default timeout
      onStatusChange,
    } = options;

    const startTime = Date.now();

    while (true) {
      const statusResult = await this.getTaskRunStatus(taskId, runId);

      if (!statusResult.success) {
        throw new Error(`Failed to get task status: ${statusResult.error}`);
      }

      const status = statusResult.data?.status;
      
      // Notify status change if callback provided
      if (onStatusChange && statusResult.data) {
        onStatusChange(statusResult.data);
      }

      if (status === 'completed' || status === 'error') {
        return this.getTaskRunResult(taskId, runId);
      }

      // Check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout waiting for task completion');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }
}

export * from './types'; 