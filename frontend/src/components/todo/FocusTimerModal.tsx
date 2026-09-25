import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  Square,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import apiClient from '../../services/api-client';
import { useWorkspace } from '../../hooks/useWorkspace';
import type { Task } from '../../hooks/useTasks';

interface FocusTimerModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onTimerComplete?: (task: Task, durationMinutes: number) => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({
  task,
  isOpen,
  onClose,
  onTimerComplete,
}) => {
  const { activeWorkspace } = useWorkspace();
  const [initialMinutes, setInitialMinutes] = useState<number>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [isStopping, setIsStopping] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Initialize timer when a new task is opened
  useEffect(() => {
    if (task) {
      const defaultDuration = task.estimatedDurationMinutes || 25;
      setInitialMinutes(defaultDuration);
      setSecondsLeft(defaultDuration * 60);
      setIsRunning(false);
      setIsMinimized(false);
      setSessionNotes('');
    }
  }, [task]);

  // Countdown effect
  useEffect(() => {
    if (isRunning && secondsLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            handleCompleteTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isRunning, secondsLeft]);

  const handleStart = async () => {
    if (!task || !activeWorkspace) return;
    try {
      await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/tasks/${task.taskId}/timer/start`
      );
    } catch (err) {
      console.warn('Backend timer start failed, continuing offline', err);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleStop = async () => {
    if (!task || !activeWorkspace) return;
    setIsStopping(true);
    try {
      const elapsedMinutes = Math.max(
        1,
        Math.round((initialMinutes * 60 - secondsLeft) / 60)
      );
      await apiClient.post(
        `/v1/workspaces/${activeWorkspace.id}/tasks/${task.taskId}/timer/stop`,
        {
          notes: sessionNotes || 'Tập trung Pomodoro',
        }
      );
      if (onTimerComplete) {
        onTimerComplete(task, elapsedMinutes);
      }
    } catch (err) {
      console.warn('Backend timer stop failed', err);
    } finally {
      setIsStopping(false);
      setIsRunning(false);
      onClose();
    }
  };

  const handleCompleteTimer = async () => {
    setIsRunning(false);
    // Play subtle audio alert if possible
    try {
      const audioCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // Audio not permitted or available
    }

    if (task && activeWorkspace) {
      try {
        await apiClient.post(
          `/v1/workspaces/${activeWorkspace.id}/tasks/${task.taskId}/timer/stop`,
          {
            notes: `Hoàn thành chu kỳ Pomodoro (${initialMinutes} phút)`,
          }
        );
        if (onTimerComplete) {
          onTimerComplete(task, initialMinutes);
        }
      } catch (e) {
        console.warn('Failed to record completed timer log', e);
      }
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  const progressPct =
    initialMinutes * 60 > 0
      ? ((initialMinutes * 60 - secondsLeft) / (initialMinutes * 60)) * 100
      : 0;

  if (!isOpen || !task) return null;

  // Floating Mini Timer when minimized
  if (isMinimized) {
    return (
      <div
        className="fade-in-slide-up"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 1000,
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          padding: '10px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: isRunning ? '#10b981' : '#f59e0b',
            animation: isRunning ? 'pulse 1.5s infinite' : 'none',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '11px',
              color: 'var(--text-muted)',
              maxWidth: '140px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {task.title}
          </span>
          <span
            style={{
              fontSize: '15px',
              fontWeight: '700',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--text-main)',
            }}
          >
            {formatTime(secondsLeft)}
          </span>
        </div>

        <button
          onClick={() => (isRunning ? handlePause() : handleStart())}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
        </button>

        <button
          onClick={() => setIsMinimized(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Mở rộng"
        >
          <Maximize2 size={15} />
        </button>
      </div>
    );
  }

  // Full Screen / Modal Dialog
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={() => setIsMinimized(true)}
    >
      <div
        className="card fade-in-slide-up"
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg, 16px)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(236, 72, 153, 0.05) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Timer size={18} style={{ color: 'var(--color-primary)' }} />
            <span
              style={{
                fontSize: '15px',
                fontWeight: '700',
                color: 'var(--text-main)',
              }}
            >
              Pomodoro Focus Session
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setIsMinimized(true)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
              }}
              title="Thu nhỏ thành thanh nổi"
            >
              <Minimize2 size={16} />
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span
              className={`badge ${
                task.priority === 'High'
                  ? 'badge-high'
                  : task.priority === 'Medium'
                    ? 'badge-medium'
                    : 'badge-low'
              }`}
              style={{ marginBottom: '8px', display: 'inline-block' }}
            >
              {task.priority} Priority
            </span>
            <h3
              style={{
                margin: '4px 0 0 0',
                fontSize: '18px',
                fontWeight: '700',
                color: 'var(--text-main)',
              }}
            >
              {task.title}
            </h3>
          </div>

          {/* Big Circular / Rounded Countdown Display */}
          <div
            style={{
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              border: '6px solid var(--bg-app)',
              borderColor: isRunning
                ? 'var(--color-primary)'
                : 'var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isRunning
                ? '0 0 25px rgba(99, 102, 241, 0.25)'
                : 'none',
              transition: 'all 0.3s ease',
              backgroundColor: 'var(--bg-app)',
            }}
          >
            <span
              style={{
                fontSize: '44px',
                fontWeight: '800',
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--text-main)',
                letterSpacing: '1px',
              }}
            >
              {formatTime(secondsLeft)}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: isRunning ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: 600,
                marginTop: '4px',
                textTransform: 'uppercase',
              }}
            >
              {isRunning
                ? 'Đang tập trung'
                : secondsLeft === 0
                  ? 'Hoàn thành!'
                  : 'Sẵn sàng'}
            </span>
          </div>

          {/* Progress Bar */}
          <div
            style={{
              width: '200px',
              height: '6px',
              backgroundColor: 'var(--bg-app)',
              borderRadius: '3px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                width: `${progressPct}%`,
                height: '100%',
                backgroundColor: 'var(--color-primary)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>

          {/* Quick Preset Buttons (if not running) */}
          {!isRunning && (
            <div style={{ display: 'flex', gap: '8px' }}>
              {[15, 25, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setInitialMinutes(mins);
                    setSecondsLeft(mins * 60);
                  }}
                  style={{
                    backgroundColor:
                      initialMinutes === mins
                        ? 'var(--color-primary)'
                        : 'var(--bg-app)',
                    color:
                      initialMinutes === mins ? '#fff' : 'var(--text-muted)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {mins}m
                </button>
              ))}
            </div>
          )}

          {/* Notes input */}
          <div style={{ width: '100%' }}>
            <input
              type="text"
              placeholder="Ghi chú phiên làm việc (tùy chọn)..."
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-app)',
                color: 'var(--text-main)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
          </div>

          {/* Controls */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              width: '100%',
              justifyContent: 'center',
            }}
          >
            {!isRunning ? (
              <button
                className="btn btn-primary"
                onClick={handleStart}
                style={{
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 600,
                  gap: '8px',
                  flex: 1,
                }}
              >
                <Play size={16} />
                <span>Bắt đầu Focus</span>
              </button>
            ) : (
              <button
                className="btn btn-secondary"
                onClick={handlePause}
                style={{
                  padding: '12px 28px',
                  fontSize: '14px',
                  fontWeight: 600,
                  gap: '8px',
                  flex: 1,
                }}
              >
                <Pause size={16} />
                <span>Tạm dừng</span>
              </button>
            )}

            <button
              className="btn btn-danger"
              onClick={handleStop}
              disabled={isStopping}
              style={{
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: 600,
                gap: '8px',
              }}
              title="Kết thúc và lưu lại thời gian"
            >
              <Square size={15} />
              <span>Dừng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
