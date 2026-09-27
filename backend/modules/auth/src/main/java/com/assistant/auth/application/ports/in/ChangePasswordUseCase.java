package com.assistant.auth.application.ports.in;

import com.assistant.kernel.domain.UserId;

public interface ChangePasswordUseCase {
  void changePassword(UserId userId, String currentPassword, String newPassword);
}
