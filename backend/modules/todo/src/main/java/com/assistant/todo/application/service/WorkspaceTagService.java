package com.assistant.todo.application.service;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.kernel.exception.EntityNotFoundException;
import com.assistant.todo.application.port.in.WorkspaceTagPort;
import com.assistant.todo.domain.model.WorkspaceTag;
import com.assistant.todo.domain.repository.WorkspaceTagRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class WorkspaceTagService implements WorkspaceTagPort {

  private final WorkspaceTagRepository tagRepository;

  public WorkspaceTagService(WorkspaceTagRepository tagRepository) {
    this.tagRepository = tagRepository;
  }

  @Override
  @Transactional(readOnly = true)
  public List<WorkspaceTag> listTags(WorkspaceId workspaceId) {
    return tagRepository.findAllByWorkspaceId(workspaceId);
  }

  @Override
  public WorkspaceTag createTag(WorkspaceId workspaceId, String name, String color) {
    if (name == null || name.isBlank()) {
      throw new IllegalArgumentException("Tag name must not be blank");
    }
    String trimmedName = name.trim();
    if (tagRepository.existsByNameAndWorkspaceId(trimmedName, workspaceId)) {
      throw new IllegalArgumentException("A tag with this name already exists in the workspace");
    }
    WorkspaceTag tag = WorkspaceTag.create(workspaceId, trimmedName, color);
    return tagRepository.save(tag);
  }

  @Override
  public WorkspaceTag updateTag(UUID tagId, WorkspaceId workspaceId, String name, String color) {
    WorkspaceTag tag =
        tagRepository
            .findById(tagId, workspaceId)
            .orElseThrow(
                () -> new EntityNotFoundException("Workspace tag not found with ID: " + tagId));
    if (name != null && !name.isBlank()) {
      String trimmedName = name.trim();
      if (!trimmedName.equalsIgnoreCase(tag.getName())
          && tagRepository.existsByNameAndWorkspaceId(trimmedName, workspaceId)) {
        throw new IllegalArgumentException("A tag with this name already exists in the workspace");
      }
      tag.rename(trimmedName);
    }
    if (color != null) {
      tag.recolor(color);
    }
    return tagRepository.save(tag);
  }

  @Override
  public void deleteTag(UUID tagId, WorkspaceId workspaceId) {
    if (tagRepository.findById(tagId, workspaceId).isEmpty()) {
      throw new EntityNotFoundException("Workspace tag not found with ID: " + tagId);
    }
    tagRepository.delete(tagId, workspaceId);
  }
}
