package com.assistant.agent.application.service;

import com.assistant.agent.domain.model.AgentAction;
import com.assistant.agent.domain.nlp.NaturalDateTimeParser;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

/**
 * Fallback rule-based cognitive planner for scheduling, task, note, and memory operations when no
 * custom LLM is configured.
 */
@Component
public class AgentRulePlanner {

  private final MessageSource messageSource;

  public AgentRulePlanner(
      @org.springframework.beans.factory.annotation.Autowired(required = false)
          MessageSource messageSource) {
    this.messageSource = messageSource;
  }

  public List<AgentAction> planActions(
      UUID workspaceId, UUID userId, String prompt, Locale locale) {
    List<AgentAction> actions = new ArrayList<>();
    String trimmed = prompt != null ? prompt.trim() : "";
    String lower = trimmed.toLowerCase(Locale.ROOT);

    // 0. Deterministic Slash Commands (CLI execution mode)
    if (trimmed.startsWith("/")) {
      String[] parts = trimmed.split("\\s+", 2);
      String cmd = parts[0].toLowerCase(Locale.ROOT);
      String param = parts.length > 1 ? parts[1].trim() : "";

      switch (cmd) {
        case "/task":
        case "/todo":
          if (param.isEmpty()) {
            actions.add(
                new AgentAction(
                    "list_tasks", String.format("{\"workspaceId\":\"%s\"}", workspaceId)));
          } else {
            var nlp = NaturalDateTimeParser.parse(param);
            String taskTitle = nlp.cleanedTitle().isEmpty() ? param : nlp.cleanedTitle();
            String due = nlp.startTime().toInstant().toString();
            String args =
                String.format(
                    "{\"workspaceId\":\"%s\",\"userId\":\"%s\",\"tasks\":[{\"title\":\"%s\",\"dueDate\":\"%s\"}]}",
                    workspaceId, userId, taskTitle, due);
            actions.add(new AgentAction("upsert_tasks", args));
          }
          return actions;

        case "/event":
        case "/cal":
        case "/meet":
        case "/meeting":
          if (param.isEmpty()) {
            actions.add(
                new AgentAction(
                    "list_events", String.format("{\"workspaceId\":\"%s\"}", workspaceId)));
          } else {
            var nlp = NaturalDateTimeParser.parse(param);
            String eventTitle = nlp.cleanedTitle().isEmpty() ? param : nlp.cleanedTitle();
            String start = nlp.startTime().toInstant().toString();
            String end = nlp.endTime().toInstant().toString();
            String args =
                String.format(
                    "{\"workspaceId\":\"%s\",\"events\":[{\"title\":\"%s\",\"startTime\":\"%s\",\"endTime\":\"%s\"}]}",
                    workspaceId, eventTitle, start, end);
            actions.add(new AgentAction("upsert_events", args));
          }
          return actions;

        case "/note":
        case "/notes":
          if (param.isEmpty()) {
            actions.add(
                new AgentAction(
                    "list_notes", String.format("{\"workspaceId\":\"%s\"}", workspaceId)));
          } else {
            String title = "Quick Note";
            String content = param;
            if (param.contains(":")) {
              String[] noteParts = param.split(":", 2);
              title = noteParts[0].trim();
              content = noteParts[1].trim();
            } else if (param.contains("-")) {
              String[] noteParts = param.split("-", 2);
              title = noteParts[0].trim();
              content = noteParts[1].trim();
            }
            String args =
                String.format(
                    "{\"workspaceId\":\"%s\",\"userId\":\"%s\",\"title\":\"%s\",\"content\":\"%s\"}",
                    workspaceId, userId, title, content);
            actions.add(new AgentAction("upsert_notes", args));
          }
          return actions;

        case "/memory":
        case "/rule":
        case "/rules":
        case "/vault":
          if (param.isEmpty()) {
            actions.add(new AgentAction("recall_memory", "{\"query\":\"all\"}"));
          } else {
            String args = String.format("{\"content\":\"%s\"}", param);
            actions.add(new AgentAction("save_memory", args));
          }
          return actions;

        case "/recall":
        case "/find":
        case "/search":
          String query = param.isEmpty() ? "rules" : param;
          actions.add(new AgentAction("recall_memory", String.format("{\"query\":\"%s\"}", query)));
          return actions;

        case "/list":
          if (param.contains("task") || param.contains("todo")) {
            actions.add(
                new AgentAction(
                    "list_tasks", String.format("{\"workspaceId\":\"%s\"}", workspaceId)));
          } else if (param.contains("event")
              || param.contains("cal")
              || param.contains("meet")
              || param.contains("lịch")) {
            actions.add(
                new AgentAction(
                    "list_events", String.format("{\"workspaceId\":\"%s\"}", workspaceId)));
          } else if (param.contains("note") || param.contains("ghi chú")) {
            actions.add(
                new AgentAction(
                    "list_notes", String.format("{\"workspaceId\":\"%s\"}", workspaceId)));
          } else {
            actions.add(new AgentAction("recall_memory", "{\"query\":\"all\"}"));
          }
          return actions;

        default:
          break;
      }
    }

    boolean isQuery =
        lower.contains("có")
            || lower.contains("xem")
            || lower.contains("tra cứu")
            || lower.contains("lấy")
            || lower.contains("gì")
            || lower.contains("danh sách")
            || lower.contains("báo cáo")
            || lower.contains("list")
            || lower.contains("show")
            || lower.contains("get")
            || lower.contains("find");

    if (isQuery) {
      if (lower.contains("lịch")
          || lower.contains("họp")
          || lower.contains("sự kiện")
          || lower.contains("event")
          || lower.contains("calendar")) {
        actions.add(
            new AgentAction("list_events", String.format("{\"workspaceId\":\"%s\"}", workspaceId)));
      }
      if (lower.contains("task")
          || lower.contains("nhiệm vụ")
          || lower.contains("công việc")
          || lower.contains("todo")) {
        actions.add(
            new AgentAction("list_tasks", String.format("{\"workspaceId\":\"%s\"}", workspaceId)));
      }
      if (lower.contains("note") || lower.contains("ghi chú")) {
        actions.add(
            new AgentAction("list_notes", String.format("{\"workspaceId\":\"%s\"}", workspaceId)));
      }
      if (lower.contains("trí nhớ")
          || lower.contains("memory")
          || lower.contains("thói quen")
          || lower.contains("quy tắc")) {
        actions.add(new AgentAction("recall_memory", String.format("{\"query\":\"%s\"}", prompt)));
      }
      if (!actions.isEmpty()) {
        return actions;
      }
    }

    // Check for note creation
    if ((lower.contains("note") || lower.contains("ghi chú"))
        && (lower.contains("tạo")
            || lower.contains("thêm")
            || lower.contains("lưu")
            || lower.contains("create")
            || lower.contains("add")
            || lower.contains("save"))) {
      String title = msg("agent.note.default_title", "Agent Note", locale);
      String content = prompt;
      String args =
          String.format(
              "{\"workspaceId\":\"%s\",\"userId\":\"%s\",\"title\":\"%s\",\"content\":\"%s\"}",
              workspaceId, userId, title, content);
      actions.add(new AgentAction("upsert_notes", args));
      return actions;
    }

    // Check for memory saving intent
    if (lower.startsWith("hãy nhớ")
        || lower.startsWith("ghi nhớ")
        || lower.startsWith("lưu vào bộ nhớ")
        || lower.startsWith("lưu trí nhớ")
        || lower.startsWith("từ nay hãy")
        || lower.startsWith("từ nay luôn")
        || lower.startsWith("từ giờ hãy")
        || lower.startsWith("từ bây giờ")
        || lower.startsWith("hãy luôn")
        || lower.startsWith("luôn luôn")
        || lower.startsWith("quy tắc của tôi")
        || lower.startsWith("thói quen của tôi")
        || lower.startsWith("remember that")
        || lower.startsWith("keep in mind")
        || lower.startsWith("from now on")
        || lower.startsWith("always remember")) {
      String factContent =
          prompt
              .replaceFirst(
                  "(?i)^(hãy nhớ|ghi nhớ|lưu vào bộ nhớ|lưu trí nhớ|từ nay hãy|từ nay luôn|từ giờ"
                      + " hãy|từ bây giờ|hãy luôn|luôn luôn|quy tắc của tôi là|thói quen của tôi"
                      + " là|remember that|keep in mind|from now on|always remember)\\s*",
                  "")
              .trim();
      if (factContent.isEmpty()) {
        factContent = prompt;
      }
      String args = String.format("{\"content\":\"%s\"}", factContent);
      actions.add(new AgentAction("save_memory", args));
      return actions;
    }

    // Check for event / task intents (Vietnamese & English)
    boolean hasEventIntent =
        lower.contains("lịch")
            || lower.contains("họp")
            || lower.contains("hẹn")
            || lower.contains("meeting")
            || lower.contains("schedule")
            || lower.contains("calendar")
            || lower.contains("chiều nay")
            || lower.contains("sáng nay")
            || lower.contains("ngày mai")
            || lower.contains("sáng mai")
            || lower.contains("chiều mai")
            || lower.contains("tối mai")
            || lower.contains("tomorrow")
            || lower.contains("tonight")
            || lower.contains("today");

    boolean hasTaskIntent =
        lower.contains("task")
            || lower.contains("nhiệm vụ")
            || lower.contains("công việc")
            || lower.contains("chuẩn bị")
            || lower.contains("làm slide")
            || lower.contains("viết báo cáo")
            || lower.contains("todo")
            || ((lower.contains("tạo") || lower.contains("create") || lower.contains("add"))
                && !hasEventIntent);

    var parsedNlp = NaturalDateTimeParser.parse(prompt);

    if (hasEventIntent) {
      String eventTitle = parsedNlp.cleanedTitle();
      if (eventTitle.isEmpty() || eventTitle.length() < 3) {
        eventTitle = prompt;
      }
      String start = parsedNlp.startTime().toInstant().toString();
      String end = parsedNlp.endTime().toInstant().toString();

      String args =
          String.format(
              "{\"workspaceId\":\"%s\",\"events\":[{\"title\":\"%s\",\"startTime\":\"%s\",\"endTime\":\"%s\"}]}",
              workspaceId, eventTitle, start, end);
      actions.add(new AgentAction("upsert_events", args));
    }

    if (hasTaskIntent) {
      String taskTitle =
          prompt
              .replaceAll("(?i)^(thêm|tạo|cho tôi|nhiệm vụ|task|giúp tôi|hãy|add|create)\\s*", "")
              .replaceAll("(?i)(và lên lịch.*|đặt lịch.*|họp.*|and schedule.*)$", "")
              .trim();
      if (taskTitle.isEmpty()) {
        taskTitle = prompt;
      }
      String due = parsedNlp.startTime().toInstant().toString();
      String args =
          String.format(
              "{\"workspaceId\":\"%s\",\"userId\":\"%s\",\"tasks\":[{\"title\":\"%s\",\"dueDate\":\"%s\"}]}",
              workspaceId, userId, taskTitle, due);
      actions.add(new AgentAction("upsert_tasks", args));
    }

    return actions;
  }

  private String msg(String code, String defaultMessage, Locale locale) {
    if (messageSource == null) {
      return defaultMessage;
    }
    Locale effLocale = locale != null ? locale : LocaleContextHolder.getLocale();
    return messageSource.getMessage(code, null, defaultMessage, effLocale);
  }
}
