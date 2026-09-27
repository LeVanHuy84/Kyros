import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { MarkdownViewerComponent } from '@shared/components/markdown/markdown-viewer.component';
import { Note } from '../../models/note.models';
import { NotesService } from '../../services/notes.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-note-detail-view',
  standalone: true,
  imports: [CommonModule, AppIconComponent, MarkdownViewerComponent],
  templateUrl: './note-detail-view.component.html',
  styleUrl: './note-detail-view.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteDetailViewComponent {
  readonly note = input<Note | null>(null);

  readonly editRequested = output<Note>();

  readonly notesService = inject(NotesService);
  readonly languageService = inject(LanguageService);

  readonly isCopied = signal<boolean>(false);

  readonly isPinned = computed<boolean>(() => {
    const current = this.note();
    if (!current) return false;
    return this.notesService.isPinned(current.id);
  });

  onEdit(): void {
    const current = this.note();
    if (current) {
      this.editRequested.emit(current);
    }
  }

  onTogglePin(): void {
    const current = this.note();
    if (current) {
      this.notesService.togglePinNote(current.id);
    }
  }

  onCopy(): void {
    const current = this.note();
    if (current?.content && navigator.clipboard) {
      navigator.clipboard.writeText(current.content).then(() => {
        this.isCopied.set(true);
        setTimeout(() => this.isCopied.set(false), 2000);
      });
    }
  }

  onDelete(): void {
    const current = this.note();
    if (!current) return;
    const confirmMsg = this.languageService.t().notes.actions.deleteConfirm;
    if (confirm(confirmMsg)) {
      this.notesService.deleteNote(current.id).subscribe();
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
