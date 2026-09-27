package com.assistant.memory.application.service;

import com.assistant.memory.domain.model.ExtractedFact;
import com.assistant.memory.domain.model.FactCategory;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.stereotype.Service;

/**
 * Service responsible for analyzing conversation turns and extracting structured, long-term facts,
 * habits, work rules, project contexts, and user constraints (Multilingual: VI/EN).
 */
@Service
public class FactExtractionService {

  private static final record PatternRule(
      Pattern pattern, FactCategory category, float baseScore, String topicHint) {}

  private static final List<PatternRule> PATTERN_RULES =
      List.of(
          // 1. WORK RULES & PERSONA (Quy tắc làm việc & Phong cách giao tiếp)
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:từ\\s+nay|từ\\s+giờ|từ\\s+bây\\s+giờ|from\\s+now\\s+on)\\s+(?:hãy|luôn|phải|xin|please|always)?\\s*([^.,;\\n"
                      + "!]+)"),
              FactCategory.WORK_RULE,
              0.95f,
              "Operational Instruction"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:hãy\\s+luôn|luôn\\s+luôn|always)\\s+(?:xưng\\s+hô|gọi|trả\\s+lời|tóm\\s+tắt|định\\s+dạng|format|summarize)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.WORK_RULE,
              0.95f,
              "Communication Rule"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:xưng\\s+hô\\s+(?:là|như)|gọi\\s+(?:tôi|mình|bạn)\\s+là|tên\\s+(?:của\\s+tôi|của\\s+bạn)\\s+là|call\\s+me|your\\s+name\\s+is)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.USER_PREFERENCE,
              0.95f,
              "Persona & Naming"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:tóm\\s+tắt\\s+(?:dưới\\s+dạng|theo|bằng|dạng)|định\\s+dạng\\s+(?:là|theo|bảng)|format\\s+(?:as|in\\s+table|table)|summarize\\s+(?:as|in\\s+table))\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.USER_PREFERENCE,
              0.92f,
              "Output Format Preference"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:tôi\\s+(?:không\\s+bao\\s+giờ|không\\s+được|tránh|từ\\s+chối|không\\s+muốn)\\s+(?:họp|nhận\\s+lịch|xếp\\s+lịch)|không\\s+họp\\s+vào)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.WORK_RULE,
              0.90f,
              "Meeting Schedule Rule"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:never\\s+schedule|do\\s+not\\s+schedule|no\\s+meetings?\\s+on|avoid\\s+meetings?\\s+on)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.WORK_RULE,
              0.90f,
              "Meeting Schedule Rule"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:quy\\s+tắc\\s+làm\\s+việc\\s+của\\s+tôi\\s+là|nguyên\\s+tắc\\s+của\\s+tôi\\s+là)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.WORK_RULE,
              0.95f,
              "Work Rule"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:my\\s+work\\s+rule\\s+is|my\\s+working\\s+rule\\s+is)\\s+([^.,;\\n!]+)"),
              FactCategory.WORK_RULE,
              0.95f,
              "Work Rule"),

          // 2. USER PREFERENCES (Thói quen & Sở thích)
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:tôi\\s+thường|thói\\s+quen\\s+của\\s+tôi\\s+là|tôi\\s+hay)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.USER_PREFERENCE,
              0.85f,
              "Habit"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:tôi\\s+thích|tôi\\s+chuộng|tôi\\s+ưu\\s+tiên|ưu\\s+tiên\\s+của\\s+tôi\\s+là)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.USER_PREFERENCE,
              0.88f,
              "Preference"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:i\\s+prefer|i\\s+usually|i\\s+always|my\\s+habit\\s+is|i\\s+like\\s+to)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.USER_PREFERENCE,
              0.85f,
              "Preference"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:tôi\\s+không\\s+thích|tôi\\s+ghét|i\\s+dislike|i\\s+don't\\s+like)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.USER_PREFERENCE,
              0.85f,
              "Dislike"),

          // 3. PROJECT CONTEXT (Bối cảnh dự án & Cộng sự)
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:tôi\\s+đang\\s+làm\\s+(?:dự\\s+án|project)|dự\\s+án\\s+của\\s+tôi\\s+là)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.PROJECT_CONTEXT,
              0.90f,
              "Project Name"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:i\\s+am\\s+working\\s+on|my\\s+current\\s+project\\s+is)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.PROJECT_CONTEXT,
              0.90f,
              "Project Name"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:công\\s+nghệ\\s+(?:chính|đang\\s+dùng|sử\\s+dụng)\\s+là|tech\\s+stack\\s+is|stack\\s+của\\s+tôi\\s+là)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.PROJECT_CONTEXT,
              0.90f,
              "Tech Stack"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:cộng\\s+sự|đồng\\s+nghiệp|team\\s+lead|quản\\s+lý\\s+của\\s+tôi\\s+là|my\\s+colleague\\s+is|my\\s+manager\\s+is)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.PROJECT_CONTEXT,
              0.88f,
              "Team Member"),

          // 4. CONSTRAINTS (Hạn chế & Ràng buộc)
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:múi\\s+giờ\\s+của\\s+tôi\\s+là|my\\s+time\\s*zone\\s+is)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.CONSTRAINT,
              0.95f,
              "Timezone"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:tôi\\s+chỉ\\s+(?:rảnh|có\\s+thể\\s+họp|làm\\s+việc)\\s+(?:sau|từ|vào)|i\\s+am\\s+only\\s+available\\s+(?:after|at|from))\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.CONSTRAINT,
              0.90f,
              "Availability Constraint"),
          new PatternRule(
              Pattern.compile(
                  "(?i)(?:tôi\\s+bị|tình\\s+trạng\\s+sức\\s+khoẻ|hạn\\s+chế\\s+của\\s+tôi\\s+là|i\\s+have\\s+a\\s+condition)\\s+([^.,;\\n"
                      + "!]+)"),
              FactCategory.CONSTRAINT,
              0.85f,
              "Health / Physical Constraint"));

  /** Extracts facts from a user conversation turn. */
  public List<ExtractedFact> extractFacts(String text) {
    if (text == null || text.isBlank() || isEphemeralChitChat(text)) {
      return List.of();
    }

    List<ExtractedFact> results = new ArrayList<>();
    for (PatternRule rule : PATTERN_RULES) {
      Matcher matcher = rule.pattern().matcher(text);
      while (matcher.find()) {
        String fullMatched = matcher.group(0).trim();
        String detail = matcher.group(1) != null ? matcher.group(1).trim() : fullMatched;

        if (detail.length() >= 4) {
          String normalizedContent = normalizeFactContent(rule.category(), fullMatched);
          ExtractedFact fact =
              ExtractedFact.of(
                  normalizedContent, rule.category(), rule.baseScore(), rule.topicHint());

          // Avoid duplicate extractions within the same turn
          boolean alreadyExtracted =
              results.stream().anyMatch(f -> f.content().equalsIgnoreCase(fact.content()));
          if (!alreadyExtracted) {
            results.add(fact);
          }
        }
      }
    }

    return results;
  }

  private String normalizeFactContent(FactCategory category, String rawText) {
    String clean =
        rawText
            .replaceAll("(?i)\\s+(?:nhé|nha|ạ|nhá|nhe|đi|please)[.!]?$", "")
            .replaceAll("\\s+", " ")
            .trim();
    if (!clean.isEmpty()) {
      clean = Character.toUpperCase(clean.charAt(0)) + clean.substring(1);
    }
    return "[" + category.name() + "] " + clean;
  }

  private boolean isEphemeralChitChat(String text) {
    String lower = text.trim().toLowerCase(java.util.Locale.ROOT);
    return lower.equals("hi")
        || lower.equals("hello")
        || lower.equals("chào")
        || lower.equals("xin chào")
        || lower.equals("cảm ơn")
        || lower.equals("thanks")
        || lower.equals("ok")
        || lower.equals("oke")
        || lower.equals("bye");
  }
}
