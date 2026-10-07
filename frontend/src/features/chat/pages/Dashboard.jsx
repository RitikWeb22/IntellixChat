import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Code2,
  LogOut,
  Menu,
  Moon,
  MessageSquare,
  Plus,
  Send,
  Sun,
  Trash2,
  UserCircle2,
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

// Custom code block component with copy functionality and syntax highlighting
const CodeBlock = ({ inline, className, children }) => {
  const [copied, setCopied] = useState(false);
  const themeMode = useSelector((state) => state.theme.mode);
  const isLightMode = themeMode === "light";
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";

  if (inline) {
    return (
      <code
        className={`rounded px-1.5 py-0.5 text-xs font-mono font-medium ${
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
    <div className="relative my-3 rounded-xl overflow-hidden border border-zinc-700/50 shadow-lg">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-zinc-900 border-b border-zinc-800 text-xs text-zinc-400">
        <span className="font-mono uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-zinc-300 hover:text-white hover:bg-zinc-800 transition text-xs font-medium cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
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
          backgroundColor: "#0d1117",
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
  const [themeFlash, setThemeFlash] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [chatToDelete, setChatToDelete] = useState(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const messageListRef = useRef(null);
  const textareaRef = useRef(null);
  const flashTimeoutRef = useRef(null);
  const previousThemeRef = useRef(null);
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

  // Run once: open socket and fetch chat list.
  useEffect(() => {
    chat.initializeSocketConnection();
    chat.handleGetChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ui = isLightMode
    ? {
        page: "bg-slate-50 text-slate-900",
        mobileToggle: "bg-white text-slate-700 shadow-sm border border-slate-200",
        sidebar: "bg-white/95 border-r border-slate-200 shadow-sm",
        sidebarHeader: "border-b border-slate-200/80",
        searchBox: "bg-slate-100 border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white",
        mutedText: "text-slate-500",
        heading: "text-slate-900",
        headerLabel: "text-slate-600",
        control: "bg-white text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-100",
        controlStatic: "bg-white text-slate-800 shadow-sm border border-slate-200",
        newChatBtn: "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200",
        chatActive: "bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs",
        chatIdle: "bg-slate-50/70 text-slate-700 hover:bg-slate-100 border border-transparent",
        dangerHover: "text-slate-400 hover:text-rose-600 hover:bg-rose-50",
        logout: "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-600",
        welcomePanel: "bg-white/80 border border-slate-200 shadow-sm",
        welcomeCard: "bg-white border border-slate-200 shadow-xs hover:border-rose-300 hover:shadow-md",
        bubbleUser: "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-sm",
        bubbleAi: "bg-white text-slate-800 border border-slate-200 shadow-sm",
        inputWrap: "bg-white border border-slate-300 shadow-md focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-400/20",
        inputText: "text-slate-900 placeholder:text-slate-400",
      }
    : {
        page: "bg-[#090d16] text-slate-100",
        mobileToggle: "bg-zinc-900 text-zinc-300 border border-zinc-800 shadow-md",
        sidebar: "bg-[#0d1322]/95 border-r border-zinc-800/80 backdrop-blur-xl",
        sidebarHeader: "border-b border-zinc-800/80",
        searchBox: "bg-zinc-900/80 border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:border-zinc-700",
        mutedText: "text-zinc-400",
        heading: "text-white",
        headerLabel: "text-zinc-400",
        control: "bg-zinc-900 text-zinc-200 border border-zinc-800 shadow-sm hover:bg-zinc-800",
        controlStatic: "bg-zinc-900 text-zinc-200 border border-zinc-800 shadow-sm",
        newChatBtn: "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30",
        chatActive: "bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-xs",
        chatIdle: "bg-zinc-900/40 text-zinc-300 hover:bg-zinc-800/60 border border-transparent",
        dangerHover: "text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10",
        logout: "bg-zinc-900/60 text-zinc-400 hover:bg-rose-500/10 hover:text-rose-300 border border-zinc-800/60",
        welcomePanel: "bg-zinc-900/40 border border-zinc-800/70 backdrop-blur-md shadow-xl",
        welcomeCard: "bg-zinc-900/60 border border-zinc-800/80 shadow-md hover:border-rose-500/40 hover:bg-zinc-800/60",
        bubbleUser: "bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-950/30",
        bubbleAi: "bg-[#131b2e]/90 text-zinc-100 border border-zinc-800/80 shadow-lg shadow-black/20",
        inputWrap: "bg-zinc-900/90 border border-zinc-700/60 shadow-2xl shadow-black/40 focus-within:border-rose-500/60 focus-within:ring-2 focus-within:ring-rose-500/20 backdrop-blur-xl",
        inputText: "text-zinc-100 placeholder:text-zinc-500",
      };

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

  // Theme change flash animation
  useEffect(() => {
    if (!previousThemeRef.current) {
      previousThemeRef.current = themeMode;
      return;
    }
    if (previousThemeRef.current !== themeMode) {
      setThemeFlash(themeMode === "light" ? "to-light" : "to-dark");
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setThemeFlash(""), 560);
    }
    previousThemeRef.current = themeMode;
  }, [themeMode]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Keep local fallback chat id
  useEffect(() => {
    if (currentChatId) {
      setLocalChatId(currentChatId);
    }
  }, [currentChatId]);

  // Auto-open first chat when loaded
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

  // Track scroll position to show scroll-to-bottom button
  const handleScroll = () => {
    if (!messageListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isScrolledUp);
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
    } catch (error) {
      console.error("Logout failed:", error);
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
    const isFirstMessageInNewChat = !activeChatId;

    if (isFirstMessageInNewChat) {
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

  const handlePromptCardClick = (promptText) => {
    setInput(promptText);
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

  // Copy message text
  const handleCopyMessage = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Text to speech
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

  // Export current chat to Markdown
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

  // Rename chat handlers
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

  const handleCancelRename = (e) => {
    e.stopPropagation();
    setEditingChatId(null);
  };

  // Delete chat confirmation
  const handleConfirmDelete = async () => {
    if (chatToDelete) {
      await chat.handleDeleteChat(chatToDelete);
      setChatToDelete(null);
    }
  };

  // Filtered chat list by search query
  const chatList = Object.values(chats);
  const filteredChats = searchQuery.trim()
    ? chatList.filter((c) =>
        (c.title || "").toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : chatList;

  return (
    <main className={`theme-fade relative h-dvh overflow-hidden ${ui.page}`}>
      {themeFlash && (
        <div className={`theme-flash theme-flash-${themeFlash}`} aria-hidden="true" />
      )}

      {/* Delete Confirmation Modal */}
      {chatToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl text-white">
            <h3 className="text-base font-semibold">Delete Conversation</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setChatToDelete(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative flex h-full w-full">
        {/* Mobile toggle button */}
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className={`absolute left-3 top-3 z-30 rounded-xl p-2.5 md:hidden transition cursor-pointer ${ui.mobileToggle}`}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {sidebarOpen && (
          <button
            className="absolute inset-0 z-20 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-80 p-4 transition-all duration-300 md:static ${
            sidebarCollapsedDesktop ? "md:hidden" : "md:flex"
          } ${ui.sidebar} ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } flex flex-col`}
        >
          {/* Header */}
          <div className={`pb-4 ${ui.sidebarHeader}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700/60 shadow-xs">
                  <img src={logo} alt="Intellix" className="h-5 w-auto" />
                </div>
                <div>
                  <h1 className={`text-lg font-bold tracking-tight ${ui.heading}`}>
                    Intellix
                  </h1>
                  <p className="text-[10px] uppercase tracking-wider text-rose-500 font-semibold">
                    AI Workspace
                  </p>
                </div>
              </div>

              {/* Desktop collapse button */}
              <button
                onClick={() => setSidebarCollapsedDesktop(true)}
                className="hidden md:grid place-items-center w-8 h-8 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition cursor-pointer"
                title="Collapse sidebar"
              >
                <PanelLeftClose size={16} />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition cursor-pointer shadow-xs ${ui.newChatBtn}`}
            >
              <Plus size={16} />
              New Conversation
            </button>

            {/* Search chat input */}
            <div className="mt-3 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs border outline-none transition ${ui.searchBox}`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Conversation List */}
          <div className="chat-scrollbar mt-3 flex-1 overflow-y-auto space-y-1.5 pr-1">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              <span>Conversations</span>
              <span>{filteredChats.length}</span>
            </div>

            {filteredChats.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400">
                {searchQuery ? "No matching chats found." : "No conversations yet."}
              </div>
            ) : (
              filteredChats.map((item) => (
                <div
                  key={item.id}
                  className={`group relative flex items-center rounded-xl text-sm transition ${
                    currentChatId === item.id ? ui.chatActive : ui.chatIdle
                  }`}
                >
                  {editingChatId === item.id ? (
                    <div className="flex items-center w-full p-2 gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="flex-1 bg-zinc-800 text-white text-xs px-2 py-1.5 rounded-lg border border-rose-500/50 outline-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(e, item.id);
                          if (e.key === "Escape") handleCancelRename(e);
                        }}
                      />
                      <button
                        onClick={(e) => handleSaveRename(e, item.id)}
                        className="p-1 rounded text-emerald-400 hover:bg-emerald-500/20"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        onClick={handleCancelRename}
                        className="p-1 rounded text-zinc-400 hover:bg-zinc-700"
                      >
                        <X size={14} />
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
                        className="flex min-w-0 flex-1 items-center justify-between px-3.5 py-2.5 text-left cursor-pointer"
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <MessageSquare size={15} className="shrink-0 opacity-70" />
                          <span className="truncate text-xs font-medium">{item.title}</span>
                        </span>
                        <ChevronRight
                          size={13}
                          className="opacity-0 transition group-hover:opacity-100 shrink-0 ml-1 text-zinc-400"
                        />
                      </button>

                      {/* Action buttons (Rename & Delete) */}
                      <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={(e) => handleStartRename(e, item)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition cursor-pointer"
                          title="Rename"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatToDelete(item.id);
                          }}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${ui.dangerHover}`}
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer User & Logout */}
          <div className="pt-3 border-t border-zinc-800/80">
            <button
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium transition cursor-pointer ${ui.logout}`}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <section className="flex min-w-0 flex-1 flex-col p-3 pt-14 md:p-5 md:pt-5 lg:p-6 lg:pt-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/50">
            <div className="flex items-center gap-3 min-w-0">
              {sidebarCollapsedDesktop && (
                <button
                  onClick={() => setSidebarCollapsedDesktop(false)}
                  className="hidden md:grid place-items-center w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white transition cursor-pointer shadow-xs"
                  title="Expand sidebar"
                >
                  <PanelLeftOpen size={17} />
                </button>
              )}
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${ui.heading}`}>
                  {chats[currentChatId]?.title || "New Conversation"}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] text-zinc-400 font-medium">Intellix AI Engine Active</span>
                </div>
              </div>
            </div>

            {/* Top Bar Actions */}
            <div className="inline-flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={handleExportChat}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${ui.control}`}
                  title="Export conversation as Markdown"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}

              <button
                onClick={() => dispatch(toggleTheme())}
                className={`grid h-9 w-9 place-items-center rounded-xl transition cursor-pointer ${ui.control}`}
                aria-label="Toggle theme"
                title={`Switch to ${isLightMode ? "Dark" : "Light"} Mode`}
              >
                {isLightMode ? <Moon size={15} /> : <Sun size={15} />}
              </button>

              <div className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium ${ui.controlStatic}`}>
                <UserCircle2 size={16} className="text-rose-500" />
                <span className="truncate max-w-[120px]">{displayName}</span>
              </div>
            </div>
          </div>

          {/* Chat Messages Body */}
          <div className="relative mt-3 flex min-h-0 flex-1 flex-col rounded-2xl">
            {showWelcomeState ? (
              <div className={`flex min-h-0 flex-1 items-center justify-center rounded-2xl p-6 md:p-8 overflow-y-auto ${ui.welcomePanel}`}>
                <div className="mx-auto max-w-2xl text-center py-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium mb-4">
                    <Sparkles size={13} />
                    <span>Multi-Agent AI Workspace</span>
                  </div>

                  <h2 className={`text-3xl font-extrabold tracking-tight sm:text-4xl ${ui.heading}`}>
                    What would you like to explore?
                  </h2>
                  <p className={`mt-2.5 text-xs sm:text-sm max-w-lg mx-auto ${ui.mutedText}`}>
                    Real-time web research, webpage reading, math computations, location finding, and instant email drafting.
                  </p>

                  {/* Feature Prompt Cards */}
                  <div className="mt-6 grid gap-2.5 text-left sm:grid-cols-2 md:grid-cols-3">
                    {[
                      {
                        title: "Live Web Search",
                        description: "Find latest news and research on any topic",
                        prompt: "Search the web for the latest artificial intelligence breakthroughs this year and summarize the top 3.",
                        icon: Globe,
                      },
                      {
                        title: "Read Webpage",
                        description: "Extract clean content from an article or URL",
                        prompt: "Read and summarize this webpage: https://en.wikipedia.org/wiki/Artificial_intelligence",
                        icon: FileText,
                      },
                      {
                        title: "Draft & Send Email",
                        description: "Create formatted HTML emails with attachments",
                        prompt: "Help me draft a polite follow-up email to a client regarding our proposal.",
                        icon: Mail,
                      },
                      {
                        title: "Math & Calculation",
                        description: "Accurately compute complex financial formulas",
                        prompt: "Calculate: (12500 * 1.08) - (450 * 12) + (3200 * 0.15)",
                        icon: Calculator,
                      },
                      {
                        title: "Date & Time",
                        description: "Check accurate current time across timezones",
                        prompt: "What is the current exact date, time, and timezone right now?",
                        icon: Clock,
                      },
                      {
                        title: "Google Maps",
                        description: "Discover nearby restaurants, shops, and directions",
                        prompt: "Find the best coffee shops near me and give me a Google Maps link.",
                        icon: MapPin,
                      },
                    ].map((feature) => {
                      const Icon = feature.icon;
                      return (
                        <div
                          key={feature.title}
                          onClick={() => handlePromptCardClick(feature.prompt)}
                          className={`welcome-card rounded-xl p-3.5 cursor-pointer transition ${ui.welcomeCard}`}
                        >
                          <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                            <Icon size={16} />
                          </div>
                          <p className="text-xs font-semibold">{feature.title}</p>
                          <p className={`mt-1 text-[11px] leading-4 ${ui.mutedText}`}>
                            {feature.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={messageListRef}
                onScroll={handleScroll}
                className="chat-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-3"
              >
                {isMessagesLoading && messages.length === 0 && (
                  <div className="space-y-3 py-2">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="flex justify-start">
                        <div className="chat-skeleton h-20 w-[80%] rounded-2xl" />
                      </div>
                    ))}
                  </div>
                )}

                {messages.map((message, index) => {
                  const isUser = message.role === "user";
                  return (
                    <div
                      key={`${message.role}-${index}`}
                      className={`flex ${isUser ? "justify-end" : "justify-start"} group`}
                    >
                      <div
                        className={`relative max-w-[95%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                          isUser ? ui.bubbleUser : ui.bubbleAi
                        }`}
                      >
                        {/* Header for AI response */}
                        {!isUser && (
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/40 text-[11px] text-zinc-400">
                            <div className="flex items-center gap-1.5">
                              <Sparkles size={12} className="text-rose-400" />
                              <span className="font-semibold text-rose-400">Intellix AI</span>
                            </div>

                            {/* Message actions (Copy & Speak) */}
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                onClick={() => handleToggleSpeak(message.content, index)}
                                className="p-1 rounded hover:bg-zinc-700/40 text-zinc-400 hover:text-white transition cursor-pointer"
                                title={speakingIndex === index ? "Stop speaking" : "Listen aloud"}
                              >
                                {speakingIndex === index ? (
                                  <VolumeX size={13} className="text-rose-400 animate-pulse" />
                                ) : (
                                  <Volume2 size={13} />
                                )}
                              </button>
                              <button
                                onClick={() => handleCopyMessage(message.content, index)}
                                className="p-1 rounded hover:bg-zinc-700/40 text-zinc-400 hover:text-white transition cursor-pointer"
                                title="Copy message"
                              >
                                {copiedIndex === index ? (
                                  <Check size={13} className="text-emerald-400" />
                                ) : (
                                  <Copy size={13} />
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {isUser ? (
                          <div className="flex items-start justify-between gap-3">
                            <p className="whitespace-pre-wrap leading-relaxed font-normal">{message.content}</p>
                            <button
                              onClick={() => handleCopyMessage(message.content, index)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-white/80 hover:text-white transition cursor-pointer shrink-0"
                              title="Copy"
                            >
                              {copiedIndex === index ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                          </div>
                        ) : (
                          <div className="markdown-chat">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code: CodeBlock,
                                table: ({ children }) => (
                                  <div className="my-3 overflow-x-auto rounded-xl border border-zinc-700/50 bg-black/20">
                                    <table className="markdown-table w-full text-left text-xs">
                                      {children}
                                    </table>
                                  </div>
                                ),
                                thead: ({ children }) => (
                                  <thead className="markdown-thead bg-zinc-800/80 text-zinc-300">
                                    {children}
                                  </thead>
                                ),
                                th: ({ children }) => (
                                  <th className="px-3.5 py-2.5 text-xs font-semibold uppercase tracking-wider">
                                    {children}
                                  </th>
                                ),
                                td: ({ children }) => (
                                  <td className="px-3.5 py-2.5 align-top border-t border-zinc-800/60">
                                    {children}
                                  </td>
                                ),
                                a: ({ href, children }) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-rose-400 underline decoration-rose-400/40 underline-offset-2 hover:text-rose-300 hover:decoration-rose-300"
                                  >
                                    {children}
                                  </a>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="mt-3 text-lg font-bold text-white">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="mt-2.5 text-base font-semibold text-white">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="mt-2 text-sm font-semibold text-white">
                                    {children}
                                  </h3>
                                ),
                              }}
                            >
                              {String(message.content || "")}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Pending user message while creating new chat */}
                {!!pendingFirstMessage && !currentChatId && (
                  <div className="flex justify-end">
                    <div className={`max-w-[95%] sm:max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-xs ${ui.bubbleUser}`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{pendingFirstMessage}</p>
                    </div>
                  </div>
                )}

                {/* AI typing/thinking indicator */}
                {(isTypingCurrent || isStartingChat) && (
                  <div className="flex justify-start">
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md ${ui.bubbleAi}`}>
                      <div className="flex items-center gap-2.5">
                        <span className="typing-dots text-rose-500" aria-label="AI is thinking">
                          <span />
                          <span />
                          <span />
                        </span>
                        <span className="text-xs font-medium text-zinc-400">
                          {isStartingChat ? "Consulting AI model..." : currentStatus || "Processing query..."}
                        </span>
                      </div>
                      <div className="loader-bars mt-2.5" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}

                {/* AI live streaming chunk */}
                {!!streamContent && (
                  <div className="flex justify-start">
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md ${ui.bubbleAi}`}>
                      <p className="whitespace-pre-wrap leading-relaxed">{streamContent}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Floating Scroll to Bottom button */}
            {showScrollBottom && (
              <button
                onClick={scrollToBottom}
                className="absolute bottom-3 right-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-zinc-800/90 text-white shadow-lg border border-zinc-700 hover:bg-zinc-700 transition cursor-pointer"
                title="Scroll to bottom"
              >
                <ArrowDown size={16} />
              </button>
            )}
          </div>

          {/* Prompt Input Form */}
          <form
            onSubmit={handleSend}
            className={`mt-3 flex items-end gap-2.5 rounded-2xl p-2 transition ${ui.inputWrap}`}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Intellix... (Press Enter to send, Shift+Enter for new line)"
              className={`max-h-44 w-full resize-none bg-transparent px-3 py-2.5 text-xs sm:text-sm outline-none leading-relaxed ${ui.inputText}`}
            />

            <div className="flex items-center gap-1.5 pb-1 pr-1">
              {input.trim() && (
                <button
                  type="button"
                  onClick={() => {
                    setInput("");
                    if (textareaRef.current) textareaRef.current.style.height = "auto";
                  }}
                  className="grid h-8 w-8 place-items-center rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition cursor-pointer"
                  title="Clear input"
                >
                  <X size={15} />
                </button>
              )}

              <button
                type="submit"
                disabled={!input.trim() || isBusyCurrent}
                className="grid h-10 w-10 place-items-center rounded-xl cursor-pointer bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-950/40 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
                aria-label="Send message"
              >
                {isBusyCurrent ? (
                  <Code2 size={16} className="animate-spin text-white" />
                ) : (
                  <Send size={15} />
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};

export default Dashboard;
