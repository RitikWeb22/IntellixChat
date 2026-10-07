import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Code2,
  LogOut,
  Menu,
  Moon,
  MessageSquare,
  Plus,
  Send,
  Sun,
  Trash2,
  User,
  X,
  Copy,
  Check,
  Globe,
  Mail,
  Calculator,
  MapPin,
  Clock,
  Download,
  Volume2,
  VolumeX,
  Search,
  Edit2,
  ArrowDown,
  Sparkles,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import logo from "../../../assets/logo.svg";
import { useChat } from "../hooks/useChat";
import { logout } from "../../auth/services/auth.api";
import { setUser } from "../../auth/auth.slice";
import { setCurrentChatId } from "../chat.slice";
import { toggleTheme } from "../../../app/theme.slice";

// Code block with copy and language badge
const CodeBlock = ({ inline, className, children }) => {
  const [copied, setCopied] = useState(false);
  const themeMode = useSelector((state) => state.theme.mode);
  const isLightMode = themeMode === "light";
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";

  if (inline) {
    return (
      <code
        className={`rounded-md px-1.5 py-0.5 text-xs font-mono font-medium ${
          isLightMode
            ? "bg-slate-200 text-slate-800"
            : "bg-zinc-800 text-rose-300 border border-zinc-700/60"
        }`}
      >
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeString = String(children).replace(/\n$/, "");

  return (
    <div className="relative my-3 rounded-xl overflow-hidden border border-zinc-700/60 shadow-md">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400">
        <span className="font-mono uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-xs cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={atomDark}
        customStyle={{
          margin: 0,
          padding: "1rem",
          fontSize: "0.85rem",
          backgroundColor: "#0b0f17",
          lineHeight: "1.5",
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

const Dashboard = () => {
  const chat = useChat();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsedDesktop, setSidebarCollapsedDesktop] = useState(false);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [localChatId, setLocalChatId] = useState(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [pendingFirstMessage, setPendingFirstMessage] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messageListRef = useRef(null);
  const textareaRef = useRef(null);
  const skipAutoOpenRef = useRef(false);

  const user = useSelector((state) => state.auth.user);
  const chats = useSelector((state) => state.chat.chats || {});
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const isMessagesLoading = useSelector((state) => state.chat.isMessagesLoading || false);
  const typingByChatId = useSelector((state) => state.chat.typingByChatId || {});
  const statusByChatId = useSelector((state) => state.chat.statusByChatId || {});
  const streamByChatId = useSelector((state) => state.chat.streamByChatId || {});
  const themeMode = useSelector((state) => state.theme.mode);
  const isLightMode = themeMode === "light";

  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [input, adjustTextareaHeight]);

  // Initial load
  useEffect(() => {
    chat.initializeSocketConnection();
    chat.handleGetChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync active chat id
  useEffect(() => {
    if (currentChatId) {
      setLocalChatId(currentChatId);
    }
  }, [currentChatId]);

  // Auto-open first chat on start
  useEffect(() => {
    if (skipAutoOpenRef.current) {
      skipAutoOpenRef.current = false;
      return;
    }
    if (!currentChatId) {
      const firstChat = Object.values(chats)[0];
      if (firstChat?.id) {
        chat.handleOpenChat(firstChat.id);
      }
    }
  }, [chats, currentChatId, chat]);

  const messages = chats[currentChatId]?.messages || [];
  const isTypingCurrent = Boolean(typingByChatId[currentChatId]);
  const currentStatus = statusByChatId[currentChatId] || "";
  const streamContent = streamByChatId[currentChatId] || "";
  const isBusyCurrent = isTypingCurrent || Boolean(streamContent) || isStartingChat;
  const showWelcomeState =
    !currentChatId &&
    messages.length === 0 &&
    !pendingFirstMessage &&
    !isStartingChat &&
    !isTypingCurrent &&
    !streamContent;

  const handleScroll = () => {
    if (!messageListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 160);
  };

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTo({
        top: messageListRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages.length, isTypingCurrent, currentChatId, streamContent]);

  const displayName =
    user?.username ||
    user?.name ||
    (typeof user?.email === "string" ? user.email.split("@")[0] : null) ||
    "User";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.warn("Logout error:", err?.message || err);
    } finally {
      dispatch(setUser(null));
      navigate("/login", { replace: true });
    }
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const trimmedInput = input.trim();
    if (!trimmedInput || isBusyCurrent) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const activeChatId = currentChatId || localChatId;
    const isFirstMessage = !activeChatId;

    if (isFirstMessage) {
      setIsStartingChat(true);
      setPendingFirstMessage(trimmedInput);
    }

    const resolvedChatId = await chat.handleSendMessage({
      message: trimmedInput,
      chatId: activeChatId,
    });

    if (resolvedChatId) {
      setLocalChatId(resolvedChatId);
    }

    setIsStartingChat(false);
    setPendingFirstMessage("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (text) => {
    setInput(text);
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(adjustTextareaHeight, 10);
    }
  };

  const handleNewChat = () => {
    skipAutoOpenRef.current = true;
    dispatch(setCurrentChatId(null));
    setLocalChatId(null);
    setIsStartingChat(false);
    setPendingFirstMessage("");
    setInput("");
    setSidebarOpen(false);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleCopyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleToggleSpeak = (text, index) => {
    if (!window.speechSynthesis) return;

    if (speakingIndex === index) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`[\]]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingIndex(null);
    utterance.onerror = () => setSpeakingIndex(null);

    setSpeakingIndex(index);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportChat = () => {
    const currentChat = chats[currentChatId];
    if (!currentChat || !messages.length) return;

    const chatTitle = currentChat.title || "Intellix-Chat";
    let markdown = `# ${chatTitle}\nExported from Intellix AI on ${new Date().toLocaleString()}\n\n---\n\n`;

    messages.forEach((m) => {
      const sender = m.role === "user" ? `**${displayName}**` : "**Intellix AI**";
      markdown += `### ${sender}\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${chatTitle.replace(/[^a-zA-Z0-9_-]/g, "_")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStartRename = (e, item) => {
    e.stopPropagation();
    setEditingChatId(item.id);
    setEditingTitle(item.title);
  };

  const handleSaveRename = async (e, chatId) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      await chat.handleRenameChat(chatId, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleConfirmDelete = async () => {
    if (chatToDelete) {
      await chat.handleDeleteChat(chatToDelete);
      setChatToDelete(null);
    }
  };

  // Group chats by date (Today, Yesterday, Previous 7 Days, Older)
  const groupedChats = useMemo(() => {
    const chatList = Object.values(chats);
    const filtered = searchQuery.trim()
      ? chatList.filter((c) =>
          (c.title || "").toLowerCase().includes(searchQuery.toLowerCase().trim())
        )
      : chatList;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = todayStart - 86400000 * 7;

    const groups = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    filtered.forEach((c) => {
      const time = new Date(c.lastUpdated || c.updatedAt || Date.now()).getTime();
      if (time >= todayStart) {
        groups.Today.push(c);
      } else if (time >= yesterdayStart) {
        groups.Yesterday.push(c);
      } else if (time >= weekStart) {
        groups["Previous 7 Days"].push(c);
      } else {
        groups.Older.push(c);
      }
    });

    return groups;
  }, [chats, searchQuery]);

  return (
    <div className={`relative flex h-dvh w-full overflow-hidden ${isLightMode ? "bg-slate-100 text-slate-900" : "bg-[#090d16] text-zinc-100"}`}>
      {/* Delete Confirmation Modal */}
      {chatToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-white">
            <h3 className="text-base font-semibold">Delete Chat?</h3>
            <p className="mt-2 text-xs text-zinc-400">
              This conversation will be permanently deleted from your history.
            </p>
            <div className="mt-6 flex justify-end gap-2.5">
              <button
                onClick={() => setChatToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-xs md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR: History & Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col transition-all duration-300 md:static ${
          sidebarCollapsedDesktop ? "md:hidden" : "md:flex"
        } ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${
          isLightMode
            ? "bg-white border-r border-slate-200 shadow-sm"
            : "bg-[#0c1220] border-r border-zinc-800/80 backdrop-blur-xl"
        }`}
      >
        {/* Top Header */}
        <div className="p-3.5 border-b border-zinc-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-700/60 shadow-xs">
                <img src={logo} alt="Intellix" className="h-4 w-auto" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                  Intellix <span className="text-[10px] font-semibold text-rose-500 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded">AI</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSidebarCollapsedDesktop(true)}
                className="hidden md:grid place-items-center w-7 h-7 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={15} />
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden grid place-items-center w-7 h-7 rounded-lg text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            className="mt-3 flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 px-3.5 py-2.5 text-xs font-semibold text-white shadow-md shadow-rose-950/40 hover:brightness-110 active:scale-98 transition cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Plus size={15} />
              <span>New Conversation</span>
            </span>
            <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded text-white/80 font-mono">⌘N</span>
          </button>

          {/* Search Box */}
          <div className="mt-2.5 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history..."
              className={`w-full rounded-xl pl-8 pr-7 py-1.5 text-xs outline-none transition ${
                isLightMode
                  ? "bg-slate-100 text-slate-800 placeholder-slate-400 border border-slate-200"
                  : "bg-zinc-900/80 text-zinc-200 placeholder-zinc-500 border border-zinc-800 focus:border-zinc-700"
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* CHAT HISTORY LIST (Grouped Chronologically) */}
        <div className="chat-scrollbar flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {Object.entries(groupedChats).map(([groupTitle, chatItems]) => {
            if (chatItems.length === 0) return null;
            return (
              <div key={groupTitle} className="space-y-1">
                <div className="px-2 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                  {groupTitle}
                </div>

                {chatItems.map((item) => {
                  const isActive = currentChatId === item.id;
                  const isEditing = editingChatId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`group relative flex items-center rounded-xl text-xs transition ${
                        isActive
                          ? isLightMode
                            ? "bg-rose-50 text-rose-600 font-medium border border-rose-200"
                            : "bg-zinc-800/90 text-rose-300 font-medium border border-rose-500/30"
                          : isLightMode
                            ? "text-slate-700 hover:bg-slate-100"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40"
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center w-full p-1.5 gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="flex-1 bg-zinc-950 text-white text-xs px-2 py-1 rounded-lg border border-rose-500 outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRename(e, item.id);
                              if (e.key === "Escape") setEditingChatId(null);
                            }}
                          />
                          <button
                            onClick={(e) => handleSaveRename(e, item.id)}
                            className="p-1 rounded text-emerald-400 hover:bg-emerald-500/20"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setEditingChatId(null)}
                            className="p-1 rounded text-zinc-400 hover:bg-zinc-800"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={async () => {
                              await chat.handleOpenChat(item.id);
                              setLocalChatId(item.id);
                              setSidebarOpen(false);
                            }}
                            className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left cursor-pointer"
                          >
                            <MessageSquare size={14} className={isActive ? "text-rose-500 shrink-0" : "opacity-60 shrink-0"} />
                            <span className="truncate">{item.title}</span>
                          </button>

                          {/* Hover Actions: Rename & Delete */}
                          <div className="flex items-center gap-0.5 pr-1.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={(e) => handleStartRename(e, item)}
                              className="p-1 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-white transition cursor-pointer"
                              title="Rename"
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setChatToDelete(item.id);
                              }}
                              className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {Object.values(groupedChats).every((arr) => arr.length === 0) && (
            <div className="py-12 text-center text-xs text-zinc-400">
              {searchQuery ? "No matching chats found." : "No chat history yet."}
            </div>
          )}
        </div>

        {/* User Profile & Sign Out Footer */}
        <div className="p-3 border-t border-zinc-800/60 bg-black/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate text-white">{displayName}</p>
                <p className="text-[10px] text-zinc-400 truncate">Free Plan</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE CHAT AREA */}
      <main className="flex min-w-0 flex-1 flex-col relative h-full">
        {/* Top Navbar */}
        <header className="flex h-13 items-center justify-between border-b border-zinc-800/60 px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Sidebar toggle buttons */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden grid place-items-center w-8 h-8 rounded-lg text-zinc-300 hover:bg-zinc-800 transition"
            >
              <Menu size={18} />
            </button>

            {sidebarCollapsedDesktop && (
              <button
                onClick={() => setSidebarCollapsedDesktop(false)}
                className="hidden md:grid place-items-center w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
                title="Expand sidebar"
              >
                <PanelLeftOpen size={17} />
              </button>
            )}

            <div className="min-w-0 flex items-center gap-2">
              <span className="text-xs font-semibold truncate text-white">
                {chats[currentChatId]?.title || "New Chat"}
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Intellix AI 2.0
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                onClick={handleExportChat}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer"
                title="Export as Markdown"
              >
                <Download size={13} />
                <span className="hidden sm:inline text-xs">Export</span>
              </button>
            )}

            <button
              onClick={() => dispatch(toggleTheme())}
              className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
              title={`Switch to ${isLightMode ? "Dark" : "Light"} Mode`}
            >
              {isLightMode ? <Moon size={15} /> : <Sun size={15} />}
            </button>
          </div>
        </header>

        {/* Message Container */}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          {showWelcomeState ? (
            /* WELCOME HERO SCREEN */
            <div className="chat-scrollbar flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto p-4 sm:p-8">
              <div className="mx-auto max-w-xl text-center">
                <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-rose-400 p-0.5 shadow-xl shadow-rose-950/30">
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-zinc-950">
                    <Bot size={26} className="text-rose-500 animate-pulse" />
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  How can I help you today?
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-zinc-400">
                  Search the live web, read articles, draft emails, compute formulas, or explore places.
                </p>

                {/* Quick Prompts Grid */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                  {[
                    {
                      title: "Live Web Search",
                      desc: "Latest news & facts online",
                      prompt: "Search the web for top AI breakthroughs this month.",
                      icon: Globe,
                    },
                    {
                      title: "Summarize URL",
                      desc: "Extract text from any article",
                      prompt: "Read and summarize this URL: https://en.wikipedia.org/wiki/Artificial_intelligence",
                      icon: FileText,
                    },
                    {
                      title: "Draft an Email",
                      desc: "Formatted HTML email draft",
                      prompt: "Draft a polite follow-up email to a client regarding our software project.",
                      icon: Mail,
                    },
                    {
                      title: "Calculator & Math",
                      desc: "Instant math computation",
                      prompt: "Calculate: (1500 * 12) + (450 * 0.18) - 250",
                      icon: Calculator,
                    },
                    {
                      title: "World Date & Time",
                      desc: "Check exact current time",
                      prompt: "What is the current exact date, time, and timezone right now?",
                      icon: Clock,
                    },
                    {
                      title: "Find Places & Maps",
                      desc: "Discover restaurants & locations",
                      prompt: "Find the best coffee shops near me and provide Google Maps links.",
                      icon: MapPin,
                    },
                  ].map((p) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={p.title}
                        onClick={() => handlePromptClick(p.prompt)}
                        className="flex items-start gap-3 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3 text-left hover:border-rose-500/40 hover:bg-zinc-800/60 transition cursor-pointer"
                      >
                        <div className="grid h-7 w-7 place-items-center rounded-lg bg-rose-500/10 text-rose-400 shrink-0">
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-zinc-200">{p.title}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{p.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* CONVERSATION MESSAGE LIST */
            <div
              ref={messageListRef}
              onScroll={handleScroll}
              className="chat-scrollbar min-h-0 flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-5"
            >
              <div className="mx-auto max-w-3xl space-y-5">
                {isMessagesLoading && messages.length === 0 && (
                  <div className="space-y-3 py-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-800 animate-pulse shrink-0" />
                        <div className="h-16 flex-1 rounded-2xl bg-zinc-900 border border-zinc-800 animate-pulse" />
                      </div>
                    ))}
                  </div>
                )}

                {messages.map((m, idx) => {
                  const isUser = m.role === "user";

                  return (
                    <div key={`${m.role}-${idx}`} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                      {!isUser && (
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white shrink-0 shadow-md shadow-rose-950/40">
                          <Sparkles size={15} />
                        </div>
                      )}

                      <div
                        className={`group relative max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                          isUser
                            ? "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-950/30"
                            : isLightMode
                              ? "bg-white text-slate-800 border border-slate-200 shadow-xs"
                              : "bg-[#111827] text-zinc-100 border border-zinc-800/80 shadow-md"
                        }`}
                      >
                        {isUser ? (
                          <div className="flex items-start justify-between gap-3">
                            <p className="whitespace-pre-wrap">{m.content}</p>
                            <button
                              onClick={() => handleCopyMessage(m.content, idx)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-white/70 hover:text-white transition cursor-pointer shrink-0"
                              title="Copy"
                            >
                              {copiedIndex === idx ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="markdown-chat">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  code: CodeBlock,
                                  a: ({ href, children }) => (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium text-rose-400 underline decoration-rose-400/40 hover:text-rose-300"
                                    >
                                      {children}
                                    </a>
                                  ),
                                }}
                              >
                                {String(m.content || "")}
                              </ReactMarkdown>
                            </div>

                            {/* Assistant Footer Actions */}
                            <div className="mt-2.5 flex items-center gap-1 border-t border-zinc-800/50 pt-1.5 text-zinc-400">
                              <button
                                onClick={() => handleToggleSpeak(m.content, idx)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] hover:text-white hover:bg-zinc-800/60 transition cursor-pointer"
                                title="Listen"
                              >
                                {speakingIndex === idx ? (
                                  <>
                                    <VolumeX size={12} className="text-rose-400 animate-pulse" />
                                    <span className="text-rose-400">Stop</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 size={12} />
                                    <span>Read aloud</span>
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleCopyMessage(m.content, idx)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] hover:text-white hover:bg-zinc-800/60 transition cursor-pointer"
                                title="Copy"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check size={12} className="text-emerald-400" />
                                    <span className="text-emerald-400">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Copy response</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {isUser && (
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0 text-xs font-bold">
                          <User size={14} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Pending user prompt */}
                {!!pendingFirstMessage && !currentChatId && (
                  <div className="flex justify-end gap-3">
                    <div className="max-w-[80%] rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 text-white px-4 py-3 text-xs sm:text-sm">
                      <p className="whitespace-pre-wrap">{pendingFirstMessage}</p>
                    </div>
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-zinc-800 text-zinc-300 shrink-0">
                      <User size={14} />
                    </div>
                  </div>
                )}

                {/* Thinking / Streaming Indicator */}
                {(isTypingCurrent || isStartingChat) && (
                  <div className="flex gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white shrink-0">
                      <Sparkles size={15} />
                    </div>
                    <div className="rounded-2xl bg-[#111827] border border-zinc-800/80 px-4 py-2.5 text-xs text-zinc-300">
                      <div className="flex items-center gap-2">
                        <span className="typing-dots text-rose-500">
                          <span />
                          <span />
                          <span />
                        </span>
                        <span className="text-xs text-zinc-400">
                          {isStartingChat ? "Consulting AI..." : currentStatus || "Generating answer..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stream Chunks */}
                {!!streamContent && (
                  <div className="flex gap-3">
                    <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 text-white shrink-0">
                      <Sparkles size={15} />
                    </div>
                    <div className="rounded-2xl bg-[#111827] border border-zinc-800/80 px-4 py-3 text-xs sm:text-sm">
                      <p className="whitespace-pre-wrap">{streamContent}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Scroll to bottom float button */}
          {showScrollBottom && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 right-6 z-20 grid h-8 w-8 place-items-center rounded-full bg-zinc-800 text-white shadow-lg border border-zinc-700 hover:bg-zinc-700 transition cursor-pointer"
            >
              <ArrowDown size={14} />
            </button>
          )}
        </div>

        {/* BOTTOM INPUT BAR */}
        <div className="p-3 sm:p-4 border-t border-zinc-800/50 bg-[#090d16]/80 backdrop-blur-md">
          <div className="mx-auto max-w-3xl">
            <form
              onSubmit={handleSend}
              className="relative flex items-end gap-2 rounded-2xl border border-zinc-700/60 bg-zinc-900/90 px-3 py-2 shadow-xl focus-within:border-rose-500/70 focus-within:ring-2 focus-within:ring-rose-500/20 transition"
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Intellix anything... (Enter to send, Shift + Enter for new line)"
                className="max-h-40 w-full resize-none bg-transparent py-1.5 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none leading-relaxed"
              />

              <div className="flex items-center gap-1 shrink-0 pb-0.5">
                {input.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setInput("");
                      if (textareaRef.current) textareaRef.current.style.height = "auto";
                    }}
                    className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                )}

                <button
                  type="submit"
                  disabled={!input.trim() || isBusyCurrent}
                  className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-950/40 hover:brightness-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {isBusyCurrent ? (
                    <Code2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </div>
            </form>

            <div className="mt-1.5 flex items-center justify-between px-1 text-[10px] text-zinc-400">
              <span>Intellix can assist with real-time web search, reasoning, and tools.</span>
              <span className="hidden sm:inline">Shift + Enter for newline</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
