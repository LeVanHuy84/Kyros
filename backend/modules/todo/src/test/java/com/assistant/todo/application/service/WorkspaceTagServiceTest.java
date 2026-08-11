package com.assistant.todo.application.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.exception.EntityNotFoundException;
import com.assistant.todo.application.port.in.WorkspaceTagPort;
import com.assistant.todo.domain.model.WorkspaceTag;
import com.assistant.todo.domain.repository.WorkspaceTagRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WorkspaceTagServiceTest {

  private WorkspaceTagRepository tagRepository;
  private WorkspaceTagPort tagPort;
  private final WorkspaceId workspaceId = new WorkspaceId(UUID.randomUUID());

  @BeforeEach
  void setUp() {
    tagRepository = mock(WorkspaceTagRepository.class);
    when(tagRepository.save(any(WorkspaceTag.class))).thenAnswer(inv -> inv.getArgument(0));
    tagPort = new WorkspaceTagService(tagRepository);
  }

  @Test
  void testCreateTagSavesNewTag() {
    when(tagRepository.existsByNameAndWorkspaceId("urgent", workspaceId)).thenReturn(false);

    WorkspaceTag tag = tagPort.createTag(workspaceId, "urgent", "#ef4444");

    assertNotNull(tag);
    assertEquals("urgent", tag.getName());
    assertEquals("#ef4444", tag.getColor());
    verify(tagRepository, times(1)).save(eq(tag));
  }

  @Test
  void testCreateTagRejectsDuplicateName() {
    when(tagRepository.existsByNameAndWorkspaceId("urgent", workspaceId)).thenReturn(true);

    assertThrows(
        IllegalArgumentException.class,
        () -> tagPort.createTag(workspaceId, "urgent", "#ef4444"));
    verify(tagRepository, never()).save(any(WorkspaceTag.class));
  }

  @Test
  void testCreateTagRejectsBlankName() {
    assertThrows(IllegalArgumentException.class, () -> tagPort.createTag(workspaceId, "   ", null));
    verify(tagRepository, never()).save(any(WorkspaceTag.class));
  }

  @Test
  void testUpdateTagRenamesAndRecolors() {
    UUID tagId = UUID.randomUUID();
    WorkspaceTag existing =
        WorkspaceTag.create(workspaceId, "old-name", "#3b82f6");
    when(tagRepository.findById(tagId, workspaceId)).thenReturn(Optional.of(existing));
    when(tagRepository.existsByNameAndWorkspaceId("new-name", workspaceId)).thenReturn(false);

    WorkspaceTag updated = tagPort.updateTag(tagId, workspaceId, "new-name", "#10b981");

    assertEquals("new-name", updated.getName());
    assertEquals("#10b981", updated.getColor());
    verify(tagRepository, times(1)).save(existing);
  }

  @Test
  void testUpdateTagThrowsWhenNotFound() {
    UUID tagId = UUID.randomUUID();
    when(tagRepository.findById(tagId, workspaceId)).thenReturn(Optional.empty());

    assertThrows(
        EntityNotFoundException.class,
        () -> tagPort.updateTag(tagId, workspaceId, "new-name", null));
  }

  @Test
  void testDeleteTagDeletesExistingTag() {
    UUID tagId = UUID.randomUUID();
    WorkspaceTag existing = WorkspaceTag.create(workspaceId, "urgent", null);
    when(tagRepository.findById(tagId, workspaceId)).thenReturn(Optional.of(existing));

    tagPort.deleteTag(tagId, workspaceId);

    verify(tagRepository, times(1)).delete(tagId, workspaceId);
  }

  @Test
  void testDeleteTagThrowsWhenNotFound() {
    UUID tagId = UUID.randomUUID();
    when(tagRepository.findById(tagId, workspaceId)).thenReturn(Optional.empty());

    assertThrows(EntityNotFoundException.class, () -> tagPort.deleteTag(tagId, workspaceId));
    verify(tagRepository, never()).delete(eq(tagId), any());
  }

  @Test
  void testListTagsReturnsRepositoryResults() {
    List<WorkspaceTag> tags =
        List.of(WorkspaceTag.create(workspaceId, "urgent", "#ef4444"));
    when(tagRepository.findAllByWorkspaceId(workspaceId)).thenReturn(tags);

    List<WorkspaceTag> result = tagPort.listTags(workspaceId);

    assertEquals(1, result.size());
    assertEquals("urgent", result.get(0).getName());
  }
}
