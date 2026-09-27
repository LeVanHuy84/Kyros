package com.assistant.bootstrap.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.assistant.kernel.exception.DomainException;
import com.assistant.kernel.exception.EntityNotFoundException;
import com.assistant.kernel.exception.ServiceUnavailableException;
import java.util.Locale;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.ServletWebRequest;

class I18nErrorResponseTest {

  private GlobalExceptionHandler handler;
  private ResourceBundleMessageSource messageSource;

  @BeforeEach
  void setUp() {
    messageSource = new ResourceBundleMessageSource();
    messageSource.setBasename("i18n/messages");
    messageSource.setDefaultEncoding("UTF-8");
    messageSource.setUseCodeAsDefaultMessage(true);

    handler = new GlobalExceptionHandler(messageSource);
  }

  @Test
  void testEntityNotFoundExceptionInEnglish() {
    LocaleContextHolder.setLocale(Locale.ENGLISH);
    ServletWebRequest request = new ServletWebRequest(new MockHttpServletRequest());

    EntityNotFoundException ex =
        new EntityNotFoundException("error.entity_not_found", "Task not found");
    ResponseEntity<ProblemDetail> response = handler.handleEntityNotFound(ex, request);

    assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    ProblemDetail body = response.getBody();
    assertNotNull(body);
    assertEquals("Entity Not Found", body.getTitle());
    assertEquals("Resource not found", body.getDetail());
    assertEquals("error.entity_not_found", body.getProperties().get("errorCode"));
    assertNotNull(body.getProperties().get("timestamp"));
  }

  @Test
  void testEntityNotFoundExceptionInVietnamese() {
    LocaleContextHolder.setLocale(Locale.forLanguageTag("vi"));
    ServletWebRequest request = new ServletWebRequest(new MockHttpServletRequest());

    EntityNotFoundException ex =
        new EntityNotFoundException("error.entity_not_found", "Task not found");
    ResponseEntity<ProblemDetail> response = handler.handleEntityNotFound(ex, request);

    assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
    ProblemDetail body = response.getBody();
    assertNotNull(body);
    assertEquals("Không tìm thấy tài nguyên", body.getTitle());
    assertEquals("Không tìm thấy tài nguyên yêu cầu", body.getDetail());
    assertEquals("error.entity_not_found", body.getProperties().get("errorCode"));
    assertNotNull(body.getProperties().get("timestamp"));
  }

  @Test
  void testDomainExceptionWithAuthErrorCodeInVietnamese() {
    LocaleContextHolder.setLocale(Locale.forLanguageTag("vi"));
    ServletWebRequest request = new ServletWebRequest(new MockHttpServletRequest());

    DomainException ex =
        new DomainException("auth.email.already_registered", "Email is already registered");
    ResponseEntity<ProblemDetail> response = handler.handleDomainException(ex, request);

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    ProblemDetail body = response.getBody();
    assertNotNull(body);
    assertEquals("Yêu cầu không hợp lệ", body.getTitle());
    assertEquals("Email này đã được đăng ký trong hệ thống", body.getDetail());
    assertEquals("auth.email.already_registered", body.getProperties().get("errorCode"));
  }

  @Test
  void testDomainExceptionWithAuthErrorCodeInEnglish() {
    LocaleContextHolder.setLocale(Locale.ENGLISH);
    ServletWebRequest request = new ServletWebRequest(new MockHttpServletRequest());

    DomainException ex =
        new DomainException("auth.email.already_registered", "Email is already registered");
    ResponseEntity<ProblemDetail> response = handler.handleDomainException(ex, request);

    assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
    ProblemDetail body = response.getBody();
    assertNotNull(body);
    assertEquals("Bad Request", body.getTitle());
    assertEquals("Email is already registered", body.getDetail());
  }

  @Test
  void testServiceUnavailableExceptionInVietnamese() {
    LocaleContextHolder.setLocale(Locale.forLanguageTag("vi"));
    ServletWebRequest request = new ServletWebRequest(new MockHttpServletRequest());

    ServiceUnavailableException ex = new ServiceUnavailableException("Downstream is down");
    ResponseEntity<ProblemDetail> response = handler.handleServiceUnavailable(ex, request);

    assertEquals(HttpStatus.SERVICE_UNAVAILABLE, response.getStatusCode());
    ProblemDetail body = response.getBody();
    assertNotNull(body);
    assertEquals("Dịch vụ không khả dụng", body.getTitle());
    assertEquals("Hệ thống đang bận hoặc dịch vụ tạm thời không khả dụng", body.getDetail());
  }
}
