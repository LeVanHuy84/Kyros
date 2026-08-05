import React from 'react';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

const ScheduleOverlaps: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{
        backgroundColor: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        padding: '24px',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }} className="interactive-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={20} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Collision Detection</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
          Event overlaps are analyzed based on integer minute intervals. If a newly scheduled event collides 
          with an existing workspace timeline block, the request is intercepted.
        </p>
        
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.06)',
          border: '1px solid rgba(16, 185, 129, 0.15)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          <AlertCircle size={18} style={{ color: 'var(--color-success)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '500' }}>Active Protection</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Overlap prevention is running. Bounded context ensures tenant schedules remain decoupled.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleOverlaps;
