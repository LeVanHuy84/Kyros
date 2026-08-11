package com.assistant.todo.application.port.in;

import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.todo.domain.model.WorkspaceTag;
import java.util.List;
import java.util.UUID;

public interface WorkspaceTagPort {

  List<WorkspaceTag> listTags(WorkspaceId workspaceId);

  WorkspaceTag createTag(WorkspaceId workspaceId, String name, String color);

  WorkspaceTag updateTag(UUID tagId, WorkspaceId workspaceId, String name, String color);

  void deleteTag(UUID tagId, WorkspaceId workspaceId);
}
