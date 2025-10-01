-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert the development test users directly into auth.users
-- Note: This is for development only - normally users would sign up 
-- Using pre-hashed password to avoid gen_salt issues
-- Password: Ameinc4100

-- Delete existing test users if they exist
DELETE FROM auth.users WHERE email IN ('tech@ame-inc.com', 'admin@ame-inc.com');

-- First, let's create the users with the email confirmation bypassed
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'tech@ame-inc.com',
    '$2a$10$PkZE92ENdOj8XkLYYWqqZ.1yZqY8pUVjhdGwdVsYwjP7OoGGQ7xYu',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated', 
    'admin@ame-inc.com',
    '$2a$10$PkZE92ENdOj8XkLYYWqqZ.1yZqY8pUVjhdGwdVsYwjP7OoGGQ7xYu',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
