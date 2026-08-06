package com.assistant.todo.infrastructure.persistence;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@Entity
@Table(name = "tasks", schema = "todo")
@FilterDef(
    name = "workspaceFilter",
    parameters = @ParamDef(name = "workspaceId", type = java.util.UUID.class))
@Filter(name = "workspaceFilter", condition = "workspace_id = :workspaceId")
public class TaskJpaEntity {

  @Id
  @Column(name = "id")
  private UUID id;

  @Column(name = "workspace_id", nullable = false)
  private UUID workspaceId;

  @Column(name = "parent_task_id")
  private UUID parentTaskId;

  @Column(name = "title", nullable = false)
  private String title;

  @Column(name = "description")
  private String description;

  @Column(name = "priority", nullable = false)
  private String priority;

  @Column(name = "status", nullable = false)
  private String status;

  @Column(name = "due_date")
  private Instant dueDate;

  @Column(name = "recurrence_rule")
  private String recurrenceRule;

  @Column(name = "recurrence_status")
  private String recurrenceStatus;

  @Column(name = "last_generated_occurrence")
  private Instant lastGeneratedOccurrence;

  @Column(name = "deleted_at")
  private Instant deletedAt;

  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  @Column(name = "updated_at", nullable = false)
  private Instant updatedAt;

  @Column(name = "created_by")
  private UUID createdBy;

  @Column(name = "updated_by")
  private UUID updatedBy;

  @Version
  @Column(name = "version")
  private int version;

  @OneToMany(
      mappedBy = "task",
      cascade = CascadeType.ALL,
      orphanRemoval = true,
      fetch = FetchType.EAGER)
  private List<TagJpaEntity> tags = new ArrayList<>();

  public TaskJpaEntity() {}

  // Getters and Setters
  public UUID getId() {
    return id;
  }

  public void setId(UUID id) {
    this.id = id;
  }

  public UUID getWorkspaceId() {
    return workspaceId;
  }

  public void setWorkspaceId(UUID workspaceId) {
    this.workspaceId = workspaceId;
  }

  public UUID getParentTaskId() {
    return parentTaskId;
  }

  public void setParentTaskId(UUID parentTaskId) {
    this.parentTaskId = parentTaskId;
  }

  public String getTitle() {
    return title;
  }

  public void setTitle(String title) {
    this.title = title;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public String getPriority() {
    return priority;
  }

  public void setPriority(String priority) {
    this.priority = priority;
  }

  public String getStatus() {
    return status;
  }

  public void setStatus(String status) {
    this.status = status;
  }

  public Instant getDueDate() {
    return dueDate;
  }

  public void setDueDate(Instant dueDate) {
    this.dueDate = dueDate;
  }

  public String getRecurrenceRule() {
    return recurrenceRule;
  }

  public void setRecurrenceRule(String recurrenceRule) {
    this.recurrenceRule = recurrenceRule;
  }

  public String getRecurrenceStatus() {
    return recurrenceStatus;
  }

  public void setRecurrenceStatus(String recurrenceStatus) {
    this.recurrenceStatus = recurrenceStatus;
  }

  public Instant getLastGeneratedOccurrence() {
    return lastGeneratedOccurrence;
  }

  public void setLastGeneratedOccurrence(Instant lastGeneratedOccurrence) {
    this.lastGeneratedOccurrence = lastGeneratedOccurrence;
  }

  public Instant getDeletedAt() {
    return deletedAt;
  }

  public void setDeletedAt(Instant deletedAt) {
    this.deletedAt = deletedAt;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(Instant updatedAt) {
    this.updatedAt = updatedAt;
  }

  public UUID getCreatedBy() {
    return createdBy;
  }

  public void setCreatedBy(UUID createdBy) {
    this.createdBy = createdBy;
  }

  public UUID getUpdatedBy() {
    return updatedBy;
  }

  public void setUpdatedBy(UUID updatedBy) {
    this.updatedBy = updatedBy;
  }

  public int getVersion() {
    return version;
  }

  public void setVersion(int version) {
    this.version = version;
  }

  public List<TagJpaEntity> getTags() {
    return tags;
  }

  public void setTags(List<TagJpaEntity> tags) {
    this.tags = tags;
  }
}
