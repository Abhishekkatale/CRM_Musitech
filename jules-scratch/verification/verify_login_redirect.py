from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Listen for console events and print them
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    try:
        # Navigate to the login page
        page.goto("http://localhost:3000/auth")

        # Fill in the email and password
        page.get_by_label("Email").fill("admin@musitech.com")
        page.get_by_label("Password").fill("admin")

        # Click the sign-in button
        page.get_by_role("button", name="Sign In").click()

        # Wait for the redirection to the admin dashboard and verify the URL
        expect(page).to_have_url("http://localhost:3000/admin", timeout=10000)

        # Take a screenshot of the admin dashboard
        page.screenshot(path="jules-scratch/verification/verification.png")

        print("Verification successful: Redirected to admin dashboard.")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)