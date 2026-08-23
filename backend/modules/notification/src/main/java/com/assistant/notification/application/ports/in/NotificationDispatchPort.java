package com.assistant.notification.application.ports.in;

import com.assistant.notification.application.dto.DispatchNotificationCommand;

public interface NotificationDispatchPort {
  void dispatch(DispatchNotificationCommand command);
}
