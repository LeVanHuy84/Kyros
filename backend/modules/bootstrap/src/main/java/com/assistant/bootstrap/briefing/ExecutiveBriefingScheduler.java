package com.assistant.bootstrap.briefing;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ExecutiveBriefingScheduler {

  private final ExecutiveBriefingService briefingService;

  public ExecutiveBriefingScheduler(ExecutiveBriefingService briefingService) {
    this.briefingService = briefingService;
  }

  // Morning briefing: 07:30 AM every day (Asia/Ho_Chi_Minh)
  @Scheduled(cron = "0 30 7 * * *", zone = "Asia/Ho_Chi_Minh")
  public void scheduledMorningBriefing() {
    briefingService.runDailyMorningBriefingForAllWorkspaces();
  }

  // Evening wrapup: 18:00 (6:00 PM) every day (Asia/Ho_Chi_Minh)
  @Scheduled(cron = "0 0 18 * * *", zone = "Asia/Ho_Chi_Minh")
  public void scheduledEveningWrapup() {
    briefingService.runDailyEveningWrapupForAllWorkspaces();
  }
}
