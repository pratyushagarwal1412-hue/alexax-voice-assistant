import React, { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Menu } from 'lucide-react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { ChatView } from './components/chat/ChatView';
import { TaskView } from './components/tasks/TaskView';
import { NoteView } from './components/notes/NoteView';
import { McpExplorerView } from './components/mcp/McpExplorerView';
import { SettingsModal } from './components/settings/SettingsModal';
import { api } from './services/api';
import { speechService } from './services/speech';
import { Conversation, ChatMessage, Task, Note, McpTool, Settings } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'tasks' | 'notes' | 'mcp'>('chat');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [mcpTools, setMcpTools] = useState<McpTool[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentlySpeakingText, setCurrentlySpeakingText] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Settings in localStorage
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('alexax_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      provider: 'mock',
      apiKey: '',
      autoSpeak: true,
      voiceIndex: 0,
      speechRate: 1.0,
      speechPitch: 1.0
    };
  });

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem('alexax_settings', JSON.stringify(newSettings));
    } catch {}
  };

  // Initial data load
  const loadInitialData = useCallback(async () => {
    try {
      const [convList, taskList, noteList, toolList] = await Promise.all([
        api.getConversations(),
        api.getTasks(),
        api.getNotes(),
        api.getMcpTools()
      ]);

      setConversations(convList);
      setTasks(taskList);
      setNotes(noteList);
      setMcpTools(toolList);

      if (convList.length > 0) {
        const first = convList[0];
        setCurrentConversationId(first.id);
        const detailed = await api.getConversation(first.id);
        setMessages(detailed.messages || []);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Select conversation
  const handleSelectConversation = async (id: string) => {
    try {
      setCurrentConversationId(id);
      const conv = await api.getConversation(id);
      setMessages(conv.messages || []);
      setActiveTab('chat');
    } catch (err) {
      console.error('Failed to load conversation:', err);
    }
  };

  // Create new conversation
  const handleNewConversation = async () => {
    try {
      const conv = await api.createConversation('New Chat');
      setConversations((prev) => [conv, ...prev]);
      setCurrentConversationId(conv.id);
      setMessages([]);
      setActiveTab('chat');
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);
      setConversations(remaining);
      if (currentConversationId === id) {
        if (remaining.length > 0) {
          handleSelectConversation(remaining[0].id);
        } else {
          setCurrentConversationId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Speak aloud
  const handleSpeakText = (text: string) => {
    if (isMuted) return;
    setCurrentlySpeakingText(text);
    speechService.speak(
      text,
      {
        voiceIndex: settings.voiceIndex,
        rate: settings.speechRate,
        pitch: settings.speechPitch
      },
      () => setIsSpeaking(true),
      () => {
        setIsSpeaking(false);
        setCurrentlySpeakingText(null);
      }
    );
  };

  const handleToggleMute = () => {
    if (!isMuted) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
      setCurrentlySpeakingText(null);
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  // Send message
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    let activeId = currentConversationId;
    if (!activeId) {
      try {
        const newConv = await api.createConversation(
          text.length > 25 ? text.substring(0, 25) + '...' : text
        );
        activeId = newConv.id;
        setCurrentConversationId(activeId);
        setConversations((prev) => [newConv, ...prev]);
      } catch (err) {
        console.error('Error creating conversation:', err);
        return;
      }
    }

    // Optimistic user message in UI
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversation_id: activeId,
      sender: 'user',
      text,
      timestamp: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage({
        conversationId: activeId,
        message: text,
        provider: settings.provider,
        apiKey: settings.apiKey
      });

      // Update message list with persisted message
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        response.userMessage,
        response.assistantMessage
      ]);

      // If auto-speak is enabled, speak assistant reply
      if (settings.autoSpeak && !isMuted) {
        handleSpeakText(response.assistantMessage.text);
      }

      // Check if any tool was executed that affected tasks or notes
      const toolCalls = response.assistantMessage.tool_calls || [];
      if (toolCalls.some((tc) => tc.name === 'manage_tasks')) {
        const updatedTasks = await api.getTasks();
        setTasks(updatedTasks);
      }
      if (toolCalls.some((tc) => tc.name === 'create_note')) {
        const updatedNotes = await api.getNotes();
        setNotes(updatedNotes);
      }

      // Refresh conversations list to update titles/timestamps
      const refreshedConvs = await api.getConversations();
      setConversations(refreshedConvs);
    } catch (err: any) {
      console.error('Error in sendChatMessage:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        conversation_id: activeId,
        sender: 'assistant',
        text: `⚠️ **Error communicating with assistant:** ${err.message}`,
        timestamp: new Date().toISOString()
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle mic for voice input
  const handleToggleMic = () => {
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
    } else {
      if (isSpeaking) {
        speechService.stopSpeaking();
        setIsSpeaking(false);
      }

      const started = speechService.startListening(
        (transcript, isFinal) => {
          if (isFinal && transcript.trim()) {
            setIsListening(false);
            handleSendMessage(transcript);
          }
        },
        (error) => {
          console.warn('Speech error:', error);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );

      if (started) {
        setIsListening(true);
      }
    }
  };

  // Task actions
  const handleAddTask = async (task: {
    title: string;
    description?: string;
    priority: 'low' | 'medium' | 'high';
    due_date?: string;
  }) => {
    try {
      const created = await api.createTask(task);
      setTasks((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleToggleTaskComplete = async (id: string) => {
    try {
      const updated = await api.toggleTaskComplete(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));

      if (updated.status === 'completed') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#a855f7', '#6366f1', '#06b6d4', '#10b981']
        });
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Note actions
  const handleAddNote = async (note: {
    title: string;
    content: string;
    tags: string[];
  }) => {
    try {
      const created = await api.createNote(note);
      setNotes((prev) => [created, ...prev]);
    } catch (err) {
      console.error('Error creating note:', err);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  const pendingTasksCount = tasks.filter((t) => t.status === 'pending').length;
  const totalNotesCount = notes.length;

  return (
    <div className="flex flex-col h-screen bg-space-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Header */}
      <div className="flex items-center">
        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="lg:hidden p-3 text-slate-400 hover:text-white bg-space-900 border-b border-purple-900/30"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1">
          <Header
            onOpenSettings={() => setIsSettingsOpen(true)}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            pendingTasksCount={pendingTasksCount}
            totalNotesCount={totalNotesCount}
            provider={settings.provider}
          />
        </div>
      </div>

      {/* Main Workspace: Sidebar + Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          pendingTasksCount={pendingTasksCount}
          totalNotesCount={totalNotesCount}
          isOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <main className="flex-1 flex flex-col overflow-y-auto bg-gradient-to-b from-space-950 via-space-900 to-space-950 relative">
          {activeTab === 'chat' && (
            <ChatView
              messages={messages}
              isLoading={isLoading}
              onSendMessage={handleSendMessage}
              isListening={isListening}
              setIsListening={setIsListening}
              isSpeaking={isSpeaking}
              onToggleMic={handleToggleMic}
              onSpeakText={handleSpeakText}
              currentlySpeakingText={currentlySpeakingText}
              autoSpeak={settings.autoSpeak}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskView
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleComplete={handleToggleTaskComplete}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === 'notes' && (
            <NoteView
              notes={notes}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
            />
          )}

          {activeTab === 'mcp' && (
            <McpExplorerView tools={mcpTools} />
          )}
        </main>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={saveSettings}
      />
    </div>
  );
};

export default App;
