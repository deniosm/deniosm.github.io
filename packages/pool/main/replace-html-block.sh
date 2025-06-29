#!/bin/bash

# Path to replacement HTML block
REPLACEMENT_FILE="replacement.html"

# Check if the replacement file exists
if [[ ! -f "$REPLACEMENT_FILE" ]]; then
  echo "Error: $REPLACEMENT_FILE not found."
  exit 1
fi

# Escape slashes and special chars for search pattern
read -r -d '' SEARCH_BLOCK <<'EOF'
          <div class="section-title text-start" data-aos="fade-up">
            <h2>Packages</h2>
            <p>Latest Updated Packages</p>
          </div>
          <p class="nunito-dark"> This list shows the most recently updated packages. </p>
          <p class="nunito-dark"> This is a limited OpenBosniana OS repositories and contains the packages needed to build the system.</p>
          <p class="nunito-dark"> With the Package Search and the Online Package Viewer, you can track, download, and resolve dependencies for all packages available in the main OpenBosniana OS repository. </p>
          <br>
          <a href="/packages/" class="btn-raised shadow-features p-3">VIEW MORE </a>
        </div>
        <br>
        <div class="container">
          <h3>Online Package Viewer</h3>
EOF

# Read and escape replacement content
REPLACEMENT_CONTENT=$(<"$REPLACEMENT_FILE")
REPLACEMENT_ESCAPED=$(printf '%s\n' "$REPLACEMENT_CONTENT" | sed 's/[&/\]/\\&/g')

# Loop over all .html files
find . -type f -name "*.html" | while read -r file; do

  # Replace block using perl for multiline
  perl -0777 -i -pe "s|\Q$SEARCH_BLOCK\E|$REPLACEMENT_ESCAPED|s" "$file"
  echo "Updated: $file"
done
