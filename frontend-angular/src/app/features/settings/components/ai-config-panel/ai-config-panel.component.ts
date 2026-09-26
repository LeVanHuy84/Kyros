import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiSettingsService } from '../../services/ai-settings.service';
import { AiConfig } from '../../models/settings.models';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { ToastService } from '@shared/components/toast/toast.service';
import { LanguageService } from '@core/services/language.service';

@Component({
  selector: 'app-ai-config-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  templateUrl: './ai-config-panel.component.html',
  styleUrl: './ai-config-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiConfigPanelComponent implements OnInit {
  readonly aiSettingsService = inject(AiSettingsService);
  private readonly toastService = inject(ToastService);
  readonly languageService = inject(LanguageService);

  configSaved = output<AiConfig>();

  readonly showApiKey = signal<boolean>(false);
  readonly apiKeyInput = signal<string>('');
  readonly isEditingKey = signal<boolean>(false);
  readonly selectedProvider = signal<string>('gemini');

  readonly provider = signal<string>('GEMINI');
  readonly baseUrl = signal<string>('https://generativelanguage.googleapis.com');
  readonly model = signal<string>('gemini-1.5-pro');
  readonly temperature = signal<number>(0.7);

  readonly categories = computed(() => {
    const map: Record<string, { key: string; preset: any }[]> = {};
    for (const [key, preset] of Object.entries(this.aiSettingsService.presets)) {
      const cat = preset.category || 'Other';
      if (!map[cat]) map[cat] = [];
      map[cat].push({ key, preset });
    }
    return Object.entries(map).map(([category, items]) => ({ category, items }));
  });

  readonly currentPreset = computed(
    () => this.aiSettingsService.presets[this.selectedProvider()]
  );

  ngOnInit(): void {
    this.aiSettingsService.fetchConfig().subscribe((cfg) => {
      if (cfg) {
        this.provider.set(cfg.provider || 'GEMINI');
        this.baseUrl.set(cfg.baseUrl || 'https://generativelanguage.googleapis.com');
        this.model.set(cfg.model || 'gemini-2.0-flash');
        this.temperature.set(cfg.temperature ?? 0.7);

        // Find preset key
        const matchKey = Object.keys(this.aiSettingsService.presets).find(
          (k) => this.aiSettingsService.presets[k].provider === cfg.provider
        );
        if (matchKey) {
          this.selectedProvider.set(matchKey);
        }
      }
    });
  }

  onPresetChange(presetKey: string): void {
    this.selectedProvider.set(presetKey);
    const preset = this.aiSettingsService.presets[presetKey];
    if (preset) {
      this.provider.set(preset.provider);
      this.baseUrl.set(preset.baseUrl);
      this.model.set(preset.model);
    }
  }

  selectModel(modelName: string): void {
    this.model.set(modelName);
  }

  toggleKeyEdit(): void {
    this.isEditingKey.set(true);
    this.apiKeyInput.set('');
  }

  handleSave(): void {
    const isEditing = this.isEditingKey();
    const hasKey = this.aiSettingsService.config().hasSavedKey;
    const rawKey = this.apiKeyInput().trim();

    const payload: Partial<AiConfig> = {
      provider: this.provider(),
      baseUrl: this.baseUrl(),
      model: this.model(),
      temperature: this.temperature(),
      apiKey: isEditing || !hasKey ? rawKey : '',
    };

    this.aiSettingsService.saveConfig(payload).subscribe({
      next: (saved) => {
        this.isEditingKey.set(false);
        this.apiKeyInput.set('');
        this.toastService.success(
          'Đã lưu cấu hình AI Provider vào Backend AES-256 Vault thành công!',
          'Đã lưu'
        );
        this.configSaved.emit(saved);
      },
      error: (err) => {
        const msg = err?.error?.detail || 'Lỗi khi lưu cấu hình AI Provider.';
        this.toastService.error(msg, 'Lỗi');
      },
    });
  }
}
