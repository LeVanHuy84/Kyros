# Low-Fidelity Wireframes — Auth Bounded Context

## 1. Screen Catalog

The Auth Bounded Context is responsible for identity and session management, password management, and administrator user account management.

- **Screen 1**: User Login Screen (Public)
- **Screen 2**: User Registration Screen (Public)
- **Screen 3**: Change Password Screen (Self-Service, Authenticated)
- **Screen 4**: User Administration Dashboard (System Operator only)

---

## 2. Navigation

- **Guest Navigation**: Guest users are restricted to **User Login** and **User Registration** screens, which link bidirectionally (cross-linking in the form container).
- **User Self-Service Navigation**: Authenticated users can access the **Change Password** screen via a dropdown menu under their profile section in the main app header.
- **Admin Navigation**: Users holding the `SYSTEM_OPERATOR` global role can navigate to the **User Administration Dashboard** via the "Admin Console > Users" item in the global sidebar navigation.

---

## 3. Wireframes

### Screen 1: User Login Screen
- **Purpose**: Authenticate guests into the platform and generate user sessions.
- **Main Components**:
  - Email text input field.
  - Password text input field.
  - Submit button ("Sign In").
  - Form status alert panel (for validation/lockout errors).
  - Link to registration screen ("Create an Account").
- **User Actions**:
  - Enter credentials.
  - Trigger validation / login check.
  - Navigate to registration.
- **API Used**:
  - `POST /api/v1/auth/login`
- **Use Cases Triggered**:
  - `UC-AUTH-002: Authenticate User & Generate Token (Login)`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
|                                                             |
|                    AI Executive Assistant                   |
|                                                             |
|                +---------------------------+                |
|                |          Sign In          |                |
|                +---------------------------+                |
|                | [ ERROR / LOCKOUT ALERT ] |                |
|                |                           |                |
|                | Email:                    |                |
|                | [                         ]                |
|                |                           |                |
|                | Password:                 |                |
|                | [                         ]                |
|                |                           |                |
|                |      +-------------+      |                |
|                |      |   Sign In   |      |                |
|                |      +-------------+      |                |
|                |                           |                |
|                | New here? Create Account  |                |
|                +---------------------------+                |
|                                                             |
+-------------------------------------------------------------+
```

---

### Screen 2: User Registration Screen
- **Purpose**: Allow new users to create accounts and provision workspaces.
- **Main Components**:
  - Email text input field.
  - Password text input field.
  - Password complexity indicator checklist (8+ chars, A-Z, a-z, 0-9, special).
  - Submit button ("Register").
  - Link to login screen ("Back to Sign In").
- **User Actions**:
  - Enter new email and password.
  - Trigger registration.
  - Navigate back to login.
- **API Used**:
  - `POST /api/v1/auth/register`
- **Use Cases Triggered**:
  - `UC-AUTH-001: Register New User` (which calls workspace provisioning)

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
|                                                             |
|                    AI Executive Assistant                   |
|                                                             |
|                +---------------------------+                |
|                |          Register         |                |
|                +---------------------------+                |
|                | Email:                    |                |
|                | [                         ]                |
|                |                           |                |
|                | Password:                 |                |
|                | [                         ]                |
|                |                           |                |
|                | * Password Requirements:  |                |
|                |  [x] 8+ Chars  [ ] A-Z    |                |
|                |  [ ] a-z       [ ] Symbol |                |
|                |                           |                |
|                |      +-------------+      |                |
|                |      |  Register   |      |                |
|                |      +-------------+      |                |
|                |                           |                |
|                | Already registered? Login |                |
|                +---------------------------+                |
|                                                             |
+-------------------------------------------------------------+
```

---

### Screen 3: Change Password Screen
- **Purpose**: Authenticated users update their passwords for security.
- **Main Components**:
  - Current Password input.
  - New Password input.
  - Confirm New Password input.
  - Status messages (success, validation failure).
  - Action buttons: "Save Changes", "Cancel".
- **User Actions**:
  - Enter current password.
  - Enter and confirm new password.
  - Submit form.
- **API Used**:
  - `PUT /api/v1/auth/password`
- **Use Cases Triggered**:
  - `UC-AUTH-003: Change Password`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: AI Assistant               [Profile Icon: Dropdown] |
|-------------------------------------------------------------|
|                                                             |
|                     Change Your Password                    |
|                                                             |
|             +----------------------------------+            |
|             | Current Password:                |            |
|             | [                              ] |            |
|             |                                  |            |
|             | New Password:                    |            |
|             | [                              ] |            |
|             |                                  |            |
|             | Confirm New Password:            |            |
|             | [                              ] |            |
|             |                                  |            |
|             |   +---------------+  +--------+  |            |
|             |   | Save Changes  |  | Cancel |  |            |
|             |   +---------------+  +--------+  |            |
|             +----------------------------------+            |
|                                                             |
+-------------------------------------------------------------+
```

---

### Screen 4: User Administration Dashboard
- **Purpose**: Admin dashboard for operators to manage user access and credentials.
- **Main Components**:
  - Search bar (by email).
  - Paginated user directory table showing ID, email, status (Active, Locked, Suspended), failedLoginCount, and global roles.
  - Selection drawer / details panel with user management actions:
    - Suspend / Reactivate button.
    - Unlock account button.
    - Role management panel (Assign / Revoke role options).
- **User Actions**:
  - Search/filter users.
  - Lockout resolution (unlock).
  - Modify user status (suspend/reactivate).
  - Assign or revoke role tags.
- **API Used**:
  - `GET /api/v1/admin/users`
  - `GET /api/v1/admin/users/{userId}`
  - `POST /api/v1/admin/users/{userId}/suspend`
  - `POST /api/v1/admin/users/{userId}/reactivate`
  - `POST /api/v1/admin/users/{userId}/unlock`
  - `POST /api/v1/admin/users/{userId}/roles`
  - `DELETE /api/v1/admin/users/{userId}/roles/{role}`
- **Use Cases Triggered**:
  - `UC-AUTH-004: Unlock Account`
  - `UC-AUTH-006: Suspend User Account`
  - `UC-AUTH-007: Reactivate Suspended Account`
  - `UC-AUTH-008: Assign / Revoke Global Role`
  - `UC-AUTH-009: Load Identity for Administration`

#### ASCII Wireframe:
```
+-------------------------------------------------------------+
| Header: Admin Console | Users                    [Operator] |
|-------------------------------------------------------------|
| [ Search email... ]                                         |
|-------------------------------------------------------------|
| Email Address         | Status     | Fail Count | Roles     |
|-----------------------+------------+------------+-----------|
| john@example.com      | ACTIVE     | 0          | END_USER  |
| locked.user@test.com  | LOCKED     | 5          | END_USER  |
| spam.account@test.com | SUSPENDED  | 2          | END_USER  |
| admin@platform.com    | ACTIVE     | 0          | OPERATOR  |
|-----------------------+------------+------------+-----------|
| [Prev] Page 1 of 5 [Next]                                   |
|=============================================================|
| User Details Panel: locked.user@test.com                    |
| Status: LOCKED (5 failed attempts)                          |
| Actions:  +--------------+  +--------------+  +----------+  |
|           | Unlock Acct  |  | Suspend Acct |  | Add Role |  |
|           +--------------+  +--------------+  +----------+  |
+-------------------------------------------------------------+
```

---

## 4. User Flows

### 1. User Self-Registration Flow
1. User navigates to Guest Signup page.
2. User enters valid, unique email address.
3. User inputs complex password (e.g. `Str0ng!P@ssw0rd`). UI checks complexity criteria in real-time.
4. User clicks "Register".
5. App shows loading indicator, then triggers workspace provisioning.
6. Upon success, screen redirects to the login view with a success alert.

### 2. Login Lockout Loop
1. User enters wrong password 5 consecutive times on Login page.
2. On the 5th attempt, the API throws `AccountLockedException` (Code `AUTH-003`).
3. Login form changes state to disabled, displays a critical lockout banner instruction: "Account locked. Please contact a system administrator to unlock your login access."

---

## 5. Screen ↔ API Mapping

| Screen | User Action | API Endpoint | Application Use Case |
| :--- | :--- | :--- | :--- |
| **Login Screen** | Input email & password, click Sign In | `POST /api/v1/auth/login` | `UC-AUTH-002: Authenticate User` |
| **Registration Screen** | Input email & password, click Register | `POST /api/v1/auth/register` | `UC-AUTH-001: Register New User` |
| **Change Password** | Input old & new passwords, click Save | `PUT /api/v1/auth/password` | `UC-AUTH-003: Change Password` |
| **User Admin Dashboard**| Browse & search users | `GET /api/v1/admin/users` | `UC-AUTH-009: Load Identity` |
| **User Admin Dashboard**| Click Unlock Account | `POST /api/v1/admin/users/{userId}/unlock` | `UC-AUTH-004: Unlock Account` |
| **User Admin Dashboard**| Click Suspend Account | `POST /api/v1/admin/users/{userId}/suspend` | `UC-AUTH-006: Suspend Account` |
| **User Admin Dashboard**| Click Reactivate Account | `POST /api/v1/admin/users/{userId}/reactivate` | `UC-AUTH-007: Reactivate Account` |
| **User Admin Dashboard**| Assign or revoke user role tag | `POST / DELETE /api/v1/admin/users/{userId}/roles` | `UC-AUTH-008: Assign/Revoke Role` |

---

## 6. Screen ↔ Context Mapping

- **Auth Bounded Context** owns all 4 screens described above.
- Downstream contexts (Workspace, Memory, Todo, Calendar, Notification, Connector) consume the resulting user identity payload (`UserId`, `WorkspaceId`, `roles`) propagated via the gateway security interceptor, but they do not own or manage these screens.
- Registration (`UC-AUTH-001`) invokes the Workspace context synchronously via the `WorkspaceProvisioningPort` to initialize the data boundary.

---

## 7. Accessibility & Mobile Responsiveness

### Accessibility Considerations
1. **Interactive Elements & Forms**:
   - Every input field (Email, Passwords) must have a corresponding, programmatically linked `<label>` element.
   - For password strength checklists, use `aria-live="polite"` to dynamically announce requirements met/failed to screen readers.
2. **Error & Lockout Alerts**:
   - Status messages and lockout banners must hold `role="alert"` (or `aria-live="assertive"`) to ensure immediate announcement on login failure.
3. **Keyboard Navigation**:
   - Focus indicators must be prominent. All buttons and links must be focusable and triggerable via spacebar/Enter.

### Mobile Responsiveness Notes
1. **Responsive Forms Layout**: On viewports <= 600px, registration and login forms stack vertically, spanning 100% of the screen width with standard side-padding.
2. **Grid / Table Reflow**: The User Administration table collapses into card-based layouts, hiding secondary elements like `failedLoginCount` by default but expanding details on card tap.
3. **Touch Targets**: All interactive elements (e.g. submit buttons, unlock button in admin) must maintain a minimum clickable area of 48x48px.

