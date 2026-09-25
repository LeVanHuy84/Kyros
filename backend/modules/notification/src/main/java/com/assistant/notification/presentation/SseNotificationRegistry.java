package com.assistant.notification.presentation;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Component
public class SseNotificationRegistry {

  private static final Map<String, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

  public static SseEmitter register(WorkspaceId workspaceId, UserId userId) {
    String key = keyOf(workspaceId, userId);
    // Timeout of 30 minutes
    SseEmitter emitter = new SseEmitter(1800000L);
    emitters.computeIfAbsent(key, k -> new CopyOnWriteArraySet<>()).add(emitter);

    Runnable cleanup =
        () -> {
          Set<SseEmitter> set = emitters.get(key);
          if (set != null) {
            set.remove(emitter);
            if (set.isEmpty()) {
              emitters.remove(key);
            }
          }
        };

    emitter.onCompletion(cleanup);
    emitter.onTimeout(cleanup);
    emitter.onError((e) -> cleanup.run());

    // Send initial ping to establish connection
    try {
      emitter.send(SseEmitter.event().name("ping").data("connected"));
    } catch (IOException e) {
      cleanup.run();
    }

    return emitter;
  }

  public static void send(WorkspaceId workspaceId, UserId userId, Object data) {
    String key = keyOf(workspaceId, userId);
    Set<SseEmitter> set = emitters.get(key);
    if (set != null) {
      set.removeIf(
          emitter -> {
            try {
              emitter.send(SseEmitter.event().name("notification").data(data));
              return false;
            } catch (IOException e) {
              return true;
            }
          });
      if (set.isEmpty()) {
        emitters.remove(key);
      }
    }
  }

  @Scheduled(fixedRate = 25000)
  public void sendHeartbeat() {
    emitters
        .entrySet()
        .removeIf(
            entry -> {
              Set<SseEmitter> set = entry.getValue();
              set.removeIf(
                  emitter -> {
                    try {
                      emitter.send(SseEmitter.event().name("ping").data("keep-alive"));
                      return false;
                    } catch (Exception e) {
                      return true;
                    }
                  });
              return set.isEmpty();
            });
  }

  private static String keyOf(WorkspaceId workspaceId, UserId userId) {
    return workspaceId.value().toString() + ":" + userId.value().toString();
  }
}
