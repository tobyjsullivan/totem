#!/usr/bin/env python3

import tensorflow as tf
import numpy as np

data = np.load('data.npz')
x_train = data['x_train']
y_train = data['y_train']

model = tf.keras.models.Sequential([
  tf.keras.layers.Dense(2500, input_shape=(2500,)),
  tf.keras.layers.Dense(512, activation=tf.nn.relu),
  tf.keras.layers.Dropout(0.2),
  tf.keras.layers.Dense(2, activation=tf.nn.softmax)
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
model.fit(x_train, y_train, epochs=5, validation_split=0.1)

import os
from PIL import Image
import csv

WHITE = 255.0

print('Applying...')
outfile = open('output.csv', 'w')
csvwriter = csv.writer(outfile)
for filename in os.listdir('./tiles'):
  filename = './tiles/'+filename
  with Image.open(filename) as imgfile:
    imgfile = imgfile.convert('1') # convert to monochrome
    pixeldata = imgfile.getdata()
    vec = 1.0 - (np.array(pixeldata) / WHITE)
    outputs = model.predict(np.array([vec]))
    labels = outputs[0]
    if labels[0] < 0.5:
      label = 0.0
    else:
      label = 1.0
    csvwriter.writerow([filename, label])

outfile.close()
