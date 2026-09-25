package com.assistant.bootstrap.config;

import com.assistant.kernel.exception.DomainException;
import com.assistant.kernel.exception.EntityNotFoundException;
import com.assistant.kernel.exception.ServiceUnavailableException;
import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  private final MessageSource messageSource;

  public GlobalExceptionHandler(MessageSource messageSource) {
    this.messageSource = messageSource;
  }

  @ExceptionHandler(EntityNotFoundException.class)
  public ResponseEntity<ProblemDetail> handleEntityNotFound(
      EntityNotFoundException ex, WebRequest request) {
    Locale locale = LocaleContextHolder.getLocale();
    String messageKey = ex.getErrorCode() != null ? ex.getErrorCode() : "error.entity_not_found";
    String detail = messageSource.getMessage(messageKey, ex.getArgs(), ex.getMessage(), locale);
    String title =
        messageSource.getMessage("error.title.not_found", null, "Entity Not Found", locale);

    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, detail);
    problem.setTitle(title);
    problem.setType(URI.create("about:blank"));
    problem.setProperty("timestamp", Instant.now());
    problem.setProperty(
        "errorCode", ex.getErrorCode() != null ? ex.getErrorCode() : "ENTITY_NOT_FOUND");
    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
  }

  @ExceptionHandler(ServiceUnavailableException.class)
  public ResponseEntity<ProblemDetail> handleServiceUnavailable(
      ServiceUnavailableException ex, WebRequest request) {
    Locale locale = LocaleContextHolder.getLocale();
    String messageKey = ex.getErrorCode() != null ? ex.getErrorCode() : "error.service_unavailable";
    String detail = messageSource.getMessage(messageKey, ex.getArgs(), ex.getMessage(), locale);
    String title =
        messageSource.getMessage(
            "error.title.service_unavailable", null, "Service Unavailable", locale);

    ProblemDetail problem =
        ProblemDetail.forStatusAndDetail(HttpStatus.SERVICE_UNAVAILABLE, detail);
    problem.setTitle(title);
    problem.setType(URI.create("about:blank"));
    problem.setProperty("timestamp", Instant.now());
    problem.setProperty(
        "errorCode", ex.getErrorCode() != null ? ex.getErrorCode() : "SERVICE_UNAVAILABLE");
    return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(problem);
  }

  @ExceptionHandler(DomainException.class)
  public ResponseEntity<ProblemDetail> handleDomainException(
      DomainException ex, WebRequest request) {
    Locale locale = LocaleContextHolder.getLocale();
    String detail;
    if (ex.getErrorCode() != null) {
      detail = messageSource.getMessage(ex.getErrorCode(), ex.getArgs(), ex.getMessage(), locale);
    } else {
      detail = messageSource.getMessage(ex.getMessage(), ex.getArgs(), ex.getMessage(), locale);
    }
    String title = messageSource.getMessage("error.title.bad_request", null, "Bad Request", locale);

    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    problem.setTitle(title);
    problem.setType(URI.create("about:blank"));
    problem.setProperty("timestamp", Instant.now());
    problem.setProperty(
        "errorCode", ex.getErrorCode() != null ? ex.getErrorCode() : "DOMAIN_ERROR");
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
  }

  @ExceptionHandler(IllegalArgumentException.class)
  public ResponseEntity<ProblemDetail> handleIllegalArgument(
      IllegalArgumentException ex, WebRequest request) {
    Locale locale = LocaleContextHolder.getLocale();
    log.warn("Bad request at {}: {}", request.getDescription(false), ex.getMessage());
    String title = messageSource.getMessage("error.title.bad_request", null, "Bad Request", locale);
    String detail = messageSource.getMessage(ex.getMessage(), null, ex.getMessage(), locale);

    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    problem.setTitle(title);
    problem.setType(URI.create("about:blank"));
    problem.setProperty("timestamp", Instant.now());
    problem.setProperty("errorCode", "INVALID_ARGUMENT");
    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ProblemDetail> handleValidationExceptions(
      MethodArgumentNotValidException ex) {
    Locale locale = LocaleContextHolder.getLocale();
    String title =
        messageSource.getMessage("error.title.validation", null, "Validation Failed", locale);
    String detail =
        messageSource.getMessage("error.validation_failed", null, "Validation failed", locale);

    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
    problem.setTitle(title);
    problem.setType(URI.create("about:blank"));

    Map<String, String> errors = new HashMap<>();
    ex.getBindingResult()
        .getAllErrors()
        .forEach(
            (error) -> {
              String fieldName = ((FieldError) error).getField();
              String defaultMsg = error.getDefaultMessage();
              String resolvedMsg =
                  messageSource.getMessage(
                      defaultMsg != null ? defaultMsg : "", null, defaultMsg, locale);
              errors.put(fieldName, resolvedMsg);
            });
    problem.setProperty("errors", errors);
    problem.setProperty("timestamp", Instant.now());
    problem.setProperty("errorCode", "VALIDATION_FAILED");

    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ProblemDetail> handleAccessDenied(
      AccessDeniedException ex, WebRequest request) {
    Locale locale = LocaleContextHolder.getLocale();
    String title = messageSource.getMessage("error.title.forbidden", null, "Forbidden", locale);
    String detail =
        messageSource.getMessage(
            "error.access_denied",
            null,
            "You do not have permission to perform this action",
            locale);

    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, detail);
    problem.setTitle(title);
    problem.setType(URI.create("about:blank"));
    problem.setProperty("timestamp", Instant.now());
    problem.setProperty("errorCode", "FORBIDDEN");
    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(problem);
  }

  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<ProblemDetail> handleAuthenticationException(
      AuthenticationException ex, WebRequest request) {
    Locale locale = LocaleContextHolder.getLocale();
    String title =
        messageSource.getMessage("error.title.unauthorized", null, "Unauthorized", locale);
    String detail =
        messageSource.getMessage(
            "error.unauthorized",
            null,
            "Authentication is required to access this resource",
            locale);

    ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, detail);
    problem.setTitle(title);
    problem.setType(URI.create("about:blank"));
    problem.setProperty("timestamp", Instant.now());
    problem.setProperty("errorCode", "UNAUTHORIZED");
    return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(problem);
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ProblemDetail> handleGenericException(Exception ex, WebRequest request) {
    Locale locale = LocaleContextHolder.getLocale();
    log.error("Unhandled exception at {}: {}", request.getDescription(false), ex.getMessage(), ex);
    String title =
        messageSource.getMessage(
            "error.title.internal_server_error", null, "Internal Server Error", locale);
    String detail =
        messageSource.getMessage("error.unexpected", null, "An unexpected error occurred", locale);

    ProblemDetail problem =
        ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, detail);
    problem.setTitle(title);
    problem.setType(URI.create("about:blank"));
    problem.setProperty("timestamp", Instant.now());
    problem.setProperty("errorCode", "INTERNAL_SERVER_ERROR");
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
  }
}
