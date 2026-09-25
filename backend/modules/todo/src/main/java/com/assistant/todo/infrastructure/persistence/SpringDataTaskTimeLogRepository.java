package com.assistant.todo.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SpringDataTaskTimeLogRepository
    extends JpaRepository<TaskTimeLogJpaEntity, UUID> {

  Optional<TaskTimeLogJpaEntity> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

  @Query(
      "SELECT t FROM TaskTimeLogJpaEntity t WHERE t.workspaceId = :workspaceId AND t.taskId = :taskId AND t.userId = :userId AND t.endTime IS NULL")
  Optional<TaskTimeLogJpaEntity> findActiveLog(
      @Param("workspaceId") UUID workspaceId,
      @Param("taskId") UUID taskId,
      @Param("userId") UUID userId);

  List<TaskTimeLogJpaEntity> findByWorkspaceIdAndTaskIdOrderByStartTimeDesc(
      UUID workspaceId, UUID taskId);

  @Query(
      "SELECT t FROM TaskTimeLogJpaEntity t WHERE t.workspaceId = :workspaceId AND t.userId = :userId AND t.startTime >= :fromTime AND t.startTime <= :toTime ORDER BY t.startTime DESC")
  List<TaskTimeLogJpaEntity> findByTimeRange(
      @Param("workspaceId") UUID workspaceId,
      @Param("userId") UUID userId,
      @Param("fromTime") Instant fromTime,
      @Param("toTime") Instant toTime);
}
