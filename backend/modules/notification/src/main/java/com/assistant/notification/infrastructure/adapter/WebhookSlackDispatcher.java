package com.assistant.notification.infrastructure.adapter;

import com.assistant.notification.application.ports.out.SlackDispatcherPort;
import java.util.Map;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class WebhookSlackDispatcher implements SlackDispatcherPort {

  private final RestTemplate restTemplate = new RestTemplate();

  @Override
  public void postMessage(String slackWebhookRef, String textMessage) {
    if (slackWebhookRef == null || !slackWebhookRef.startsWith("http")) {
      System.out.printf(
          "[WARN] Slack webhook reference is not a direct URL (waiting for vault lookup): %s. "
              + "Message logged: %s%n",
          slackWebhookRef, textMessage);
      return;
    }

    try {
      HttpHeaders headers = new HttpHeaders();
      headers.setContentType(MediaType.APPLICATION_JSON);

      Map<String, String> payload = Map.of("text", textMessage);
      HttpEntity<Map<String, String>> request = new HttpEntity<>(payload, headers);

      restTemplate.postForEntity(slackWebhookRef, request, String.class);
      System.out.printf(
          "[INFO] Slack webhook message successfully posted to %s%n", slackWebhookRef);
    } catch (Exception e) {
      System.err.printf("[ERROR] Failed to post Slack webhook message: %s%n", e.getMessage());
      throw new RuntimeException("Slack webhook delivery failed", e);
    }
  }
}
