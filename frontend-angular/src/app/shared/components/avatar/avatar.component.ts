import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  name = input<string>('User');
  imageUrl = input<string | null>(null);
  size = input<number>(36);
  isAgent = input<boolean>(false);
  online = input<boolean>(false);

  protected hasImageError = false;

  readonly initials = computed(() => {
    if (this.isAgent()) return 'AI';
    const n = this.name().trim();
    if (!n) return 'U';
    const parts = n.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.substring(0, 2).toUpperCase();
  });

  protected onImageError(): void {
    this.hasImageError = true;
  }
}
