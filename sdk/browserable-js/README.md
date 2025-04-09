# Browserable JavaScript SDK

A JavaScript/TypeScript SDK for interacting with the Browserable API.

## Installation

```bash
npm install browserable-js
```

## Usage

```typescript
import { Browserable } from 'browserable-js';

// Initialize the SDK
const browserable = new Browserable({
  apiKey: 'your-api-key',
  // Optional: override the base URL (defaults to https://api.browserable.ai/api/v1)
  // baseURL: 'https://custom-api.example.com/api/v1'
});

// Create a new task
const createTask = async () => {
  const result = await browserable.createTask({
    task: 'Visit example.com and extract all links',
    agents: ['BROWSER_AGENT'], // Optional
    triggers: ['once|0|'] // Optional
  });
  console.log('Task created:', result.data?.taskId);
};

// List all tasks
const listTasks = async () => {
  const result = await browserable.listTasks({
    page: 1,
    limit: 10
  });
  console.log('Tasks:', result.data);
};

// Get task run status
const getStatus = async (taskId: string, runId?: string) => {
  const result = await browserable.getTaskRunStatus(taskId, runId);
  console.log('Status:', result.data);
};

// Get task run result
const getResult = async (taskId: string, runId?: string) => {
  const result = await browserable.getTaskRunResult(taskId, runId);
  console.log('Result:', result.data);
};

// Stop a task run
const stopRun = async (taskId: string, runId?: string) => {
  const result = await browserable.stopTaskRun(taskId, runId);
  console.log('Run stopped:', result.success);
};

// Stop a task
const stopTask = async (taskId: string) => {
  const result = await browserable.stopTask(taskId);
  console.log('Task stopped:', result.success);
};
```

## API Reference

### Constructor

```typescript
new Browserable(config: BrowserableConfig)
```

- `config.apiKey` (required): Your Browserable API key
- `config.baseURL` (optional): Override the default API base URL

### Methods

#### `createTask(options: CreateTaskOptions)`
Create a new automated browser task.

#### `listTasks(options?: PaginationOptions)`
List all tasks for the authenticated user.

#### `listTaskRuns(taskId: string, options?: PaginationOptions)`
List all runs for a specific task.

#### `getTaskRunStatus(taskId: string, runId?: string)`
Get the status of a specific task run.

#### `getTaskRunResult(taskId: string, runId?: string)`
Get the results of a specific task run.

#### `stopTaskRun(taskId: string, runId?: string)`
Stop a running task execution.

#### `stopTask(taskId: string)`
Stop a task from running future executions.

#### `check()`
Verify if your API key is valid.

## Error Handling

All methods return a Promise that resolves to an `ApiResponse` object with the following structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  total?: number;
  page?: number;
  limit?: number;
}
```

## License

MIT 