package com.assistant.memory.infrastructure.config;

import com.assistant.memory.domain.service.SensitiveFactScreeningService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Spring configuration for memory domain services. */
@Configuration
public class MemoryConfig {

  @Bean
  public SensitiveFactScreeningService sensitiveFactScreeningService() {
    return new SensitiveFactScreeningService();
  }
}
