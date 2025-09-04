# Setup Instructions for Your CRM

Congratulations on building your CRM! To connect it with Facebook Ads and Google Ads, you need to provide some secret credentials. This guide will walk you through it.

## How It Works

Your application uses Supabase Edge Functions to securely connect to the ad platforms. These functions read their credentials from the "Secrets" section of your Supabase project settings. You should **never** put your real secrets directly into the code or the `.env.local` file.

The `.env.local` file in this project contains placeholder values. You need to replace them with real secrets in your Supabase project dashboard.

## Step 1: Set Supabase Secrets

1.  Go to your project on [Supabase.io](https://supabase.io).
2.  Navigate to **Project Settings** > **Secrets**.
3.  Add the following secrets. You will get the values for these in the next steps.

    *   `FACEBOOK_APP_ID`: Your Facebook App ID.
    *   `FACEBOOK_APP_SECRET`: Your Facebook App Secret.
    *   `GOOGLE_ID`: Your Google Client ID.
    *   `GOOGLE_SECRET`: Your Google Client Secret.
    *   `SUPABASE_JWT_SECRET`: A long, random, and secret string (at least 32 characters). You can generate one from a password generator.

## Step 2: Get Facebook Ads Credentials

1.  **Create a Facebook App:**
    *   Go to [Facebook for Developers](https://developers.facebook.com/) and create a new App.
    *   Choose "Business" as the app type.
    *   In your App's dashboard, go to **App Settings** > **Basic**. Here you will find your `App ID` and `App Secret`. Copy these and add them to your Supabase secrets.

2.  **Configure OAuth:**
    *   In the App Dashboard, find the "Facebook Login for Business" product and add it.
    *   Go to its **Settings**.
    *   Under "Valid OAuth Redirect URIs", you **must** add the following URL:
        ```
        https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/facebook-oauth
        ```
        (Replace `<YOUR_SUPABASE_PROJECT_ID>` with your actual project ID from Supabase).

3.  **Configure your Ad Account ID:**
    *   After you connect your Facebook account on the "Integrations" page, you need to tell the application which Ad Account to use.
    *   Go to your project on [Supabase.io](https://supabase.io).
    *   Navigate to the **Table Editor** and open the `user_credentials` table.
    *   Find the row for your user and the `facebook` provider.
    *   In the `provider_specific_id` column, you need to enter your Facebook Ad Account ID.
    *   To find your Ad Account ID, go to your [Facebook Ads Manager](https://www.facebook.com/adsmanager/). In the URL, you will see `act=...`. Your ID is the number that follows, like `act_123456789`. You must enter the full `act_...` string.

## Step 3: Get Google Ads Credentials

1.  **Create a Google Cloud Project:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project.
    *   In the navigation menu, go to **APIs & Services** > **Enabled APIs & services**.
    *   Click **+ ENABLE APIS AND SERVICES** and search for "Google Ads API". Enable it.

2.  **Create OAuth Credentials:**
    *   Go to **APIs & Services** > **Credentials**.
    *   Click **+ CREATE CREDENTIALS** and choose "OAuth client ID".
    *   Select "Web application" as the application type.
    *   Under "Authorized redirect URIs", you **must** add the following URL:
        ```
        https://<YOUR_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/google-oauth
        ```
    *   Click "Create". You will be shown your `Client ID` and `Client Secret`. Copy these and add them to your Supabase secrets.

## Step 4: You're Ready!

Once you have set all the secrets in your Supabase project, you can deploy your application and everything should work. When you go to the "Integrations" page, you can now connect your accounts. The dashboard will then show the live data.
