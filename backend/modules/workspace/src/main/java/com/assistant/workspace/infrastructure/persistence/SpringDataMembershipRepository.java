package com.assistant.workspace.infrastructure.persistence;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SpringDataMembershipRepository extends JpaRepository<MembershipJpaEntity, UUID> {

  Optional<MembershipJpaEntity> findByUserIdAndIsPrimaryTrue(UUID userId);

  boolean existsByWorkspaceIdAndUserId(UUID workspaceId, UUID userId);

  @Query(
      "SELECT m.role FROM MembershipJpaEntity m WHERE m.workspace.id = :workspaceId AND m.userId ="
          + " :userId")
  Optional<String> findRoleByWorkspaceIdAndUserId(
      @Param("workspaceId") UUID workspaceId, @Param("userId") UUID userId);
}
