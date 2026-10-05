import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ChatWindow from './ChatWindow';
import { API_BASE } from '../config/api';

export default function ChatPanel() {
  const { user, token, loading } = useAuth();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    unreadCounts,
    joinConversation,
    leaveConversation,
    setMessagesForConversation,
    addConversation,
    connected
  } = useSocket();

  const [isOpen, setIsOpen] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!token || !user) return;

    const fetchConversations = async () => {
      setLoadingConversations(true);
      try {
        const res = await fetch(`${API_BASE}/api/conversations`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.conversations) {
          data.conversations.forEach(c => addConversation(c));
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoadingConversations(false);
      }
    };

    fetchConversations();
  }, [token, user, addConversation]);

  useEffect(() => {
    if (activeConversation) {
      joinConversation(activeConversation.id);

      const fetchMessages = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/conversations/${activeConversation.id}/messages`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.messages) {
            setMessagesForConversation(activeConversation.id, data.messages);
          }
        } catch (err) {
          console.error('Failed to load messages:', err);
        }
      };

      fetchMessages();
    }

    return () => {
      if (activeConversation) {
        leaveConversation(activeConversation.id);
      }
    };
  }, [activeConversation, token, joinConversation, leaveConversation, setMessagesForConversation]);

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
    if (!isOpen) setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setActiveConversation(null);
  };

  const getOtherParty = (conversation) => {
    if (user.role === 'provider') {
      return conversation.customer;
    }
    return conversation.provider?.user || conversation.provider;
  };

  const getUnreadCount = (conversationId) => unreadCounts[conversationId] || 0;

  if (loading || !user) return null;

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary-aesthetic position-fixed bottom-0 end-0 m-4"
          style={{
            zIndex: 1050,
            borderRadius: 50,
            width: 60,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(16, 196, 168, 0.45)',
            border: '2px solid #001E2B',
            background: 'linear-gradient(135deg, #10C4A8 0%, #0DB197 100%)'
          }}
          aria-label="Open chat"
        >
          <i className="bi bi-chat-dots-fill" style={{ fontSize: 24, color: '#001E2B' }}></i>
          {conversations.some(c => getUnreadCount(c.id) > 0) && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: 10, padding: '2px 6px' }}>
              {conversations.reduce((sum, c) => sum + getUnreadCount(c.id), 0)}
            </span>
          )}
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="position-fixed bottom-0 end-0 m-4"
          style={{
            zIndex: 1050,
            width: '380px',
            maxHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFBFC',
            borderRadius: 16,
            boxShadow: '0 8px 40px rgba(0,30,43,0.20)',
            border: '2px solid #10C4A8',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out'
          }}
        >
          <style jsx>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>

          {/* Header */}
          <div className="d-flex align-items-center justify-content-between p-3"
            style={{
              background: '#001E2B',
              color: '#FFFFFF',
              borderBottom: '2px solid #10C4A8'
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <div className="bg-white bg-opacity-20 rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 36, height: 36 }}>
                <i className="bi bi-chat-dots-fill" style={{ fontSize: 18 }}></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold" style={{ fontSize: 15 }}>Messages</h6>
                <small style={{ opacity: 0.8 }}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</small>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className={`badge ${connected ? 'bg-success' : 'bg-warning'}`}
                style={{ fontSize: 10, padding: '3px 8px' }}>
                {connected ? 'Online' : 'Connecting...'}
              </span>
              <button
                onClick={handleClose}
                className="btn btn-sm p-0"
                style={{ color: '#fff', background: 'transparent', border: 'none' }}
                aria-label="Close chat"
              >
                <i className="bi bi-x-lg" style={{ fontSize: 20 }}></i>
              </button>
            </div>
          </div>

          {/* Conversation List or Chat Window */}
          {activeConversation ? (
            <ChatWindow
              conversation={activeConversation}
              currentUser={user}
              messages={messages[activeConversation.id] || []}
              onClose={handleClose}
            />
          ) : (
            <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
              {loadingConversations ? (
                <div className="d-flex align-items-center justify-content-center py-5">
                  <div className="spinner-border text-primary" style={{ width: 24, height: 24 }}></div>
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center py-5 px-3" style={{ color: 'var(--text-muted)' }}>
                  <i className="bi bi-chat-dots" style={{ fontSize: 48, marginBottom: 12, opacity: 0.5 }}></i>
                  <p className="mb-1 fw-medium">No conversations yet</p>
                  <small>Start a chat from a provider's profile</small>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {conversations.map((conversation) => {
                    const otherParty = getOtherParty(conversation);
                    const unread = getUnreadCount(conversation.id);
                    const lastMsg = conversation.latestMessage;
                    const isOwnLastMsg = lastMsg?.senderId === user.id;

                    return (
                      <button
                        key={conversation.id}
                        onClick={() => handleConversationClick(conversation)}
                        className="list-group-item list-group-item-action d-flex align-items-start gap-3 px-3 py-3"
                        style={{
                          border: 'none',
                          borderBottom: '1px solid var(--border-light)',
                          background: 'transparent',
                          textAlign: 'left',
                          width: '100%',
                          transition: 'background 0.15s'
                        }}
                      >
                        <div className="position-relative flex-shrink-0">
                          <div className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: 44, height: 44, fontSize: 18, color: '#00684A', background: '#E6FAF6', border: '1px solid #10C4A8' }}>
                            <i className={user.role === 'provider' ? 'bi bi-person-fill' : 'bi bi-building-fill'}></i>
                          </div>
                          {unread > 0 && (
                            <span className="position-absolute top-0 end-0 translate-middle badge rounded-pill bg-danger"
                              style={{ fontSize: 10, padding: '2px 6px', minWidth: 18, height: 18 }}>
                            {unread > 9 ? '9+' : unread}
                          </span>
                          )}
                        </div>
                        <div className="flex-grow-1 min-w-0" style={{ minWidth: 0 }}>
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <h6 className="mb-0 fw-semibold" style={{ fontSize: 14, color: 'var(--text-primary)' }}>
                              {otherParty?.name || otherParty?.businessName || 'Unknown'}
                            </h6>
                            <small className="text-muted ms-2" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                              {lastMsg ? new Date(lastMsg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </small>
                          </div>
                          <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                            {lastMsg && (
                              <>
                                {isOwnLastMsg && <i className="bi bi-check2-all text-muted" style={{ fontSize: 11 }}></i>}
                                <span className="text-truncate d-block"
                                  style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {isOwnLastMsg ? 'You: ' : ''}{lastMsg.content}
                                </span>
                              </>
                            )}
                            {!lastMsg && (
                              <span className="text-muted" style={{ fontSize: 13 }}>No messages yet</span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}