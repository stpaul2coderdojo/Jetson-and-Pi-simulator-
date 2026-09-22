import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Zap,
  Code2,
  Trash2,
  X,
  ChevronRight,
  PlusCircle,
  Copy,
  Check,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import { ChatMessage, DeviceId } from '../../types';
import { sendGeminiChatMessage } from '../../services/geminiClient';

interface GeminiChatbotDockProps {
  isOpen: boolean;
  onClose: () => void;
  targetHardware: DeviceId;
  activeNotebookTitle: string;
  activeCellCode: string;
  onInsertCodeToNotebook: (code: string) => void;
}

export const GeminiChatbotDock: React.FC<GeminiChatbotDockProps> = ({
  isOpen,
  onClose,
  targetHardware,
  activeNotebookTitle,
  activeCellCode,
  onInsertCodeToNotebook,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: `👋 **Hello! I'm your Gemini AI Edge Coding Assistant.**\n\nI can help you:\n- **Optimize** Python code for NVIDIA Jetson TensorRT or ARM NEON SIMD.\n- **Write** MegaDetector and bioacoustic wildlife pipelines.\n- **Debug** CUDA memory allocations and container execution errors.\n- **Insert** ready-to-run Python code directly into your notebook.`,
      timestamp: Date.now(),
      model: 'gemini-3.8-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input.trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const notebookContext = `Current Notebook: ${activeNotebookTitle}\nTarget Hardware Architecture: ${targetHardware}`;

    const response = await sendGeminiChatMessage(
      newMessages,
      notebookContext,
      activeCellCode,
      targetHardware
    );

    const assistantMessage: ChatMessage = {
      id: `gemini-${Date.now()}`,
      role: 'assistant',
      content: response.text,
      timestamp: Date.now(),
      model: 'gemini-3.8-flash',
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsLoading(false);
  };

  const handleQuickPrompt = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const renderMessageContent = (content: string, msgId: string) => {
    // Parse code blocks with ```python or ```
    const codeBlockRegex = /```(?:python|bash|dockerfile)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    let codeIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          value: content.slice(lastIndex, match.index),
          id: `${msgId}-txt-${lastIndex}`,
        });
      }

      parts.push({
        type: 'code',
        value: match[1].trim(),
        id: `${msgId}-code-${codeIndex++}`,
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        value: content.slice(lastIndex),
        id: `${msgId}-txt-${lastIndex}`,
      });
    }

    return (
      <div className="space-y-2 text-xs leading-relaxed">
        {parts.map((part) => {
          if (part.type === 'code') {
            const isCopied = copiedCodeId === part.id;
            return (
              <div
                key={part.id}
                className="my-2 rounded-lg border border-slate-700 bg-slate-950 overflow-hidden font-mono text-[11px]"
              >
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-slate-400">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                    <Code2 className="w-3.5 h-3.5" />
                    Python Snippet
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopyCode(part.value, part.id)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                      title="Copy code to clipboard"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {isCopied ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => onInsertCodeToNotebook(part.value)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 text-[10px] font-semibold transition-colors"
                      title="Insert as a new cell into the active notebook"
                    >
                      <PlusCircle className="w-3 h-3 text-cyan-400" />
                      Insert into Notebook
                    </button>
                  </div>
                </div>
                <pre className="p-3 overflow-x-auto text-slate-200 scrollbar-thin">
                  <code>{part.value}</code>
                </pre>
              </div>
            );
          }

          // Simple markdown line formatting
          const paragraphs = part.value.split('\n\n');
          return (
            <div key={part.id} className="space-y-1.5">
              {paragraphs.map((p, idx) => {
                const trimmed = p.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith('### ')) {
                  return (
                    <h4 key={idx} className="font-semibold text-cyan-300 text-xs mt-2 mb-1">
                      {trimmed.replace('### ', '')}
                    </h4>
                  );
                }
                if (trimmed.startsWith('> ')) {
                  return (
                    <blockquote
                      key={idx}
                      className="border-l-2 border-amber-500/80 pl-2 py-0.5 my-1 text-slate-400 bg-amber-950/20 text-[11px] rounded-r"
                    >
                      {trimmed.replace('> ', '')}
                    </blockquote>
                  );
                }
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                  const items = trimmed.split('\n');
                  return (
                    <ul key={idx} className="list-disc pl-4 space-y-1 text-slate-300">
                      {items.map((item, itemIdx) => (
                        <li key={itemIdx}>{item.replace(/^[-*]\s+/, '')}</li>
                      ))}
                    </ul>
                  );
                }

                return (
                  <p key={idx} className="text-slate-300">
                    {trimmed}
                  </p>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Gemini AI Assistant"
      className="w-80 sm:w-96 shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl relative z-10"
    >
      {/* Dock Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/90">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">Gemini AI Copilot</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 border border-indigo-700 text-indigo-300 font-mono">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-cyan-400" />
              Target: <span className="font-semibold text-slate-300 uppercase">{targetHardware}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setMessages([
                {
                  id: `reset-${Date.now()}`,
                  role: 'assistant',
                  content: 'Chat cleared. How can I help you with your edge Python notebook?',
                  timestamp: Date.now(),
                },
              ])
            }
            title="Clear Chat History"
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            title="Close Assistant Panel"
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Active Context Banner */}
      <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate max-w-[200px] text-cyan-400 font-mono">
          📄 {activeNotebookTitle}
        </span>
        {activeCellCode && (
          <span className="text-slate-500 font-mono text-[10px]">
            Cell: {activeCellCode.length} chars
          </span>
        )}
      </div>

      {/* Quick Prompts Chips */}
      <div className="px-3 py-2 bg-slate-900/60 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => handleQuickPrompt('Explain this notebook cell and its performance impact on edge hardware.')}
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
        >
          <HelpCircle className="w-3 h-3 text-cyan-400" />
          Explain Cell
        </button>
        <button
          onClick={() =>
            handleQuickPrompt(
              'How can I optimize this code for TensorRT INT8 calibration and maximum FPS on Jetson Orin Nano?'
            )
          }
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
        >
          <Zap className="w-3 h-3 text-amber-400" />
          Optimize TensorRT
        </button>
        <button
          onClick={() =>
            handleQuickPrompt(
              'Generate a camera trap inference pipeline using MegaDetector v5 with bounding box letterbox padding.'
            )
          }
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
        >
          <Sparkles className="w-3 h-3 text-emerald-400" />
          MegaDetector Pipeline
        </button>
        <button
          onClick={() =>
            handleQuickPrompt('Convert this notebook workflow into a multi-arch ARM64 Dockerfile and docker-compose.yml.')
          }
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
        >
          <Code2 className="w-3 h-3 text-indigo-400" />
          To Dockerfile
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1 mb-1 text-[10px] text-slate-500">
              {msg.role === 'user' ? (
                <span>You</span>
              ) : (
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <Bot className="w-3 h-3" /> Gemini 3.8 Flash
                </span>
              )}
            </div>

            <div
              className={`p-3 rounded-xl max-w-[94%] ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none shadow-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
              ) : (
                renderMessageContent(msg.content, msg.id)
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 max-w-[80%]">
            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400 font-mono">Gemini is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Ask Gemini to optimize code, fix errors, or generate cells..."
            rows={2}
            className="flex-1 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none font-mono"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg disabled:opacity-50 transition-colors shadow-sm shrink-0"
            title="Send Message (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between">
          <span>Shift+Enter for new line</span>
          <span>Powered by Gemini 3.8 Flash</span>
        </p>
      </div>
    </aside>
  );
};
