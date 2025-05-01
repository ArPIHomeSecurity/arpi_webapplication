#!/bin/bash

source="$(pwd)/$1"
# if not exists exit fail
if [ ! -d $source ]; then
  echo "Source directory ($source) does not exist"
  exit 1
fi

# check if self signed certificate exists
if [ ! -f arpi_dev.key ] || [ ! -f arpi_dev.crt ]; then
    printf "\n\n## Create self signed certificate\n"
    openssl req -new -newkey rsa:4096 -nodes -x509 \
        -subj "/C=HU/ST=Fejér/L=Baracska/O=ArPI/CN=arpi.local" \
        -days 730 \
        -keyout arpi_dev.key \
        -out arpi_dev.crt \
        -addext "subjectAltName=DNS:arpi.local,DNS:*.arpi.local"
fi

# check dhparams file
if [ ! -f arpi_dhparams.pem ]; then
    printf "\n\n## Create dhparams file\n"
    openssl dhparam -out arpi_dhparams.pem 1024
fi

docker rm -fv arpi-webserver || true

destination="$2"

if [ ! -z "$destination" ]; then
    echo "Serving $source on http://localhost:4200/$destination/"
else
    echo "Serving $source on http://localhost:4200"
fi

docker run -d --name arpi-webserver \
    -p 4200:8080 \
    -v $(pwd)/arpi_dhparams.pem:/etc/nginx/arpi_dhparams.pem:ro \
    -v $(pwd)/arpi_dev.crt:/etc/nginx/arpi_dev.crt:ro \
    -v $(pwd)/arpi_dev.key:/etc/nginx/arpi_dev.key:ro \
    -v $(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro \
    -v $source:/usr/share/nginx/html/$destination:ro \
    nginx