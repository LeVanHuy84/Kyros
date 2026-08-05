import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const TenantSelector: React.FC = () => {
  const { workspaces, activeWorkspace, selectWorkspace, createWorkspace } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    selectWorkspace(id);
    setIsOpen(false);
  };

  const handleCreate = async () => {
    const wsName = prompt('Enter new workspace name:');
    if (wsName && wsName.trim()) {
      await createWorkspace(wsName.trim());
      setIsOpen(false);
    }
  };

  if (!activeWorkspace) return null;

  return (
    <div className="workspace-selector-container" ref={containerRef}>
      <button 
        className="workspace-selector-trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span>{activeWorkspace.name}</span>
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }} />
      </button>

      {isOpen && (
        <div className="workspace-dropdown" role="listbox">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              role="option"
              aria-selected={activeWorkspace.id === ws.id}
              className={`workspace-option ${activeWorkspace.id === ws.id ? 'active' : ''}`}
              onClick={() => handleSelect(ws.id)}
            >
              <span>{ws.name}</span>
              <span className={`workspace-status-dot ${ws.status === 'SUSPENDED' ? 'suspended' : ''}`} />
            </button>
          ))}
          <div className="workspace-create-divider" />
          <button className="workspace-create-btn" onClick={handleCreate}>
            <Plus size={14} />
            <span>Create Workspace</span>
          </button>
        </div>
      )}
    </div>
  );
};
