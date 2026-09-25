import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kyros-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kyros-logo.component.html',
  styleUrl: './kyros-logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KyrosLogoComponent {
  size = input<number>(32);
  showText = input<boolean>(false);

  protected readonly gradBgId = 'logo-bg-' + Math.random().toString(36).substring(2, 7);
  protected readonly gradWarmId = 'logo-warm-' + Math.random().toString(36).substring(2, 7);
  protected readonly gradStemId = 'logo-stem-' + Math.random().toString(36).substring(2, 7);
}
