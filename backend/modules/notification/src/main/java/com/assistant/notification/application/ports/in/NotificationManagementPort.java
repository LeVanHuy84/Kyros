package com.assistant.notification.application.ports.in;

import com.assistant.notification.application.dto.DismissNotificationCommand;
import com.assistant.notification.application.dto.GetNotificationProfileQuery;
import com.assistant.notification.application.dto.MarkNotificationReadCommand;
import com.assistant.notification.application.dto.NotificationProfileDTO;
import com.assistant.notification.application.dto.UpdateNotificationProfileCommand;

public interface NotificationManagementPort {
  void markAsRead(MarkNotificationReadCommand command);

  void dismiss(DismissNotificationCommand command);

  void updateProfile(UpdateNotificationProfileCommand command);

  NotificationProfileDTO getProfile(GetNotificationProfileQuery query);
}
