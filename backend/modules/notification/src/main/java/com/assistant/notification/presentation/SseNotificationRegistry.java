package com.assistant.notification.presentation;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public final class SseNotificationRegistry {

  private SseNotificationRegistry() {}

  private static final Map<String, SseEmitter> emitters = new ConcurrentHashMap<>();

  public static SseEmitter register(WorkspaceId workspaceId, UserId userId) {
    String key = keyOf(workspaceId, userId);
    // Timeout of 30 minutes
    SseEmitter emitter = new SseEmitter(1800000L);
    emitters.put(key, emitter);

    emitter.onCompletion(() -> emitters.remove(key));
    emitter.onTimeout(() -> emitters.remove(key));
    emitter.onError((e) -> emitters.remove(key));

    // Send initial ping to establish connection
    try {
      emitter.send(SseEmitter.event().name("ping").data("connected"));
    } catch (IOException e) {
      emitters.remove(key);
    }

    return emitter;
  }

  public static void send(WorkspaceId workspaceId, UserId userId, Object data) {
    String key = keyOf(workspaceId, userId);
    SseEmitter emitter = emitters.get(key);
    if (emitter != null) {
      try {
        emitter.send(SseEmitter.event().name("notification").data(data));
      } catch (IOException e) {
        emitters.remove(key);
      }
    }
  }

  private static String keyOf(WorkspaceId workspaceId, UserId userId) {
    return workspaceId.value().toString() + ":" + userId.value().toString();
  }
}
