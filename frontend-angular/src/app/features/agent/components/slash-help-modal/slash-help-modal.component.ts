import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';
import { SLASH_COMMANDS, SlashCommand } from '../slash-command-picker/slash-command-picker.component';

@Component({
  selector: 'app-slash-help-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent, AppIconComponent],
  templateUrl: './slash-help-modal.component.html',
  styleUrl: './slash-help-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlashHelpModalComponent {
  readonly languageService = inject(LanguageService);

  isOpen = input.required<boolean>();
  closeModal = output<void>();
  selectCommand = output<SlashCommand>();

  readonly commands = SLASH_COMMANDS;

  onSelect(cmd: SlashCommand): void {
    this.selectCommand.emit(cmd);
    this.closeModal.emit();
  }
}
