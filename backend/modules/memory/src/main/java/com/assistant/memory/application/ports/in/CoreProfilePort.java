package com.assistant.memory.application.ports.in;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;

/** In-port for retrieving and updating Tier 1: Core User Profile (Working Memory). */
public interface CoreProfilePort {
  /**
   * Retrieves the synthesized core user profile formatted as compact Markdown for system prompt.
   * Returns empty string if no core facts are established yet.
   */
  String getSynthesizedCoreProfile(WorkspaceId workspaceId, UserId userId);

  /**
   * Triggers an immediate re-synthesis and persistence of the user's Core Profile from Tier 2
   * facts.
   */
  String refreshCoreProfile(WorkspaceId workspaceId, UserId userId);
}
