-- Create a table to store user credentials for third-party services
CREATE TABLE public.user_credentials (
    id bigserial PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider text NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamptz,
    provider_specific_id text, -- To store things like Facebook Ad Account ID
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE (user_id, provider)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows users to see and manage their own credentials
CREATE POLICY "Allow users to manage their own credentials"
ON public.user_credentials
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
