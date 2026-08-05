package com.assistant.auth.domain;

import com.assistant.kernel.domain.UserId;
import java.util.Optional;

public interface UserRepository {

  UserIdentity save(UserIdentity user);

  Optional<UserIdentity> findById(UserId id);

  Optional<UserIdentity> findByEmail(String email);

  void saveSessionEvent(SessionEvent event);
}
