import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Sparkles, Loader2, Bot, User, Paperclip, Mic } from 'lucide-react';
import { createPanelDefinition, PanelCategories, ContentTypes } from './BasePanelInterface';

/**
 * Dummy Chat Panel - Demonstrates the panel interface for AI chat
 */

// Message bubble component
function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${isUser ? 'bg-violet-500' : 'bg-gradient-to-br from-cyan-500 to-violet-500'}
      `}>
        {isUser ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
      </div>
      
      {/* Message content */}
      <div className={`
        max-w-[80%] rounded-2xl px-4 py-2.5
        ${isUser 
          ? 'bg-violet-500 text-white rounded-br-md' 
          : 'bg-zinc-800 text-zinc-100 rounded-bl-md border border-white/5'
        }
      `}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        {message.timestamp && (
          <p className={`text-xs mt-1 ${isUser ? 'text-violet-200' : 'text-zinc-500'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  );
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 flex items-center justify-center">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3 border border-white/5">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// Main View Component
function ChatMainView({ panelState, updateState, isFocused }) {
  const [messages, setMessages] = useState(panelState?.messages || [
    { id: '1', role: 'assistant', content: 'Hello! I\'m your AI design assistant. I can help you with flowcharts, UI design, code generation, and more. What would you like to create today?', timestamp: Date.now() - 60000 }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  
  // Simulate AI response
  const simulateResponse = (userMessage) => {
    setIsTyping(true);
    
    setTimeout(() => {
      const responses = [
        "I understand you want to work on that. Let me analyze the current context from your open panels...",
        "Great idea! I can help you design that. Would you like me to generate a flowchart or start with a wireframe?",
        "I've reviewed your canvas and notes. Here's what I suggest: we could break this down into smaller components first.",
        "That's an interesting approach. Let me create a draft based on your requirements. You'll see it appear in the Canvas panel.",
        "I can definitely help with that! Looking at your existing work, I think we should consider the user flow first.",
      ];
      
      const newMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: responses[Math.floor(Math.random() * responses.length)],
        timestamp: Date.now(),
      };
      
      setMessages(prev => {
        const updated = [...prev, newMessage];
        updateState?.({ messages: updated });
        return updated;
      });
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };
  
  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };
    
    setMessages(prev => {
      const updated = [...prev, userMessage];
      updateState?.({ messages: updated });
      return updated;
    });
    setInput('');
    
    // Simulate AI response
    simulateResponse(input.trim());
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const suggestions = [
    "Generate a flowchart",
    "Create a Kanban board",
    "Design a landing page",
    "Help me organize my notes",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Quick suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => setInput(suggestion)}
                className="px-3 py-1.5 text-xs rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-white/5 transition-colors"
              >
                <Sparkles size={10} className="inline mr-1.5" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Input area */}
      <div className="p-4 border-t border-white/5">
        <div className={`
          flex items-end gap-2 p-2 rounded-2xl bg-zinc-800/50 border transition-colors
          ${isFocused ? 'border-violet-500/50' : 'border-white/5'}
        `}>
          <button className="p-2 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors">
            <Paperclip size={18} />
          </button>
          
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 resize-none max-h-32 py-2"
            style={{ minHeight: '24px' }}
          />
          
          <button className="p-2 rounded-full text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors">
            <Mic size={18} />
          </button>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="p-2 rounded-full bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        
        <p className="text-xs text-zinc-600 text-center mt-2">
          AI can analyze all open panels to provide contextual assistance
        </p>
      </div>
    </div>
  );
}

// Panel Definition
const DummyChatPanel = createPanelDefinition({
  id: 'chat',
  name: 'AI Assistant',
  description: 'Chat with AI for design assistance',
  icon: MessageSquare,
  category: PanelCategories.AI,
  accentColor: 'cyan',
  
  renderMainView: (props) => <ChatMainView {...props} />,
  
  getInitialState: () => ({
    messages: [
      { 
        id: '1', 
        role: 'assistant', 
        content: 'Hello! I\'m your AI design assistant. I can help you with flowcharts, UI design, code generation, and more. What would you like to create today?', 
        timestamp: Date.now() 
      }
    ],
  }),
  
  getLLMContext: async (panelState) => {
    return {
      contentType: 'text/plain',
      data: {
        type: 'chat',
        messageCount: panelState?.messages?.length || 0,
        lastMessage: panelState?.messages?.slice(-1)[0]?.content || '',
      },
      schemaVersion: '1.0',
    };
  },
  
  applyLLMChange: async (panelState, updateState, dslDiff) => {
    if (dslDiff.addMessage) {
      const messages = [...(panelState?.messages || []), dslDiff.addMessage];
      updateState({ messages });
      return true;
    }
    return false;
  },
  
  dropZone: {
    acceptTypes: [ContentTypes.TEXT_PLAIN, ContentTypes.TEXT_MARKDOWN, ContentTypes.JSON],
    onDrop: (data, panelState, updateState) => {
      // Add dropped content as context to the chat
      console.log('Chat received drop:', data);
    },
  },
  
  actions: [
    { id: 'chat.clear', label: 'Clear Chat History', category: 'Chat' },
    { id: 'chat.export', label: 'Export Conversation', category: 'Chat' },
    { id: 'chat.gather-context', label: 'Gather Context from All Panels', category: 'Chat' },
  ],
});

export default DummyChatPanel;