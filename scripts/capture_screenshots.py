import os
import time
import subprocess
from pathlib import Path
from playwright.sync_api import sync_playwright

def main():
    screenshots_dir = Path("outputs/screenshots")
    screenshots_dir.mkdir(parents=True, exist_ok=True)

    # Launch server as subprocess if not already running
    server_process = subprocess.Popen(
        ["node", "server.mjs"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env={**os.environ, "PORT": "3000"}
    )
    time.sleep(2) # Give server time to bind port

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(viewport={"width": 1520, "height": 960})
            page = context.new_page()

            page.goto("http://localhost:3000", wait_until="networkidle")
            page.wait_for_timeout(1000)

            # 0. Capture initial hero & value cards
            page.screenshot(path=str(screenshots_dir / "00-landing-state.png"))
            print("Captured: 00-landing-state.png")

            # Scroll to workspace
            page.evaluate("() => document.getElementById('main-workspace').scrollIntoView({ behavior: 'instant', block: 'start' })")
            page.wait_for_timeout(600)

            # 1. Trigger Feedback Analysis
            page.click("#btn-analyze-feedback")
            page.wait_for_selector(".suggestion-item", timeout=5000)
            page.wait_for_timeout(4500) # Wait for toast to fade
            page.screenshot(path=str(screenshots_dir / "01-feedback-analysis.png"))
            print("Captured: 01-feedback-analysis.png")

            # 2. Trigger Pre-Send Gate Check for Julian Vance (Smoker -> BLOCK)
            page.select_option("#candidate-select", "cand_julian")
            page.wait_for_timeout(400)
            page.click("#btn-run-gate-check")
            page.wait_for_selector(".decision-result-box.status-block", timeout=5000)
            page.wait_for_timeout(4500) # Wait for toast to fade
            page.screenshot(path=str(screenshots_dir / "02-conflict-blocked.png"))
            print("Captured: 02-conflict-blocked.png")

            # 3. Trigger Pre-Send Gate Check for Alexander Wright (CLEAR)
            page.select_option("#candidate-select", "cand_alexander")
            page.wait_for_timeout(400)
            page.click("#btn-run-gate-check")
            page.wait_for_selector(".decision-result-box.status-clear", timeout=5000)
            page.wait_for_timeout(4500)
            page.screenshot(path=str(screenshots_dir / "03-gate-cleared.png"))
            print("Captured: 03-gate-cleared.png")

            # 4. Open Override Dialog for Julian
            page.select_option("#candidate-select", "cand_julian")
            page.click("#btn-run-gate-check")
            page.wait_for_selector("#btn-open-override")
            page.click("#btn-open-override")
            page.wait_for_selector("#override-dialog[open]")
            page.fill("#override-rationale", "Elena explicitly confirmed in follow-up call that occasional social smoking is acceptable given Julian's shared architectural background and values.")
            page.wait_for_timeout(500)
            page.screenshot(path=str(screenshots_dir / "04-override-modal.png"))
            print("Captured: 04-override-modal.png")

            browser.close()
    finally:
        server_process.terminate()
        try:
            server_process.wait(timeout=2)
        except Exception:
            server_process.kill()
        print("Server process shut down cleanly.")

if __name__ == "__main__":
    main()
