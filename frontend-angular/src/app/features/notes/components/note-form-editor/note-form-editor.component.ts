import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { MarkdownViewerComponent } from '@shared/components/markdown/markdown-viewer.component';
import { Note } from '../../models/note.models';
import { NotesService } from '../../services/notes.service';
import { LanguageService } from '@core/services/language.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

export type EditorViewMode = 'split' | 'edit' | 'preview';

@Component({
  selector: 'app-note-form-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, MarkdownViewerComponent],
  templateUrl: './note-form-editor.component.html',
  styleUrl: './note-form-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoteFormEditorComponent {
  readonly initialNote = input<Note | null>(null);
  readonly isNew = input<boolean>(false);

  readonly saved = output<Note>();
  readonly cancelled = output<void>();

  readonly notesService = inject(NotesService);
  readonly languageService = inject(LanguageService);

  @ViewChild('contentTextarea') textareaRef?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('previewPane') previewPaneRef?: ElementRef<HTMLDivElement>;

  private isSyncingFromEditor = false;
  private isSyncingFromPreview = false;

  readonly title = signal<string>('');
  readonly content = signal<string>('');
  readonly viewMode = signal<EditorViewMode>('split');
  readonly autoSaveStatus = signal<'saved' | 'saving' | 'idle'>('idle');

  // Track the ID of the note currently loaded into the editor to prevent overwriting user input
  private loadedNoteId: string | null = null;
  private isInitialLoaded = false;

  private readonly contentChange$ = new Subject<{ title: string; content: string }>();

  readonly wordCount = computed<number>(() => {
    const text = this.content().trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(Boolean).length;
  });

  readonly charCount = computed<number>(() => {
    return this.content().length;
  });

  readonly readTime = computed<number>(() => {
    const words = this.wordCount();
    return Math.max(1, Math.ceil(words / 200));
  });

  constructor() {
    // Only synchronize initial note when a completely new/different note is opened
    effect(
      () => {
        const note = this.initialNote();
        const isCreating = this.isNew();

        if (isCreating) {
          if (!this.isInitialLoaded || this.loadedNoteId !== '__NEW__') {
            this.title.set('');
            this.content.set('');
            this.loadedNoteId = '__NEW__';
            this.isInitialLoaded = true;
          }
        } else if (note) {
          // Only populate if it's the first load OR switching to a different note ID
          if (this.loadedNoteId !== note.id) {
            this.title.set(note.title || '');
            this.content.set(note.content || '');
            this.loadedNoteId = note.id;
            this.isInitialLoaded = true;
          }
        }
      },
      { allowSignalWrites: true }
    );

    // Auto-save debounce stream: Saves in the background WITHOUT kicking user out of editor
    this.contentChange$
      .pipe(
        debounceTime(800),
        distinctUntilChanged((prev, curr) => prev.title === curr.title && prev.content === curr.content)
      )
      .subscribe((data) => {
        const currentNote = untracked(() => this.initialNote());
        const isNewNote = untracked(() => this.isNew());

        if (currentNote && currentNote.id && !isNewNote) {
          if (data.title.trim() || data.content.trim()) {
            this.autoSaveStatus.set('saving');
            this.notesService
              .updateNote(currentNote.id, {
                title: data.title.trim() || 'Untitled Note',
                content: data.content,
                taskId: currentNote.taskId,
                eventId: currentNote.eventId,
              })
              .subscribe({
                next: () => {
                  this.autoSaveStatus.set('saved');
                  setTimeout(() => {
                    if (this.autoSaveStatus() === 'saved') {
                      this.autoSaveStatus.set('idle');
                    }
                  }, 2500);
                },
                error: () => {
                  this.autoSaveStatus.set('idle');
                },
              });
          }
        }
      });
  }

  onTitleInput(val: string): void {
    this.title.set(val);
    this.triggerAutoSave();
  }

  onContentInput(val: string): void {
    this.content.set(val);
    this.triggerAutoSave();
  }

  onEditorScroll(event: Event): void {
    if (this.viewMode() !== 'split' || this.isSyncingFromPreview) return;

    const textarea = this.textareaRef?.nativeElement;
    const preview = this.previewPaneRef?.nativeElement;
    if (!textarea || !preview) return;

    const editorScrollable = textarea.scrollHeight - textarea.clientHeight;
    if (editorScrollable > 0) {
      this.isSyncingFromEditor = true;
      const percentage = textarea.scrollTop / editorScrollable;
      const previewScrollable = preview.scrollHeight - preview.clientHeight;
      preview.scrollTop = percentage * previewScrollable;
      requestAnimationFrame(() => {
        this.isSyncingFromEditor = false;
      });
    }
  }

  onPreviewScroll(event: Event): void {
    if (this.viewMode() !== 'split' || this.isSyncingFromEditor) return;

    const textarea = this.textareaRef?.nativeElement;
    const preview = this.previewPaneRef?.nativeElement;
    if (!textarea || !preview) return;

    const previewScrollable = preview.scrollHeight - preview.clientHeight;
    if (previewScrollable > 0) {
      this.isSyncingFromPreview = true;
      const percentage = preview.scrollTop / previewScrollable;
      const editorScrollable = textarea.scrollHeight - textarea.clientHeight;
      textarea.scrollTop = percentage * editorScrollable;
      requestAnimationFrame(() => {
        this.isSyncingFromPreview = false;
      });
    }
  }

  private triggerAutoSave(): void {
    if (!this.isNew() && this.initialNote()) {
      this.contentChange$.next({ title: this.title(), content: this.content() });
    }
  }

  setViewMode(mode: EditorViewMode): void {
    this.viewMode.set(mode);
  }

  @HostListener('keydown', ['$event'])
  handleKeyboardShortcuts(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      this.saveManual();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      this.insertFormatting('**', '**', 'bold text');
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'i') {
      event.preventDefault();
      this.insertFormatting('*', '*', 'italic text');
    }
  }

  insertFormatting(prefix: string, suffix: string = '', placeholder: string = ''): void {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = this.content();

    const selectedText = currentVal.substring(start, end) || placeholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const updated = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    this.content.set(updated);
    this.triggerAutoSave();

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selectedText.length
      );
    }, 0);
  }

  insertHeading(level: 1 | 2 | 3): void {
    const prefix = '#'.repeat(level) + ' ';
    this.insertLinePrefix(prefix);
  }

  insertLinePrefix(prefix: string): void {
    const textarea = this.textareaRef?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const currentVal = this.content();

    const lineStart = currentVal.lastIndexOf('\n', start - 1) + 1;
    const updated = currentVal.substring(0, lineStart) + prefix + currentVal.substring(lineStart);
    this.content.set(updated);
    this.triggerAutoSave();

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  }

  insertTable(): void {
    const tableTemplate = `\n| Cột 1 | Cột 2 | Cột 3 |\n| :--- | :--- | :--- |\n| Nội dung 1 | Nội dung 2 | Nội dung 3 |\n| Dòng 2 | Dòng 2 | Dòng 2 |\n\n`;
    this.insertFormatting(tableTemplate, '', '');
  }

  insertCodeBlock(): void {
    const codeTemplate = `\n\`\`\`typescript\n// Code snippet\nconst message = "Hello Kyros";\n\`\`\`\n`;
    this.insertFormatting(codeTemplate, '', '');
  }

  insertChecklist(): void {
    this.insertLinePrefix('- [ ] ');
  }

  insertLink(): void {
    this.insertFormatting('[', '](https://example.com)', 'Link title');
  }

  insertQuote(): void {
    this.insertLinePrefix('> ');
  }

  insertDivider(): void {
    this.insertFormatting('\n---\n\n', '', '');
  }

  saveManual(): void {
    const titleVal = this.title().trim() || 'Untitled Note';
    const contentVal = this.content();

    if (this.isNew()) {
      this.notesService
        .createNote({
          title: titleVal,
          content: contentVal,
        })
        .subscribe((newNote) => {
          this.saved.emit(newNote);
        });
    } else if (this.initialNote()) {
      this.notesService
        .updateNote(this.initialNote()!.id, {
          title: titleVal,
          content: contentVal,
          taskId: this.initialNote()?.taskId,
          eventId: this.initialNote()?.eventId,
        })
        .subscribe((updated) => {
          this.saved.emit(updated);
        });
    }
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
