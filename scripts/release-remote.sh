#!/bin/bash

# This script copies the remote dist files to the app folder

source="$(pwd)/dist-remote"
# if arg 1 is dev use dist-remote-dev
if [ "$1" == "dev" ]; then
  source="$(pwd)/dist-remote-dev"
fi

# if not exists exit fail
if [ ! -d $source ]; then
  echo "Source directory ($source) does not exist"
  exit 1
fi

cp -r $source/browser/en/* ../../app
cp -r $source/browser/hu ../../app
cp -r $source/browser/it ../../app
