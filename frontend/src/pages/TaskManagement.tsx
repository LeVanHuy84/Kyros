import React, { useState } from 'react';
import { ListTodo, Trash2, RotateCcw } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isSoftDeleted: boolean;
}

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Implement Workspace JWT Filter', priority: 'HIGH', isSoftDeleted: false },
    { id: 2, title: 'Configure Flyway multi-tenant migrations', priority: 'MEDIUM', isSoftDeleted: false },
    { id: 3, title: 'Setup Redis token deny-list check', priority: 'HIGH', isSoftDeleted: false }
  ]);

  const handleSoftDelete = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isSoftDeleted: true } : t));
  };

  const handleRecover = (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isSoftDeleted: false } : t));
  };

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
          <ListTodo size={20} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Soft Delete Lifecycle</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
          Deleted tasks are marked as pending deletion. They can be fully recovered from the local trash within a 
          2-hour window before becoming hidden from the workspace.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              padding: '16px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-app)',
              opacity: task.isSoftDeleted ? 0.6 : 1,
              transition: 'opacity var(--transition-normal)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ 
                  fontWeight: '500', 
                  fontSize: '14px', 
                  color: 'var(--text-main)',
                  textDecoration: task.isSoftDeleted ? 'line-through' : 'none'
                }}>
                  Task #{task.id}: {task.title}
                </span>
                <span style={{ 
                  fontSize: '11px', 
                  color: task.priority === 'HIGH' ? 'var(--color-danger)' : 'var(--color-warning)', 
                  fontWeight: '600' 
                }}>
                  PRIORITY: {task.priority}
                </span>
              </div>
              
              {task.isSoftDeleted ? (
                <button 
                  aria-label={`Recover Task #${task.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'transparent',
                    color: 'var(--color-success)',
                    border: '1px solid var(--color-success)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  onClick={() => handleRecover(task.id)}
                >
                  <RotateCcw size={14} aria-hidden="true" />
                  <span>Recover Task</span>
                </button>
              ) : (
                <button 
                  aria-label={`Soft delete Task #${task.id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'transparent',
                    color: 'var(--color-danger)',
                    border: '1px solid var(--color-danger)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    transition: 'background-color var(--transition-fast)'
                  }}
                  onClick={() => handleSoftDelete(task.id)}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  <span>Soft Delete</span>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskManagement;
