#!/bin/sh
# Convertit un vocal WhatsApp (.opus, .ogg, .m4a, .aac...) en .mp3 lisible partout (y compris iPhone/Safari).
# Usage : ./outils/convertir-voix.sh PTT-20261030-WA0001.opus mot-1
#         -> crée assets/audio/mot-1.mp3        (nécessite ffmpeg)
[ $# -ne 2 ] && { echo "Usage: $0 fichier_whatsapp nom_sans_extension   (ex: mot-1, mot-2, mot-3, lettre)"; exit 1; }
mkdir -p "$(dirname "$0")/../assets/audio"
ffmpeg -y -i "$1" -vn -ac 1 -ar 44100 -c:a libmp3lame -q:a 3 "$(dirname "$0")/../assets/audio/$2.mp3" && echo "OK -> assets/audio/$2.mp3"
