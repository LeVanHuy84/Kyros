package com.assistant.memory.domain.model;

/** Standard classification categories for extracted long-term user facts and memory entries. */
public enum FactCategory {
  USER_PREFERENCE("Thói quen / Sở thích", "User Preference"),
  PROJECT_CONTEXT("Bối cảnh dự án", "Project Context"),
  WORK_RULE("Quy tắc làm việc", "Work Rule"),
  CONSTRAINT("Hạn chế / Ràng buộc", "Constraint"),
  GENERAL("Thông tin chung", "General Context");

  private final String viLabel;
  private final String enLabel;

  FactCategory(String viLabel, String enLabel) {
    this.viLabel = viLabel;
    this.enLabel = enLabel;
  }

  public String getViLabel() {
    return viLabel;
  }

  public String getEnLabel() {
    return enLabel;
  }
}
