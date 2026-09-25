package com.assistant.bootstrap.config;

import java.util.Locale;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

@Component
public class I18nMessageService {

  private final MessageSource messageSource;

  public I18nMessageService(MessageSource messageSource) {
    this.messageSource = messageSource;
  }

  public String getMessage(String code, Object[] args, String defaultMessage) {
    Locale locale = LocaleContextHolder.getLocale();
    return messageSource.getMessage(code, args, defaultMessage, locale);
  }

  public String getMessage(String code, String defaultMessage) {
    return getMessage(code, null, defaultMessage);
  }

  public String getMessage(String code) {
    return getMessage(code, null, code);
  }

  public Locale getCurrentLocale() {
    return LocaleContextHolder.getLocale();
  }
}
