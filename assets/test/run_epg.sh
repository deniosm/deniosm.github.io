#!/bin/bash
pkill -f chromedriver
pkill -f chromium
while true; do
    echo "▶ Pokrećem selenium skriptu..."

    python3 download_vpn_epg.py
    EXIT_CODE=$?

    if [ $EXIT_CODE -eq 0 ]; then
        echo "✅ Završeno normalno."
        break
    fi

    if [ $EXIT_CODE -eq 99 ]; then
        echo "🔄 Detektovan blok. Mijenjam IP..."
        anonsurf changeid
        sleep 10
        continue
    fi

    echo "⚠ Neočekivana greška ($EXIT_CODE). Pauza 20s..."
    sleep 20
done

