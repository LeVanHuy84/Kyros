import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { useWorkspace } from '../../hooks/useWorkspace';
import type { UrgencyLevel } from '../../types/notification';

interface NotificationsDropdownProps {
  onClose?: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  onClose,
}) => {
  const navigate = useNavigate();
  const { activeWorkspace } = useWorkspace();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismiss,
  } = useNotifications();

  const [statusFilter, setStatusFilter] = useState<'Unread' | 'Read' | 'All'>(
    'Unread'
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Initial fetch on mount or statusFilter change
  useEffect(() => {
    if (activeWorkspace) {
      fetchNotifications(statusFilter);
    }
  }, [activeWorkspace, statusFilter, fetchNotifications]);

  // Connect to real-time SSE stream
  useEffect(() => {
    if (!activeWorkspace) return;

    const token = localStorage.getItem('token');
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const streamUrl =
      `${baseUrl}/v1/workspaces/${activeWorkspace.id}/notifications/stream?workspaceId=${activeWorkspace.id}` +
      (token ? `&token=${token}` : '');

    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener('notification', () => {
      // Refresh the current view when a new notification is dispatched
      fetchNotifications(statusFilter);
    });

    eventSource.onerror = (err) => {
      console.warn('SSE EventSource disconnected. Reconnecting...', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [activeWorkspace, statusFilter, fetchNotifications]);

  // Click outside to close handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        if (onClose) onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleItemClick = (item: any) => {
    if (item.status === 'Unread') {
      markAsRead(item.notificationId);
    }
    if (item.metadata?.type === 'calendar_reminder' && item.metadata?.eventId) {
      setIsOpen(false);
      if (onClose) onClose();
      navigate(`/calendar?eventId=${item.metadata.eventId}`);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const getUrgencyColor = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'Critical':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#F87171' };
      case 'Urgent':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FBBF24' };
      case 'Normal':
        return { bg: '#E0F2FE', text: '#075985', border: '#38BDF8' };
      case 'Low':
        return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hrs ago`;
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="notifications-container"
      ref={dropdownRef}
      style={{ position: 'relative' }}
    >
      {/* Bell Trigger Button */}
      <button
        className="action-btn"
        title="Notifications [Bell]"
        onClick={handleToggle}
        aria-label={`Notifications, ${unreadCount} unread`}
        style={{ position: 'relative' }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="action-badge"
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              backgroundColor: '#EF4444',
              color: 'white',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: 'bold',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          className="notification-dropdown-panel"
          style={{
            position: 'absolute',
            right: 0,
            top: '40px',
            width: '380px',
            maxHeight: '500px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-app)',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-primary)',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check size={14} />
                Mark all read
              </button>
            )}
          </div>

          {/* Filters */}
          <div
            style={{
              display: 'flex',
              padding: '8px 16px',
              borderBottom: '1px solid var(--border-color)',
              gap: '8px',
            }}
          >
            {(['Unread', 'Read', 'All'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  border: 'none',
                  backgroundColor:
                    statusFilter === filter
                      ? 'var(--color-primary)'
                      : 'transparent',
                  color:
                    statusFilter === filter ? 'white' : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Feed List Container */}
          <div
            role="feed"
            aria-busy={isLoading}
            style={{
              overflowY: 'auto',
              flex: 1,
              maxHeight: '340px',
            }}
          >
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                }}
              >
                All caught up!
              </div>
            ) : (
              notifications.map((item) => {
                const colors = getUrgencyColor(item.urgencyLevel);
                return (
                  <div
                    key={item.notificationId}
                    onClick={() => handleItemClick(item)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor:
                        item.status === 'Unread'
                          ? 'rgba(79, 70, 229, 0.03)'
                          : 'transparent',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      cursor: item.metadata?.type ? 'pointer' : 'default',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      {/* Urgency Badge */}
                      <span
                        style={{
                          backgroundColor: colors.bg,
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.urgencyLevel}
                      </span>

                      <span
                        style={{ fontSize: '12px', color: 'var(--text-muted)' }}
                      >
                        {formatTime(item.createdAt)}
                      </span>
                    </div>

                    <h4
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        fontWeight: item.status === 'Unread' ? '700' : '600',
                        color: 'var(--text-main)',
                      }}
                    >
                      {item.title}
                    </h4>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '13px',
                        color: 'var(--text-muted)',
                        lineHeight: '1.4',
                      }}
                    >
                      {item.content}
                    </p>

                    {/* Actions */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '12px',
                        marginTop: '4px',
                      }}
                    >
                      {item.status === 'Unread' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(item.notificationId);
                          }}
                          title="Mark read"
                          aria-label="Mark notification as read"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismiss(item.notificationId);
                        }}
                        title="Dismiss"
                        aria-label="Dismiss notification"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
