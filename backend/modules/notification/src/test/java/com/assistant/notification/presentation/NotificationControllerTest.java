package com.assistant.notification.presentation;

import static org.mockito.Mockito.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.notification.application.dto.GetNotificationProfileQuery;
import com.assistant.notification.application.dto.NotificationProfileDTO;
import com.assistant.notification.application.ports.in.NotificationManagementPort;
import com.assistant.notification.domain.model.InAppNotification;
import com.assistant.notification.domain.model.UrgencyLevel;
import com.assistant.notification.domain.repository.InAppNotificationRepository;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class NotificationControllerTest {

  private MockMvc mockMvc;
  private NotificationManagementPort managementPort;
  private InAppNotificationRepository inAppRepository;
  private final UUID workspaceId = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    managementPort = mock(NotificationManagementPort.class);
    inAppRepository = mock(InAppNotificationRepository.class);
    mockMvc =
        MockMvcBuilders.standaloneSetup(new NotificationController(managementPort, inAppRepository))
            .build();
    WorkspaceContextHolder.set(new WorkspaceId(workspaceId));

    // Mock Spring Security context for SecurityUtils
    UserId mockUserId = new UserId(UUID.randomUUID());
    org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth =
        new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
            mockUserId, null, java.util.List.of());
    org.springframework.security.core.context.SecurityContext context =
        org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
    context.setAuthentication(auth);
    org.springframework.security.core.context.SecurityContextHolder.setContext(context);
  }

  @AfterEach
  void tearDown() {
    WorkspaceContextHolder.clear();
    org.springframework.security.core.context.SecurityContextHolder.clearContext();
  }

  @Test
  void testGetInAppNotificationsReturnsDataAndMeta() throws Exception {
    InAppNotification notification =
        new InAppNotification(
            new WorkspaceId(workspaceId),
            UserId.random(),
            "Urgent Meeting",
            "Details here",
            UrgencyLevel.Urgent);

    when(inAppRepository.findNotifications(
            any(), any(), any(), any(Integer.class), any(Integer.class)))
        .thenReturn(List.of(notification));
    when(inAppRepository.countNotifications(any(), any(), any())).thenReturn(1L);

    mockMvc
        .perform(
            get("/api/v1/workspaces/{workspaceId}/notifications", workspaceId)
                .param("status", "Unread")
                .param("page", "0")
                .param("size", "20"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.data[0].title").value("Urgent Meeting"))
        .andExpect(jsonPath("$.meta.totalElements").value(1))
        .andExpect(jsonPath("$.meta.totalPages").value(1));
  }

  @Test
  void testGetNotificationProfileSuccess() throws Exception {
    NotificationProfileDTO profileDto =
        new NotificationProfileDTO(
            workspaceId,
            UUID.randomUUID(),
            Map.of("Urgent", Set.of("InApp", "Email")),
            "test@kyros.ai",
            null,
            "Immediate",
            "ENABLED");

    when(managementPort.getProfile(any(GetNotificationProfileQuery.class))).thenReturn(profileDto);

    mockMvc
        .perform(get("/api/v1/workspaces/{workspaceId}/notification-profile", workspaceId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.emailAddress").value("test@kyros.ai"))
        .andExpect(jsonPath("$.consentPolicy").value("ENABLED"));
  }
}
