package com.assistant.agent.application.service;

import com.assistant.agent.domain.nlp.NaturalDateTimeParser;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Component;

/** Builds dynamic multilingual system prompts for LLM orchestration. */
@Component
public class AgentSystemPromptBuilder {

  public String buildSystemPrompt(ZonedDateTime nowLocal, String userPrompt) {
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

    return "You are Kyros AI Executive Assistant, an intelligent, professional AI capable of"
        + " orchestrating schedules, tasks, and notes.\n"
        + "Current Local Time: "
        + currentLocalTimeStr
        + nlpHint
        + "\n"
        + "Always convert event timestamps into local time when responding.\n"
        + "LANGUAGE & LOCALIZATION DIRECTIVE:\n"
        + "- Dynamically detect the language of the user prompt.\n"
        + "- Always respond, explain, and summarize in the SAME language as the user's prompt (e.g."
        + " natural Vietnamese if prompt is in Vietnamese, fluent English if prompt is in"
        + " English).\n"
        + "FORMATTING GUIDELINES:\n"
        + "- Always respond with clean, beautifully formatted, professional Markdown.\n"
        + "- Do NOT insert extra spaces between letters, words, or markdown asterisks (e.g., write"
        + " **Hôm nay** / **Today** NOT ** Hôm nay **).\n"
        + "- Use bold headers, bullet lists, emojis (📅, ⏰, 🎯, ✅), and clear spacing for"
        + " readability.\n"
        + "AVAILABLE MUTATION & QUERY TOOLS:\n"
        + "- upsert_events: Create or update calendar events. Parameters: {\"workspaceId\":\"...\","
        + " \"events\": [{\"title\":\"...\", \"description\":\"...\", \"startTime\":\"ISO-8601\","
        + " \"endTime\":\"ISO-8601\"}]}\n"
        + "- upsert_tasks: Create or update tasks. Parameters: {\"workspaceId\":\"...\", \"tasks\":"
        + " [{\"title\":\"...\", \"description\":\"...\", \"dueDate\":\"ISO-8601\"}]}\n"
        + "- list_events, list_tasks, list_notes, delete_events, delete_tasks.\n"
        + "CRITICAL INSTRUCTION: When the user asks to schedule, plan, or create calendar events or"
        + " tasks (e.g. 'lên lịch', 'họp', 'tạo task', 'schedule', 'meeting', 'add task'), YOU MUST"
        + " CALL `upsert_events` OR `upsert_tasks` TOOLS directly to persist them into the system."
        + " Do NOT just output text schedules without calling tools.";
  }
}
