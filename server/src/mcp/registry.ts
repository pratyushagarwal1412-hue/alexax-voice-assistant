import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { executeGetTime, getTimeSchema } from './tools/timeTool.js';
import { executeCalculate, calcSchema } from './tools/calcTool.js';
import { executeCreateNote, executeSearchNotes, createNoteSchema, searchNotesSchema } from './tools/noteTool.js';
import { executeGetWeather, weatherSchema } from './tools/weatherTool.js';
import { executeManageTasks, manageTasksSchema } from './tools/taskTool.js';

export interface ToolDefinition {
  name: string;
  description: string;
  zodShape: Record<string, z.ZodTypeAny>;
  jsonSchema: Record<string, any>;
  execute: (args: any) => Promise<any>;
}

export const toolsRegistry: Record<string, ToolDefinition> = {
  get_current_time: {
    name: 'get_current_time',
    description: 'Get the current local time, date, weekday, and ISO timestamp for a specified timezone or the system default.',
    zodShape: {
      timezone: z.string().optional().describe('Optional IANA timezone name, e.g. "America/New_York", "Asia/Kolkata", "Europe/London", "UTC"')
    },
    jsonSchema: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description: 'Optional IANA timezone name, e.g. "America/New_York", "Asia/Kolkata", "Europe/London", "UTC"'
        }
      }
    },
    execute: executeGetTime
  },

  calculate: {
    name: 'calculate',
    description: 'Evaluate mathematical expressions safely, supporting addition, subtraction, multiplication, division, powers, percentages (e.g. "15% of 85"), and math functions.',
    zodShape: {
      expression: z.string().describe('Mathematical expression to calculate, e.g. "15% of 85", "sqrt(144) + 25 * 3"')
    },
    jsonSchema: {
      type: 'object',
      required: ['expression'],
      properties: {
        expression: {
          type: 'string',
          description: 'Mathematical expression to calculate, e.g. "15% of 85", "sqrt(144) + 25 * 3"'
        }
      }
    },
    execute: executeCalculate
  },

  create_note: {
    name: 'create_note',
    description: 'Create and save a persistent note with a title, body content, and optional categorization tags.',
    zodShape: {
      title: z.string().min(1).describe('Title of the note'),
      content: z.string().min(1).describe('Detailed content or body of the note'),
      tags: z.array(z.string()).optional().describe('Optional list of tag labels for categorizing the note')
    },
    jsonSchema: {
      type: 'object',
      required: ['title', 'content'],
      properties: {
        title: { type: 'string', description: 'Title of the note' },
        content: { type: 'string', description: 'Detailed content or body of the note' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional list of tag labels' }
      }
    },
    execute: executeCreateNote
  },

  search_notes: {
    name: 'search_notes',
    description: 'Search persistent notes by keyword in title/content or by specific tag label.',
    zodShape: {
      query: z.string().optional().describe('Keyword or phrase to search within note titles and contents'),
      tag: z.string().optional().describe('Specific tag to filter notes by')
    },
    jsonSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Keyword or phrase to search' },
        tag: { type: 'string', description: 'Specific tag to filter notes by' }
      }
    },
    execute: executeSearchNotes
  },

  get_weather: {
    name: 'get_weather',
    description: 'Fetch real-time weather information for any city or location worldwide via Open-Meteo, with fallback demo data if offline.',
    zodShape: {
      city: z.string().min(1).describe('City name, e.g. "Tokyo", "London", "New York", "San Francisco"'),
      units: z.enum(['celsius', 'fahrenheit']).optional().describe('Temperature unit (celsius or fahrenheit)')
    },
    jsonSchema: {
      type: 'object',
      required: ['city'],
      properties: {
        city: { type: 'string', description: 'City name, e.g. "Tokyo", "London", "New York"' },
        units: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature unit' }
      }
    },
    execute: executeGetWeather
  },

  manage_tasks: {
    name: 'manage_tasks',
    description: 'Manage tasks: create a new task, list tasks (filtered by all/pending/completed), mark a task complete, or delete a task.',
    zodShape: {
      action: z.enum(['create', 'list', 'complete', 'delete']).describe('Action: create, list, complete, or delete'),
      title: z.string().optional().describe('Title of the task (required for create, or search query for complete/delete)'),
      description: z.string().optional().describe('Optional detailed description for the task'),
      priority: z.enum(['low', 'medium', 'high']).optional().describe('Priority level: low, medium, high'),
      due_date: z.string().optional().describe('Optional due date string'),
      taskId: z.string().optional().describe('Specific task ID for complete or delete'),
      filter: z.enum(['all', 'pending', 'completed']).optional().describe('Filter when listing tasks')
    },
    jsonSchema: {
      type: 'object',
      required: ['action'],
      properties: {
        action: { type: 'string', enum: ['create', 'list', 'complete', 'delete'], description: 'Action to perform' },
        title: { type: 'string', description: 'Title of the task' },
        description: { type: 'string', description: 'Detailed description' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority level' },
        due_date: { type: 'string', description: 'Optional due date' },
        taskId: { type: 'string', description: 'Specific task ID' },
        filter: { type: 'string', enum: ['all', 'pending', 'completed'], description: 'Filter when listing' }
      }
    },
    execute: executeManageTasks
  }
};

/**
 * Registers all tools onto the official MCP Server instance.
 */
export function registerAllMcpTools(mcpServer: McpServer): void {
  for (const [name, tool] of Object.entries(toolsRegistry)) {
    mcpServer.tool(
      name,
      tool.description,
      tool.zodShape,
      async (args: any) => {
        try {
          const result = await tool.execute(args);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        } catch (err: any) {
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: JSON.stringify({ success: false, error: err.message }, null, 2)
              }
            ]
          };
        }
      }
    );
  }
}

/**
 * Executes a tool directly by name.
 */
export async function executeToolDirect(name: string, args: any): Promise<any> {
  const tool = toolsRegistry[name];
  if (!tool) {
    throw new Error(`Tool "${name}" not found in MCP tools registry.`);
  }
  return await tool.execute(args);
}

/**
 * Returns formatted tool list for UI inspection and LLM schemas.
 */
export function getToolsList() {
  return Object.values(toolsRegistry).map(t => ({
    name: t.name,
    description: t.description,
    inputSchema: t.jsonSchema
  }));
}
