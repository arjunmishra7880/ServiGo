import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';

export default function ChatWindow({ conversation, currentUser, messages: initialMessages, onClose }) {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState(initialMessages);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const { sendMessage, markAsRead, joinConversation, leaveConversation, activeConversation, setActiveConversation } = useSocket();

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (activeConversation?.id === conversation.id) {
      markAsRead(conversation.id);
    }
  }, [activeConversation, conversation.id, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      sendMessage(conversation.id, messageText.trim());
      setMessageText('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const getOtherParty = () => {
    if (currentUser.role === 'provider') {
      return conversation.customer;
    }
    return conversation.provider?.user || conversation.provider;
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.createdAt);
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '600px' }}>
      {/* Chat Header */}
      <div className="d-flex align-items-center gap-3 p-3"
        style={{ borderBottom: '1.5px solid #10C4A8', background: '#FFFFFF' }}
      >
        <button
          onClick={() => setActiveConversation(null)}
          className="btn btn-sm p-0 me-2"
          style={{ color: '#001E2B', background: 'transparent', border: 'none' }}
          aria-label="Back to conversations"
        >
          <i className="bi bi-chevron-left" style={{ fontSize: 20 }}></i>
        </button>
        <div className="flex-shrink-0">
          <div className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: 40, height: 40, fontSize: 16, color: '#00684A', background: '#E6FAF6', border: '1px solid #10C4A8' }}>
            <i className={currentUser.role === 'provider' ? 'bi bi-person-fill' : 'bi bi-building-fill'}></i>
          </div>
        </div>
        <div className="flex-grow-1 min-w-0">
          <h6 className="mb-0 fw-semibold" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
            {getOtherParty()?.name || getOtherParty()?.businessName || 'Unknown'}
          </h6>
          <small className="text-muted" style={{ fontSize: 11 }}>
            {currentUser.role === 'provider' ? 'Customer' : 'Service Provider'}
          </small>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: '#FFFBFC'
        }}
      >
        {Object.entries(groupedMessages).map(([date, dayMessages]) => (
          <React.Fragment key={date}>
            <div className="text-center my-2">
              <span className="badge bg-light text-muted px-3 py-1" style={{ fontSize: 11, fontWeight: 500 }}>
                {date}
              </span>
            </div>
            {dayMessages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUser.id}
                currentUser={currentUser}
              />
            ))}
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="p-3"
        style={{ borderTop: '1.5px solid #10C4A8', background: '#FFFFFF' }}
      >
        <div className="d-flex align-items-center gap-2">
          <div className="flex-grow-1 position-relative">
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="form-control form-control-sm"
              style={{
                borderRadius: 24,
                border: '1.5px solid #10C4A8',
                padding: '8px 16px',
                fontSize: 14,
                background: '#FFFBFC',
                color: '#001E2B'
              }}
              disabled={sending}
              maxLength={1000}
            />
          </div>
          <button
            type="submit"
            disabled={!messageText.trim() || sending}
            className="btn btn-primary-aesthetic p-0 d-flex align-items-center justify-content-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 50,
              background: '#001E2B',
              border: 'none'
            }}
          >
            <i className="bi bi-send-fill" style={{ fontSize: 18, color: '#10C4A8' }}></i>
          </button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message, isOwn, currentUser }) {
  return (
    <div className={`d-flex ${isOwn ? 'justify-content-end' : 'justify-content-start'}`}>
      <div
        className="d-flex flex-column"
        style={{
          maxWidth: '75%',
          ...(isOwn ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' })
        }}
      >
        {!isOwn && (
          <small className="text-muted ms-1 mb-1" style={{ fontSize: 11 }}>
            {message.senderName}
          </small>
        )}
        <div
          className={`rounded-3 px-4 py-2 ${isOwn ? 'rounded-end-0' : 'rounded-start-0'}`}
          style={{
            background: isOwn
              ? 'linear-gradient(135deg, #10C4A8 0%, #0DB197 100%)'
              : '#E6FAF6',
            color: '#001E2B',
            boxShadow: '0 1px 3px rgba(0,30,43,0.10)',
            fontSize: 14,
            fontWeight: 600,
            lineHeight: 1.5,
            wordWrap: 'break-word',
            border: isOwn ? '1px solid #001E2B' : '1px solid rgba(16, 196, 168, 0.35)'
          }}
        >
          {message.content}
        </div>
        <div className="d-flex align-items-center gap-1 mt-1"
          style={{ ...(isOwn ? { justifyContent: 'flex-end' } : {}) }}
        >
          <small className="text-muted" style={{ fontSize: 10 }}>
            {formatTime(message.createdAt)}
          </small>
          {isOwn && message.read && (
            <i className="bi bi-check2-all text-primary" style={{ fontSize: 11 }}></i>
          )}
          {isOwn && !message.read && (
            <i className="bi bi-check2 text-muted" style={{ fontSize: 11 }}></i>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}