package com.assistant.notification.application.ports.out;

public interface SlackDispatcherPort {
  void postMessage(String slackWebhookRef, String textMessage);
}
