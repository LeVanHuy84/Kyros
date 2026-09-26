import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { NoteFilterTab, NotesService } from '../../services/notes.service';
import { Note } from '../../models/note.models';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-note-list-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  templateUrl: './note-list-panel.component.html',
  styleUrl: './note-list-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteListPanelComponent {
  readonly collapseRequested = output<void>();

  readonly notesService = inject(NotesService);
  readonly languageService = inject(LanguageService);

  onCollapse(): void {
    this.collapseRequested.emit();
  }

  onSearchChange(value: string): void {
    this.notesService.searchQuery.set(value);
  }

  setFilterTab(tab: NoteFilterTab): void {
    this.notesService.filterTab.set(tab);
  }

  onSelectNote(note: Note): void {
    this.notesService.selectNote(note.id);
  }

  onTogglePin(event: MouseEvent, note: Note): void {
    event.stopPropagation();
    this.notesService.togglePinNote(note.id);
  }

  onDeleteNote(event: MouseEvent, note: Note): void {
    event.stopPropagation();
    const confirmMsg = this.languageService.t().notes.actions.deleteConfirm;
    if (confirm(confirmMsg)) {
      this.notesService.deleteNote(note.id).subscribe();
    }
  }

  onCreateNew(): void {
    this.notesService.startCreatingNew();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  stripMarkdown(content?: string): string {
    if (!content) return '';
    return content
      .replace(/#+\s/g, '')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/`{1,3}.*?`{1,3}/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/>\s/g, '')
      .trim();
  }
}
