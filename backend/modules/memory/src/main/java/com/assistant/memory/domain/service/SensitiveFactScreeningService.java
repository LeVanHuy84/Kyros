package com.assistant.memory.domain.service;

import java.util.regex.Pattern;

/**
 * Pure domain service for screening facts against sensitive data leaks (passwords, tokens, API
 * keys, cards, SSN, national IDs). Adheres strictly to Hexagonal Architecture (zero framework
 * dependencies).
 */
public class SensitiveFactScreeningService {

  private static final Pattern CREDIT_CARD_PATTERN =
      Pattern.compile(
          "\\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\\d{3})\\d{11}|\\d{4}["
              + " -]?\\d{4}[ -]?\\d{4}[ -]?\\d{4})\\b");

  private static final Pattern SSN_PATTERN = Pattern.compile("\\b\\d{3}-\\d{2}-\\d{4}\\b");

  private static final Pattern VIETNAMESE_ID_PATTERN =
      Pattern.compile(
          "(?i)(?:cccd|cmnd|căn\\s+cước|chứng\\s+minh|citizen\\s*id)\\s*[:#-]?\\s*(\\d{9}|\\d{12})\\b");

  private static final Pattern CREDENTIAL_KEYWORDS =
      Pattern.compile(
          "(?i)(?:password|secret|api_key|apikey|token|private_key|auth_token|access_token|mật\\s*khẩu|khoá\\s*bí\\s*mật)\\s*[:=]\\s*\\S+");

  private static final Pattern JWT_TOKEN_PATTERN =
      Pattern.compile("\\beyJ[a-zA-Z0-9_-]{10,}\\.[a-zA-Z0-9_-]{10,}\\.[a-zA-Z0-9_-]{10,}\\b");

  private static final Pattern OPENAI_KEY_PATTERN = Pattern.compile("\\bsk-[a-zA-Z0-9]{20,}\\b");

  private static final Pattern PRIVATE_KEY_BLOCK =
      Pattern.compile("-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----");

  public SensitiveDataScreeningResult screen(String content) {
    if (content == null || content.trim().isEmpty()) {
      return SensitiveDataScreeningResult.allowed();
    }

    if (PRIVATE_KEY_BLOCK.matcher(content).find()) {
      return SensitiveDataScreeningResult.rejected("Private key block detected");
    }

    if (JWT_TOKEN_PATTERN.matcher(content).find()) {
      return SensitiveDataScreeningResult.rejected("JWT token detected");
    }

    if (OPENAI_KEY_PATTERN.matcher(content).find()) {
      return SensitiveDataScreeningResult.rejected("API key token detected");
    }

    if (CREDENTIAL_KEYWORDS.matcher(content).find()) {
      return SensitiveDataScreeningResult.rejected(
          "Password, API key, or authentication credential detected");
    }

    if (CREDIT_CARD_PATTERN.matcher(content).find()) {
      return SensitiveDataScreeningResult.rejected("Potential credit card number detected");
    }

    if (SSN_PATTERN.matcher(content).find()) {
      return SensitiveDataScreeningResult.rejected(
          "Potential Social Security Number (SSN) detected");
    }

    if (VIETNAMESE_ID_PATTERN.matcher(content).find()) {
      return SensitiveDataScreeningResult.rejected(
          "Potential Vietnamese Citizen ID (CCCD/CMND) detected");
    }

    return SensitiveDataScreeningResult.allowed();
  }
}
