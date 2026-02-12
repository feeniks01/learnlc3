'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface AIContextType {
  isOpen: boolean;
  selectedCode: string;
  messages: Message[];
  isLoading: boolean;
  open: () => void;
  openWithCode: (code: string) => void;
  close: () => void;
  sendMessage: (content: string) => void;
  clearChat: () => void;
}

const AIContext = createContext<AIContextType | null>(null);

export function useAI(): AIContextType | null {
  return useContext(AIContext);
}

export function AIProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const codeUsedRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);

  // Keep ref in sync with state
  messagesRef.current = messages;

  const open = useCallback(() => setIsOpen(true), []);

  const openWithCode = useCallback((code: string) => {
    setSelectedCode(code);
    codeUsedRef.current = false;
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setSelectedCode('');
    codeUsedRef.current = false;
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '' };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsLoading(true);

    try {
      const currentMessages = messagesRef.current;
      const apiMessages = [...currentMessages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const codeToSend = !codeUsedRef.current && selectedCode ? selectedCode : undefined;
      if (codeToSend) codeUsedRef.current = true;

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages, code: codeToSend }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const current = accumulated;
        setMessages(prev =>
          prev.map(m => m.id === assistantMsg.id ? { ...m, content: current } : m)
        );
      }
    } catch {
      setMessages(prev =>
        prev.map(m => m.id === assistantMsg.id
          ? { ...m, content: 'Sorry, something went wrong. Please try again.' }
          : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [selectedCode]);

  return (
    <AIContext.Provider value={{ isOpen, selectedCode, messages, isLoading, open, openWithCode, close, sendMessage, clearChat }}>
      {children}
    </AIContext.Provider>
  );
}
