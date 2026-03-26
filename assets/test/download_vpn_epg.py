#!/usr/bin/env python3
import json
import time
import os
import subprocess
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

# -------------------------------
# POSTAVKE SELENIUM
# -------------------------------
options = Options()
# options.binary_location = "/usr/bin/chromium"
# options.add_argument("--headless=new")
options.add_argument("--disable-gpu")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--autoplay-policy=no-user-gesture-required")
options.add_argument("--user-data-dir=/home/deni/.config/chrome")
options.add_argument("--profile-directory=Default")
options.set_capability("goog:loggingPrefs", {"performance": "ALL"})

driver = webdriver.Chrome(
    service=Service("/usr/bin/chromedriver"),
    options=options
)

driver.execute_cdp_cmd("Network.enable", {})
# -------------------------------
# PARSER ZA TVPROFIL #! URL
# -------------------------------
def parse_tvprofil_url(url):
    if "#!" not in url:
        return None, None

    fragment = url.split("#!", 1)[1]
    params = {}

    for part in fragment.split("&"):
        if "=" in part:
            k, v = part.split("=", 1)
            params[k] = v

    return params.get("datum"), params.get("kanal")

# -------------------------------
# FUNKCIJA ZA PRONALAZAK EPG LINKA
# -------------------------------
def find_epg_url():
    for entry in driver.get_log("performance"):
        msg = json.loads(entry["message"])["message"]

        if msg.get("method") != "Network.requestWillBeSent":
            continue

        url = msg["params"]["request"].get("url", "")

        if "tvprogram" in url and "callback=" in url:
            return url

    return None

# -------------------------------
# FETCH PREKO BROWSERA
# -------------------------------
def fetch_via_browser(url):
    return driver.execute_async_script("""
        const url = arguments[0];
        const done = arguments[1];

        fetch(url, {
            credentials: "include",
            headers: {
                "Accept": "text/javascript, application/javascript, */*; q=0.01",
                "X-Requested-With": "XMLHttpRequest"
            }
        })
        .then(r => r.text())
        .then(t => done(t))
        .catch(e => done(null));
    """, url)

# -------------------------------
# UČITAJ URL-OVE
# -------------------------------
with open("urls.txt", "r", encoding="utf-8") as f:
    urls = [line.strip() for line in f if line.strip()]

BASE_DIR = "/home/deni/Desktop/epg/bosna/epg"

# -------------------------------
# GLAVNA PETLJA
# -------------------------------
for page_url in urls:
    datum, kanal = parse_tvprofil_url(page_url)

    if not datum or not kanal:
        print(f"⚠️ Preskačem – nečitljiv URL: {page_url}")
        continue

    channel_dir = os.path.join(BASE_DIR, kanal)
    os.makedirs(channel_dir, exist_ok=True)
        # ime fajla: MMDD.js
    filename = datum[5:7] + datum[8:10] + ".js"
    filepath = os.path.join(channel_dir, filename)
    if os.path.exists(filepath):
        print(f"⏭️  Preskačem (već postoji): {kanal} {datum}")
        continue

    # OČISTI CACHE + LOGOVE
    driver.execute_cdp_cmd("Network.clearBrowserCache", {})
    driver.execute_cdp_cmd("Network.clearBrowserCookies", {})
    driver.get_log("performance")

    driver.get(page_url)
    time.sleep(4)
    page_source = driver.page_source
    if "Blocked. You country is not on the list of supported countries" in page_source:
        print("🚫 BLOK DETEKTOVAN")
        driver.quit()
        exit(99)   # poseban exit code za blok
    if "Blocked. There is suspicious activity from your IP address" in page_source:
        print("🚫 BLOK DETEKTOVAN")
        driver.quit()
        exit(99)   # poseban exit code za blok
    if "Blocked. Due to high volume" in page_source:
        print("🚫 BLOK DETEKTOVAN")
        driver.quit()
        exit(99)   # poseban exit code za blok
    epg_url = None
    for _ in range(20):
        epg_url = find_epg_url()
        if epg_url:
            break
        time.sleep(0.5)

    if not epg_url:
        print(f"❌ NEMA EPG-a za {kanal} {datum}")
        continue

    # ime fajla: MMDD.js
    filename = datum[5:7] + datum[8:10] + ".js"
    filepath = os.path.join(channel_dir, filename)

    content = fetch_via_browser(epg_url)

    if not content:
        print(f"❌ FETCH greška: {kanal} {datum}")
        continue

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"✅ Sačuvano:  {kanal} {datum}")

# -------------------------------
# CLEANUP
# -------------------------------
try:
    subprocess.run(["./update.sh"], check=False)
except Exception as e:
    print(f"[CLEANER ERROR] {e}")

driver.quit()

