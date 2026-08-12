package com.assistant.calendar.infrastructure.persistence;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataCalendarEventRepository
    extends JpaRepository<CalendarEventJpaEntity, UUID> {
  Optional<CalendarEventJpaEntity> findByIdAndWorkspaceId(UUID id, UUID workspaceId);

  @Query(
      value =
          "SELECT e FROM CalendarEventJpaEntity e "
              + "WHERE e.workspaceId = :workspaceId "
              + "AND e.status = 'Scheduled' "
              + "AND e.deletedAt IS NULL "
              + "AND e.startTime < :endTime "
              + "AND e.endTime > :startTime "
              + "AND e.id <> :excludeEventId")
  List<CalendarEventJpaEntity> findOverlapping(
      @Param("workspaceId") UUID workspaceId,
      @Param("startTime") Instant startTime,
      @Param("endTime") Instant endTime,
      @Param("excludeEventId") UUID excludeEventId);

  @Query(
      value =
          "SELECT e FROM CalendarEventJpaEntity e "
              + "WHERE e.workspaceId = :workspaceId "
              + "AND e.startTime >= :startTime "
              + "AND e.endTime <= :endTime")
  List<CalendarEventJpaEntity> findInWindow(
      @Param("workspaceId") UUID workspaceId,
      @Param("startTime") Instant startTime,
      @Param("endTime") Instant endTime);

  @Query(
      value =
          "SELECT e FROM CalendarEventJpaEntity e "
              + "JOIN e.reminders r "
              + "WHERE r.status IN ('Scheduled', 'Snoozed') "
              + "AND r.triggerTime <= :now")
  List<CalendarEventJpaEntity> findEventsWithDueReminders(@Param("now") Instant now);

  @Query(
      value =
          "SELECT e FROM CalendarEventJpaEntity e "
              + "WHERE e.workspaceId = :workspaceId "
              + "AND e.status = 'Scheduled' "
              + "AND e.deletedAt IS NULL "
              + "AND e.startTime >= :rangeStart "
              + "AND e.endTime <= :rangeEnd")
  List<CalendarEventJpaEntity> findActiveEvents(
      @Param("workspaceId") UUID workspaceId,
      @Param("rangeStart") Instant rangeStart,
      @Param("rangeEnd") Instant rangeEnd);
}
