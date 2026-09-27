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
  {
    path: 'auth/forgot-password',
    loadComponent: () =>
      import(
        '@features/auth/pages/forgot-password/forgot-password.component'
      ).then((m) => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import(
        '@features/auth/pages/forgot-password/forgot-password.component'
      ).then((m) => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'auth/reset-password',
    loadComponent: () =>
      import(
        '@features/auth/pages/reset-password/reset-password.component'
      ).then((m) => m.ResetPasswordComponent),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import(
        '@features/auth/pages/reset-password/reset-password.component'
      ).then((m) => m.ResetPasswordComponent),
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
          import('@features/tasks/pages/tasks-page/tasks-page.component').then(
            (m) => m.TasksPageComponent
          ),
      },
      {
        path: 'calendar',
        loadComponent: () =>
          import(
            '@features/calendar/pages/calendar-page/calendar-page.component'
          ).then((m) => m.CalendarPageComponent),
      },
      {
        path: 'notes',
        loadComponent: () =>
          import(
            '@features/notes/pages/notes-management.component'
          ).then((m) => m.NotesManagementComponent),
      },
      {
        path: 'memory',
        loadComponent: () =>
          import(
            '@features/memory/pages/memory-page.component'
          ).then((m) => m.MemoryPageComponent),
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
