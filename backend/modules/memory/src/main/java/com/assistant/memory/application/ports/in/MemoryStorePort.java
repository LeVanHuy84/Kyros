package com.assistant.memory.application.ports.in;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.application.dto.MemoryEntryDTO;
import com.assistant.memory.application.dto.PreferencesDTO;
import com.assistant.memory.application.dto.UpdatePreferencesCommand;
import java.util.List;

public interface MemoryStorePort {
  PreferencesDTO getUserPreferences(WorkspaceId workspaceId, UserId userId);

  void updatePreferences(UpdatePreferencesCommand command);

  List<MemoryEntryDTO> searchSemanticFacts(WorkspaceId workspaceId, String queryText);
}
