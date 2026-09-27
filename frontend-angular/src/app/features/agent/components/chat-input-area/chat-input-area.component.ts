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
import { SlashCommandPickerComponent, SlashCommand } from '../slash-command-picker/slash-command-picker.component';
import { SlashHelpModalComponent } from '../slash-help-modal/slash-help-modal.component';
import { Note } from '@features/notes/models/note.models';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-chat-input-area',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppIconComponent,
    NoteMentionPickerComponent,
    SlashCommandPickerComponent,
    SlashHelpModalComponent,
  ],
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
  @ViewChild(SlashCommandPickerComponent) slashPickerComponent?: SlashCommandPickerComponent;

  readonly inputText = signal<string>('');
  readonly isPickerOpen = signal<boolean>(false);
  readonly isSlashPickerOpen = signal<boolean>(false);
  readonly isHelpModalOpen = signal<boolean>(false);
  readonly slashQuery = signal<string>('');
  readonly showSuggestions = signal<boolean>(false);

  handleKeyDown(event: KeyboardEvent): void {
    // If slash picker is open, handle navigation keys
    if (this.isSlashPickerOpen()) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.slashPickerComponent?.selectNext();
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        this.slashPickerComponent?.selectPrevious();
        return;
      }
      if (event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey)) {
        event.preventDefault();
        const selected = this.slashPickerComponent?.getSelected();
        if (selected) {
          this.onSlashCommandSelected(selected);
        } else {
          this.isSlashPickerOpen.set(false);
          this.submitMessage();
        }
        return;
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        this.isSlashPickerOpen.set(false);
        return;
      }
    }

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

  toggleSlashPicker(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.isSlashPickerOpen.update((v) => !v);
    if (this.isSlashPickerOpen()) {
      this.slashQuery.set(this.inputText());
    }
  }

  onSlashCommandSelected(cmd: SlashCommand): void {
    if (cmd.name === '/help') {
      this.isSlashPickerOpen.set(false);
      this.isHelpModalOpen.set(true);
      this.inputText.set('');
      this.resetTextareaHeight();
      return;
    }

    this.inputText.set(cmd.name + ' ');
    this.isSlashPickerOpen.set(false);
    setTimeout(() => {
      const el = this.textareaRef?.nativeElement;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }, 50);
  }

  onTryCommandFromModal(cmd: SlashCommand): void {
    this.isHelpModalOpen.set(false);
    this.inputText.set(cmd.name + ' ');
    setTimeout(() => {
      const el = this.textareaRef?.nativeElement;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    }, 50);
  }

  submitMessage(): void {
    if (this.disabled() || this.isThinking()) return;
    const text = this.inputText().trim();
    if (!text) return;

    // Check if user submitted /help command directly
    const lower = text.toLowerCase();
    if (lower === '/help' || lower === '/?' || lower === '/commands') {
      this.isHelpModalOpen.set(true);
      this.inputText.set('');
      this.isSlashPickerOpen.set(false);
      this.resetTextareaHeight();
      return;
    }

    this.sendMessage.emit(text);
    this.inputText.set('');
    this.isSlashPickerOpen.set(false);
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
    const text = this.inputText();
    // Auto trigger slash command popup when typing /
    if (text.startsWith('/') && !text.includes(' ') && text.length <= 12) {
      this.slashQuery.set(text);
      this.isSlashPickerOpen.set(true);
    } else if (this.isSlashPickerOpen() && (text.indexOf(' ') > 0 || !text.startsWith('/'))) {
      this.isSlashPickerOpen.set(false);
    }

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
