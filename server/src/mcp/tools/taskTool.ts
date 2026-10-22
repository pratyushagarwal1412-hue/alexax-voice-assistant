import { z } from 'zod';
import { taskRepo, Task } from '../../db/taskRepo.js';

export const manageTasksSchema = z.object({
  action: z.enum(['create', 'list', 'complete', 'delete']).describe('Action to perform on tasks: create, list, complete, or delete'),
  title: z.string().optional().describe('Title of the task (required for "create", or search query for complete/delete if ID is omitted)'),
  description: z.string().optional().describe('Detailed description or notes for the task'),
  priority: z.enum(['low', 'medium', 'high']).optional().describe('Priority level (low, medium, high)'),
  due_date: z.string().optional().describe('Optional due date in YYYY-MM-DD or readable string format'),
  taskId: z.string().optional().describe('Task ID to complete or delete'),
  filter: z.enum(['all', 'pending', 'completed']).optional().describe('Filter for listing tasks: all, pending, or completed')
});

export type ManageTasksInput = z.infer<typeof manageTasksSchema>;

export async function executeManageTasks(input: ManageTasksInput) {
  const action = input.action;

  switch (action) {
    case 'create': {
      if (!input.title || input.title.trim() === '') {
        return {
          success: false,
          error: 'Title is required when creating a task.'
        };
      }

      const task = taskRepo.create({
        title: input.title.trim(),
        description: input.description,
        priority: input.priority || 'medium',
        due_date: input.due_date
      });

      return {
        success: true,
        action: 'create',
        message: `Task "${task.title}" added to your task list with ${task.priority} priority.`,
        task
      };
    }

    case 'list': {
      const filter = input.filter || 'all';
      const tasks = taskRepo.getAll(filter);
      return {
        success: true,
        action: 'list',
        filter,
        count: tasks.length,
        tasks
      };
    }

    case 'complete': {
      let targetTask: Task | null = null;

      if (input.taskId) {
        targetTask = taskRepo.getById(input.taskId);
      } else if (input.title) {
        const matches = taskRepo.search(input.title);
        if (matches.length > 0) {
          targetTask = matches[0];
        }
      }

      if (!targetTask) {
        return {
          success: false,
          error: `Could not find task to complete with id="${input.taskId || ''}" or title="${input.title || ''}".`
        };
      }

      const updated = taskRepo.toggleComplete(targetTask.id);
      return {
        success: true,
        action: 'complete',
        message: `Task "${updated?.title}" marked as ${updated?.status}.`,
        task: updated
      };
    }

    case 'delete': {
      let targetTask: Task | null = null;

      if (input.taskId) {
        targetTask = taskRepo.getById(input.taskId);
      } else if (input.title) {
        const matches = taskRepo.search(input.title);
        if (matches.length > 0) {
          targetTask = matches[0];
        }
      }

      if (!targetTask) {
        return {
          success: false,
          error: `Could not find task to delete with id="${input.taskId || ''}" or title="${input.title || ''}".`
        };
      }

      taskRepo.delete(targetTask.id);
      return {
        success: true,
        action: 'delete',
        message: `Task "${targetTask.title}" has been deleted.`,
        deletedTaskId: targetTask.id,
        deletedTaskTitle: targetTask.title
      };
    }

    default:
      return {
        success: false,
        error: `Unknown action "${action}". Allowed: create, list, complete, delete.`
      };
  }
}
