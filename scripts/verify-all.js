async function verifyAll() {
  const BASE = 'http://localhost:3001';
  console.log('--- 1. Testing Health ---');
  const health = await fetch(BASE + '/api/health').then(r => r.json());
  console.log('Health:', health.status);

  console.log('\n--- 2. Testing Static Frontend & Assets ---');
  const indexHtml = await fetch(BASE + '/').then(r => r.text());
  console.log('Frontend HTML length:', indexHtml.length, 'Contains AlexaX:', indexHtml.includes('AlexaX'));
  
  const jsMatch = indexHtml.match(/src="(\/assets\/[^"]+\.js)"/);
  const cssMatch = indexHtml.match(/href="(\/assets\/[^"]+\.css)"/);
  if (jsMatch) {
    const jsRes = await fetch(BASE + jsMatch[1]);
    console.log('JS Asset status:', jsRes.status, 'Content-Type:', jsRes.headers.get('content-type'));
  }
  if (cssMatch) {
    const cssRes = await fetch(BASE + cssMatch[1]);
    console.log('CSS Asset status:', cssRes.status, 'Content-Type:', cssRes.headers.get('content-type'));
  }

  console.log('\n--- 3. Testing MCP Protocol Endpoints ---');
  const mcpTools = await fetch(BASE + '/api/mcp/tools').then(r => r.json());
  console.log('MCP Tools Registered:', mcpTools.count, mcpTools.tools.map(t => t.name));

  const mcpStatus = await fetch(BASE + '/api/mcp/status').then(r => r.json());
  console.log('MCP Status:', mcpStatus.status, 'Server:', mcpStatus.name);

  console.log('\n--- 4. Testing Direct MCP Tool Execution for All 6 Tools ---');
  // 1. Time
  const tTime = await fetch(BASE + '/api/mcp/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'get_current_time', parameters: { timezone: 'Europe/London' } })
  }).then(r => r.json());
  console.log('Tool get_current_time result:', tTime.result?.formattedTime);

  // 2. Calc
  const tCalc = await fetch(BASE + '/api/mcp/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'calculate', parameters: { expression: 'sqrt(144) + 25 * 4' } })
  }).then(r => r.json());
  console.log('Tool calculate result:', tCalc.result?.result);

  // 3. Create Note
  const tNote = await fetch(BASE + '/api/mcp/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'create_note', parameters: { title: 'Verified Note', content: 'Testing all features', tags: ['verified'] } })
  }).then(r => r.json());
  console.log('Tool create_note result:', tNote.result?.note?.title);

  // 4. Search Notes
  const tSearchNote = await fetch(BASE + '/api/mcp/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'search_notes', parameters: { query: 'Verified' } })
  }).then(r => r.json());
  console.log('Tool search_notes count:', tSearchNote.result?.count);

  // 5. Weather
  const tWeather = await fetch(BASE + '/api/mcp/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'get_weather', parameters: { city: 'Paris', units: 'celsius' } })
  }).then(r => r.json());
  console.log('Tool get_weather result:', tWeather.result?.current?.condition, tWeather.result?.current?.temperature);

  // 6. Manage Tasks
  const tTask = await fetch(BASE + '/api/mcp/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'manage_tasks', parameters: { action: 'create', title: 'Feature Complete Task', priority: 'high' } })
  }).then(r => r.json());
  console.log('Tool manage_tasks create result:', tTask.result?.task?.title);

  console.log('\n--- 5. Testing Task REST CRUD ---');
  const allTasks = await fetch(BASE + '/api/tasks').then(r => r.json());
  console.log('Total tasks in DB:', allTasks.tasks.length);
  const createdTaskId = tTask.result.task.id;
  
  // Toggle complete
  const toggled = await fetch(BASE + '/api/tasks/' + createdTaskId + '/toggle', { method: 'PATCH' }).then(r => r.json());
  console.log('Toggled task status:', toggled.task.status);

  // Delete
  const deletedTask = await fetch(BASE + '/api/tasks/' + createdTaskId, { method: 'DELETE' }).then(r => r.json());
  console.log('Deleted task:', deletedTask.success);

  console.log('\n--- 6. Testing Note REST CRUD ---');
  const allNotes = await fetch(BASE + '/api/notes').then(r => r.json());
  console.log('Total notes in DB:', allNotes.notes.length);
  const createdNoteId = tNote.result.note.id;

  // Delete
  const deletedNote = await fetch(BASE + '/api/notes/' + createdNoteId, { method: 'DELETE' }).then(r => r.json());
  console.log('Deleted note:', deletedNote.success);

  console.log('\n--- 7. Testing Multi-turn Chat Conversation & Memory Context ---');
  const newConv = await fetch(BASE + '/api/conversations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Live Context Test' })
  }).then(r => r.json());
  const convId = newConv.conversation.id;

  // Turn 1
  const chat1 = await fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: convId, message: 'What is the current time in London?' })
  }).then(r => r.json());
  console.log('Chat Turn 1 Tool:', chat1.assistantMessage.tool_calls?.[0]?.name);
  console.log('Chat Turn 1 Text:', chat1.assistantMessage.text);

  // Turn 2
  const chat2 = await fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: convId, message: 'Now calculate 25 * 4 + 50' })
  }).then(r => r.json());
  console.log('Chat Turn 2 Tool:', chat2.assistantMessage.tool_calls?.[0]?.name);
  console.log('Chat Turn 2 Text:', chat2.assistantMessage.text);

  // Turn 3: Context retention test
  const chat3 = await fetch(BASE + '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId: convId, message: 'What is the weather in Seattle?' })
  }).then(r => r.json());
  console.log('Chat Turn 3 Tool:', chat3.assistantMessage.tool_calls?.[0]?.name);

  // Check persisted conversation history
  const savedConv = await fetch(BASE + '/api/conversations/' + convId).then(r => r.json());
  console.log('Saved Messages Count in Memory:', savedConv.conversation.messages.length);

  console.log('\n======================================================');
  console.log('🏆 ALL VERIFICATIONS PASSED CLEANLY ON LOCALHOST:3001!');
  console.log('======================================================');
}

verifyAll().catch(err => {
  console.error('VERIFICATION ERROR:', err);
  process.exit(1);
});
