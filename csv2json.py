#!/usr/bin/env python3

import csv
import json
import sys

result = []
csvreader = csv.reader(iter(sys.stdin.readline, ''))
for row in csvreader:
  result.append({
    'filename': row[0],
    'label': row[1]
  })

print(json.dumps(result, indent=2))
