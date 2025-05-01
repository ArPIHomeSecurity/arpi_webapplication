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

if [ "$1" == "dev" ]; then
  rm -rf ../../app/$2-dev/*
  cp -r $source/browser/en ../../app/$2-dev
  cp -r $source/browser/hu ../../app/$2-dev
  cp -r $source/browser/it ../../app/$2-dev
else
  rm -rf ../../app/$2/*
  cp -r $source/browser/en ../../app/$2
  cp -r $source/browser/hu ../../app/$2
  cp -r $source/browser/it ../../app/$2
fi
