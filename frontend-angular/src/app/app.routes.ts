import { Routes } from '@angular/router';
import { AppLayoutComponent } from '@core/layout/app-layout/app-layout.component';
import { authGuard } from '@core/guards/auth.guard';
import { guestGuard } from '@core/guards/guest.guard';
import { workspaceGuard } from '@core/guards/workspace.guard';

export const routes: Routes = [
  // Public / Guest Auth Routes
  {
    path: 'auth/login',
    loadComponent: () =>
      import('@features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'auth/register',
    loadComponent: () =>
      import('@features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
    canActivate: [guestGuard],
  },
  {
    path: 'verify',
    loadComponent: () =>
      import('@features/auth/pages/verify/verify.component').then(
        (m) => m.VerifyComponent
      ),
  },
  {
    path: 'auth/verify',
    loadComponent: () =>
      import('@features/auth/pages/verify/verify.component').then(
        (m) => m.VerifyComponent
      ),
  },

  // Protected App Shell Routes
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard, workspaceGuard],
    children: [
      {
        path: '',
        redirectTo: 'agent',
        pathMatch: 'full',
      },
      {
        path: 'agent',
        loadComponent: () =>
          import('@features/agent/pages/agent-coordinator/agent-coordinator.component').then(
            (m) => m.AgentCoordinatorComponent
          ),
      },
      {
        path: 'tasks',
        loadComponent: () =>
          import('@features/agent/pages/agent-placeholder.component').then(
            (m) => m.AgentPlaceholderComponent
          ),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import('@features/agent/pages/agent-placeholder.component').then(
            (m) => m.AgentPlaceholderComponent
          ),
      },
      {
        path: 'notes',
        loadComponent: () =>
          import('@features/agent/pages/agent-placeholder.component').then(
            (m) => m.AgentPlaceholderComponent
          ),
      },
      {
        path: 'memory',
        loadComponent: () =>
          import('@features/agent/pages/agent-placeholder.component').then(
            (m) => m.AgentPlaceholderComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('@features/settings/pages/settings-page.component').then(
            (m) => m.SettingsPageComponent
          ),
      },
    ],
  },

  // Fallback Wildcard
  {
    path: '**',
    redirectTo: '',
  },
];
