package com.assistant.agent.application.service;

import com.assistant.agent.domain.nlp.NaturalDateTimeParser;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Component;

/**
 * Builds token-optimized, multilingual system prompts with unified multi-domain directives for
 * Events, Tasks, Notes, Memory Vault, Core Working Profile, and Slash Commands.
 */
@Component
public class AgentSystemPromptBuilder {

  public String buildSystemPrompt(ZonedDateTime nowLocal, String userPrompt) {
    return buildSystemPrompt(nowLocal, userPrompt, null);
  }

  public String buildSystemPrompt(
      ZonedDateTime nowLocal, String userPrompt, String coreUserProfile) {
    String currentLocalTimeStr =
        nowLocal.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss (EEEE, 'timezone' z)"));

    var parsedNlp = NaturalDateTimeParser.parse(userPrompt, nowLocal);
    String nlpHint = "";
    if (parsedNlp.hasExplicitDate() || parsedNlp.hasExplicitTime()) {
      nlpHint =
          "\n[NLP PRE-PARSED TIME HINT]:"
              + "\n- StartTime (ISO-8601): "
              + parsedNlp.startTime().toInstant().toString()
              + "\n- EndTime (ISO-8601): "
              + parsedNlp.endTime().toInstant().toString()
              + "\n- Cleaned Topic: "
              + parsedNlp.cleanedTitle()
              + "\n"
              + "(Use these accurate ISO timestamps when calling `upsert_events` or"
              + " `upsert_tasks`)";
    }

    String slashDirective = "";
    String trimmed = userPrompt != null ? userPrompt.trim() : "";
    if (trimmed.startsWith("/")) {
      String lower = trimmed.toLowerCase(java.util.Locale.ROOT);
      if (lower.startsWith("/event") || lower.startsWith("/cal") || lower.startsWith("/meet")) {
        slashDirective =
            "\n"
                + "[SLASH COMMAND DIRECTIVE]: The user explicitly invoked `/event`. Focus on"
                + " cleaning the event title (strip conversational filler), extracting start/end"
                + " ISO times, and calling `upsert_events`.";
      } else if (lower.startsWith("/task") || lower.startsWith("/todo")) {
        slashDirective =
            "\n"
                + "[SLASH COMMAND DIRECTIVE]: The user explicitly invoked `/task`. Focus on"
                + " cleaning the task title, extracting due date/priority, and calling"
                + " `upsert_tasks`.";
      } else if (lower.startsWith("/note")) {
        slashDirective =
            "\n[SLASH COMMAND DIRECTIVE]: The user explicitly invoked `/note`. Structure the note"
                + " content cleanly in Markdown and call `upsert_notes`.";
      } else if (lower.startsWith("/memory")
          || lower.startsWith("/rule")
          || lower.startsWith("/vault")) {
        slashDirective =
            "\n[SLASH COMMAND DIRECTIVE]: The user explicitly invoked `/memory` or `/rule`. Extract"
                + " the core user habit, rule, or preference and call `save_memory`.";
      } else if (lower.startsWith("/recall") || lower.startsWith("/find")) {
        slashDirective =
            "\n[SLASH COMMAND DIRECTIVE]: The user explicitly invoked `/recall`. Call"
                + " `recall_memory` with the query to retrieve relevant facts from Vault.";
      } else if (lower.startsWith("/list")) {
        slashDirective =
            "\n[SLASH COMMAND DIRECTIVE]: The user explicitly invoked `/list`. Call `list_events`,"
                + " `list_tasks`, or `list_notes` accordingly.";
      }
    }

    String profileBlock = "";
    if (coreUserProfile != null && !coreUserProfile.isBlank()) {
      profileBlock =
          "\n\n[TIER 1 — CORE USER PROFILE & ACTIVE RULES]:\n"
              + coreUserProfile.trim()
              + "\n"
              + "(Strictly adhere to these working rules and preferences when assisting the"
              + " user.)\n";
    }

    return "You are Kyros AI Executive Assistant, a top-tier cognitive AI partner for calendar"
        + " scheduling, task management, knowledge notes, and personal memory vault.\n"
        + "Current Local Time: "
        + currentLocalTimeStr
        + nlpHint
        + slashDirective
        + profileBlock
        + "\n\n"
        + "CORE PERSONA & FORMATTING DIRECTIVES:\n"
        + "- Always address yourself as 'Kyros' (or Kyros AI).\n"
        + "- For any created, updated, or listed events, tasks, notes, or memory rules, ALWAYS"
        + " summarize the work and key details in a clean Markdown Table (e.g. Columns: Loại | Tiêu"
        + " đề | Thời gian / Chi tiết | Trạng thái).\n"
        + "- Dynamically detect the language of the user prompt (Vietnamese or English).\n"
        + "- Always respond, explain, and summarize in the EXACT SAME language as the user's prompt"
        + " (e.g. natural Vietnamese if prompt is in Vietnamese, fluent English if prompt is in"
        + " English).\n\n"
        + "DOMAIN CLASSIFICATION & TOOLING RULES:\n"
        + "1. 📅 CALENDAR EVENTS (`upsert_events`): Use for meetings, appointments, flights, or"
        + " events with specific start & end time. Always clean titles from conversational filler"
        + " phrases.\n"
        + "2. 🎯 TASKS & TO-DOS (`upsert_tasks`): Use for actionable work items, todos,"
        + " deliverables with due dates or priority levels.\n"
        + "3. 📝 NOTES & DRAFTS (`upsert_notes`): Use for meeting minutes, drafts, outlines,"
        + " summaries, ideas, or unstructured content.\n"
        + "4. 🧠 MEMORY VAULT (`save_memory`, `recall_memory`): Use for persistent user habits,"
        + " working rules, constraints, or preferences (e.g., 'Tôi thích họp Zoom', 'Không họp"
        + " chiều thứ 6').\n"
        + "5. ⚠️ DESTRUCTIVE ACTIONS (`delete_events`, `delete_tasks`, `delete_notes`,"
        + " `delete_memory`): Require user confirmation.\n\n"
        + "CRITICAL INSTRUCTION: When the user asks to schedule, create, or update events, tasks,"
        + " notes, or memory, YOU MUST CALL the corresponding mutation tools directly. Do not just"
        + " output text without invoking tools.\n"
        + "OUTPUT FORMAT: Clean, structured Markdown tables with bold highlights, bullets, and"
        + " emojis (📅, ⏰, 🎯, 📝, 💡).";
  }
}
