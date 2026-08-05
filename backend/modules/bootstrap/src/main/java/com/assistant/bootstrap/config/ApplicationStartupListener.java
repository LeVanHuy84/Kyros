package com.assistant.bootstrap.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class ApplicationStartupListener implements ApplicationListener<ApplicationReadyEvent> {

  private static final Logger log = LoggerFactory.getLogger(ApplicationStartupListener.class);

  private final Environment env;

  @Value("${scalar.path:/scalar}")
  private String scalarPath;

  public ApplicationStartupListener(Environment env) {
    this.env = env;
  }

  @Override
  public void onApplicationEvent(ApplicationReadyEvent event) {
    String protocol = "http";
    if (env.getProperty("server.ssl.key-store") != null) {
      protocol = "https";
    }
    String serverPort = env.getProperty("local.server.port");
    if (serverPort == null) {
      serverPort = env.getProperty("server.port", "8080");
    }
    String contextPath = env.getProperty("server.servlet.context-path", "");
    if ("/".equals(contextPath)) {
      contextPath = "";
    }

    String scalarUrl =
        String.format("%s://localhost:%s%s%s", protocol, serverPort, contextPath, scalarPath);

    log.info(
        """

        ----------------------------------------------------------
        \tApplication is running!
        \tLocal URL:      {}://localhost:{}{}
        \tAPI Docs:       {}
        ----------------------------------------------------------\
        """,
        protocol,
        serverPort,
        contextPath,
        scalarUrl);
  }
}
