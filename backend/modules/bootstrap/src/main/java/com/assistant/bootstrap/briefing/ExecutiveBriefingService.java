package com.assistant.bootstrap.briefing;

import com.assistant.agent.domain.nlp.VietnameseDateTimeParser;
import com.assistant.calendar.application.port.in.CalendarPort;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.notification.application.dto.DispatchNotificationCommand;
import com.assistant.notification.application.ports.in.NotificationDispatchPort;
import com.assistant.notification.domain.model.UrgencyLevel;
import com.assistant.todo.application.port.in.TodoPort;
import com.assistant.todo.domain.model.Priority;
import com.assistant.todo.domain.model.Task;
import com.assistant.workspace.domain.Workspace;
import com.assistant.workspace.domain.WorkspaceRepository;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

@Service
public class ExecutiveBriefingService {

  public enum BriefingType {
    MORNING,
    EVENING
  }

  public record ExecutiveBriefingDto(
      BriefingType type,
      String title,
      String markdownContent,
      int totalEvents,
      int totalTasksPending,
      int totalTasksCompleted,
      Instant generatedAt) {}

  private final CalendarPort calendarPort;
  private final TodoPort todoPort;
  private final NotificationDispatchPort notificationDispatchPort;
  private final WorkspaceRepository workspaceRepository;

  public ExecutiveBriefingService(
      CalendarPort calendarPort,
      TodoPort todoPort,
      NotificationDispatchPort notificationDispatchPort,
      WorkspaceRepository workspaceRepository) {
    this.calendarPort = calendarPort;
    this.todoPort = todoPort;
    this.notificationDispatchPort = notificationDispatchPort;
    this.workspaceRepository = workspaceRepository;
  }

  public ExecutiveBriefingDto generateMorningBriefing(
      WorkspaceId workspaceId, UserId userId, boolean sendNotification) {
    ZoneId vnZone = VietnameseDateTimeParser.VIETNAM_ZONE;
    ZonedDateTime now = ZonedDateTime.now(vnZone);
    ZonedDateTime startOfDay = now.with(LocalTime.MIN);
    ZonedDateTime endOfDay = now.with(LocalTime.MAX);

    // 1. Fetch today's events
    var events =
        calendarPort.listEvents(workspaceId, startOfDay.toInstant(), endOfDay.toInstant());

    // 2. Fetch pending tasks
    var tasksPage =
        todoPort.listTasks(
            workspaceId,
            null,
            null,
            null,
            false,
            null,
            null,
            PageRequest.of(0, 20));
    List<Task> pendingTasks = tasksPage.getContent();

    // 3. Format Morning Markdown Briefing
    String dateStr =
        now.format(
            DateTimeFormatter.ofPattern("EEEE, 'ngày' dd/MM/yyyy", java.util.Locale.forLanguageTag("vi")));
    if (!dateStr.isEmpty()) {
      dateStr = Character.toUpperCase(dateStr.charAt(0)) + dateStr.substring(1);
    }

    StringBuilder md = new StringBuilder();
    md.append("## 🌅 Bản Tin Điều Hành Buổi Sáng\n\n");
    md.append("**Thời gian:** ").append(dateStr).append("\n\n");

    md.append("### 📅 Lịch trình & Cuộc họp hôm nay (").append(events.size()).append(")\n");
    if (events.isEmpty()) {
      md.append("*(Hôm nay bạn không có cuộc họp cố định nào. Đây là cơ hội tuyệt vời để tập trung Deep Work!)*\n\n");
    } else {
      DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm").withZone(vnZone);
      for (var ev : events) {
        String startStr = timeFmt.format(ev.startTime());
        String endStr = timeFmt.format(ev.endTime());
        md.append("- **")
            .append(startStr)
            .append(" - ")
            .append(endStr)
            .append("**: ")
            .append(ev.title());
        if (ev.description() != null && !ev.description().isBlank()) {
          md.append(" *(").append(ev.description()).append(")*");
        }
        md.append("\n");
      }
      md.append("\n");
    }

    md.append("### 🎯 Công việc trọng tâm cần xử lý (").append(pendingTasks.size()).append(")\n");
    if (pendingTasks.isEmpty()) {
      md.append("*(Tất cả công việc đã hoàn thành!)*\n\n");
    } else {
      for (Task t : pendingTasks) {
        String priorityIcon =
            t.getPriority() == Priority.High ? "🔴" : t.getPriority() == Priority.Medium ? "🟠" : "🟡";
        md.append("- ")
            .append(priorityIcon)
            .append(" **")
            .append(t.getTitle())
            .append("**");
        if (t.getDueDate() != null) {
          String dueStr =
              DateTimeFormatter.ofPattern("HH:mm dd/MM").withZone(vnZone).format(t.getDueDate());
          md.append(" *(Hạn chót: ").append(dueStr).append(")*");
        }
        md.append("\n");
      }
      md.append("\n");
    }

    md.append("💡 **Gợi ý của Trợ lý Kyros:** Ưu tiên xử lý các đầu việc quan trọng trước 11:30 sáng và dành 60-90 phút cho các dự án cốt lõi.");

    String briefingTitle = "Bản tin điều hành: " + dateStr;
    String finalContent = md.toString();

    if (sendNotification) {
      notificationDispatchPort.dispatch(
          new DispatchNotificationCommand(
              workspaceId,
              userId,
              briefingTitle,
              finalContent,
              UrgencyLevel.Normal,
              Map.of("type", "MORNING_BRIEFING", "date", dateStr)));
    }

    return new ExecutiveBriefingDto(
        BriefingType.MORNING,
        briefingTitle,
        finalContent,
        events.size(),
        pendingTasks.size(),
        0,
        Instant.now());
  }

  public ExecutiveBriefingDto generateEveningWrapup(
      WorkspaceId workspaceId, UserId userId, boolean sendNotification) {
    ZoneId vnZone = VietnameseDateTimeParser.VIETNAM_ZONE;
    ZonedDateTime now = ZonedDateTime.now(vnZone);

    // 1. Fetch completed tasks
    var completedTasks =
        todoPort.listTasks(
            workspaceId,
            null,
            null,
            null,
            true,
            null,
            null,
            PageRequest.of(0, 20)).getContent();

    // 2. Fetch pending tasks
    var pendingTasks =
        todoPort.listTasks(
            workspaceId,
            null,
            null,
            null,
            false,
            null,
            null,
            PageRequest.of(0, 20)).getContent();

    // 3. Fetch tomorrow's preview
    ZonedDateTime tomorrowStart = now.plusDays(1).with(LocalTime.MIN);
    ZonedDateTime tomorrowEnd = now.plusDays(1).with(LocalTime.MAX);
    var tomorrowEvents =
        calendarPort.listEvents(workspaceId, tomorrowStart.toInstant(), tomorrowEnd.toInstant());

    String dateStr =
        now.format(
            DateTimeFormatter.ofPattern("EEEE, 'ngày' dd/MM/yyyy", java.util.Locale.forLanguageTag("vi")));
    if (!dateStr.isEmpty()) {
      dateStr = Character.toUpperCase(dateStr.charAt(0)) + dateStr.substring(1);
    }

    StringBuilder md = new StringBuilder();
    md.append("## 🌆 Tổng Kết Cuối Ngày & Kế Hoạch Ngày Mai\n\n");
    md.append("**Thời gian:** ").append(dateStr).append("\n\n");

    md.append("### ✅ Công việc đã hoàn thành hôm nay (").append(completedTasks.size()).append(")\n");
    if (completedTasks.isEmpty()) {
      md.append("*(Hôm nay chưa có task nào được đánh dấu hoàn thành)*\n\n");
    } else {
      for (Task t : completedTasks) {
        md.append("- [x] ").append(t.getTitle()).append("\n");
      }
      md.append("\n");
    }

    md.append("### ⏳ Công việc tồn đọng chuyển tiếp (").append(pendingTasks.size()).append(")\n");
    if (pendingTasks.isEmpty()) {
      md.append("*(Xuất sắc! Không còn công việc tồn đọng)*\n\n");
    } else {
      for (Task t : pendingTasks) {
        md.append("- [ ] **").append(t.getTitle()).append("**\n");
      }
      md.append("\n");
    }

    md.append("### 🔮 Lịch trình ngày mai (").append(tomorrowEvents.size()).append(" sự kiện)\n");
    if (tomorrowEvents.isEmpty()) {
      md.append("*(Ngày mai hiện chưa có lịch họp cố định)*\n\n");
    } else {
      DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm").withZone(vnZone);
      for (var ev : tomorrowEvents) {
        md.append("- **")
            .append(timeFmt.format(ev.startTime()))
            .append(" - ")
            .append(timeFmt.format(ev.endTime()))
            .append("**: ")
            .append(ev.title())
            .append("\n");
      }
      md.append("\n");
    }

    md.append("🎉 **Kyros:** Chúc bạn có một buổi tối thư giãn và nạp lại năng lượng!");

    String wrapupTitle = "Tổng kết ngày: " + dateStr;
    String finalContent = md.toString();

    if (sendNotification) {
      notificationDispatchPort.dispatch(
          new DispatchNotificationCommand(
              workspaceId,
              userId,
              wrapupTitle,
              finalContent,
              UrgencyLevel.Normal,
              Map.of("type", "EVENING_WRAPUP", "date", dateStr)));
    }

    return new ExecutiveBriefingDto(
        BriefingType.EVENING,
        wrapupTitle,
        finalContent,
        tomorrowEvents.size(),
        pendingTasks.size(),
        completedTasks.size(),
        Instant.now());
  }

  public void runDailyMorningBriefingForAllWorkspaces() {
    var workspaces = workspaceRepository.findAll();
    for (Workspace ws : workspaces) {
      try {
        generateMorningBriefing(ws.getId(), ws.getOwnerId(), true);
      } catch (Exception e) {
        System.err.println(
            "Failed to send morning briefing for workspace " + ws.getId().value() + ": " + e.getMessage());
      }
    }
  }

  public void runDailyEveningWrapupForAllWorkspaces() {
    var workspaces = workspaceRepository.findAll();
    for (Workspace ws : workspaces) {
      try {
        generateEveningWrapup(ws.getId(), ws.getOwnerId(), true);
      } catch (Exception e) {
        System.err.println(
            "Failed to send evening wrapup for workspace " + ws.getId().value() + ": " + e.getMessage());
      }
    }
  }
}
