package com.assistant.memory.infrastructure.persistence;

import com.assistant.kernel.domain.UserId;
import com.assistant.kernel.domain.WorkspaceId;
import com.assistant.memory.domain.model.Conversation;
import com.assistant.memory.domain.model.ConversationId;
import com.assistant.memory.domain.model.ConversationStatus;
import com.assistant.memory.domain.model.ConversationTurn;
import com.assistant.memory.domain.model.SenderRole;
import com.assistant.memory.domain.model.TurnId;
import com.assistant.memory.domain.repository.ConversationRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class ConversationRepositoryAdapter implements ConversationRepository {

  private final SpringDataConversationRepository conversationRepository;
  private final SpringDataConversationTurnRepository turnRepository;

  public ConversationRepositoryAdapter(
      SpringDataConversationRepository conversationRepository,
      SpringDataConversationTurnRepository turnRepository) {
    this.conversationRepository = conversationRepository;
    this.turnRepository = turnRepository;
  }

  @Override
  public Optional<Conversation> findById(ConversationId id, WorkspaceId workspaceId) {
    return conversationRepository
        .findByIdAndWorkspaceId(id.value(), workspaceId.value())
        .map(this::toDomain);
  }

  @Override
  public List<Conversation> findByWorkspace(WorkspaceId workspaceId, int offset, int limit) {
    int page = limit > 0 ? offset / limit : 0;
    Pageable pageable =
        PageRequest.of(page, limit > 0 ? limit : 20, Sort.by("lastTurnTimestamp").descending());
    return conversationRepository
        .findByWorkspaceId(workspaceId.value(), pageable)
        .getContent()
        .stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  public long countByWorkspace(WorkspaceId workspaceId) {
    return conversationRepository.countByWorkspaceId(workspaceId.value());
  }

  @Override
  public void save(Conversation conversation) {
    ConversationJpaEntity jpa = toJpa(conversation);
    conversationRepository.save(jpa);
  }

  @Override
  @Transactional
  public void appendTurn(
      ConversationId conversationId, WorkspaceId workspaceId, ConversationTurn turn) {
    ConversationTurnJpaEntity turnJpa = new ConversationTurnJpaEntity();
    turnJpa.setId(turn.getId().value());
    turnJpa.setConversationId(conversationId.value());
    turnJpa.setSenderRole(turn.getRole().name());
    turnJpa.setContent(turn.getContent());
    turnJpa.setTurnTimestamp(turn.getTimestamp());
    turnRepository.save(turnJpa);

    conversationRepository
        .findByIdAndWorkspaceId(conversationId.value(), workspaceId.value())
        .ifPresent(
            conv -> {
              conv.setLastTurnTimestamp(turn.getTimestamp());
              conv.setStatus(ConversationStatus.Active.name());
              conv.setUpdatedAt(Instant.now());
              conversationRepository.save(conv);
            });
  }

  @Override
  public List<ConversationTurn> findRecentTurns(ConversationId conversationId, int limit) {
    Pageable pageable = PageRequest.of(0, limit);
    return turnRepository.findRecentTurns(conversationId.value(), pageable).stream()
        .map(this::toDomain)
        .collect(Collectors.toList());
  }

  @Override
  @Transactional
  public void deleteTurns(ConversationId conversationId) {
    turnRepository.deleteByConversationId(conversationId.value());
  }

  private Conversation toDomain(ConversationJpaEntity jpa) {
    return new Conversation(
        new ConversationId(jpa.getId()),
        new WorkspaceId(jpa.getWorkspaceId()),
        new UserId(jpa.getUserId()),
        jpa.getSessionId(),
        jpa.getTitle(),
        ConversationStatus.valueOf(jpa.getStatus()),
        jpa.getLastTurnTimestamp(),
        jpa.getCreatedAt(),
        jpa.getUpdatedAt(),
        jpa.getVersion());
  }

  private ConversationJpaEntity toJpa(Conversation domain) {
    ConversationJpaEntity jpa = new ConversationJpaEntity();
    jpa.setId(domain.getId().value());
    jpa.setWorkspaceId(domain.getWorkspaceId().value());
    jpa.setUserId(domain.getUserId().value());
    jpa.setSessionId(domain.getSessionId());
    jpa.setTitle(domain.getTitle());
    jpa.setStatus(domain.getStatus().name());
    jpa.setLastTurnTimestamp(domain.getLastTurnTimestamp());
    jpa.setCreatedAt(domain.getCreatedAt());
    jpa.setUpdatedAt(domain.getUpdatedAt());
    jpa.setVersion(domain.getVersion());
    return jpa;
  }

  private ConversationTurn toDomain(ConversationTurnJpaEntity jpa) {
    return new ConversationTurn(
        new TurnId(jpa.getId()),
        SenderRole.valueOf(jpa.getSenderRole()),
        jpa.getContent(),
        jpa.getTurnTimestamp());
  }
}
