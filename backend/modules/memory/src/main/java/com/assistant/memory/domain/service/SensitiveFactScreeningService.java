package com.assistant.memory.domain.service;

import java.util.regex.Pattern;

public class SensitiveFactScreeningService {
  private static final Pattern CREDIT_CARD_PATTERN = Pattern.compile("\\b(?:\\d[ -]*?){13,16}\\b");
  private static final Pattern SSN_PATTERN = Pattern.compile("\\b\\d{3}-\\d{2}-\\d{4}\\b");
  private static final Pattern CREDENTIAL_KEYWORDS =
      Pattern.compile("(?i)(password|secret|api_key|apikey|token|private_key)\\s*[:=]");

  public SensitiveDataScreeningResult screen(String content) {
    if (content == null || content.trim().isEmpty()) {
      return SensitiveDataScreeningResult.allowed();
    }

    if (CREDIT_CARD_PATTERN.matcher(content).find()) {
      return SensitiveDataScreeningResult.rejected("Potential credit card number detected");
    }

    if (SSN_PATTERN.matcher(content).find()) {
      return SensitiveDataScreeningResult.rejected(
          "Potential Social Security Number (SSN) detected");
    }

    if (CREDENTIAL_KEYWORDS.matcher(content).find()) {
      return SensitiveDataScreeningResult.rejected(
          "Potential API key, token, or password detected");
    }

    return SensitiveDataScreeningResult.allowed();
  }
}
