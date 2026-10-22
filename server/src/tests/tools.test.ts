import test from 'node:test';
import assert from 'node:assert/strict';
import { executeGetTime } from '../mcp/tools/timeTool.js';
import { executeCalculate } from '../mcp/tools/calcTool.js';
import { executeCreateNote, executeSearchNotes } from '../mcp/tools/noteTool.js';
import { executeGetWeather } from '../mcp/tools/weatherTool.js';
import { executeManageTasks } from '../mcp/tools/taskTool.js';
import { getToolsList, executeToolDirect } from '../mcp/registry.js';

test('MCP Tools Registry exposes all 6 required tools with valid schemas', () => {
  const tools = getToolsList();
  assert.equal(tools.length, 6);
  const names = tools.map(t => t.name);
  assert.ok(names.includes('get_current_time'));
  assert.ok(names.includes('calculate'));
  assert.ok(names.includes('create_note'));
  assert.ok(names.includes('search_notes'));
  assert.ok(names.includes('get_weather'));
  assert.ok(names.includes('manage_tasks'));

  for (const t of tools) {
    assert.ok(t.description && t.description.length > 5);
    assert.equal(t.inputSchema.type, 'object');
  }
});

test('Tool: get_current_time returns valid time and timezone', async () => {
  const result = await executeGetTime({ timezone: 'UTC' });
  assert.equal(result.success, true);
  assert.equal(result.timezone, 'UTC');
  assert.ok(result.formattedTime.length > 0);
  assert.ok(result.timestamp > 0);
});

test('Tool: calculate handles arithmetic and percentages', async () => {
  const addRes = await executeCalculate({ expression: '25 + 75' });
  assert.equal(addRes.success, true);
  assert.equal(addRes.result, 100);

  const multRes = await executeCalculate({ expression: '12 * 8' });
  assert.equal(multRes.success, true);
  assert.equal(multRes.result, 96);

  const tipRes = await executeCalculate({ expression: '15% of 80' });
  assert.equal(tipRes.success, true);
  assert.equal(tipRes.result, 12);
});

test('Tool: create_note and search_notes persist and find data', async () => {
  const noteRes = await executeCreateNote({
    title: 'Automated Test Note',
    content: 'Testing note storage in SQLite database',
    tags: ['test', 'automated']
  });

  assert.equal(noteRes.success, true);
  assert.equal(noteRes.note.title, 'Automated Test Note');
  assert.ok(noteRes.note.id);

  const searchRes = await executeSearchNotes({ query: 'Automated' });
  assert.equal(searchRes.success, true);
  assert.ok(searchRes.count >= 1);
  const found = searchRes.notes.find(n => n.id === noteRes.note.id);
  assert.ok(found);
  assert.equal(found?.title, 'Automated Test Note');
});

test('Tool: get_weather returns structured weather data', async () => {
  const weatherRes = await executeGetWeather({ city: 'Tokyo', units: 'celsius' });
  assert.equal(weatherRes.success, true);
  assert.ok(weatherRes.location.name);
  assert.ok(weatherRes.current.temperature);
  assert.ok(weatherRes.current.condition);
  assert.ok(weatherRes.formattedSummary.length > 10);
});

test('Tool: manage_tasks supports create, list, complete, delete lifecycle', async () => {
  // 1. Create
  const createRes = await executeManageTasks({
    action: 'create',
    title: 'Unit Test Task',
    priority: 'high',
    description: 'A task created during test execution'
  });
  assert.equal(createRes.success, true);
  assert.equal(createRes.action, 'create');
  assert.equal(createRes.task.title, 'Unit Test Task');
  assert.equal(createRes.task.status, 'pending');
  const taskId = createRes.task.id;

  // 2. List
  const listRes = await executeManageTasks({ action: 'list', filter: 'all' });
  assert.equal(listRes.success, true);
  assert.ok(listRes.tasks.some((t: any) => t.id === taskId));

  // 3. Complete
  const completeRes = await executeManageTasks({ action: 'complete', taskId });
  assert.equal(completeRes.success, true);
  assert.equal(completeRes.task.status, 'completed');

  // 4. Delete
  const deleteRes = await executeManageTasks({ action: 'delete', taskId });
  assert.equal(deleteRes.success, true);
  assert.equal(deleteRes.deletedTaskId, taskId);
});

test('executeToolDirect dispatches to tools registry cleanly', async () => {
  const res = await executeToolDirect('calculate', { expression: '7 * 7' });
  assert.equal(res.success, true);
  assert.equal(res.result, 49);
});
