package com.assistant.todo.presentation;

import static org.mockito.Mockito.any;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.assistant.kernel.context.WorkspaceContextHolder;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.application.port.in.TodoPort;
import com.assistant.todo.domain.model.Priority;
import com.assistant.todo.domain.model.Task;
import com.assistant.todo.domain.model.TaskId;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class TodoControllerTest {

  private MockMvc mockMvc;
  private TodoPort todoPort;
  private final UUID workspaceId = UUID.randomUUID();

  @BeforeEach
  void setUp() {
    todoPort = mock(TodoPort.class);
    mockMvc = MockMvcBuilders.standaloneSetup(new TodoController(todoPort)).build();
    // Set ThreadLocal WorkspaceContext for validation check in controller
    WorkspaceContextHolder.set(new WorkspaceId(workspaceId));
  }

  @AfterEach
  void tearDown() {
    WorkspaceContextHolder.clear();
  }

  @Test
  void testCreateTaskSuccess() throws Exception {
    TaskId taskId = TaskId.random();
    Task task =
        new Task(
            taskId,
            new WorkspaceId(workspaceId),
            "Test Title",
            "Desc",
            Priority.Medium,
            null,
            Set.of());
    when(todoPort.createTask(
            any(WorkspaceId.class),
            eq("Test Title"),
            eq("Desc"),
            eq(Priority.Medium),
            any(),
            any()))
        .thenReturn(task);

    String payload =
        """
        {
          "title": "Test Title",
          "description": "Desc",
          "priority": "Medium"
        }
        """;

    mockMvc
        .perform(
            post("/api/v1/workspaces/{workspaceId}/tasks", workspaceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.taskId").value(taskId.toString()))
        .andExpect(jsonPath("$.title").value("Test Title"))
        .andExpect(jsonPath("$.priority").value("Medium"));
  }

  @Test
  void testCreateTaskValidationFailure() throws Exception {
    String payload =
        """
        {
          "title": "",
          "description": "Desc"
        }
        """;

    mockMvc
        .perform(
            post("/api/v1/workspaces/{workspaceId}/tasks", workspaceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(payload))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testGetTaskNotFound() throws Exception {
    UUID taskId = UUID.randomUUID();
    when(todoPort.getTask(eq(new TaskId(taskId)), any(WorkspaceId.class)))
        .thenReturn(Optional.empty());

    mockMvc
        .perform(get("/api/v1/workspaces/{workspaceId}/tasks/{taskId}", workspaceId, taskId))
        .andExpect(status().isNotFound());
  }

  @Test
  void testGetTaskSuccess() throws Exception {
    UUID taskId = UUID.randomUUID();
    Task task =
        new Task(
            new TaskId(taskId),
            new WorkspaceId(workspaceId),
            "Test Title",
            "Desc",
            Priority.Medium,
            null,
            Set.of());
    when(todoPort.getTask(eq(new TaskId(taskId)), any(WorkspaceId.class)))
        .thenReturn(Optional.of(task));

    mockMvc
        .perform(get("/api/v1/workspaces/{workspaceId}/tasks/{taskId}", workspaceId, taskId))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.taskId").value(taskId.toString()))
        .andExpect(jsonPath("$.title").value("Test Title"));
  }
}
