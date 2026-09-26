import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesService } from '@features/notes/services/notes.service';
import { Note } from '@features/notes/models/note.models';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-note-mention-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  templateUrl: './note-mention-picker.component.html',
  styleUrl: './note-mention-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteMentionPickerComponent implements OnInit {
  private readonly notesService = inject(NotesService);
  private readonly elementRef = inject(ElementRef);
  readonly languageService = inject(LanguageService);

  readonly searchQuery = signal<string>('');
  readonly notes = this.notesService.notes;
  readonly isLoading = this.notesService.isLoading;

  noteSelected = output<Note>();
  closePicker = output<void>();

  readonly filteredNotes = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.notes();
    return this.notes().filter(
      (n) => n.title.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)
    );
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closePicker.emit();
    }
  }

  ngOnInit(): void {
    this.notesService.fetchNotes().subscribe();
  }

  selectNote(note: Note): void {
    this.noteSelected.emit(note);
    this.closePicker.emit();
  }
}
