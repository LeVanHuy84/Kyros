import { useState, useCallback } from 'react';
import { useWorkspace } from './useWorkspace';
import apiClient from '../services/api-client';
import type {
  InAppNotification,
  NotificationProfile,
  PaginatedResponse,
} from '../types/notification';

export const useNotifications = () => {
  const { activeWorkspace } = useWorkspace();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [profile, setProfile] = useState<NotificationProfile | null>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 1,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(
    async (status: string = 'Unread', page: number = 0, size: number = 20) => {
      if (!activeWorkspace) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(
          `/v1/workspaces/${activeWorkspace.id}/notifications`,
          { params: { status, page, size } }
        );

        const payload = res.data as PaginatedResponse<InAppNotification>;
        setNotifications(payload.data || []);
        setPagination(
          payload.meta || { page, size, totalElements: 0, totalPages: 1 }
        );

        // Update unread count by doing a quick fetch or looking at meta
        if (status === 'Unread') {
          setUnreadCount(payload.meta?.totalElements || 0);
        } else {
          const countRes = await apiClient.get(
            `/v1/workspaces/${activeWorkspace.id}/notifications`,
            { params: { status: 'Unread', page: 0, size: 1 } }
          );
          setUnreadCount(countRes.data?.meta?.totalElements || 0);
        }
      } catch (err: any) {
        setError(err.friendlyMessage || 'Failed to load notifications');
      } finally {
        setIsLoading(false);
      }
    },
    [activeWorkspace]
  );

  const markAsRead = async (notificationId: string) => {
    if (!activeWorkspace) return false;
    setError(null);
    try {
      await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/notifications/${notificationId}/read`
      );
      // Update locally
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === notificationId ? { ...n, status: 'Read' } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      return true;
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to mark notification as read');
      return false;
    }
  };

  const markAllAsRead = async () => {
    if (!activeWorkspace) return false;
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/notifications/read-all`
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, status: 'Read' })));
      setUnreadCount(0);
      return true;
    } catch (err: any) {
      setError(
        err.friendlyMessage || 'Failed to mark all notifications as read'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const dismiss = async (notificationId: string) => {
    if (!activeWorkspace) return false;
    setError(null);
    try {
      await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/notifications/${notificationId}/dismiss`
      );
      setNotifications((prev) =>
        prev.filter((n) => n.notificationId !== notificationId)
      );
      return true;
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to dismiss notification');
      return false;
    }
  };

  const fetchProfile = useCallback(async () => {
    if (!activeWorkspace) return null;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(
        `/v1/workspaces/${activeWorkspace.id}/notification-profile`
      );
      setProfile(res.data);
      return res.data as NotificationProfile;
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to load notification profile');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [activeWorkspace]);

  const updateProfile = async (
    updatedProfile: Partial<NotificationProfile>
  ) => {
    if (!activeWorkspace) return false;
    setIsSaving(true);
    setError(null);
    try {
      const res = await apiClient.put(
        `/v1/workspaces/${activeWorkspace.id}/notification-profile`,
        updatedProfile
      );
      setProfile(res.data);
      return true;
    } catch (err: any) {
      setError(err.friendlyMessage || 'Failed to update notification profile');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    notifications,
    unreadCount,
    profile,
    pagination,
    isLoading,
    isSaving,
    error,
    setError,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    dismiss,
    fetchProfile,
    updateProfile,
  };
};
