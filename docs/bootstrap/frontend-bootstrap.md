# Project Bootstrap Overview: Frontend (React + Vite)

This document defines the blueprint and architecture design for the frontend project bootstrap phase of the **AI Executive Assistant**. It outlines the technology stack, project structure, Vanilla CSS styling conventions, API integration patterns, state management, and a step-by-step initialization checklist.

---

## 1. Technology Stack

- **Framework**: React 18+ powered by **Vite** (Single Page Application)
- **Language**: TypeScript (Strict Mode enabled)
- **Styling**: Vanilla CSS for maximum flexibility and styling control, utilizing CSS Custom Properties (Variables) for theming, responsive grid layouts, and custom micro-animations.
- **State Management**: Zustand (lightweight, framework-agnostic store) or React Context API.
- **HTTP Client**: Axios with interceptors.
- **Routing**: React Router v6.

---

## 2. Directory Structure

The frontend code resides under the `frontend/` directory at the repository root.

```text
frontend/
├── package.json                              # Project scripts and dependencies
├── tsconfig.json                             # TypeScript compiler configuration
├── vite.config.ts                            # Vite builder configuration
├── index.html                                # Single Page Application HTML entry point
├── Dockerfile                                # Production web server build (Nginx)
├── public/                                   # Static assets (images, icons, fonts)
│   └── favicon.ico
└── src/
    ├── main.tsx                              # Application entry point
    ├── App.tsx                               # Root component with router
    │
    ├── components/                           # Shared UI elements
    │   ├── common/                           # Design system atoms (Button, Input, Card)
    │   ├── layout/                           # Layout components (Sidebar, TopNav, TenantSelector)
    │   └── feedback/                         # Loaders, Toast notifications, Modals
    │
    ├── styles/                               # Core styling layer
    │   ├── variables.css                     # Design tokens (Colors, Typography, Spacing, Shadows)
    │   ├── global.css                        # Reset, global rules, scrollbars
    │   └── animations.css                    # Shared micro-animations and transitions
    │
    ├── hooks/                                # Reusable custom React hooks
    │   ├── useAuth.ts                        # Hook to access user identity and login/logout
    │   ├── useWorkspace.ts                   # Hook to manage active workspace context
    │   └── useFetch.ts                       # Generic API fetch wrapper with loading states
    │
    ├── context/                              # React Context Providers
    │   ├── AuthContext.tsx                   # Auth session state provider
    │   └── WorkspaceContext.tsx              # Tenant workspace state provider
    │
    ├── services/                             # API Integration Client (Adapters)
    │   ├── api-client.ts                     # Axios base client with interceptors
    │   ├── auth-service.ts                   # Login, signup, token rotation
    │   ├── workspace-service.ts              # Workspace management (create, join, list)
    │   ├── todo-service.ts                   # Task CRUD operations
    │   └── calendar-service.ts               # Event CRUD operations & overlaps
    │
    └── utils/                                # Pure helper functions
        ├── date-formatter.ts                 # ISO-8601 UTC timezone utilities
        └── validators.ts                     # Syntax validation helpers
```

---

## 3. Styling Guidelines (Vanilla CSS)

To deliver a premium, high-fidelity experience, styling is structured using standard CSS Variables. This facilitates instant theme swapping and ensures uniform typography, spacing, and animations.

### 3.1 Design Tokens (`src/styles/variables.css`)
```css
:root {
  /* Brand Color Palette - Deep Indigo (#4F46E5) & Cyan (#22D3EE) */
  --color-primary-h: 243;
  --color-primary-s: 75%;
  --color-primary-l: 59%;
  --color-primary: hsl(var(--color-primary-h), var(--color-primary-s), var(--color-primary-l));

  --color-secondary-h: 189;
  --color-secondary-s: 87%;
  --color-secondary-l: 54%;
  --color-secondary: hsl(var(--color-secondary-h), var(--color-secondary-s), var(--color-secondary-l));
  
  --color-success: hsl(142, 70%, 45%);
  --color-warning: hsl(38, 92%, 50%);
  --color-danger: hsl(350, 89%, 60%);

  /* Light Theme Specifics (White Background) */
  --bg-app: hsl(220, 20%, 97%);
  --bg-card: hsl(0, 0%, 100%);
  --bg-sidebar: hsl(222, 47%, 11%); /* Dark Navy sidebar for premium contrast */
  --text-main: hsl(222, 47%, 15%);
  --text-muted: hsl(220, 15%, 45%);
  --border-color: hsl(220, 20%, 90%);
  
  /* Shadows & Radius */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 24px;

  /* Font Styles */
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-size-base: 16px;
  
  /* Transition Speeds */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Dark Theme Overrides (Dark Navy Theme) */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-app: hsl(222, 47%, 6%);     /* Very Deep Navy */
    --bg-card: hsl(222, 47%, 11%);    /* Dark Navy */
    --bg-sidebar: hsl(222, 47%, 4%);  /* Black Navy */
    --text-main: hsl(210, 40%, 98%);
    --text-muted: hsl(215, 20%, 65%);
    --border-color: hsl(222, 30%, 18%);
  }
}
```

### 3.2 Micro-Animations (`src/styles/animations.css`)
Interactions feel physical and fluid using custom transitions and keyframes:
```css
@keyframes slideUpFade {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in-slide-up {
  animation: slideUpFade var(--transition-normal) forwards;
}

.interactive-card {
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}

.interactive-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
```

---

## 4. API Integration & Security

All network calls to the Backend API must pass security credentials (JWT bearer token) and scope requests to the selected workspace tenant.

### 4.1 Client Interceptor Pattern (`src/services/api-client.ts`)
```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Token & Workspace Tenant ID to every outgoing request
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const activeWorkspaceId = localStorage.getItem('active_workspace_id');
    if (activeWorkspaceId) {
      config.headers['X-Workspace-Id'] = activeWorkspaceId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Global Response Interceptor for Error Handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    if (status === 401) {
      // Clear token and redirect to login if session expires
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    } else if (status === 503) {
      // Fail-closed condition if cache database (Redis) is down
      console.error('Service temporarily unavailable. Session check failed.');
    }
    
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
```

---

## 5. Routing & Authentication Guards

The application implements client-side middleware/guards to enforce access control using React Router v6:

- **Public Routes**: `/login`, `/signup` (accessible only to unauthenticated sessions).
- **Private Routes**: `/workspaces`, `/todo`, `/calendar`, `/agent`, `/settings` (require valid JWT).
- **Workspace Verification**: For private routes (except workspace management itself), React Router guards verify that an `active_workspace_id` is present in local storage. If missing, redirect to `/workspaces` for workspace creation or selection.

---

## 6. Step-by-Step Frontend Initialization Checklist

Execute the following steps to initialize the frontend folder:

- [ ] **Step 1: Scaffold Project**
  - Run `npx -y create-vite-app@latest frontend --template react-ts` from the monorepo root.
  - Delete boilerplate assets (`vite.svg`, `src/App.css`, `src/index.css`).
- [ ] **Step 2: Add Core Routing & State Libraries**
  - Install dependencies: `npm install axios react-router-dom lucide-react` (or similar UI icon library).
  - Install devDependencies: `npm install -D @types/react-router-dom`.
- [ ] **Step 3: Setup Design System Styles**
  - Create the folder `src/styles/`.
  - Write `variables.css`, `global.css`, and `animations.css`.
  - Import these styles in `src/main.tsx`.
- [ ] **Step 4: Create Global State Contexts**
  - Build `src/context/AuthContext.tsx` to handle token storage and user context.
  - Build `src/context/WorkspaceContext.tsx` to handle the workspace selector drop-down and syncing selection to storage.
- [ ] **Step 5: Write API Client Interceptor**
  - Create `src/services/api-client.ts` implementing the Axios request and response interceptors.
- [ ] **Step 6: Write Basic Layout & Sidebar**
  - Create the layout skeleton with responsive navigation sidebar.
  - Incorporate a tenant workspace switcher widget in the top header.
- [ ] **Step 7: Configure Development Proxy**
  - Adjust `vite.config.ts` to proxy requests to backend `http://localhost:8080` to prevent CORS issues in local development:
    ```typescript
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';

    export default defineConfig({
      plugins: [react()],
      server: {
        port: 3000,
        proxy: {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: true,
            secure: false,
          },
        },
      },
    });
    ```
- [ ] **Step 8: Define production Dockerfile**
  - Write `frontend/Dockerfile` targeting multi-stage Node build serving compiled files via Nginx Alpine container.
