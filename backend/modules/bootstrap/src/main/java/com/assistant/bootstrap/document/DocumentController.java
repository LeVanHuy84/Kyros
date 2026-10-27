package com.assistant.bootstrap.document;

import com.assistant.kernel.context.WorkspaceContextHolder;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/documents")
public class DocumentController {

  public record RawDocumentRequest(String filename, String contentType, String content) {}

  private final DocumentIngestionService ingestionService;

  public DocumentController(DocumentIngestionService ingestionService) {
    this.ingestionService = ingestionService;
  }

  private void validateWorkspace(UUID pathWorkspaceId) {
    UUID authenticatedWorkspaceId = WorkspaceContextHolder.getRequired().value();
    if (!authenticatedWorkspaceId.equals(pathWorkspaceId)) {
      throw new AccessDeniedException("Access denied. You do not have access to this workspace.");
    }
  }

  private UUID resolveUserId() {
    return UUID.fromString("00000000-0000-0000-0000-000000000001");
  }

  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<DocumentIngestionService.WorkspaceDocumentDto> uploadDocument(
      @PathVariable("workspaceId") UUID workspaceId, @RequestParam("file") MultipartFile file)
      throws IOException {
    validateWorkspace(workspaceId);
    if (file.isEmpty()) {
      return ResponseEntity.badRequest().build();
    }

    String filename =
        file.getOriginalFilename() != null ? file.getOriginalFilename() : "document.txt";
    String contentType = file.getContentType();
    byte[] bytes = file.getBytes();

    var result =
        ingestionService.ingestDocument(workspaceId, resolveUserId(), filename, contentType, bytes);
    return ResponseEntity.ok(result);
  }

  @PostMapping(value = "/raw", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<DocumentIngestionService.WorkspaceDocumentDto> ingestRawDocument(
      @PathVariable("workspaceId") UUID workspaceId, @RequestBody RawDocumentRequest request) {
    validateWorkspace(workspaceId);
    if (request.content() == null || request.content().isBlank()) {
      return ResponseEntity.badRequest().build();
    }

    byte[] bytes = request.content().getBytes(StandardCharsets.UTF_8);
    var result =
        ingestionService.ingestDocument(
            workspaceId, resolveUserId(), request.filename(), request.contentType(), bytes);
    return ResponseEntity.ok(result);
  }

  @GetMapping
  public ResponseEntity<List<DocumentIngestionService.WorkspaceDocumentDto>> listDocuments(
      @PathVariable("workspaceId") UUID workspaceId) {
    validateWorkspace(workspaceId);
    return ResponseEntity.ok(ingestionService.listDocuments(workspaceId));
  }

  @GetMapping("/{documentId}")
  public ResponseEntity<DocumentIngestionService.WorkspaceDocumentDto> getDocument(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("documentId") UUID documentId) {
    validateWorkspace(workspaceId);
    return ingestionService
        .getDocument(workspaceId, documentId)
        .map(ResponseEntity::ok)
        .orElseGet(() -> ResponseEntity.notFound().build());
  }

  @DeleteMapping("/{documentId}")
  public ResponseEntity<Void> deleteDocument(
      @PathVariable("workspaceId") UUID workspaceId, @PathVariable("documentId") UUID documentId) {
    validateWorkspace(workspaceId);
    ingestionService.deleteDocument(workspaceId, documentId);
    return ResponseEntity.noContent().build();
  }
}
