package com.assistant.kernel.exception;

public class ServiceUnavailableException extends DomainException {

  public ServiceUnavailableException(String message) {
    super("error.service_unavailable", message);
  }

  public ServiceUnavailableException(String errorCode, String defaultMessage) {
    super(errorCode, defaultMessage);
  }

  public ServiceUnavailableException(String errorCode, String defaultMessage, Object... args) {
    super(errorCode, defaultMessage, args);
  }

  public ServiceUnavailableException(String message, Throwable cause) {
    super("error.service_unavailable", message, cause);
  }

  public ServiceUnavailableException(
      String errorCode, String defaultMessage, Throwable cause, Object... args) {
    super(errorCode, defaultMessage, cause, args);
  }
}
