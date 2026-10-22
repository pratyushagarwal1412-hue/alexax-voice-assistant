import test from 'node:test';
import assert from 'node:assert/strict';
import { processUserMessage } from '../agent/orchestrator.js';
import { chatRepo } from '../db/chatRepo.js';
import { taskRepo } from '../db/taskRepo.js';
import { noteRepo } from '../db/noteRepo.js';

test('Chat Orchestrator: handles multi-turn conversation and maintains context', async () => {
  const conv = chatRepo.createConversation('Integration Test Conversation');
  
  // Turn 1: Ask for time
  const turn1 = await processUserMessage({
    conversationId: conv.id,
    userText: 'What time is it in Tokyo?'
  });

  assert.equal(turn1.userMessage.text, 'What time is it in Tokyo?');
  assert.ok(turn1.assistantMessage.text.includes('Tokyo') || turn1.assistantMessage.text.includes('time'));
  assert.equal(turn1.assistantMessage.tool_calls?.[0]?.name, 'get_current_time');

  // Turn 2: Math request in the same conversation
  const turn2 = await processUserMessage({
    conversationId: conv.id,
    userText: 'Calculate 25 * 4'
  });

  assert.ok(turn2.assistantMessage.text.includes('100'));
  assert.equal(turn2.assistantMessage.tool_calls?.[0]?.name, 'calculate');

  // Verify memory in SQLite
  const messages = chatRepo.getMessages(conv.id);
  assert.ok(messages.length >= 4); // 2 user messages + 2 assistant messages
});

test('Chat Orchestrator: executes task creation via natural language', async () => {
  const conv = chatRepo.createConversation('Task NLP Test');
  const result = await processUserMessage({
    conversationId: conv.id,
    userText: 'Add a task to buy organic coffee beans high priority'
  });

  assert.ok(result.assistantMessage.tool_calls?.[0]?.name === 'manage_tasks');
  assert.ok(result.assistantMessage.text.toLowerCase().includes('organic coffee beans'));

  // Verify task was saved in SQLite
  const tasks = taskRepo.search('organic coffee beans');
  assert.ok(tasks.length > 0);
  assert.equal(tasks[0].priority, 'high');
});

test('Chat Orchestrator: executes note creation via natural language', async () => {
  const conv = chatRepo.createConversation('Note NLP Test');
  const result = await processUserMessage({
    conversationId: conv.id,
    userText: 'Take a note: AlexaX presentation deck draft'
  });

  assert.ok(result.assistantMessage.tool_calls?.[0]?.name === 'create_note');
  assert.ok(result.assistantMessage.text.includes('presentation deck draft'));

  const notes = noteRepo.search('presentation deck draft');
  assert.ok(notes.length > 0);
});
