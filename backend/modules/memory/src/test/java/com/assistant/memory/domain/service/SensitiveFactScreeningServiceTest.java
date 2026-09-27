package com.assistant.memory.domain.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class SensitiveFactScreeningServiceTest {

  private SensitiveFactScreeningService screeningService;

  @BeforeEach
  void setUp() {
    screeningService = new SensitiveFactScreeningService();
  }

  @Test
  void shouldAllowNormalPreferences() {
    SensitiveDataScreeningResult result =
        screeningService.screen("Thích họp qua Zoom và làm việc vào buổi sáng.");
    assertTrue(result.isAllowed());
  }

  @Test
  void shouldRejectPasswordAndSecrets() {
    SensitiveDataScreeningResult res1 =
        screeningService.screen("Mật khẩu của tôi là password: mySuperSecret123!");
    assertFalse(res1.isAllowed());

    SensitiveDataScreeningResult res2 =
        screeningService.screen("api_key: sk-proj123456789012345678901234");
    assertFalse(res2.isAllowed());
  }

  @Test
  void shouldRejectOpenAiApiKey() {
    SensitiveDataScreeningResult result =
        screeningService.screen("API token is sk-123456789012345678901234567890");
    assertFalse(result.isAllowed());
  }

  @Test
  void shouldRejectJwtToken() {
    SensitiveDataScreeningResult result =
        screeningService.screen(
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN_pGMstwtS_sample");
    assertFalse(result.isAllowed());
  }

  @Test
  void shouldRejectCreditCardNumber() {
    SensitiveDataScreeningResult result =
        screeningService.screen("Số thẻ visa là 4532 1234 5678 9012");
    assertFalse(result.isAllowed());
  }

  @Test
  void shouldRejectSSN() {
    SensitiveDataScreeningResult result = screeningService.screen("My SSN is 123-45-6789");
    assertFalse(result.isAllowed());
  }

  @Test
  void shouldRejectVietnameseCitizenId() {
    SensitiveDataScreeningResult result = screeningService.screen("Số CCCD: 012345678901");
    assertFalse(result.isAllowed());
  }
}
