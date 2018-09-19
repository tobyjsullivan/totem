#!/usr/bin/env bash

#
# Convert a PDF file to a series of PNGs
#

set -eu
set -o pipefail

main() {
  if [[ "$#" -lt "2" ]]
  then
    echo 'Err: Must supply 2 args' >&2
    exit 1
  fi

  local in_file="$1"
  local out_dir="$2"

  mkdir -p "${out_dir}"
  magick -density 100  "${in_file}" -colorspace LinearGray -set filename:page '%p' "${out_dir}/%[filename:page].png"
}

main "$@"

