package com.assistant.kernel.exception;

public class EntityNotFoundException extends DomainException {

  public EntityNotFoundException(String message) {
    super("error.entity_not_found", message);
  }

  public EntityNotFoundException(String errorCode, String defaultMessage) {
    super(errorCode, defaultMessage);
  }

  public EntityNotFoundException(String errorCode, String defaultMessage, Object... args) {
    super(errorCode, defaultMessage, args);
  }
}
