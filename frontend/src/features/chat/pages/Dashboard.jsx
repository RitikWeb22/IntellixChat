import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Code2,
  LogOut,
  Menu,
  Moon,
  MessageSquare,
  Sparkles,
  Plus,
  Send,
  Sun,
  Table2,
  Trash2,
  UserCircle2,
  X,
  Copy,
  Check,
  Globe,
  Mail,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useChat } from "../hooks/useChat";
import { logout } from "../../auth/services/auth.api";
import { setUser } from "../../auth/auth.slice";
import { setCurrentChatId } from "../chat.slice";
import { toggleTheme } from "../../../app/theme.slice";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

// Custom code block component with copy functionality and syntax highlighting
const CodeBlock = ({ node, inline, className, children, ...props }) => {
  const [copied, setCopied] = useState(false);
  const themeMode = useSelector((state) => state.theme.mode);
  const isLightMode = themeMode === "light";
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "text";

  if (inline) {
    return (
      <code
        className={`rounded px-1.5 py-0.5 text-sm font-mono ${
          isLightMode
            ? "bg-slate-200 text-slate-800"
            : "bg-slate-700 text-slate-100"
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
    <div className="relative my-3 rounded-lg overflow-hidden">
      {language && language !== "text" && (
        <div
          className={`absolute right-14 top-3 z-20 rounded-md px-3 py-1.5 text-xs ${
            isLightMode
              ? "bg-slate-200 text-slate-700"
              : "bg-slate-800 text-slate-400"
          }`}
        >
          {language}
        </div>
      )}
      <button
        onClick={handleCopy}
        className={`absolute right-3 top-3 z-30 rounded-md p-2 transition ${
          isLightMode
            ? "bg-slate-200 text-slate-700 hover:bg-slate-300"
            : "bg-slate-700 text-slate-200 hover:bg-slate-600"
        }`}
        title="Copy code"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
      </button>
      <SyntaxHighlighter
        language={language}
        style={isLightMode ? atomDark : atomDark}
        customStyle={{
          margin: 0,
          padding: "1rem",
          paddingRight: "3rem",
          fontSize: "0.875rem",
          borderRadius: "0.5rem",
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
  const [input, setInput] = useState("");
  const [localChatId, setLocalChatId] = useState(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [pendingFirstMessage, setPendingFirstMessage] = useState("");
  const [themeFlash, setThemeFlash] = useState("");
  const messageListRef = useRef(null);
  const flashTimeoutRef = useRef(null);
  const previousThemeRef = useRef(null);
  const skipAutoOpenRef = useRef(false);

  // Run once: open socket and fetch chat list.
  useEffect(() => {
    chat.initializeSocketConnection();
    chat.handleGetChats();
  }, []);

  const user = useSelector((state) => state.auth.user);
  const chats = useSelector((state) => state.chat.chats || {});
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const isMessagesLoading = useSelector(
    (state) => state.chat.isMessagesLoading || false,
  );
  const typingByChatId = useSelector(
    (state) => state.chat.typingByChatId || {},
  );
  const statusByChatId = useSelector(
    (state) => state.chat.statusByChatId || {},
  );
  const streamByChatId = useSelector(
    (state) => state.chat.streamByChatId || {},
  );
  const themeMode = useSelector((state) => state.theme.mode);
  const isLightMode = themeMode === "light";
  const ui = isLightMode
    ? {
        page: "bg-linear-to-br from-[#f7f8ff] via-[#fbfdff] to-[#edf3ff] text-slate-900",
        mobileToggle: "bg-white text-slate-700 shadow",
        sidebar: "bg-white/85 md:bg-white/70",
        mutedText: "text-slate-500",
        heading: "text-slate-900",
        headerLabel: "text-slate-500",
        control: "bg-white text-slate-700 shadow hover:bg-slate-100",
        controlStatic: "bg-white text-slate-800 shadow",
        newChatBtn:
          "bg-[#eaf0ff] text-[#243b67] hover:bg-[#dbe7ff] hover:text-[#1f2f54]",
        chatActive: "bg-[#e8efff] text-[#1f3560] shadow-sm",
        chatIdle: "bg-white text-slate-700 hover:bg-slate-50",
        dangerHover: "text-slate-500 hover:bg-rose-100 hover:text-rose-600",
        logout: "bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600",
        welcomePanel: "bg-white/75 shadow-sm",
        welcomeCard: "bg-white shadow-sm",
        bubbleUser: "bg-[#e8efff] text-[#1f3560] shadow-sm",
        bubbleAi: "bg-white text-slate-800 shadow-sm",
        inputWrap: "bg-white shadow",
        inputText: "text-slate-900 placeholder:text-slate-400",
      }
    : {
        page: "bg-linear-to-br from-[#161b2e] via-[#1e2438] to-[#171c30] text-slate-100",
        mobileToggle: "bg-[#232a42] text-slate-200 shadow",
        sidebar: "bg-[#171d31]/92 md:bg-[#171d31]/76",
        mutedText: "text-slate-400",
        heading: "text-slate-100",
        headerLabel: "text-slate-400",
        control: "bg-[#232a42] text-slate-100 shadow hover:bg-[#2a3350]",
        controlStatic: "bg-[#232a42] text-slate-100 shadow",
        newChatBtn:
          "bg-[#232a42] text-slate-100 hover:bg-[#2a3350] hover:text-slate-100",
        chatActive: "bg-[#3a466f] text-slate-100 shadow-sm",
        chatIdle: "bg-[#202741]/70 text-slate-200 hover:bg-[#27304f]",
        dangerHover: "text-slate-400 hover:bg-rose-500/20 hover:text-rose-300",
        logout:
          "bg-[#202741]/70 text-slate-200 hover:bg-rose-500/10 hover:text-rose-200",
        welcomePanel: "bg-[#222a45]/55 shadow-sm",
        welcomeCard: "bg-[#232b47]/70 shadow-sm",
        bubbleUser: "bg-[#3a466f] text-slate-100 shadow-sm",
        bubbleAi: "bg-[#232b47] text-slate-100 shadow-sm",
        inputWrap: "bg-[#202741]/85 shadow",
        inputText: "text-slate-100 placeholder:text-slate-500",
      };
  const messages = chats[currentChatId]?.messages || [];
  const isTypingCurrent = Boolean(typingByChatId[currentChatId]);
  const currentStatus = statusByChatId[currentChatId] || "";
  const streamContent = streamByChatId[currentChatId] || "";
  const isBusyCurrent =
    isTypingCurrent || Boolean(streamContent) || isStartingChat;
  const showWelcomeState =
    !currentChatId &&
    messages.length === 0 &&
    !pendingFirstMessage &&
    !isStartingChat &&
    !isTypingCurrent &&
    !streamContent;

  useEffect(() => {
    if (!previousThemeRef.current) {
      previousThemeRef.current = themeMode;
      return;
    }

    if (previousThemeRef.current !== themeMode) {
      setThemeFlash(themeMode === "light" ? "to-light" : "to-dark");
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      flashTimeoutRef.current = setTimeout(() => {
        setThemeFlash("");
      }, 560);
    }

    previousThemeRef.current = themeMode;
  }, [themeMode]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, []);

  // Keep a local fallback chat id for sending during state transitions.
  useEffect(() => {
    if (currentChatId) {
      setLocalChatId(currentChatId);
    }
  }, [currentChatId]);

  // Auto-open the first chat when chat data arrives.
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
  }, [chats, currentChatId]);

  // Keep the latest messages visible.
  useEffect(() => {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }, [messages.length, isTypingCurrent, currentChatId]);

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
    // Form submit (Enter or button click) lands here.
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    // Clear immediately for snappy UX while request is in-flight.
    setInput("");

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

  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    await chat.handleDeleteChat(chatId);
  };

  const handleNewChat = () => {
    skipAutoOpenRef.current = true;
    dispatch(setCurrentChatId(null));
    setLocalChatId(null);
    setIsStartingChat(false);
    setPendingFirstMessage("");
    setInput("");
    setSidebarOpen(false);
  };

  return (
    <main className={`theme-fade relative h-dvh overflow-hidden ${ui.page}`}>
      {themeFlash && (
        <div
          className={`theme-flash theme-flash-${themeFlash}`}
          aria-hidden="true"
        />
      )}
      <div className="relative flex h-full w-full">
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className={`absolute left-3 top-3 z-30 rounded-xl p-2 md:hidden ${ui.mobileToggle}`}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        {sidebarOpen && (
          <button
            className="absolute inset-0 z-10 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          />
        )}

        <aside
          className={`absolute inset-y-0 left-0 z-20 w-72 p-5 transition-transform duration-300 md:static md:translate-x-0 ${ui.sidebar} ${sidebarOpen ? "translate-x-0" : "-translate-x-[120%]"}`}
        >
          <div className="flex h-full flex-col">
            <div>
              <h1
                className={`text-3xl font-semibold tracking-tight ${ui.heading}`}
              >
                Intellix
              </h1>
              <p className={`mt-2 text-sm ${ui.mutedText}`}>
                Your AI workspace
              </p>

              <button
                onClick={handleNewChat}
                className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${ui.newChatBtn}`}
              >
                <Plus size={16} />
                New Chat
              </button>
            </div>

            <div className="mt-8 space-y-3">
              {Object.values(chats).map((item) => (
                <div
                  key={item.id}
                  className={`group flex items-center rounded-xl text-sm transition ${currentChatId === item.id ? ui.chatActive : ui.chatIdle}`}
                >
                  <button
                    onClick={async () => {
                      await chat.handleOpenChat(item.id);
                      setLocalChatId(item.id);
                      setSidebarOpen(false);
                    }}
                    className="flex min-w-0 flex-1 items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <MessageSquare size={16} className="opacity-80" />
                      <span className="truncate">{item.title}</span>
                    </span>
                    <ChevronRight
                      size={14}
                      className="opacity-0 transition group-hover:opacity-100"
                    />
                  </button>

                  <button
                    onClick={(event) => handleDeleteChat(event, item.id)}
                    className={`mr-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg transition ${ui.dangerHover}`}
                    aria-label="Delete chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className={`mt-auto flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${ui.logout}`}
            >
              <span className="grid h-7 w-7 place-items-center rounded-full">
                <LogOut size={14} />
              </span>
              Logout
            </button>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col p-2 pt-16 md:p-4 md:pt-4 lg:p-5 lg:pt-5">
          <div className="flex items-center justify-between pb-4">
            <p className={`text-sm tracking-wide ${ui.headerLabel}`}>
              {chats[currentChatId]?.title || "New Conversation"}
            </p>
            <div className="inline-flex items-center gap-2">
              <button
                onClick={() => dispatch(toggleTheme())}
                className={`grid h-10 w-10 place-items-center rounded-xl transition ${ui.control}`}
                aria-label="Toggle theme"
              >
                {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
              </button>

              <div
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${ui.controlStatic}`}
              >
                <UserCircle2 size={18} />
                {displayName}
              </div>
            </div>
          </div>

          <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-2xl bg-transparent p-2 md:p-3">
            {showWelcomeState ? (
              <div
                className={`flex min-h-0 flex-1 items-center justify-center rounded-2xl p-6 md:p-10 ${ui.welcomePanel}`}
              >
                <div className="mx-auto max-w-2xl text-center">
                  <h2
                    className={`text-4xl font-semibold tracking-tight md:text-5xl ${ui.heading}`}
                  >
                    Intellix
                  </h2>
                  <p className={`mt-3 text-sm md:text-base ${ui.mutedText}`}>
                    Fast answers, live web research, and smart AI assistance in
                    one workspace.
                  </p>

                  <div className="mt-7 grid gap-3 text-left md:grid-cols-3">
                    {[
                      {
                        title: "Search Internet",
                        description:
                          "Fetch latest information from the web in real time.",
                        icon: Globe,
                      },
                      {
                        title: "Read Web Page",
                        description:
                          "Extracts clean text content directly from a URL.",
                        icon: Table2,
                      },
                      {
                        title: "Send Email",
                        description:
                          "Draft and send formatted HTML emails from chat.",
                        icon: Mail,
                      },
                    ].map((feature) => (
                      <div
                        key={feature.title}
                        className={`welcome-card rounded-xl p-4 ${ui.welcomeCard}`}
                      >
                        <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                          <feature.icon size={15} />
                        </div>
                        <p className="text-sm font-semibold">{feature.title}</p>
                        <p className={`mt-1 text-xs leading-5 ${ui.mutedText}`}>
                          {feature.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={messageListRef}
                className="chat-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto pr-2"
              >
                {isMessagesLoading && messages.length === 0 && (
                  <div className="space-y-3 py-1">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex justify-start">
                        <div className="chat-skeleton h-18 w-[88%] rounded-2xl" />
                      </div>
                    ))}
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[98%] wrap-break-word overflow-hidden rounded-2xl px-4 py-3 text-sm md:${message.role === "user" ? "max-w-[88%]" : "max-w-[94%]"} ${message.role === "user" ? ui.bubbleUser : ui.bubbleAi}`}
                    >
                      {message.role === "user" ? (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        <div className="markdown-chat">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code: CodeBlock,
                              table: ({ children }) => (
                                <div className="my-3 overflow-x-auto rounded-lg bg-slate-500/5">
                                  <table className="markdown-table w-full text-left text-sm">
                                    {children}
                                  </table>
                                </div>
                              ),
                              thead: ({ children }) => (
                                <thead className="markdown-thead">
                                  {children}
                                </thead>
                              ),
                              th: ({ children }) => (
                                <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide">
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="px-3 py-2 align-top">
                                  {children}
                                </td>
                              ),
                              a: ({ href, children }) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-red-500 underline decoration-red-400/60 underline-offset-2"
                                >
                                  {children}
                                </a>
                              ),
                              h1: ({ children }) => (
                                <h1 className="mt-3 text-xl font-semibold">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="mt-3 text-lg font-semibold">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="mt-2 text-base font-semibold">
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
                ))}

                {!!pendingFirstMessage && !currentChatId && (
                  <div className="flex justify-end">
                    <div
                      className={`max-w-[98%] wrap-break-word overflow-hidden rounded-2xl px-4 py-3 text-sm md:max-w-[88%] ${ui.bubbleUser}`}
                    >
                      <p className="whitespace-pre-wrap">
                        {pendingFirstMessage}
                      </p>
                    </div>
                  </div>
                )}

                {(isTypingCurrent || isStartingChat) && (
                  <div className="flex justify-start">
                    <div
                      className={`max-w-[94%] rounded-2xl px-4 py-3 text-sm shadow-sm ${ui.bubbleAi}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="typing-dots" aria-label="AI is typing">
                          <span />
                          <span />
                          <span />
                        </span>
                        <span className="text-xs opacity-80">
                          {isStartingChat
                            ? "Searching..."
                            : currentStatus || "Typing..."}
                        </span>
                      </div>
                      <div className="loader-bars mt-3" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}

                {!!streamContent && (
                  <div className="flex justify-start">
                    <div
                      className={`max-w-[94%] wrap-break-word overflow-hidden rounded-2xl px-4 py-3 text-sm ${ui.bubbleAi}`}
                    >
                      <p className="whitespace-pre-wrap">{streamContent}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <form
            onSubmit={handleSend}
            className={`mt-5 flex items-center gap-3 rounded-2xl p-2.5 ${ui.inputWrap}`}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Intellix anything..."
              className={`h-12 w-full rounded-xl bg-transparent px-4 text-sm outline-none ${ui.inputText}`}
            />
            <button
              type="submit"
              disabled={!input.trim() || isBusyCurrent}
              className="grid h-12 w-12 place-items-center rounded-xl cursor-pointer bg-linear-to-r from-red-600 to-red-500 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Send message"
            >
              {isBusyCurrent ? (
                <Code2 size={16} className="animate-pulse" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};
export default Dashboard;
