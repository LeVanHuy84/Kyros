package com.assistant.agent.domain.tool;

import com.assistant.agent.domain.model.ToolExecutionResult;

public interface AgentToolContract {

  String getName();

  String getDescription();

  String getJsonSchema();

  ToolExecutionResult execute(String argumentsJson);
}
