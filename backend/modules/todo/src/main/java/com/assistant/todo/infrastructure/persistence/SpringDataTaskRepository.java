package com.assistant.todo.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataTaskRepository extends JpaRepository<TaskJpaEntity, UUID> {

  Optional<TaskJpaEntity> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

  @Query(
      "SELECT t FROM TaskJpaEntity t WHERE t.recurrenceRule IS NOT NULL AND t.recurrenceStatus ="
          + " 'Active' AND t.deletedAt IS NULL")
  List<TaskJpaEntity> findActiveRecurrenceTemplates();

  @Query(
      "SELECT t FROM TaskJpaEntity t WHERE t.parentTaskId = :parentTaskId AND t.deletedAt IS NULL")
  List<TaskJpaEntity> findChildInstances(@Param("parentTaskId") UUID parentTaskId);

  @Query("SELECT t FROM TaskJpaEntity t WHERE t.deletedAt IS NOT NULL AND t.deletedAt < :threshold")
  List<TaskJpaEntity> findSoftDeletedExpiredBefore(@Param("threshold") Instant threshold);

  @Query(
      "SELECT COUNT(t) > 0 FROM TaskJpaEntity t WHERE t.parentTaskId = :parentTaskId AND t.dueDate"
          + " = :dueDate AND t.deletedAt IS NULL")
  boolean existsChildOccurrence(
      @Param("parentTaskId") UUID parentTaskId, @Param("dueDate") Instant dueDate);

  @Query(
      "SELECT DISTINCT t FROM TaskJpaEntity t LEFT JOIN t.tags tag "
          + "WHERE t.workspaceId = :workspaceId "
          + "AND t.deletedAt IS NULL "
          + "AND (:title IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:title AS string), '%'))) "
          + "AND (:priority IS NULL OR t.priority = CAST(:priority AS string)) "
          + "AND (:tag IS NULL OR tag.name = CAST(:tag AS string)) "
          + "AND (:status IS NULL OR t.status = CAST(:status AS string)) "
          + "AND (CAST(:dueDateFrom AS timestamp) IS NULL OR t.dueDate >= :dueDateFrom) "
          + "AND (CAST(:dueDateTo AS timestamp) IS NULL OR t.dueDate <= :dueDateTo)")
  Page<TaskJpaEntity> findAllTasksFiltered(
      @Param("workspaceId") UUID workspaceId,
      @Param("title") String title,
      @Param("priority") String priority,
      @Param("tag") String tag,
      @Param("status") String status,
      @Param("dueDateFrom") Instant dueDateFrom,
      @Param("dueDateTo") Instant dueDateTo,
      Pageable pageable);

  @Query(
      "SELECT t FROM TaskJpaEntity t WHERE t.workspaceId = :workspaceId AND t.deletedAt IS NOT"
          + " NULL")
  Page<TaskJpaEntity> findSoftDeletedTasks(
      @Param("workspaceId") UUID workspaceId, Pageable pageable);

  @Query(
      "SELECT COUNT(DISTINCT t) FROM TaskJpaEntity t LEFT JOIN t.tags tag "
          + "WHERE t.workspaceId = :workspaceId "
          + "AND t.deletedAt IS NULL "
          + "AND (:title IS NULL OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:title AS string), '%'))) "
          + "AND (:priority IS NULL OR t.priority = CAST(:priority AS string)) "
          + "AND (:tag IS NULL OR tag.name = CAST(:tag AS string)) "
          + "AND (:status IS NULL OR t.status = CAST(:status AS string)) "
          + "AND (CAST(:dueDateFrom AS timestamp) IS NULL OR t.dueDate >= :dueDateFrom) "
          + "AND (CAST(:dueDateTo AS timestamp) IS NULL OR t.dueDate <= :dueDateTo)")
  long countAllTasksFiltered(
      @Param("workspaceId") UUID workspaceId,
      @Param("title") String title,
      @Param("priority") String priority,
      @Param("tag") String tag,
      @Param("status") String status,
      @Param("dueDateFrom") Instant dueDateFrom,
      @Param("dueDateTo") Instant dueDateTo);

  @Query(
      "SELECT COUNT(t) FROM TaskJpaEntity t WHERE t.workspaceId = :workspaceId AND t.deletedAt IS"
          + " NOT NULL")
  long countSoftDeletedTasks(@Param("workspaceId") UUID workspaceId);
}
