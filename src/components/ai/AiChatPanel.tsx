'use client';

import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from 'react';
import { Bot, Plus, Send, X } from 'lucide-react';
import { usePathname, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/providers/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type ContextMode = 'auto' | 'global' | 'society' | 'building';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  createdAt: number;
  messages: ChatMessage[];
};

const generateUuid = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const getInitialAssistantMessage = (language: 'en' | 'ur'): ChatMessage => ({
  role: 'assistant',
  content:
    language === 'ur'
      ? 'میں آپ کا Ignis AI اسسٹنٹ ہوں۔ خطرات، سینسرز، یا حفاظتی رہنمائی کے بارے میں پوچھیں۔'
      : 'I am your Ignis AI assistant. Ask about hazards, sensors, or response guidance.',
});

export function AiChatPanel() {
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const isUrdu = language === 'ur';
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [emergencyVisible, setEmergencyVisible] = useState(false);
  const [emergencyLabel, setEmergencyLabel] = useState('');
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: generateUuid(),
      title: 'New Chat',
      createdAt: Date.now(),
      messages: [getInitialAssistantMessage(language)],
    },
  ]);
  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id);

  const canSend = useMemo(() => prompt.trim().length > 0 && !loading, [prompt, loading]);
  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeSessionId) || sessions[0],
    [sessions, activeSessionId]
  );
  const inferredContext = useMemo(() => {
    const buildingIdRaw = searchParams.get('buildingId') || searchParams.get('id');
    const societyIdRaw = searchParams.get('societyId');
    const buildingNameRaw = searchParams.get('buildingName') || searchParams.get('building');
    const societyNameRaw = searchParams.get('societyName') || searchParams.get('society');

    const parsedBuildingId = buildingIdRaw ? Number(buildingIdRaw) : undefined;
    const parsedSocietyId = societyIdRaw ? Number(societyIdRaw) : undefined;
    const buildingId = Number.isFinite(parsedBuildingId) ? parsedBuildingId : undefined;
    const societyId = Number.isFinite(parsedSocietyId) ? parsedSocietyId : undefined;
    const buildingName = buildingNameRaw?.trim() || undefined;
    const societyName = societyNameRaw?.trim() || undefined;

    let contextMode: ContextMode = 'auto';
    if (pathname.includes('/building-view') || buildingId || buildingName) {
      contextMode = 'building';
    } else if (societyId || societyName) {
      contextMode = 'society';
    }

    return { contextMode, buildingId, societyId, buildingName, societyName };
  }, [pathname, searchParams]);

  const setSessionMessages = (sessionId: string, updater: (messages: ChatMessage[]) => ChatMessage[]) => {
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id !== sessionId) return session;
        const nextMessages = updater(session.messages);
        const firstUserMessage = nextMessages.find((message) => message.role === 'user');
        const nextTitle = firstUserMessage
          ? firstUserMessage.content.slice(0, 32) + (firstUserMessage.content.length > 32 ? '...' : '')
          : session.title;
        return {
          ...session,
          messages: nextMessages,
          title: nextTitle || 'New Chat',
        };
      })
    );
  };

  const onCreateSession = () => {
    const id = generateUuid();
    const newSession: ChatSession = {
      id,
      title: 'New Chat',
      createdAt: Date.now(),
      messages: [getInitialAssistantMessage(language)],
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(id);
    setEmergencyVisible(false);
    setEmergencyLabel('');
  };

  useEffect(() => {
    const onToggle = () => {
      setOpen((prev) => !prev);
    };

    window.addEventListener('ignis-ai-chat-toggle', onToggle);
    return () => {
      window.removeEventListener('ignis-ai-chat-toggle', onToggle);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      api.getChatSessions()
        .then(async (sessionsData) => {
          if (sessionsData && sessionsData.length > 0) {
            const loadedSessions = await Promise.all(
              sessionsData.map(async (s) => {
                const { messages } = await api.getChatSessionMessages(s.id);
                const chatMessages: ChatMessage[] = messages.map((m: any) => ({
                  role: m.role,
                  content: m.content,
                }));
                // Add default greeting if no messages exist
                if (chatMessages.length === 0) {
                  chatMessages.push(getInitialAssistantMessage(language));
                }
                return {
                  id: s.id,
                  title: s.title || 'New Chat',
                  createdAt: new Date(s.createdAt).getTime(),
                  messages: chatMessages,
                };
              })
            );
            
            loadedSessions.sort((a, b) => b.createdAt - a.createdAt);
            
            setSessions(loadedSessions);
            if (loadedSessions.length > 0) {
              setActiveSessionId(loadedSessions[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [isAuthenticated, language]);

  if (!isAuthenticated) return null;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!text) return;

    const sessionId = activeSession.id;
    setPrompt('');
    setSessionMessages(sessionId, (prev) => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      let answer = 'No answer was returned.';
      let shouldSpeak = false;
      let voiceText = '';
      let voiceLanguage: 'en' | 'ur' = language;
      const payload = {
        sessionId,
        message: text,
        language,
        contextMode: inferredContext.contextMode,
        ...(inferredContext.buildingId ? { buildingId: inferredContext.buildingId } : {}),
        ...(inferredContext.societyId ? { societyId: inferredContext.societyId } : {}),
        ...(inferredContext.buildingName ? { buildingName: inferredContext.buildingName } : {}),
        ...(inferredContext.societyName ? { societyName: inferredContext.societyName } : {}),
      };
      const response = await api.chatWithOrchestrator(payload);
      answer = response.text || 'No answer was returned.';
      shouldSpeak = response.mode === 'emergency';
      voiceText = response.voice?.text || answer;
      voiceLanguage = response.voice?.language || language;
      
      const newSessionId = (response as any).sessionId || sessionId;

      if (response.mode === 'emergency') {
        setEmergencyVisible(true);
        setEmergencyLabel(
          response.voice?.text ||
          'Emergency mode active. Follow verified on-site guidance immediately.',
        );
      }

      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === sessionId) {
            return {
              ...session,
              id: newSessionId,
              messages: [...session.messages, { role: 'assistant', content: answer }],
            };
          }
          return session;
        })
      );
      if (newSessionId !== sessionId) {
        setActiveSessionId(newSessionId);
      }

      if (shouldSpeak && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(voiceText);
        utterance.lang = voiceLanguage === 'ur' ? 'ur-PK' : 'en-US';
        utterance.rate = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      setSessionMessages(sessionId, (prev) => [
        ...prev,
        {
          role: 'assistant',
          content: error instanceof Error ? error.message : 'AI chat request failed.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onPromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        void onSubmit(event as unknown as FormEvent);
      }
    }
  };

  const historyPanel = (
    <div
      className={`flex w-36 flex-col bg-muted/40 ${isUrdu ? 'border-l border-border' : 'border-r border-border'
        }`}
    >
      <div className="flex items-center justify-between border-b border-border px-2 py-2">
        <span className="text-xs font-semibold text-muted-foreground">{isUrdu ? 'ہسٹری' : 'History'}</span>
        <Button variant="ghost" size="icon" onClick={onCreateSession} className="h-7 w-7">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {sessions.map((session) => (
          <button
            key={session.id}
            type="button"
            onClick={() => {
              setActiveSessionId(session.id);
              setEmergencyVisible(false);
            }}
            className={`w-full rounded-md px-2 py-2 text-xs transition-colors ${isUrdu ? 'text-right' : 'text-left'
              } ${session.id === activeSession.id
                ? 'bg-primary/15 text-foreground'
                : 'text-muted-foreground hover:bg-muted'
              }`}
          >
            <p className="truncate font-medium">{session.title}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const chatPanel = (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Bot className="h-4 w-4" />
          Ignis AI Chat
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className={`flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm ${isUrdu ? 'text-right' : 'text-left'}`}>
        {emergencyVisible && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-2 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
            <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
              <span>{isUrdu ? 'ایمرجنسی موڈ فعال ہے' : 'Emergency Mode Active'}</span>
              <button
                type="button"
                className="rounded px-2 py-0.5 text-[10px] hover:bg-red-200/70 dark:hover:bg-red-900/50"
                onClick={() => setEmergencyVisible(false)}
              >
                {isUrdu ? 'بند کریں' : 'Dismiss'}
              </button>
            </div>
            <div className="text-xs">{emergencyLabel}</div>
          </div>
        )}
        {activeSession.messages.map((message, index) => (
          <div
            key={`${activeSession.id}-${message.role}-${index}`}
            className={
              message.role === 'user'
                ? 'ml-8 rounded-lg bg-primary/10 px-3 py-2'
                : 'mr-8 rounded-lg bg-muted px-3 py-2'
            }
          >
            {message.content}
          </div>
        ))}
        {loading && (
          <div className='mr-8 rounded-lg bg-muted px-3 py-2'>
            {isUrdu ? 'سوچ رہا ہوں...' : 'Thinking...'}
          </div>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="mt-auto flex items-end gap-2 border-t border-border p-3"
      >
        <Textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={onPromptKeyDown}
          placeholder={
            isUrdu
              ? 'واقعات، خطرات یا حفاظتی اقدامات کے بارے میں پوچھیں...'
              : 'Ask about incidents, hazards, or safety actions...'
          }
          rows={3}
          className={`min-h-[64px] resize-none ${isUrdu ? 'text-right' : 'text-left'}`}
        />
        <Button type="submit" disabled={!canSend}>
          <Send className={`h-4 w-4 ${isUrdu ? 'rotate-180' : ''}`} />
        </Button>
      </form>
    </div>
  );

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex items-center" dir={isUrdu ? 'rtl' : 'ltr'}>
      {open ? (
        <div className="flex h-full w-[26rem] border-l border-border bg-card shadow-2xl">
          {historyPanel}
          {chatPanel}
        </div>
      ) : null}
    </div>
  );
}
