package com.assistant.calendar.infrastructure.config;

import com.assistant.calendar.domain.repository.CalendarEventRepository;
import com.assistant.calendar.domain.service.AvailabilityQueryService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CalendarConfig {

  @Bean
  public AvailabilityQueryService availabilityQueryService(
      CalendarEventRepository calendarEventRepository) {
    return new AvailabilityQueryService(calendarEventRepository);
  }
}
