import React, { useState, useRef, useEffect } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL;
import {
  Send,
  Bot,
  User,
  Wand2,
  Zap,
  History,
  ChevronDown,
  Check,
  Plus,
  MessageSquare,
  Trash2,
  Clock,
  Square,
  Edit2
} from 'lucide-react';

import {
  fetchSessions,
  fetchSessionMessages,
  deleteSession,
  renameSession
} from "@/src/api";

import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Message } from '@/src/types';
import { cn } from '@/lib/utils';
import ReactMarkdown from "react-markdown";

export function AppPlayground() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ─────────────────────────────────────────────────────
  // Load sessions
  // ─────────────────────────────────────────────────────

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const sessions = await fetchSessions();
      setHistoryItems(sessions);
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────────────
  // Close dropdown outside click
  // ─────────────────────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setHistoryOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // ─────────────────────────────────────────────────────
  // Scroll bottom
  // ─────────────────────────────────────────────────────

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [messages]);

  // ─────────────────────────────────────────────────────
  // Cleanup stream
  // ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // ─────────────────────────────────────────────────────
  // Stop stream
  // ─────────────────────────────────────────────────────

  const handleStop = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  };

  // ─────────────────────────────────────────────────────
  // New chat
  // ─────────────────────────────────────────────────────

  const handleNewChat = () => {
    setMessages([]);
    setSessionId(null);
    setHistoryOpen(false);
  };

  // ─────────────────────────────────────────────────────
  // Select session
  // ─────────────────────────────────────────────────────

  const handleSelectThread = async (thread: any) => {
    try {
      const msgs = await fetchSessionMessages(thread.id);

      const formatted = msgs.map((m: any) => ({
        id: String(m.id),
        role: m.role,
        content: m.content,
      }));

      setMessages(formatted);
      setSessionId(thread.id);
      setHistoryOpen(false);

    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────────────
  // Delete session
  // ─────────────────────────────────────────────────────

  const handleDeleteHistoryItem = async (
    e: React.MouseEvent,
    id: number
  ) => {
    e.stopPropagation();

    try {
      await deleteSession(id);

      setHistoryItems(prev =>
        prev.filter((t) => t.id !== id)
      );

      if (sessionId === id) {
        setSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartRename = (e: React.MouseEvent, id: number, currentTitle: string) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setEditTitle(currentTitle);
  };

  const handleSaveRename = async (e: React.MouseEvent | React.KeyboardEvent, id: number) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;
    try {
      await renameSession(id, editTitle.trim());
      setHistoryItems(prev =>
        prev.map(item => item.id === id ? { ...item, title: editTitle.trim() } : item)
      );
      setEditingSessionId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // ─────────────────────────────────────────────────────
  // Send message
  // ─────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);

    setInput('');
    setIsLoading(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const jwt = localStorage.getItem('jwt_token');

    let assistantMessage = "";

    try {
      const response = await fetch(
        `${BASE_URL}/chat/stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwt}`
          },
          body: JSON.stringify({
            prompt: userMessage.content,
            session_id: sessionId
          }),
          signal: abortController.signal
        }
      );

      if (!response.body) {
        throw new Error("No response body");
      }

      // Create empty assistant message
      setMessages(prev => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: ""
        }
      ]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let buffer = "";
      let lastRenderTime = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;

          const data = line.replace("data: ", "").trim();

          if (data === "[DONE]") {
            break;
          }

          try {
            const parsed = JSON.parse(data);

            // NEW SESSION CREATED
            if (parsed.session_id) {
              setSessionId(parsed.session_id);

              loadSessions();

              continue;
            }

            // STREAM TOKENS
            if (parsed.text) {
              assistantMessage += parsed.text;

              const now = Date.now();

              // render every 25ms
              if (now - lastRenderTime > 25) {
                lastRenderTime = now;

                setMessages(prev => {
                  const updated = [...prev];

                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: assistantMessage
                  };

                  return updated;
                });
              }
            }

          } catch (err) {
            console.error(err);
          }
        }
      }
      setMessages(prev => {
        const updated = [...prev];

        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: assistantMessage
        };

        return updated;
      });

      loadSessions();

    } catch (error: any) {

      if (error.name === "AbortError") {
        console.log("aborted");
      } else {
        console.error(error);
      }

    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // ─────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full min-h-0 bg-zinc-950 text-white">

      {/* HEADER */}

      <header className="px-3 sm:px-6 py-3 sm:py-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <Bot className="w-6 h-6 text-blue-400" />
          </div>

          <div>
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Inference Engine
            </h2>

            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-medium hidden sm:block">
                System Ready
              </span>
            </div>
          </div>
        </div>

        {/* HISTORY DROPDOWN */}

        <div className="relative" ref={dropdownRef}>

          <button
            onClick={() => setHistoryOpen(!historyOpen)}
            className="flex items-center gap-2 sm:gap-3 bg-white/5 hover:bg-white/10 text-white px-3 sm:px-4 py-2 border border-white/10 rounded-2xl"
          >
            <History className="w-4 h-4 text-zinc-400" />

            <div className="flex flex-col items-start hidden sm:flex">
              <span className="text-sm font-medium">
                Chat Sessions
              </span>
            </div>

            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                historyOpen && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {historyOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-xs sm:max-w-sm bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden z-50"
              >

                {/* NEW CHAT */}

                <button
                  onClick={handleNewChat}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-white/5 border-b border-white/5"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />

                  <div className="text-left">
                    <div className="text-sm font-medium">
                      New Chat
                    </div>

                    <div className="text-[10px] text-zinc-500">
                      Start fresh session
                    </div>
                  </div>
                </button>

                {/* SESSIONS */}

                <div className="max-h-80 overflow-y-auto">

                  {historyItems.length === 0 ? (
                    <div className="p-6 text-center text-sm text-zinc-500">
                      No sessions found
                    </div>
                  ) : (
                    historyItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectThread(item)}
                        className={cn(
                          "group/item px-4 py-3 hover:bg-white/5 cursor-pointer border-b border-white/[0.03] flex items-center justify-between transition-all",
                          sessionId === item.id &&
                          "bg-blue-500/10"
                        )}
                      >

                        <div className="flex items-center gap-3 overflow-hidden flex-1 mr-2">

                          <MessageSquare className="w-4 h-4 text-zinc-400 shrink-0" />

                          <div className="overflow-hidden flex-1">
                            {editingSessionId === item.id ? (
                              <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(e, item.id);
                                  if (e.key === 'Escape') setEditingSessionId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-zinc-800 border border-blue-500/50 rounded px-2 py-0.5 text-xs text-white focus:outline-none w-full"
                                autoFocus
                              />
                            ) : (
                              <div className="text-sm truncate">
                                {item.title}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {editingSessionId === item.id ? (
                            <button
                              onClick={(e) => handleSaveRename(e, item.id)}
                              className="text-emerald-400 hover:text-emerald-300 p-1 rounded hover:bg-emerald-500/10"
                              title="Save rename"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <>
                              {sessionId === item.id && (
                                <Check className="w-4 h-4 text-blue-400 shrink-0" />
                              )}

                              <button
                                onClick={(e) => handleStartRename(e, item.id, item.title)}
                                className="
                                  text-zinc-500
                                  hover:text-blue-400
                                  p-1.5
                                  rounded-lg
                                  hover:bg-blue-500/10
                                  border border-transparent
                                  opacity-0
                                  group-hover/item:opacity-100
                                  transition-all duration-200
                                  shrink-0
                                "
                                title="Rename session"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={(e) =>
                                  handleDeleteHistoryItem(e, item.id)
                                }
                                className="
                                  text-zinc-600
                                  hover:text-red-400
                                  p-1.5
                                  rounded-lg
                                  hover:bg-red-500/10
                                  border border-transparent
                                  hover:border-red-500/10
                                  opacity-0
                                  group-hover/item:opacity-100
                                  transition-all duration-200
                                  shrink-0
                                "
                                title="Delete session"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* CHAT AREA */}

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 sm:p-6"
      >
        <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">

          {messages.length === 0 && (
            <div className="h-[50vh] sm:h-[60vh] flex flex-col items-center justify-center text-center">

              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center mb-6 sm:mb-8">
                <Zap className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
              </div>

              <h1 className="text-3xl sm:text-4xl font-bold">
                INFERFLOW
              </h1>

              <p className="text-zinc-500 mt-4">
                Real-time streaming inference
              </p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-3 sm:gap-4",
                  message.role === "assistant"
                    ? "flex-row"
                    : "flex-row-reverse"
                )}
              >

                <div
                  className={cn(
                    "w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 border",
                    message.role === "assistant"
                      ? "bg-blue-600/10 border-blue-500/20 text-blue-400"
                      : "bg-zinc-800 border-white/10 text-zinc-400"
                  )}
                >
                  {message.role === "assistant"
                    ? <Wand2 className="w-4 h-4 sm:w-5 sm:h-5" />
                    : <User className="w-4 h-4 sm:w-5 sm:h-5" />
                  }
                </div>

                <div
                  className={cn(
                    "w-fit max-w-[85%] sm:max-w-[75%]",
                    message.role === "assistant"
                      ? "items-start text-left"
                      : "items-end text-left ml-auto"
                  )}
                >

                  <div
                    className={cn(
                      "px-3 py-2 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl text-sm",
                      message.role === "assistant"
                        ? "bg-white/5 border border-white/5"
                        : "bg-blue-600"
                    )}
                  >

                    {message.content ? (
                      <div className="prose prose-invert max-w-none">
                        <ReactMarkdown>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-100" />
                        <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-200" />
                      </div>
                    )}

                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* INPUT */}

      <div className="p-3 sm:p-6 border-t border-white/5 bg-black/40">

        <div className="max-w-3xl mx-auto flex gap-2 items-center">

          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && handleSend()
            }
            placeholder="Type your prompt..."
            className="flex-1 bg-white/5 border-white/10 text-white h-12 sm:h-14 rounded-2xl"
            disabled={isLoading}
          />

          {isLoading ? (
            <Button
              onClick={handleStop}
              className="bg-red-600 hover:bg-red-500 h-12 sm:h-14 px-4 sm:px-6 rounded-xl shrink-0"
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          ) : (
            <Button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-blue-600 hover:bg-blue-500 h-12 sm:h-14 px-4 sm:px-6 rounded-xl shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}

        </div>
      </div>
    </div>
  );
}