package com.assistant.agent.domain.repository;

import com.assistant.agent.domain.model.AgentAuditLog;
import java.util.List;
import java.util.UUID;

public interface AgentAuditLogRepository {

  AgentAuditLog save(AgentAuditLog auditLog);

  List<AgentAuditLog> findByWorkspaceId(UUID workspaceId);
}
