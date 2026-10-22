import { Router, Request, Response } from 'express';
import { chatRepo } from '../db/chatRepo.js';
import { processUserMessage } from '../agent/orchestrator.js';

export const chatRoutes = Router();

// Get all conversations
chatRoutes.get('/conversations', (req: Request, res: Response) => {
  try {
    const list = chatRepo.getConversations();
    res.json({ success: true, conversations: list });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create a new conversation
chatRoutes.post('/conversations', (req: Request, res: Response) => {
  try {
    const title = req.body.title || 'New Conversation';
    const conv = chatRepo.createConversation(title);
    res.json({ success: true, conversation: conv });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get a specific conversation with its full message history
chatRoutes.get('/conversations/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const conv = chatRepo.getConversationById(id);
    if (!conv) {
      res.status(404).json({ success: false, error: 'Conversation not found' });
      return;
    }
    res.json({ success: true, conversation: conv });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete a conversation
chatRoutes.delete('/conversations/:id', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    chatRepo.deleteConversation(id);
    res.json({ success: true, message: 'Conversation deleted.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Post a chat message
chatRoutes.post('/chat', async (req: Request, res: Response) => {
  try {
    const { conversationId, message, provider, apiKey } = req.body;

    if (!message || message.trim() === '') {
      res.status(400).json({ success: false, error: 'Message cannot be empty.' });
      return;
    }

    let activeConvId = conversationId;
    if (!activeConvId) {
      const newConv = chatRepo.createConversation();
      activeConvId = newConv.id;
    }

    const result = await processUserMessage({
      conversationId: activeConvId,
      userText: message,
      provider,
      apiKey
    });

    res.json({
      success: true,
      conversationId: activeConvId,
      userMessage: result.userMessage,
      assistantMessage: result.assistantMessage,
      providerUsed: result.providerUsed
    });
  } catch (err: any) {
    console.error('[Chat API] Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
