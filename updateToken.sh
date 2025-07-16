#!/bin/sh

if [ -z "$1" ]; then
  echo "❌ Usage: updateToken <TOKEN>"
  exit 1
fi

echo "BUS_TOKEN=$1" > /home/le-saad/logger/.env
echo "✅ Token updated in /home/le-saad/logger/.env"
