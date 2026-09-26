import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { NoteMentionPickerComponent } from '../note-mention-picker/note-mention-picker.component';
import { Note } from '@features/notes/models/note.models';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-chat-input-area',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent, NoteMentionPickerComponent],
  templateUrl: './chat-input-area.component.html',
  styleUrl: './chat-input-area.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatInputAreaComponent {
  readonly languageService = inject(LanguageService);

  disabled = input<boolean>(false);
  isThinking = input<boolean>(false);
  selectedNotes = input<Note[]>([]);
  isNewConversation = input<boolean>(false);

  sendMessage = output<string>();
  addNote = output<Note>();
  removeNote = output<string>();

  @ViewChild('textareaRef') textareaRef?: ElementRef<HTMLTextAreaElement>;

  readonly inputText = signal<string>('');
  readonly isPickerOpen = signal<boolean>(false);
  readonly showSuggestions = signal<boolean>(false);

  handleKeyDown(event: KeyboardEvent): void {
    // Keyboard shortcut to toggle suggestions: Ctrl+/ or Cmd+/ or Alt+/
    if ((event.ctrlKey || event.metaKey || event.altKey) && event.key === '/') {
      event.preventDefault();
      this.toggleSuggestions();
      return;
    }

    if (event.key === 'Escape' && this.showSuggestions()) {
      this.showSuggestions.set(false);
      return;
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitMessage();
    }
  }

  toggleSuggestions(event?: Event): void {
    if (event) event.stopPropagation();
    this.showSuggestions.update((v) => !v);
  }

  submitMessage(): void {
    if (this.disabled() || this.isThinking()) return;
    const text = this.inputText().trim();
    if (!text) return;

    this.sendMessage.emit(text);
    this.inputText.set('');
    this.resetTextareaHeight();
  }

  applySuggestion(prompt: string): void {
    if (this.disabled() || this.isThinking()) return;
    this.sendMessage.emit(prompt);
  }

  toggleNotePicker(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isPickerOpen.update((v) => !v);
  }

  onNoteSelected(note: Note): void {
    this.addNote.emit(note);
    this.isPickerOpen.set(false);
  }

  onInput(): void {
    const el = this.textareaRef?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  private resetTextareaHeight(): void {
    const el = this.textareaRef?.nativeElement;
    if (el) {
      el.style.height = 'auto';
    }
  }
}
