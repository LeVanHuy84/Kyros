package com.assistant.todo.presentation;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.application.port.in.WorkspaceTagPort;
import com.assistant.todo.domain.model.WorkspaceTag;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class WorkspaceTagControllerTest {

  private MockMvc mockMvc;
  private WorkspaceTagPort tagPort;
  private final UUID workspaceId = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    tagPort = mock(WorkspaceTagPort.class);
    mockMvc = MockMvcBuilders.standaloneSetup(new WorkspaceTagController(tagPort)).build();
    WorkspaceContextHolder.set(new WorkspaceId(workspaceId));
  }

  @AfterEach
  void tearDown() {
    WorkspaceContextHolder.clear();
  }

  @Test
  void testListTagsSuccess() throws Exception {
    WorkspaceTag tag = WorkspaceTag.create(new WorkspaceId(workspaceId), "urgent", "#ef4444");
    when(tagPort.listTags(new WorkspaceId(workspaceId))).thenReturn(List.of(tag));

    mockMvc
        .perform(get("/api/v1/workspaces/{workspaceId}/tags", workspaceId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].name").value("urgent"))
        .andExpect(jsonPath("$[0].color").value("#ef4444"));
  }

  @Test
  void testCreateTagSuccess() throws Exception {
    WorkspaceTag tag = WorkspaceTag.create(new WorkspaceId(workspaceId), "design", "#8b5cf6");
    when(tagPort.createTag(eq(new WorkspaceId(workspaceId)), eq("design"), eq("#8b5cf6")))
        .thenReturn(tag);

    String payload =
        """
        {
          "name": "design",
          "color": "#8b5cf6"
        }
        """;

    mockMvc
        .perform(
            post("/api/v1/workspaces/{workspaceId}/tags", workspaceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.name").value("design"))
        .andExpect(jsonPath("$.color").value("#8b5cf6"));
  }

  @Test
  void testCreateTagValidationFailure() throws Exception {
    String payload =
        """
        {
          "name": ""
        }
        """;

    mockMvc
        .perform(
            post("/api/v1/workspaces/{workspaceId}/tags", workspaceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
        .andExpect(status().isBadRequest());

    verify(tagPort, never()).createTag(any(), any(), any());
  }

  @Test
  void testUpdateTagSuccess() throws Exception {
    UUID tagId = UUID.randomUUID();
    WorkspaceTag updated = WorkspaceTag.create(new WorkspaceId(workspaceId), "design", "#10b981");
    when(tagPort.updateTag(
            eq(tagId), eq(new WorkspaceId(workspaceId)), eq("design"), eq("#10b981")))
        .thenReturn(updated);

    String payload =
        """
        {
          "name": "design",
          "color": "#10b981"
        }
        """;

    mockMvc
        .perform(
            put("/api/v1/workspaces/{workspaceId}/tags/{tagId}", workspaceId, tagId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("design"))
        .andExpect(jsonPath("$.color").value("#10b981"));
  }

  @Test
  void testDeleteTagSuccess() throws Exception {
    UUID tagId = UUID.randomUUID();

    mockMvc
        .perform(delete("/api/v1/workspaces/{workspaceId}/tags/{tagId}", workspaceId, tagId))
        .andExpect(status().isNoContent());

    verify(tagPort, org.mockito.Mockito.times(1)).deleteTag(tagId, new WorkspaceId(workspaceId));
  }
}
