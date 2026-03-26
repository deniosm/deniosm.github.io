import xml.etree.ElementTree as ET
from datetime import datetime
import os

BASE_DIR = "."
OUTPUT_DIR = "channels"

def get(el, path):
    x = el.find(path)
    return x.text.strip() if x is not None and x.text else ""

def parse_time(t):
    return datetime.strptime(t, "%Y-%m-%d %H:%M")

# napravi output folder
os.makedirs(OUTPUT_DIR, exist_ok=True)

channels = {}

# ================= LOAD =================
for i in range(40):
    folder = os.path.join(BASE_DIR, str(i))
    if not os.path.isdir(folder):
        continue

    for file in os.listdir(folder):
        if not file.endswith(".xml"):
            continue

        path = os.path.join(folder, file)
        print(f"Processing: {path}")

        try:
            tree = ET.parse(path)
            root = tree.getroot()
        except Exception as e:
            print(f"ERROR parsing {path}: {e}")
            continue

        products = root.find('{*}products')
        if products is None:
            continue

        for product in products:
            ch_code = get(product, '{*}code')
            ch_name = get(product, '{*}name')

            if not ch_code:
                continue

            if ch_code not in channels:
                channels[ch_code] = {
                    "name": ch_name,
                    "programs": []
                }

            programs = product.find('{*}programs')
            if programs is None:
                continue

            for prog in programs:
                start = get(prog, '{*}start')
                end = get(prog, '{*}end')

                if not start or not end:
                    continue

                try:
                    start_dt = parse_time(start)
                except:
                    continue

                channels[ch_code]["programs"].append({
                    "title": get(prog, '{*}title'),
                    "start": start,
                    "end": end,
                    "desc": get(prog, '{*}description'),
                    "img": get(prog, '{*}picture/{*}url'),
                    "subCategory": get(prog, '{*}subCategory'),
                    "start_dt": start_dt
                })

# ================= SAVE =================
for ch_code, data in channels.items():
    # sortiraj programe po vremenu
    progs = sorted(data["programs"], key=lambda x: x["start_dt"])

    ch_folder = os.path.join(OUTPUT_DIR, ch_code)
    os.makedirs(ch_folder, exist_ok=True)

    root = ET.Element("channel")
    root.set("code", ch_code)
    root.set("name", data["name"])

    for p in progs:
        prog_el = ET.SubElement(root, "programme")

        ET.SubElement(prog_el, "title").text = p["title"]
        ET.SubElement(prog_el, "start").text = p["start"]
        ET.SubElement(prog_el, "end").text = p["end"]

        if p["desc"]:
            ET.SubElement(prog_el, "desc").text = p["desc"]

        if p["img"]:
            ET.SubElement(prog_el, "image").text = p["img"]

        if p["subCategory"]:
            ET.SubElement(prog_el, "subCategory").text = p["subCategory"]

    out_file = os.path.join(ch_folder, "epg.xml")
    ET.ElementTree(root).write(out_file, encoding="utf-8", xml_declaration=True)

    print(f"Saved: {out_file}")

print("\n✅ Gotovo")
