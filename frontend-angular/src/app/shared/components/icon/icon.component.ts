import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AppIconName =
  | 'sparkles'
  | 'check'
  | 'check-circle'
  | 'check-square'
  | 'calendar'
  | 'file-text'
  | 'brain'
  | 'settings'
  | 'sun'
  | 'moon'
  | 'bell'
  | 'menu'
  | 'building'
  | 'user'
  | 'bot'
  | 'x'
  | 'x-circle'
  | 'alert-triangle'
  | 'info'
  | 'search'
  | 'plus'
  | 'trash'
  | 'clock'
  | 'play'
  | 'pause'
  | 'square'
  | 'rotate-ccw'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'send'
  | 'mic'
  | 'lock'
  | 'shield-check'
  | 'zap'
  | 'mail'
  | 'mail-check'
  | 'eye'
  | 'eye-off'
  | 'loader'
  | 'log-out'
  | 'message-square'
  | 'refresh-cw';

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppIconComponent {
  name = input.required<AppIconName>();
  size = input<number>(18);
  strokeWidth = input<number>(1.85);
  color = input<string | null>(null);
  customClass = input<string>('');
}
