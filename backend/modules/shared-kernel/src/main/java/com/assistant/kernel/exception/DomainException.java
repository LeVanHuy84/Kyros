package com.assistant.kernel.exception;

public class DomainException extends RuntimeException {

  private final String errorCode;
  private final Object[] args;

  public DomainException(String message) {
    super(message);
    this.errorCode = null;
    this.args = new Object[0];
  }

  public DomainException(String errorCode, String defaultMessage) {
    super(defaultMessage);
    this.errorCode = errorCode;
    this.args = new Object[0];
  }

  public DomainException(String errorCode, String defaultMessage, Object... args) {
    super(defaultMessage);
    this.errorCode = errorCode;
    this.args = args != null ? args : new Object[0];
  }

  public DomainException(String message, Throwable cause) {
    super(message, cause);
    this.errorCode = null;
    this.args = new Object[0];
  }

  public DomainException(String errorCode, String defaultMessage, Throwable cause, Object... args) {
    super(defaultMessage, cause);
    this.errorCode = errorCode;
    this.args = args != null ? args : new Object[0];
  }

  public String getErrorCode() {
    return errorCode;
  }

  public Object[] getArgs() {
    return args;
  }
}
