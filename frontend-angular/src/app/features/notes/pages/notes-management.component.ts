import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { NoteListPanelComponent } from '../components/note-list-panel/note-list-panel.component';
import { NoteDetailViewComponent } from '../components/note-detail-view/note-detail-view.component';
import { NoteFormEditorComponent } from '../components/note-form-editor/note-form-editor.component';
import { NotesService } from '../services/notes.service';
import { Note } from '../models/note.models';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-notes-management',
  standalone: true,
  imports: [
    CommonModule,
    AppIconComponent,
    NoteListPanelComponent,
    NoteDetailViewComponent,
    NoteFormEditorComponent,
  ],
  templateUrl: './notes-management.component.html',
  styleUrl: './notes-management.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotesManagementComponent implements OnInit {
  readonly notesService = inject(NotesService);
  readonly languageService = inject(LanguageService);

  readonly isEditing = signal<boolean>(false);
  readonly isSidebarOpen = signal<boolean>(true);

  ngOnInit(): void {
    this.notesService.fetchNotes().subscribe();
  }

  toggleSidebar(): void {
    this.isSidebarOpen.update((v) => !v);
  }

  onEditRequested(note: Note): void {
    this.isEditing.set(true);
  }

  onNoteSaved(note: Note): void {
    this.isEditing.set(false);
  }

  onEditorCancelled(): void {
    this.isEditing.set(false);
    if (this.notesService.isCreatingNew()) {
      this.notesService.cancelCreatingNew();
    }
  }
}
