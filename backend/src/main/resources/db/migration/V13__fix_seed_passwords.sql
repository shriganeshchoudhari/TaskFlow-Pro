-- V13: Fix invalid BCrypt password hashes introduced in V12.
--
-- Root cause: The hashes in V12 were never valid.
--   - admin hash was 59 chars (BCrypt requires exactly 60)
--   - Neither hash matched its documented plaintext password
--
-- These are freshly generated, verified BCrypt(strength=12) hashes:
--   admin@taskflow.com    → Admin@1234
--   all other seed users  → Test@1234
--
-- Spring Security BCryptPasswordEncoder accepts both $2a$ and $2b$ prefixes.

UPDATE users
SET password = '$2b$12$4YWJh3jWcKGxJLf94wYemegsfCFKemETizIPN.HZ6BtMGZ9PMsWEW'
WHERE email = 'admin@taskflow.com';

UPDATE users
SET password = '$2b$12$06A2z4UFnHR0FKYs8UfFGumWOK764L93KDNUo7MxJt2F2rfC0Dova'
WHERE email IN (
    'manager1@taskflow.com',
    'manager2@taskflow.com',
    'worker1@taskflow.com',
    'worker2@taskflow.com',
    'worker3@taskflow.com',
    'worker4@taskflow.com',
    'worker5@taskflow.com',
    'worker6@taskflow.com',
    'worker7@taskflow.com'
);
