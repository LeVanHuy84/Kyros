import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentService } from '../../services/document.service';
import { WorkspaceDocument } from '../../models/document.models';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ToastService } from '@shared/components/toast/toast.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-documents-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, ModalComponent, ButtonComponent],
  templateUrl: './documents-panel.component.html',
  styleUrl: './documents-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsPanelComponent implements OnInit {
  private readonly documentService = inject(DocumentService);
  private readonly toastService = inject(ToastService);
  readonly languageService = inject(LanguageService);

  readonly documents = signal<WorkspaceDocument[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isUploading = signal<boolean>(false);
  readonly isDragging = signal<boolean>(false);
  readonly searchQuery = signal<string>('');
  readonly selectedDoc = signal<WorkspaceDocument | null>(null);
  readonly docToDelete = signal<WorkspaceDocument | null>(null);
  readonly isDeleting = signal<boolean>(false);

  readonly filteredDocuments = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.documents();
    return this.documents().filter((d) => d.filename.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.loadDocuments();
  }

  loadDocuments(): void {
    this.isLoading.set(true);
    this.documentService.getDocuments().subscribe({
      next: (docs) => {
        this.documents.set(docs || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFile(event.dataTransfer.files[0]);
    }
  }

  onFileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
      input.value = '';
    }
  }

  private handleFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'txt', 'md'];
    if (!ext || !allowed.includes(ext)) {
      this.toastService.error(
        'Định dạng không được hỗ trợ. Chỉ chấp nhận .pdf, .docx, .txt, .md.'
      );
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      this.toastService.error('Dung lượng tệp vượt quá 25MB.');
      return;
    }

    this.isUploading.set(true);
    this.documentService.uploadDocument(file).subscribe({
      next: (doc) => {
        this.isUploading.set(false);
        this.toastService.success(
          `Đã tải lên "${doc.filename}" và lập chỉ mục ${doc.chunkCount} chunks.`
        );
        this.loadDocuments();
      },
      error: (err) => {
        this.isUploading.set(false);
        this.toastService.error(
          err?.error?.message || 'Không thể tải lên hoặc lập chỉ mục tài liệu.'
        );
      },
    });
  }

  confirmDelete(): void {
    const doc = this.docToDelete();
    if (!doc) return;
    this.isDeleting.set(true);
    this.documentService.deleteDocument(doc.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.toastService.success(`Đã xóa tài liệu "${doc.filename}".`);
        this.docToDelete.set(null);
        this.loadDocuments();
      },
      error: () => {
        this.isDeleting.set(false);
        this.toastService.error('Xóa tài liệu thất bại.');
      },
    });
  }

  formatFileSize(bytes: number): string {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}
