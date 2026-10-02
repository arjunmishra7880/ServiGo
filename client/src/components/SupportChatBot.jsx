import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────
//  Knowledge Base
// ─────────────────────────────────────────────
const KB = [
  {
    id: 'greeting',
    patterns: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy'],
    answer: "👋 Hello! Welcome to **ServiGo Support**. I'm here to help you with bookings, finding providers, account issues, and more. How can I assist you today?",
  },
  {
    id: 'book_service',
    patterns: ['how to book', 'book a service', 'booking', 'make a booking', 'schedule', 'hire', 'how do i book'],
    answer: "📅 **How to book a service:**\n1. Go to the **Home page** and search for a service category.\n2. Browse providers and click on one you like.\n3. On the **Provider Detail** page, click **Book Now**.\n4. Choose your date, time, and add any notes.\n5. Confirm — and you're done!\n\nYou can view all your bookings under **My Bookings** in the menu.",
  },
  {
    id: 'cancel_booking',
    patterns: ['cancel booking', 'cancel my booking', 'how to cancel', 'refund', 'cancellation'],
    answer: "❌ **Cancelling a booking:**\n1. Go to **My Bookings** from the top menu.\n2. Find the booking you want to cancel.\n3. Click the **Cancel** button next to it.\n\nCancellations can usually be made before the provider confirms the booking. If you need help with a refund, please contact the provider directly via the chat feature.",
  },
  {
    id: 'booking_status',
    patterns: ['booking status', 'check my booking', 'where is my booking', 'confirm booking', 'booking confirmed', 'pending booking'],
    answer: "🔍 **Check your booking status:**\n- Go to **My Bookings** in the navigation menu.\n- Statuses include: **Pending** (waiting for provider), **Confirmed** (provider accepted), **Completed**, or **Cancelled**.\n\nIf your booking has been pending for too long, try messaging the provider directly using the chat button.",
  },
  {
    id: 'find_provider',
    patterns: ['find provider', 'search provider', 'find service', 'how to find', 'search for', 'looking for', 'near me'],
    answer: "🔎 **Finding a service provider:**\n1. On the **Home page**, use the search bar or pick a **category** from the list.\n2. You can filter by **location**, **rating**, and **service type**.\n3. Click any provider card to see their full profile, reviews, and contact options.\n\nTip: Allow location access to find providers near you!",
  },
  {
    id: 'provider_rating',
    patterns: ['rating', 'review', 'how to rate', 'leave a review', 'rate a provider', 'feedback'],
    answer: "⭐ **Leaving a review:**\n1. Go to **My Bookings**.\n2. Find a **Completed** booking.\n3. Click **Leave Review** and give a star rating with your comments.\n\nYour honest reviews help other customers make better decisions and help providers improve their services!",
  },
  {
    id: 'account_create',
    patterns: ['create account', 'register', 'sign up', 'new account', 'join', 'how to register'],
    answer: "🆕 **Creating an account:**\n1. Click **Register** in the top navigation bar.\n2. Choose your role: **Customer** or **Service Provider**.\n3. Fill in your name, email, and password.\n4. Submit and you're ready to go!\n\nProviders will also fill in their business details and service categories.",
  },
  {
    id: 'account_login',
    patterns: ['login', 'log in', 'sign in', 'cant login', "can't login", 'forgot password', 'password', 'access account'],
    answer: "🔐 **Logging in / Account access:**\n- Click **Login** in the top navigation bar.\n- Enter your registered email and password.\n\n**Forgot your password?** Currently, please contact our support team for a password reset. We're working on a self-service reset feature!\n\nMake sure you're using the same email you registered with.",
  },
  {
    id: 'contact_provider',
    patterns: ['contact provider', 'message provider', 'chat with provider', 'talk to provider', 'reach provider'],
    answer: "💬 **Contacting a provider:**\n1. Open any **Provider Detail** page.\n2. Click the **Message** or **Chat** button.\n3. A chat window will open in the bottom-right corner.\n\nYou can also view all your chats by clicking the **chat bubble icon** in the bottom-right corner anytime.",
  },
  {
    id: 'payment',
    patterns: ['payment', 'pay', 'how to pay', 'price', 'cost', 'fee', 'charges', 'billing'],
    answer: "💳 **Payments & Pricing:**\n- Pricing is set by each **individual provider** and displayed on their profile.\n- Payment terms are agreed upon between you and the provider (usually settled directly).\n- ServiGo does not currently process payments — it connects you with the right service provider.\n\nAlways confirm the price with your provider before confirming a booking.",
  },
  {
    id: 'become_provider',
    patterns: ['become a provider', 'register as provider', 'offer service', 'list my service', 'provider account', 'service provider'],
    answer: "🛠️ **Becoming a service provider:**\n1. Click **Register** and select the **Service Provider** role.\n2. Fill in your **business name**, service category, location, and description.\n3. Once registered, customers can find your profile and book your services!\n\nKeep your profile complete and respond to bookings quickly to build your ratings.",
  },
  {
    id: 'provider_not_responding',
    patterns: ['provider not responding', 'no reply', 'provider inactive', 'unresponsive', 'not answering'],
    answer: "😕 **Provider not responding?**\n- Give them some time — providers may be busy with current jobs.\n- Try sending them a message via the **chat feature**.\n- If they remain unresponsive, consider **cancelling** and booking with another provider.\n\nWe encourage all providers to respond within 24 hours.",
  },
  {
    id: 'app_issue',
    patterns: ['app not working', 'bug', 'error', 'problem', 'issue', 'not loading', 'broken', 'glitch', 'crash'],
    answer: "🐛 **App issues / Bugs:**\n- Try **refreshing** the page first.\n- **Clear your browser cache** and cookies.\n- Make sure you have a stable internet connection.\n- Try using a different browser (Chrome or Firefox recommended).\n\nIf the issue persists, describe the problem in detail and our team will look into it. We're constantly improving ServiGo!",
  },
  {
    id: 'categories',
    patterns: ['categories', 'what services', 'types of services', 'available services', 'what can i book'],
    answer: "🏠 **Available Service Categories on ServiGo:**\n- 🔧 Plumbing\n- ⚡ Electricians\n- 🧹 Cleaning\n- 🪴 Gardening\n- 🎨 Painting\n- 🔑 Locksmiths\n- 🚗 Auto Repair\n- 🧱 Construction\n- And many more!\n\nBrowse all categories on the **Home page** to see what's available in your area.",
  },
  {
    id: 'safety',
    patterns: ['safe', 'safety', 'trusted', 'verified', 'background check', 'scam', 'fraud', 'legit'],
    answer: "🛡️ **Safety on ServiGo:**\n- All providers must **register with valid credentials**.\n- **Customer reviews and ratings** help identify trustworthy providers.\n- Always check a provider's **profile, reviews, and ratings** before booking.\n- Meet providers in a safe environment and confirm service details before work begins.\n\nIf you suspect fraudulent activity, please report it to us immediately.",
  },
  {
    id: 'thanks',
    patterns: ['thank you', 'thanks', 'thank', 'appreciate', 'helpful', 'great', 'awesome'],
    answer: "😊 You're welcome! I'm glad I could help. Is there anything else you'd like to know about ServiGo? I'm here whenever you need assistance!",
  },
  {
    id: 'bye',
    patterns: ['bye', 'goodbye', 'see you', 'later', 'done'],
    answer: "👋 Goodbye! Have a wonderful experience with ServiGo. Don't hesitate to come back if you need help. Take care! 😊",
  },
];

const QUICK_REPLIES = [
  { label: '📅 How to book?', query: 'how to book' },
  { label: '🔍 Find a provider', query: 'find provider' },
  { label: '❌ Cancel booking', query: 'cancel booking' },
  { label: '🔐 Login issues', query: 'cant login' },
  { label: '⭐ Leave a review', query: 'how to rate' },
  { label: '💬 Contact provider', query: 'contact provider' },
];

// ─────────────────────────────────────────────
//  Answer Resolver
// ─────────────────────────────────────────────
function resolveAnswer(query) {
  const q = query.toLowerCase().trim();

  for (const item of KB) {
    for (const pattern of item.patterns) {
      if (q.includes(pattern)) return item.answer;
    }
  }

  // Fuzzy single-word fallback
  for (const item of KB) {
    for (const pattern of item.patterns) {
      const words = pattern.split(' ');
      if (words.some((w) => w.length > 3 && q.includes(w))) return item.answer;
    }
  }

  return "🤔 I'm not sure about that. Here are some things I can help with:\n\n• **Booking a service** — how to book, cancel, or check status\n• **Finding providers** — search and filter options\n• **Account help** — login, register, profile\n• **Reviews & ratings** — how to leave feedback\n• **Payments** — pricing and billing\n\nTry rephrasing your question or pick a quick topic below!";
}

// ─────────────────────────────────────────────
//  Markdown-lite Renderer
// ─────────────────────────────────────────────
function renderText(text) {
  return text.split('\n').map((line, i) => {
    const html = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const isItem = /^\d+\./.test(line.trim()) || line.trim().startsWith('•') || line.trim().startsWith('-');
    return (
      <span
        key={i}
        style={{ display: 'block', marginBottom: isItem ? 2 : 0 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  });
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export default function SupportChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: "👋 Hi! I'm **ServiGo Assistant**. Ask me anything about bookings, providers, your account, or how the app works. I'm here to help!",
      time: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const msgIdRef = useRef(2);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setIsMinimized(false);
      setTimeout(() => inputRef.current?.focus(), 120);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized, isTyping]);

  const addBotMessage = useCallback((text) => {
    setIsTyping(true);
    const delay = 700 + Math.min(text.length * 4, 1400);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: msgIdRef.current++, type: 'bot', text, time: new Date() },
      ]);
      if (!isOpen) setHasUnread(true);
    }, delay);
  }, [isOpen]);

  const handleSend = useCallback((overrideText) => {
    const q = (overrideText || inputText).trim();
    if (!q || isTyping) return;
    setMessages((prev) => [
      ...prev,
      { id: msgIdRef.current++, type: 'user', text: q, time: new Date() },
    ]);
    setInputText('');
    addBotMessage(resolveAnswer(q));
  }, [inputText, isTyping, addBotMessage]);

  const formatTime = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <style>{`
        @keyframes sbSlideUp {
          from { opacity: 0; transform: translateY(24px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sbPulse {
          0%   { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes sbBounce {
          0%,100% { transform: translateY(0); }
          50%     { transform: translateY(-4px); }
        }
        @keyframes sbDot {
          0%,80%,100% { transform: translateY(0); opacity: 0.4; }
          40%         { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes sbFade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sb-msg { animation: sbFade 0.22s ease-out; }
        .sb-dot { width:7px;height:7px;border-radius:50%;background:#00B4D8;display:inline-block;margin:0 2px; }
        .sb-dot:nth-child(1){animation:sbDot 1.2s ease-in-out infinite;}
        .sb-dot:nth-child(2){animation:sbDot 1.2s ease-in-out 0.2s infinite;}
        .sb-dot:nth-child(3){animation:sbDot 1.2s ease-in-out 0.4s infinite;}
        .sb-quick:hover{background:#023E8A!important;color:#fff!important;border-color:#023E8A!important;transform:translateY(-1px);}
        .sb-send:not(:disabled):hover{background:linear-gradient(135deg,#03045E,#023E8A)!important;transform:scale(1.06);}
        .sb-input:focus{outline:none;border-color:#00B4D8!important;box-shadow:0 0 0 3px rgba(0,180,216,0.18)!important;}
        .sb-msgs::-webkit-scrollbar{width:4px;}
        .sb-msgs::-webkit-scrollbar-track{background:transparent;}
        .sb-msgs::-webkit-scrollbar-thumb{background:#CAF0F8;border-radius:4px;}
        .sb-ctrl:hover{background:rgba(255,255,255,0.2)!important;}
      `}</style>

      {/* ── Floating Trigger ── */}
      {!isOpen && (
        <div style={{ position:'fixed', bottom:24, left:24, zIndex:1060, display:'flex', flexDirection:'column', alignItems:'flex-start', gap:8 }}>
          <div
            style={{
              background:'#03045E', color:'#fff', fontSize:12, fontWeight:700,
              padding:'5px 12px', borderRadius:20, whiteSpace:'nowrap',
              fontFamily:'Plus Jakarta Sans,sans-serif',
              boxShadow:'0 4px 12px rgba(3,4,94,0.3)',
              animation:'sbBounce 2.4s ease-in-out infinite',
            }}
          >
            💬 Need help?
          </div>
          <div style={{ position:'relative' }}>
            <div style={{
              position:'absolute', inset:0, borderRadius:'50%',
              border:'2px solid #00B4D8', animation:'sbPulse 2s ease-out infinite',
            }} />
            <button
              id="support-chatbot-trigger"
              onClick={() => setIsOpen(true)}
              aria-label="Open support chat"
              style={{
                width:58, height:58, borderRadius:'50%',
                background:'linear-gradient(135deg,#023E8A 0%,#00B4D8 100%)',
                border:'none', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center',
                boxShadow:'0 6px 24px rgba(2,62,138,0.45)',
                transition:'all 0.2s ease', position:'relative',
              }}
            >
              <i className="bi bi-headset" style={{ fontSize:24, color:'#fff' }} />
              {hasUnread && (
                <span style={{
                  position:'absolute', top:4, right:4, width:12, height:12,
                  background:'#ff4757', borderRadius:'50%', border:'2px solid #fff',
                }} />
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Chat Panel ── */}
      {isOpen && (
        <div
          id="support-chatbot-panel"
          style={{
            position:'fixed', bottom:24, left:24, zIndex:1060,
            width:370, borderRadius:20, overflow:'hidden',
            boxShadow:'0 20px 60px rgba(3,4,94,0.3),0 4px 16px rgba(0,0,0,0.1)',
            display:'flex', flexDirection:'column',
            fontFamily:'Plus Jakarta Sans,sans-serif',
            animation:'sbSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
            border:'1px solid rgba(202,240,248,0.8)',
            background:'#FFFFFF',
          }}
        >
          {/* Header */}
          <div style={{
            background:'linear-gradient(135deg,#03045E 0%,#023E8A 60%,#00B4D8 100%)',
            padding:'14px 16px', display:'flex', alignItems:'center', gap:12,
          }}>
            <div style={{
              width:42, height:42, borderRadius:'50%',
              background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)',
              display:'flex', alignItems:'center', justifyContent:'center',
              flexShrink:0, border:'2px solid rgba(255,255,255,0.3)',
            }}>
              <i className="bi bi-headset" style={{ fontSize:20, color:'#fff' }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ color:'#fff', fontWeight:700, fontSize:15, lineHeight:1.2 }}>
                ServiGo Assistant
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                <span style={{
                  width:7, height:7, borderRadius:'50%', background:'#2ed573',
                  display:'inline-block', boxShadow:'0 0 6px #2ed573',
                }} />
                <span style={{ color:'rgba(255,255,255,0.75)', fontSize:11 }}>
                  Online · Always ready to help
                </span>
              </div>
            </div>
            <div style={{ display:'flex', gap:4 }}>
              <button
                className="sb-ctrl"
                onClick={() => setIsMinimized(v => !v)}
                aria-label="Minimize"
                style={{
                  background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8,
                  width:30, height:30, cursor:'pointer', color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background 0.15s',
                }}
              >
                <i className={`bi bi-${isMinimized ? 'chevron-up' : 'dash-lg'}`} style={{ fontSize:14 }} />
              </button>
              <button
                className="sb-ctrl"
                onClick={() => setIsOpen(false)}
                aria-label="Close support chat"
                style={{
                  background:'rgba(255,255,255,0.1)', border:'none', borderRadius:8,
                  width:30, height:30, cursor:'pointer', color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  transition:'background 0.15s',
                }}
              >
                <i className="bi bi-x-lg" style={{ fontSize:14 }} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages */}
              <div
                className="sb-msgs"
                style={{
                  overflowY:'auto', padding:'16px 14px 8px',
                  display:'flex', flexDirection:'column', gap:10,
                  maxHeight:340, background:'#F4FAFC',
                }}
              >
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className="sb-msg"
                    style={{
                      display:'flex',
                      flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                      alignItems:'flex-end', gap:8,
                    }}
                  >
                    {msg.type === 'bot' && (
                      <div style={{
                        width:28, height:28, borderRadius:'50%', flexShrink:0,
                        background:'linear-gradient(135deg,#023E8A,#00B4D8)',
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        <i className="bi bi-robot" style={{ fontSize:13, color:'#fff' }} />
                      </div>
                    )}
                    <div style={{
                      maxWidth:'80%', padding:'10px 14px',
                      borderRadius: msg.type === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                      background: msg.type === 'user'
                        ? 'linear-gradient(135deg,#023E8A 0%,#00B4D8 100%)'
                        : '#FFFFFF',
                      color: msg.type === 'user' ? '#fff' : '#03045E',
                      fontSize:13.5, lineHeight:1.55, wordBreak:'break-word',
                      boxShadow: msg.type === 'user'
                        ? '0 4px 12px rgba(2,62,138,0.25)'
                        : '0 2px 8px rgba(0,0,0,0.07)',
                      border: msg.type === 'bot' ? '1px solid #CAF0F8' : 'none',
                    }}>
                      {renderText(msg.text)}
                      <div style={{
                        fontSize:10, marginTop:5, opacity:0.55,
                        textAlign: msg.type === 'user' ? 'right' : 'left',
                      }}>
                        {formatTime(msg.time)}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="sb-msg" style={{ display:'flex', alignItems:'flex-end', gap:8 }}>
                    <div style={{
                      width:28, height:28, borderRadius:'50%', flexShrink:0,
                      background:'linear-gradient(135deg,#023E8A,#00B4D8)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <i className="bi bi-robot" style={{ fontSize:13, color:'#fff' }} />
                    </div>
                    <div style={{
                      background:'#FFFFFF', border:'1px solid #CAF0F8',
                      borderRadius:'4px 18px 18px 18px', padding:'12px 16px',
                      boxShadow:'0 2px 8px rgba(0,0,0,0.07)',
                      display:'flex', alignItems:'center', gap:2,
                    }}>
                      <span className="sb-dot" />
                      <span className="sb-dot" />
                      <span className="sb-dot" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Replies */}
              <div style={{
                padding:'8px 14px', background:'#FFFFFF',
                borderTop:'1px solid #CAF0F8',
                display:'flex', flexWrap:'wrap', gap:6,
              }}>
                {QUICK_REPLIES.map(qr => (
                  <button
                    key={qr.query}
                    className="sb-quick"
                    onClick={() => handleSend(qr.query)}
                    disabled={isTyping}
                    style={{
                      fontSize:11, padding:'4px 10px', borderRadius:20,
                      border:'1.5px solid #00B4D8', background:'#CAF0F8',
                      color:'#023E8A', cursor:'pointer', fontWeight:600,
                      transition:'all 0.18s ease', fontFamily:'inherit',
                      whiteSpace:'nowrap',
                    }}
                  >
                    {qr.label}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div style={{
                padding:'10px 14px 12px', background:'#FFFFFF',
                borderTop:'1px solid #CAF0F8',
                display:'flex', gap:8, alignItems:'center',
              }}>
                <input
                  id="support-chatbot-input"
                  ref={inputRef}
                  className="sb-input"
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Ask me anything…"
                  disabled={isTyping}
                  maxLength={300}
                  style={{
                    flex:1, padding:'9px 14px', borderRadius:24,
                    border:'1.5px solid #BEE3F8', fontSize:13.5,
                    fontFamily:'inherit', outline:'none',
                    background:'#F4FAFC', color:'#03045E',
                    transition:'border-color 0.2s,box-shadow 0.2s',
                  }}
                />
                <button
                  id="support-chatbot-send"
                  className="sb-send"
                  onClick={() => handleSend()}
                  disabled={!inputText.trim() || isTyping}
                  aria-label="Send message"
                  style={{
                    width:40, height:40, borderRadius:'50%',
                    background: inputText.trim()
                      ? 'linear-gradient(135deg,#023E8A 0%,#00B4D8 100%)'
                      : '#e0e0e0',
                    border:'none',
                    cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink:0, transition:'all 0.2s ease',
                    boxShadow: inputText.trim() ? '0 4px 12px rgba(2,62,138,0.3)' : 'none',
                  }}
                >
                  <i className="bi bi-send-fill" style={{ fontSize:15, color: inputText.trim() ? '#fff' : '#aaa' }} />
                </button>
              </div>

              {/* Footer */}
              <div style={{
                padding:'5px 14px 10px', background:'#fff',
                textAlign:'center', fontSize:10.5, color:'#90a0b0',
                fontFamily:'inherit',
              }}>
                🤖 Powered by ServiGo AI Support · Always available
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
