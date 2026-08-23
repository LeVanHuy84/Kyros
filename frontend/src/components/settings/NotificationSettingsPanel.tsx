import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, AlertCircle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type {
  UrgencyLevel,
  NotificationChannel,
  NotificationProfile,
} from '../../types/notification';

interface NotificationSettingsPanelProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const URGENCY_LEVELS: UrgencyLevel[] = ['Critical', 'Urgent', 'Normal', 'Low'];
const CHANNELS: NotificationChannel[] = ['InApp', 'Email', 'Slack'];

export const NotificationSettingsPanel: React.FC<
  NotificationSettingsPanelProps
> = ({ onSuccess, onError }) => {
  const { profile, isLoading, isSaving, fetchProfile, updateProfile } =
    useNotifications();

  // Local state for profile edits
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [slackWebhookRef, setSlackWebhookRef] = useState<string>('');
  const [consentPolicy, setConsentPolicy] = useState<'ENABLED' | 'DISABLED'>(
    'DISABLED'
  );
  const [digestSchedule, setDigestSchedule] = useState<string>('0 8 * * *'); // Default 8:00 AM daily
  const [channelRoutingMap, setChannelRoutingMap] = useState<
    Record<UrgencyLevel, NotificationChannel[]>
  >({
    Critical: ['InApp'],
    Urgent: ['InApp'],
    Normal: ['InApp'],
    Low: ['InApp'],
  });

  useEffect(() => {
    const loadProfileData = async () => {
      const data = await fetchProfile();
      if (data) {
        setEmailAddress(data.emailAddress || '');
        setSlackWebhookRef(data.slackWebhookRef || '');
        setConsentPolicy(data.consentPolicy || 'DISABLED');
        setDigestSchedule(data.digestSchedule || '0 8 * * *');
        if (data.channelRoutingMap) {
          setChannelRoutingMap(data.channelRoutingMap);
        }
      }
    };
    loadProfileData();
  }, [fetchProfile]);

  const handleCheckboxChange = (
    urgency: UrgencyLevel,
    channel: NotificationChannel
  ) => {
    // Constraint: Slack channel is locked to Critical and Urgent only
    if (channel === 'Slack' && urgency !== 'Critical' && urgency !== 'Urgent') {
      return; // Ignore check
    }

    setChannelRoutingMap((prev) => {
      const currentList = prev[urgency] || [];
      const updatedList = currentList.includes(channel)
        ? currentList.filter((c) => c !== channel)
        : [...currentList, channel];
      return { ...prev, [urgency]: updatedList };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile({
      emailAddress,
      slackWebhookRef,
      consentPolicy,
      digestSchedule,
      channelRoutingMap,
    });

    if (success) {
      onSuccess('Notification profile updated successfully');
    } else {
      onError('Failed to update notification profile');
    }
  };

  return (
    <form
      onSubmit={handleSave}
      style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
    >
      {/* 1. Alert Routing Preferences Table Matrix */}
      <div>
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-main)',
          }}
        >
          Alert Routing Preferences
        </h3>
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            color: 'var(--text-muted)',
          }}
        >
          Choose which delivery channels are active for each level of alert
          urgency.
        </p>

        {/* Responsive Table wrapper */}
        <div
          style={{
            overflowX: 'auto',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '14px',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--bg-app)',
                  borderBottom: '1px solid var(--border-color)',
                }}
              >
                <th style={{ padding: '16px', fontWeight: '600' }}>
                  Urgency Level
                </th>
                <th style={{ padding: '16px', fontWeight: '600' }}>
                  In-App Feed
                </th>
                <th style={{ padding: '16px', fontWeight: '600' }}>
                  Email Notification
                </th>
                <th style={{ padding: '16px', fontWeight: '600' }}>
                  Slack Webhook
                </th>
              </tr>
            </thead>
            <tbody>
              {URGENCY_LEVELS.map((urgency) => (
                <tr
                  key={urgency}
                  style={{ borderBottom: '1px solid var(--border-color)' }}
                >
                  <td
                    style={{
                      padding: '16px',
                      fontWeight: '600',
                      color: 'var(--text-main)',
                    }}
                  >
                    {urgency}
                  </td>
                  {CHANNELS.map((channel) => {
                    const isSlackDisabled =
                      channel === 'Slack' &&
                      urgency !== 'Critical' &&
                      urgency !== 'Urgent';
                    const isChecked = (
                      channelRoutingMap[urgency] || []
                    ).includes(channel);

                    return (
                      <td key={channel} style={{ padding: '16px' }}>
                        <label
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: isSlackDisabled ? 'not-allowed' : 'pointer',
                            opacity: isSlackDisabled ? 0.4 : 1,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isSlackDisabled}
                            onChange={() =>
                              handleCheckboxChange(urgency, channel)
                            }
                            style={{
                              width: '16px',
                              height: '16px',
                              accentColor: 'var(--color-primary)',
                              cursor: isSlackDisabled
                                ? 'not-allowed'
                                : 'pointer',
                            }}
                          />
                          <span
                            style={{
                              fontSize: '13px',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {channel === 'InApp' ? 'In-App' : channel}
                          </span>
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '6px',
            alignItems: 'center',
            marginTop: '8px',
            color: 'var(--text-muted)',
            fontSize: '12px',
          }}
        >
          <AlertCircle size={14} />
          <span>
            Note: Slack notifications are locked to Critical and Urgent alerts
            only to reduce noise.
          </span>
        </div>
      </div>

      {/* 2. Destination Credentials */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3
          style={{
            margin: '0',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-main)',
          }}
        >
          Delivery Coordinates
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Email Address */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-main)',
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="user@example.com"
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Slack Webhook */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-main)',
              }}
            >
              Slack Webhook Reference
            </label>
            <input
              type="text"
              value={slackWebhookRef}
              onChange={(e) => setSlackWebhookRef(e.target.value)}
              placeholder="https://hooks.slack.com/services/... or vault reference"
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '14px',
              }}
            />
          </div>
        </div>
      </div>

      {/* 3. Email Digest Preferences */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3
          style={{
            margin: '0',
            fontSize: '16px',
            fontWeight: '600',
            color: 'var(--text-main)',
          }}
        >
          Periodic Email Digests
        </h3>

        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--bg-app)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={consentPolicy === 'ENABLED'}
              onChange={(e) =>
                setConsentPolicy(e.target.checked ? 'ENABLED' : 'DISABLED')
              }
              style={{
                width: '16px',
                height: '16px',
                accentColor: 'var(--color-primary)',
              }}
            />
            <span
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: 'var(--text-main)',
              }}
            >
              Enable periodic email summaries of unread notifications
            </span>
          </label>

          {consentPolicy === 'ENABLED' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                maxWidth: '300px',
              }}
            >
              <label
                style={{
                  fontSize: '13px',
                  fontWeight: '500',
                  color: 'var(--text-muted)',
                }}
              >
                Frequency Interval
              </label>
              <select
                value={digestSchedule}
                onChange={(e) => setDigestSchedule(e.target.value)}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                <option value="0 8 * * *">Daily (at 08:00 AM)</option>
                <option value="0 8 * * 1">Weekly (Monday at 08:00 AM)</option>
                <option value="0 */12 * * *">Every 12 Hours</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="submit"
          disabled={isSaving || isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            transition: 'background-color 0.2s',
          }}
        >
          {isSaving ? (
            <>
              <RefreshCw className="animate-spin" size={16} />
              Saving Preferences...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </form>
  );
};
