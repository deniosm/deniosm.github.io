#!/bin/bash

DATE="${1:-$(date +%F)}"
BASE_URL="https://mtel.ba/hybris/ecommerce/b2c/v1/products/channels/epg"

for i in $(seq 0 39); do
    echo "Skidam page $i..."

    mkdir -p "$i"

    curl "$BASE_URL?platform=tv-msat&currentPage=$i&date=$DATE" \
      --compressed \
      -H 'User-Agent: Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0' \
      -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8' \
      -H 'Accept-Language: hr,hr-HR;q=0.5' \
      -H 'Accept-Encoding: gzip, deflate, br, zstd' \
      -H 'DNT: 1' \
      -H 'Connection: keep-alive' \
      -H 'Cookie: cookiesDialog=1; OrigamiSessionId=fb62b1d9-9379-4446-899f-a425e7db72a1' \
      -H 'Upgrade-Insecure-Requests: 1' \
      -H 'Sec-Fetch-Dest: document' \
      -H 'Sec-Fetch-Mode: navigate' \
      -H 'Sec-Fetch-Site: none' \
      -H 'Priority: u=0, i' \
      -o "$i/$DATE.xml"

    # mali delay da ne spamujes server
    sleep 0.5
done

echo "Gotovo."
