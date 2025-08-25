import React, { useState, useRef, useEffect } from 'react';
import { useAgent } from '../context/AgentContext';
import { QuantizedModel, MessageRole } from '../services/llmService';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';

// Message component for chat
interface ChatMessageProps {
  role: MessageRole;
  content: string;
  timestamp: Date;
  model: QuantizedModel;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, timestamp, model }) => {
  const isUser = role === MessageRole.User;

  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isUser ? 'order-first' : ''}`}>
        <div className={`rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-secondary text-white ml-auto'
            : 'bg-surface border border-border'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
        <div className={`text-xs text-text-muted mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          {!isUser && <span className="ml-2 text-secondary">Llama 3.1 8B</span>}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      )}
    </div>
  );
};

// Typing indicator component
const TypingIndicator: React.FC = () => {
  return (
    <div className="flex gap-3 justify-start mb-4">
      <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="bg-surface border border-border rounded-lg px-4 py-2">
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-secondary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-secondary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
};

// Main ModelChat component
const ModelChat: React.FC = () => {
  const { llmState, createLlmConversation, sendLlmMessage } = useAgent();
  const [message, setMessage] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [llmState.currentConversation?.messages]);

  useEffect(() => {
    // Focus input when component mounts
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || llmState.isLoading) return;

    const messageToSend = message.trim();
    setMessage('');

    try {
      // Create conversation if it doesn't exist
      if (!llmState.currentConversation) {
        await createLlmConversation(QuantizedModel.Llama3_1_8B);
      }

      // Send the message
      await sendLlmMessage(messageToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error is handled in the context
    }
  };

  const handleNewChat = async () => {
    try {
      await createLlmConversation(QuantizedModel.Llama3_1_8B);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const currentMessages = llmState.currentConversation?.messages || [];

  return (
    <div className="flex h-screen bg-primary">
      {/* Sidebar */}
      <div className={`${
        isSidebarOpen ? 'w-80' : 'w-0'
      } transition-all duration-300 border-r border-border bg-surface-light flex flex-col`}>
        {isSidebarOpen && (
          <>
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-text-primary">Chat History</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <Button
                onClick={handleNewChat}
                className="w-full mt-3"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </Button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto p-2">
              {llmState.conversations.size === 0 ? (
                <div className="text-center text-text-secondary mt-8">
                  <p className="text-sm">No conversations yet</p>
                  <p className="text-xs mt-1">Start a new chat to begin</p>
                </div>
              ) : (
                Array.from(llmState.conversations.values()).map((conv) => (
                  <div
                    key={conv.session_id}
                    className={`p-3 rounded-lg cursor-pointer mb-2 transition-colors ${
                      llmState.currentConversation?.session_id === conv.session_id
                        ? 'bg-secondary/20 border border-secondary/30'
                        : 'hover:bg-surface'
                    }`}
                    onClick={() => {
                      // In a real implementation, this would switch conversations
                      console.log('Switch to conversation:', conv.session_id);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="text-sm text-text-primary truncate">
                        {conv.messages.length > 0
                          ? conv.messages[0].content.substring(0, 30) + '...'
                          : 'New conversation'
                        }
                      </span>
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {conv.last_activity ? new Date(Number(conv.last_activity)).toLocaleDateString() : 'Just now'}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Model Info */}
            <div className="p-4 border-t border-border">
              <div className="bg-surface rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-sm font-medium text-text-primary">Llama 3.1 8B</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  General-purpose AI for content generation, code assistance, and creative tasks.
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-text-muted">
                  <span>Free</span>
                  <span>•</span>
                  <span>Fast responses</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-border p-4 flex items-center justify-between bg-surface-light">
          <div className="flex items-center gap-3">
            {!isSidebarOpen && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(true)}
                className="p-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            )}
            <div>
              <h1 className="text-lg font-semibold text-text-primary">
                {llmState.currentConversation ? 'Chat with Llama 3.1 8B' : 'Start a new conversation'}
              </h1>
              <p className="text-sm text-text-secondary">
                {llmState.currentConversation
                  ? `${currentMessages.length} messages`
                  : 'Ask anything about coding, content creation, or creative tasks'
                }
              </p>
            </div>
          </div>

          {/* Model Status */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-accent-success rounded-full"></div>
            <span className="text-sm text-text-secondary">Online</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!llmState.currentConversation ? (
            // Welcome screen
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">
                  Chat with Llama 3.1 8B
                </h2>
                <p className="text-text-secondary mb-6">
                  Ask questions about coding, get help with content creation, or explore creative ideas.
                  This AI assistant is powered by advanced AI technology.
                </p>
                <Button onClick={handleNewChat} size="lg">
                  Start Conversation
                </Button>
              </div>
            </div>
          ) : (
            // Messages
            <>
              {currentMessages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  role={msg.role}
                  content={msg.content}
                  timestamp={new Date(Number(msg.timestamp))}
                  model={msg.model}
                />
              ))}

              {llmState.isLoading && <TypingIndicator />}

              {/* Error display */}
              {llmState.error && (
                <div className="bg-accent-error/10 border border-accent-error/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-accent-error">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-sm font-medium">Error</span>
                  </div>
                  <p className="text-sm text-accent-error mt-1">{llmState.error.message}</p>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 bg-surface-light">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <div className="flex-1">
              <Input
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  llmState.currentConversation
                    ? "Type your message..."
                    : "Start a conversation..."
                }
                disabled={llmState.isLoading}
                className="min-h-[48px]"
              />
            </div>
            <Button
              type="submit"
              disabled={!message.trim() || llmState.isLoading}
              size="lg"
              className="min-h-[48px] px-6"
            >
              {llmState.isLoading ? (
                <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </Button>
          </form>

          {/* Usage info */}
          {llmState.currentConversation && (
            <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
              <span>
                {llmState.currentConversation.token_usage.total_tokens} tokens used
              </span>
              <span className="text-secondary">
                Powered by Advanced AI
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelChat;
