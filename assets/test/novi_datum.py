#!/usr/bin/env python3
import re
from datetime import datetime, timedelta

INPUT_FILE = "urls.txt"
OUTPUT_FILE = "urls.txt"   # ili "urls_new.txt" ako želiš odvojeno

# -----------------------
# POSTAVI DATUME OVDJE
# -----------------------
START_DATE = input("Unesi startni datum (format godina-mjesec-dan): ")
END_DATE   = input("Unesi krajnji datum: ")
# -----------------------

date_re = re.compile(r"datum=\d{4}-\d{2}-\d{2}")

start = datetime.strptime(START_DATE, "%Y-%m-%d")
end   = datetime.strptime(END_DATE, "%Y-%m-%d")

# pročitaj fajl
with open(INPUT_FILE, "r", encoding="utf-8") as f:
    lines = [l.strip() for l in f if l.strip()]

# napravi jedinstvene template linije (bez datuma)
templates = []
for line in lines:
    if not date_re.search(line):
        continue
    template = date_re.sub("datum={DATE}", line)
    if template not in templates:
        templates.append(template)

# generiši nove URL-ove
new_lines = []
current = start
while current <= end:
    d = current.strftime("%Y-%m-%d")
    for tpl in templates:
        new_lines.append(tpl.replace("{DATE}", d))
    current += timedelta(days=1)

# upiši nazad
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(new_lines) + "\n")

print(f"[OK] {len(new_lines)} URL-ova generisano ({len(templates)} template-a)")

