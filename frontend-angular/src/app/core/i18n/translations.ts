export interface TranslationSchema {
  nav: {
    agent: string;
    tasks: string;
    calendar: string;
    notes: string;
    memory: string;
    settings: string;
    systemStatus: string;
    liveBadge: string;
  };
  topNav: {
    searchPlaceholder: string;
    searchShortcut: string;
    toggleSidebar: string;
    workspaceTitle: string;
    defaultWorkspace: string;
    lightModeTooltip: string;
    darkModeTooltip: string;
    notificationsTooltip: string;
    userProfile: string;
    switchLangTooltip: string;
  };
  common: {
    online: string;
    offline: string;
    loading: string;
    save: string;
    cancel: string;
    close: string;
  };
}

export const translations: Record<'vi' | 'en', TranslationSchema> = {
  vi: {
    nav: {
      agent: 'Trợ lý AI',
      tasks: 'Công việc',
      calendar: 'Lịch biểu',
      notes: 'Ghi chú',
      memory: 'Ký ức AI',
      settings: 'Cài đặt',
      systemStatus: 'Kyros OS Trực tuyến',
      liveBadge: 'Trực tiếp',
    },
    topNav: {
      searchPlaceholder: 'Tìm kiếm hoặc lệnh nhanh...',
      searchShortcut: 'Ctrl K',
      toggleSidebar: 'Thu gọn / Mở rộng menu',
      workspaceTitle: 'Không gian làm việc',
      defaultWorkspace: 'Kyros Workspace',
      lightModeTooltip: 'Chuyển sang giao diện Sáng',
      darkModeTooltip: 'Chuyển sang giao diện Tối',
      notificationsTooltip: 'Thông báo',
      userProfile: 'Tài khoản điều hành',
      switchLangTooltip: 'Chuyển sang English',
    },
    common: {
      online: 'Trực tuyến',
      offline: 'Ngoại tuyến',
      loading: 'Đang tải...',
      save: 'Lưu thay đổi',
      cancel: 'Hủy bỏ',
      close: 'Đóng',
    },
  },
  en: {
    nav: {
      agent: 'AI Assistant',
      tasks: 'Tasks & Focus',
      calendar: 'Calendar',
      notes: 'Notes Vault',
      memory: 'Memory Vault',
      settings: 'Settings',
      systemStatus: 'Kyros OS Online',
      liveBadge: 'Live',
    },
    topNav: {
      searchPlaceholder: 'Search or type a command...',
      searchShortcut: 'Ctrl K',
      toggleSidebar: 'Toggle sidebar navigation',
      workspaceTitle: 'Workspace',
      defaultWorkspace: 'Kyros Workspace',
      lightModeTooltip: 'Switch to Light mode',
      darkModeTooltip: 'Switch to Dark mode',
      notificationsTooltip: 'Notifications',
      userProfile: 'Executive Account',
      switchLangTooltip: 'Chuyển sang Tiếng Việt',
    },
    common: {
      online: 'Online',
      offline: 'Offline',
      loading: 'Loading...',
      save: 'Save changes',
      cancel: 'Cancel',
      close: 'Close',
    },
  },
};
