import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { WorkspaceService } from '../workspace/services/workspace.service';

export const workspaceInterceptor: HttpInterceptorFn = (req, next) => {
  const workspaceService = inject(WorkspaceService);
  const activeWorkspaceId = workspaceService.activeWorkspaceId();

  // If request already has X-Workspace-Id or has no active workspace, proceed
  if (!activeWorkspaceId || req.headers.has('X-Workspace-Id')) {
    return next(req);
  }

  // Attach X-Workspace-Id
  const modifiedReq = req.clone({
    setHeaders: {
      'X-Workspace-Id': activeWorkspaceId,
    },
  });

  return next(modifiedReq);
};
