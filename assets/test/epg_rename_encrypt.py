import os
import re
import random
import string
import json

# === PODESI OVO ===
BASE_EPG_PATH = "/home/deni/Desktop/epg/bosna/epg"
JS_FILES = ["sportski4.js", "domaci.js"]  # dodaj koliko hoces
RANDOM_LENGTH = 7
MAPPING_FILE = "epg_mapping.json"
# ===================


def random_string(length=7):
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def generate_unique_name(used_names, existing_folders):
    while True:
        name = random_string(RANDOM_LENGTH)
        if name not in used_names and name not in existing_folders:
            return name


def extract_epg_names(content):
    pattern = r'epg_name:\s*"([^"]+)"'
    return re.findall(pattern, content)


def main():

    mapping = {}
    used_new_names = set()

    if not os.path.isdir(BASE_EPG_PATH):
        os.makedirs(BASE_EPG_PATH)

    existing_folders = set(os.listdir(BASE_EPG_PATH))

    for js_file in JS_FILES:

        if not os.path.isfile(js_file):
            print(f"Fajl ne postoji: {js_file}")
            continue

        print(f"\nObrada: {js_file}")

        with open(js_file, "r", encoding="utf-8") as f:
            content = f.read()

        epg_names = extract_epg_names(content)

        for old_name in epg_names:

            if old_name in mapping:
                new_name = mapping[old_name]
            else:
                new_name = generate_unique_name(used_new_names, existing_folders)
                mapping[old_name] = new_name
                used_new_names.add(new_name)

            old_folder_path = os.path.join(BASE_EPG_PATH, old_name)
            new_folder_path = os.path.join(BASE_EPG_PATH, new_name)

            # Ako postoji stari folder → preimenuj (bez diranja sadržaja)
            if os.path.isdir(old_folder_path):
                print(f"Preimenujem folder: {old_name} -> {new_name}")
                os.rename(old_folder_path, new_folder_path)

                # Ukloni staro ime iz evidencije foldera
                existing_folders.discard(old_name)
                existing_folders.add(new_name)

            else:
                # Ako ne postoji → napravi samo novi (bez ostavljanja starog)
                if not os.path.isdir(new_folder_path):
                    print(f"Kreiram folder: {new_name}")
                    os.makedirs(new_folder_path)
                    existing_folders.add(new_name)

            # Zamijeni u JS
            content = re.sub(
                rf'epg_name:\s*"{re.escape(old_name)}"',
                f'epg_name: "{new_name}"',
                content
            )

        # Upisi izmjene
        with open(js_file, "w", encoding="utf-8") as f:
            f.write(content)

    # Sačuvaj mapping
    with open(MAPPING_FILE, "w", encoding="utf-8") as f:
        json.dump(mapping, f, indent=4)

    print("\n✅ Gotovo bez dupliranja foldera.")
    print(f"Mapping sacuvan u: {MAPPING_FILE}")


if __name__ == "__main__":
    main()
