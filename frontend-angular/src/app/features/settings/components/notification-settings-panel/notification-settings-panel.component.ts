import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppIconComponent } from '@shared/components/icon/icon.component';
import { LanguageService } from '@core/services/language.service';
import { NotificationProfileService } from '../../services/notification-profile.service';
import {
  NotificationChannel,
  NotificationProfile,
  UrgencyLevel,
} from '../../models/settings.models';

export const URGENCY_LEVELS: UrgencyLevel[] = [
  'Critical',
  'Urgent',
  'Normal',
  'Low',
];

export const CHANNELS: { id: NotificationChannel; labelKey: string }[] = [
  { id: 'InApp', labelKey: 'inAppChannel' },
  { id: 'Email', labelKey: 'emailChannel' },
  { id: 'Slack', labelKey: 'slackChannel' },
];

@Component({
  selector: 'app-notification-settings-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, AppIconComponent],
  templateUrl: './notification-settings-panel.component.html',
  styleUrl: './notification-settings-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationSettingsPanelComponent implements OnInit {
  readonly languageService = inject(LanguageService);
  readonly profileService = inject(NotificationProfileService);

  readonly urgencyLevels = URGENCY_LEVELS;
  readonly channels = CHANNELS;

  readonly emailAddress = signal<string>('');
  readonly slackWebhookRef = signal<string>('');
  readonly consentPolicy = signal<'ENABLED' | 'DISABLED'>('DISABLED');
  readonly digestSchedule = signal<string>('0 8 * * *');

  readonly channelRoutingMap = signal<Record<UrgencyLevel, NotificationChannel[]>>({
    Critical: ['InApp', 'Email', 'Slack'],
    Urgent: ['InApp', 'Email'],
    Normal: ['InApp'],
    Low: ['InApp'],
  });

  readonly feedbackMessage = signal<{ type: 'success' | 'error'; text: string } | null>(null);

  ngOnInit(): void {
    this.profileService.fetchProfile().subscribe((profile) => {
      this.syncFromProfile(profile);
    });
  }

  private syncFromProfile(profile: NotificationProfile): void {
    this.emailAddress.set(profile.emailAddress || '');
    this.slackWebhookRef.set(profile.slackWebhookRef || '');
    this.consentPolicy.set(profile.consentPolicy || 'DISABLED');
    this.digestSchedule.set(profile.digestSchedule || '0 8 * * *');
    if (profile.channelRoutingMap) {
      this.channelRoutingMap.set(profile.channelRoutingMap);
    }
  }

  isChannelChecked(urgency: UrgencyLevel, channel: NotificationChannel): boolean {
    const list = this.channelRoutingMap()[urgency] || [];
    return list.includes(channel);
  }

  isChannelDisabled(urgency: UrgencyLevel, channel: NotificationChannel): boolean {
    // Constraint: Slack is restricted to Critical and Urgent only
    return channel === 'Slack' && urgency !== 'Critical' && urgency !== 'Urgent';
  }

  toggleChannel(urgency: UrgencyLevel, channel: NotificationChannel): void {
    if (this.isChannelDisabled(urgency, channel)) return;

    const currentMap = { ...this.channelRoutingMap() };
    const currentList = currentMap[urgency] || [];
    const updatedList = currentList.includes(channel)
      ? currentList.filter((c) => c !== channel)
      : [...currentList, channel];

    currentMap[urgency] = updatedList;
    this.channelRoutingMap.set(currentMap);
  }

  getChannelLabel(channelId: NotificationChannel): string {
    const t = this.languageService.t().settings.notifications;
    if (channelId === 'InApp') return t.inAppChannel;
    if (channelId === 'Email') return t.emailChannel;
    if (channelId === 'Slack') return t.slackChannel;
    return channelId;
  }

  handleSave(): void {
    const payload: NotificationProfile = {
      emailAddress: this.emailAddress(),
      slackWebhookRef: this.slackWebhookRef(),
      consentPolicy: this.consentPolicy(),
      digestSchedule: this.digestSchedule(),
      channelRoutingMap: this.channelRoutingMap(),
    };

    this.profileService.updateProfile(payload).subscribe((success) => {
      if (success) {
        this.showFeedback('success', this.languageService.t().settings.notifications.savedSuccess);
      } else {
        this.showFeedback('error', 'Cập nhật thất bại. Vui lòng kiểm tra lại!');
      }
    });
  }

  private showFeedback(type: 'success' | 'error', text: string): void {
    this.feedbackMessage.set({ type, text });
    setTimeout(() => {
      if (this.feedbackMessage()?.text === text) {
        this.feedbackMessage.set(null);
      }
    }, 4000);
  }
}
