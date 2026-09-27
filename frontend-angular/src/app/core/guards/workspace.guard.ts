import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { map, of } from 'rxjs';
import { WorkspaceService } from '../workspace/services/workspace.service';

/**
 * Guard ensuring that an active workspace is selected or fetched before entering functional screens.
 */
export const workspaceGuard: CanActivateFn = () => {
  const workspaceService = inject(WorkspaceService);

  if (workspaceService.activeWorkspaceId()) {
    if (workspaceService.workspaces().length === 0) {
      workspaceService.fetchWorkspaces().subscribe();
    }
    return true;
  }

  return workspaceService.fetchWorkspaces().pipe(
    map((workspaces) => {
      return (workspaces && workspaces.length > 0) || true;
    })
  );
};
