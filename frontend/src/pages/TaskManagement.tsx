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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div className="card interactive-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ListTodo size={22} style={{ color: 'var(--color-primary)' }} aria-hidden="true" />
          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Soft Delete Lifecycle</h3>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', margin: 0, lineHeight: '1.6' }}>
          Deleted tasks are marked as pending deletion. They can be fully recovered from the local trash within a 
          2-hour window before becoming hidden from the workspace.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
          {tasks.map(task => (
            <div key={task.id} style={{
              padding: '20px 24px',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-app)',
              opacity: task.isSoftDeleted ? 0.6 : 1,
              transition: 'opacity var(--transition-normal), border-color var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ 
                  fontWeight: '600', 
                  fontSize: '16px', 
                  color: 'var(--text-main)',
                  textDecoration: task.isSoftDeleted ? 'line-through' : 'none'
                }}>
                  Task #{task.id}: {task.title}
                </span>
                <span className={`badge ${task.priority === 'HIGH' ? 'badge-high' : task.priority === 'MEDIUM' ? 'badge-medium' : 'badge-low'}`}>
                  {task.priority} Priority
                </span>
              </div>
              
              {task.isSoftDeleted ? (
                <button 
                  aria-label={`Recover Task #${task.id}`}
                  className="btn btn-success"
                  onClick={() => handleRecover(task.id)}
                >
                  <RotateCcw size={15} aria-hidden="true" />
                  <span>Recover Task</span>
                </button>
              ) : (
                <button 
                  aria-label={`Soft delete Task #${task.id}`}
                  className="btn btn-danger"
                  onClick={() => handleSoftDelete(task.id)}
                >
                  <Trash2 size={15} aria-hidden="true" />
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
