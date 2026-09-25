import { Routes } from '@angular/router';
import { AppLayoutComponent } from '@core/layout/app-layout/app-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'agent',
        pathMatch: 'full',
      },
      {
        path: 'agent',
        loadComponent: () =>
          import('@features/agent/pages/agent-placeholder.component').then(
            (m) => m.AgentPlaceholderComponent
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
          import('@features/agent/pages/agent-placeholder.component').then(
            (m) => m.AgentPlaceholderComponent
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];
