# Ubiquitous Language — Auth Bounded Context

This document defines the core business terms and concepts within the **Auth Bounded Context** (IAM/Authentication) of the AI Executive Assistant. Standardizing these terms ensures clear communication between business analysts, domain experts, developers, and the AI Agent.

---

## Glossary of Terms

### 1. User Identity
- **Definition**: The central security record representing a registered user account in the system.
- **Synonyms**: Account, Identity, User.
- **Context-Specific Meaning**: Identified by a system-wide unique `UserId`. Contains credentials, credentials policy validation metadata, and global access roles.

### 2. Credentials
- **Definition**: The security parameters used to prove a User Identity during login.
- **Synonyms**: Authentication Data, Login Details.
- **Context-Specific Meaning**: Standard credentials consist of a unique email address and a securely salted password hash.

### 3. Credential Policy
- **Definition**: The set of security rules governing password strength.
- **Synonyms**: Password Complexity Policy.
- **Context-Specific Meaning**: Requires passwords to be at least 8 characters long, containing at least one uppercase letter, one lowercase letter, one number, and one special character.

### 4. Session
- **Definition**: The period of authorized interaction for a successfully authenticated user.
- **Synonyms**: Authentication Session.
- **Context-Specific Meaning**: Token-based. Authenticated users are issued a JWT that represents their active session.

### 5. JSON Web Token (JWT)
- **Definition**: A cryptographically signed token containing user identity and workspace claims.
- **Synonyms**: Auth Token, Access Token.
- **Context-Specific Meaning**: Handled by the presentation gateway. Decoded to verify access before forwarding requests to the application layer.

### 6. JWT Session Signature
- **Definition**: The cryptographic signature applied to the JWT by the Auth context using a private key.
- **Synonyms**: Token Signature.
- **Context-Specific Meaning**: Used by all contexts to verify that the token has not been tampered with.

### 7. Global Role
- **Definition**: System-wide authorization claims assigned to a User Identity.
- **Synonyms**: IAM Role, Access Role.
- **Context-Specific Meaning**: Basic roles are **End User** and **System Operator** (platform-level manager). These are distinct from Workspace Roles.

### 8. Session Invalidation
- **Definition**: The process of terminating an active session immediately, rendering subsequent API calls unauthorized.
- **Synonyms**: Logout, Session Revocation.
- **Context-Specific Meaning**: Invalidates the active session signature (typically via token blacklisting or deleting refresh tokens).
