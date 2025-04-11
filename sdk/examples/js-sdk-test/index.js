import { Browserable } from 'browserable-js';

// Initialize the SDK
const browserable = new Browserable({
  apiKey: '43c42f35b0b6b3b30fdfd2fcf07ba7fdf179f5831207153448b77c9eee99711d',
  baseURL: 'http://localhost:2003/api/v1'
});

// Create and run a task
async function runTask() {
  // Create a new task
  const createResult = await browserable.createTask({
    task: 'find the top trending GitHub repos of the day.',
    agent: 'BROWSER_AGENT'
  });

  if (!createResult.success || !createResult.data) {
    console.error('Failed to create task:', createResult.error);
    return;
  }

  const taskId = createResult.data.taskId;

  // Wait for task completion with status updates
  try {
    const result = await browserable.waitForRun(taskId, undefined, {
      // Optional: customize polling interval (default: 1000ms)
      pollInterval: 2000,
      // Optional: customize timeout (default: 5 minutes)
      timeout: 600000, // 10 minutes
      // Optional: handle status updates
      onStatusChange: (status) => {
        console.log('Current status:', status.status);
        if (status.liveStatus) {
          console.log('Live status:', status.liveStatus);
        }
      }
    });

    if (result.success && result.data) {
      console.log('Task completed successfully!');
      console.log('Results:', result.data);
    }
  } catch (error) {
    if (error.message.includes('Timeout')) {
      console.error('Task took too long to complete');
    } else {
      console.error('Error while waiting for task:', error);
    }
  }
}

runTask().catch(console.error);