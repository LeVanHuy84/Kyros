import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { usePreferences } from '../../hooks/usePreferences';
import { useTheme } from '../../hooks/useTheme';

interface PreferencesPanelProps {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Ho_Chi_Minh',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Australia/Sydney',
];

export const PreferencesPanel: React.FC<PreferencesPanelProps> = ({
  onSuccess,
  onError,
}) => {
  const { theme, setTheme } = useTheme();
  const {
    pref,
    isLoading,
    isSaving,
    error,
    savePreferences,
    resetPreferences,
  } = usePreferences();

  const [timezone, setTimezone] = useState<string>('UTC');
  const [defaultPriority, setDefaultPriority] = useState<
    'High' | 'Medium' | 'Low'
  >('Medium');
  const [preventCalendarOverlap, setPreventCalendarOverlap] =
    useState<boolean>(false);
  const [leadTimeMinutes, setLeadTimeMinutes] = useState<number>(15);

  useEffect(() => {
    if (pref) {
      setTimezone(pref.timezone);
      setDefaultPriority(pref.defaultPriority);
      setPreventCalendarOverlap(pref.preventCalendarOverlap);
      setLeadTimeMinutes(pref.leadTimeMinutes);
    }
  }, [pref]);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error, onError]);

  const handleSave = async () => {
    const success = await savePreferences({
      timezone,
      defaultPriority,
      preventCalendarOverlap,
      leadTimeMinutes,
    });
    if (success) {
      onSuccess('Preferences updated successfully.');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset preferences to default values?')) {
      const success = await resetPreferences();
      if (success) {
        onSuccess('Preferences reset to default values.');
      }
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        position: 'relative',
      }}
    >
      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <Loader2
            className="animate-spin"
            size={24}
            style={{ color: 'var(--color-primary)' }}
          />
        </div>
      )}

      <div>
        <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          User Preferences
        </h4>
        <p
          style={{
            fontSize: '15px',
            color: 'var(--text-muted)',
            margin: '4px 0 0 0',
            lineHeight: '1.6',
          }}
        >
          Adjust interface parameters, toggle dark/light theme, or select
          default coordinator triggers.
        </p>
      </div>

      {/* Theme Settings */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          maxWidth: '350px',
        }}
      >
        <label
          htmlFor="theme-select"
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--text-muted)',
          }}
        >
          Interface Theme Mode
        </label>
        <select
          id="theme-select"
          value={theme}
          onChange={(e) => setTheme(e.target.value as any)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-app)',
            color: 'var(--text-main)',
            outline: 'none',
            fontSize: '15px',
          }}
        >
          <option value="system">Follow System</option>
          <option value="light">Light Theme</option>
          <option value="dark">Dark Theme</option>
        </select>
      </div>

      <hr
        style={{ border: 'none', borderTop: '1px solid var(--border-color)' }}
      />

      {/* Backend Preferences Form */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxWidth: '500px',
        }}
      >
        {/* Timezone */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            htmlFor="timezone-select"
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-muted)',
            }}
          >
            Preferred Timezone (IANA)
          </label>
          <select
            id="timezone-select"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              outline: 'none',
              fontSize: '15px',
            }}
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        {/* Default Priority */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-muted)',
            }}
          >
            Default Task Priority
          </span>
          <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
            {['Low', 'Medium', 'High'].map((pri) => (
              <label
                key={pri}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                }}
              >
                <input
                  type="radio"
                  name="priority"
                  value={pri}
                  checked={defaultPriority === pri}
                  onChange={() => setDefaultPriority(pri as any)}
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span>{pri}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Prevent Overlaps Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '4px',
          }}
        >
          <input
            type="checkbox"
            id="prevent-overlap"
            checked={preventCalendarOverlap}
            onChange={(e) => setPreventCalendarOverlap(e.target.checked)}
            style={{
              width: '18px',
              height: '18px',
              accentColor: 'var(--color-primary)',
              cursor: 'pointer',
            }}
          />
          <label
            htmlFor="prevent-overlap"
            style={{ fontSize: '15px', fontWeight: '500', cursor: 'pointer' }}
          >
            Prevent Calendar Event Overlaps
          </label>
        </div>

        {/* Lead Time */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label
            htmlFor="lead-time"
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: 'var(--text-muted)',
            }}
          >
            Default Reminder Lead Time (Minutes)
          </label>
          <input
            type="number"
            id="lead-time"
            min="1"
            max="10080"
            value={leadTimeMinutes}
            onChange={(e) =>
              setLeadTimeMinutes(Math.max(1, parseInt(e.target.value) || 1))
            }
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-app)',
              color: 'var(--text-main)',
              outline: 'none',
              fontSize: '15px',
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isSaving && <Loader2 className="animate-spin" size={16} />}
            <span>Save Settings</span>
          </button>
          <button
            onClick={handleReset}
            disabled={isSaving}
            style={{
              padding: '12px 24px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'transparent',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <RefreshCw size={16} />
            <span>Reset to Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
