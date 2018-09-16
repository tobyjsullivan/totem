#!/usr/bin/env python3

from PIL import Image
import csv
import sys
import numpy as np

WHITE = 65535.0

x_train = []
y_train = []
reader = csv.reader(iter(sys.stdin.readline, ''))
for row in reader:
  filename = row[0]
  label = row[1]
  with Image.open(filename) as imgfile:
    imgfile = imgfile.convert('1')
    pixeldata = imgfile.getdata()
    vec = 1.0 - (np.array(pixeldata) / 255.0)
    x_train.append(vec)
    y_train.append(label)

x_train = np.array(x_train)
y_trian = np.array(y_train)
print(x_train)
print(y_train)

np.savez('data.npz', x_train=x_train, y_train=y_train)
