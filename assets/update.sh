#!/bin/bash

EPG_DIR="./test"   # ⬅ promijeni po potrebi

find "$EPG_DIR" -type f -name "*.js" | while read -r file; do
    # zamijeni sve tvprogram<nešto>BROJ( sa tvprogrambsb49(
    sed -i 's/^tvprogram[a-zA-Z]\+[0-9]\+/tvprogrambsb49/' "$file"
    echo "✔ popravljeno: $file"
done

echo "✅ Svi EPG fajlovi su prepravljeni"

