#!/usr/bin/env python3

import os
import glob
import subprocess
import xml.etree.ElementTree as ET
from urllib.parse import urlparse

MEDIA_DIR = "./media"

# napravi media folder ako ne postoji
os.makedirs(MEDIA_DIR, exist_ok=True)

def download_image(url):
    # uzmi ime fajla iz URL-a (bez query stringa)
    parsed = urlparse(url)
    filename = os.path.basename(parsed.path)

    output_path = os.path.join(MEDIA_DIR, filename)

    # ako već postoji – preskoči
    if os.path.exists(output_path):
        print(f"[SKIP] {filename}")
        return output_path

    print(f"[DOWNLOADING] {url}")

    curl_cmd = [
        "curl", url,
        "-H", "User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0",
        "-H", "Accept: image/avif,image/webp,image/png,image/svg+xml,image/*;q=0.8,*/*;q=0.5",
        "-H", "Accept-Language: hr,hr-HR;q=0.5",
        "-H", "Accept-Encoding: gzip, deflate, br, zstd",
        "-H", "Referer: https://mtel.ba/",
        "-H", "DNT: 1",
        "-H", "Connection: keep-alive",
        "-H", "Cookie: ROUTE=.accstorefront-545c4fbf8d-rxclr",
        "-H", "Sec-Fetch-Dest: image",
        "-H", "Sec-Fetch-Mode: no-cors",
        "-H", "Sec-Fetch-Site: same-site",
        "-o", output_path
    ]

    try:
        subprocess.run(curl_cmd, check=True)
    except subprocess.CalledProcessError:
        print(f"[ERROR] Failed: {url}")
        return None

    return output_path


def process_xml(file_path):
    print(f"\n[PROCESSING] {file_path}")

    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
    except Exception as e:
        print(f"[ERROR] XML parse: {e}")
        return

    changed = False

    for img in root.iter("image"):
        if img.text and img.text.startswith("http"):
            url = img.text.strip()

            local_path = download_image(url)
            if local_path:
                img.text = local_path
                changed = True

    if changed:
        tree.write(file_path, encoding="utf-8", xml_declaration=True)
        print(f"[UPDATED] {file_path}")
    else:
        print(f"[NO CHANGE]")


def main():
    xml_files = glob.glob("./*/*.xml")

    for xml_file in xml_files:
        process_xml(xml_file)


if __name__ == "__main__":
    main()
