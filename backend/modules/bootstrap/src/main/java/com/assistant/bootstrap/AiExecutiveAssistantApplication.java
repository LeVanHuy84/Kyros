package com.assistant.bootstrap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.assistant")
@EntityScan(basePackages = "com.assistant")
@EnableJpaRepositories(basePackages = "com.assistant")
@EnableScheduling
public class AiExecutiveAssistantApplication {
  public static void main(String[] args) {
    SpringApplication.run(AiExecutiveAssistantApplication.class, args);
  }
}
