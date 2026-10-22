import { taskRepo } from './taskRepo.js';
import { noteRepo } from './noteRepo.js';
import { chatRepo } from './chatRepo.js';

export function seedInitialDataIfNeeded(): void {
  const existingTasks = taskRepo.getAll();
  const existingNotes = noteRepo.getAll();

  if (existingTasks.length === 0) {
    console.log('[Seed] Seeding sample tasks...');
    taskRepo.create({
      title: 'Review Alexa+ submission and test MCP tools',
      description: 'Test all 6 MCP tools: get_current_time, calculate, create_note, search_notes, get_weather, manage_tasks.',
      priority: 'high',
      due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
    });

    const completedTask = taskRepo.create({
      title: 'Initialize AlexaX voice assistant architecture',
      description: 'Set up Express server, React dashboard, Web Speech API integration, and SQLite persistence.',
      priority: 'high'
    });
    taskRepo.toggleComplete(completedTask.id);

    taskRepo.create({
      title: 'Prepare project presentation and voice demo',
      description: 'Record hands-free voice interaction demo and highlight MCP protocol capabilities.',
      priority: 'medium',
      due_date: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0]
    });

    taskRepo.create({
      title: 'Buy groceries: organic oat milk, espresso beans, berries',
      description: 'From whole foods or local market.',
      priority: 'low'
    });
  }

  if (existingNotes.length === 0) {
    console.log('[Seed] Seeding sample notes...');
    noteRepo.create({
      title: 'AlexaX Architecture & MCP Overview',
      content: 'AlexaX integrates Model Context Protocol (MCP) TypeScript SDK v1.32+ with a robust tool layer: Time, Calculator, Notes, Weather, and Task management. Supports real-time browser speech recognition, speech synthesis, and SQLite persistence.',
      tags: ['architecture', 'mcp', 'alexax', 'voice']
    });

    noteRepo.create({
      title: 'Voice Agent Prompt Ideas',
      content: 'Try asking:\n1. "What time is it in Tokyo?"\n2. "Calculate 15% tip on $85.50"\n3. "What is the weather in Seattle?"\n4. "Add a task to prepare lunch tomorrow"\n5. "Take a note about my presentation ideas"',
      tags: ['guide', 'prompts', 'alexax']
    });

    noteRepo.create({
      title: 'Smart Home & Assistant Wishlist',
      content: 'Future expansion: Home Assistant integration via MCP SSE transport, Spotify API control, multi-speaker voice profiles.',
      tags: ['roadmap', 'ideas']
    });
  }

  const existingConversations = chatRepo.getConversations();
  if (existingConversations.length === 0) {
    console.log('[Seed] Seeding welcome conversation...');
    const conv = chatRepo.createConversation('Welcome to AlexaX');
    chatRepo.addMessage({
      conversationId: conv.id,
      sender: 'assistant',
      text: "👋 Hello! I am **AlexaX**, your intelligent AI agent powered by Model Context Protocol (MCP).\n\nYou can chat with me using text or voice! Try asking:\n- *\"What time is it in London?\"*\n- *\"Calculate 25 * 14 + 180\"*\n- *\"What's the weather in San Francisco?\"*\n- *\"Add a task to submit the challenge\"*\n- *\"Take a note: Meeting tomorrow at 10 AM\"*\n\nHow can I help you today?"
    });
  }
}
