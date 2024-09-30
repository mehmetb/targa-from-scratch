/** 
 * @license
 * Copyright 2024 Mehmet Baker
 *
 * This file is part of tga-for-web.
 *
 * tga-for-web is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * tga-for-web is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with tga-for-web. If not, see <https://www.gnu.org/licenses/>.
 */

import { ImageType } from './lib/types';
import TGAFile from './lib/TGAFile';
import ImageFileInfo from './lib/ImageFileInfo';
import drawColorMapped from './lib/draw-methods/drawColorMapped';
import drawRunLengthEncoded from './lib/draw-methods/drawRunLengthEncoded';
import drawRunLengthEncodedColorMapped from './lib/draw-methods/drawRunLengthEncodedColorMapped';
import drawUncompressed from './lib/draw-methods/drawUncompressed';
import drawUncompressedGrayscale from './lib/draw-methods/drawUncompressedGrayscale';

function drawTransparencyGrid(params: { context: CanvasRenderingContext2D, imageWidth: number, imageHeight: number, gridSize: number }) {
  const { context, imageWidth, imageHeight, gridSize } = params;
  let evenRow = 0;

  for (let y = 0; y < imageHeight; y += gridSize) {
    let evenColumn = 0;

    for (let x = 0; x < imageWidth; x += gridSize) {
      context.fillStyle = evenRow ^ evenColumn ? 'rgba(180, 180, 180, 1)' : 'rgba(100, 100, 100, 1)';
      context.fillRect(x, y, gridSize, gridSize);
      evenColumn = evenColumn === 1 ? 0 : 1;
    }

    evenRow = evenRow === 1 ? 0 : 1;
  }
}

function resetCanvas(context: CanvasRenderingContext2D, imageWidth: number, imageHeight: number) {
  context.resetTransform();
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.canvas.width = imageWidth;
  context.canvas.height = imageHeight;
  context.fillStyle = 'rgba(40, 40, 40, 255)';
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
}

export function decodeTGAIntoImageData(tgaFile: TGAFile, imageData: ImageData) {
  imageData.data.fill(255);

  if (tgaFile.fileInfo.rleEncoded) {
    if (tgaFile.fileInfo.imageType === ImageType.RUN_LENGTH_ENCODED_COLOR_MAPPED) {
      drawRunLengthEncodedColorMapped(imageData, tgaFile);
    } else {
      drawRunLengthEncoded(imageData, tgaFile);
    }
  } else {
    if (tgaFile.fileInfo.imageType === ImageType.COLOR_MAPPED) {
      drawColorMapped(imageData, tgaFile);
    } else {
      if (tgaFile.fileInfo.pixelSize === 1) {
        drawUncompressedGrayscale(imageData, tgaFile);
      } else {
        drawUncompressed(imageData, tgaFile);
      }
    }
  }
}

function decodeTGA(tgaFile: TGAFile, context: CanvasRenderingContext2D): ImageData {
  const imageData = context.createImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
  decodeTGAIntoImageData(tgaFile, imageData);
  return imageData;
}

function flipCanvasVertically(context: CanvasRenderingContext2D) {
  context.translate(0, context.canvas.height);
  context.scale(1, -1);
}

/**
 * The given TGA image is drawn to the given canvas. The given canvas is cleared and resized to the image size.
 * If the image has transparency, a grid is drawn to show it.
 * The duration of the operation and the image metadata are returned.
 * 
 * @example 
 * // Read a TGA file from an input element and draw it to a canvas
 * const canvas = document.getElementById('canvas');
 * const fileInput = document.getElementById('fileInput');
 * 
 * fileInput.addEventListener('change', (event) => {
 *   const file = fileInput.files?.item(0);
 *   if (!file) return;
 * 
 *   const reader = new FileReader();
 * 
 *   reader.onload = async (event) => {
 *     const arrayBuffer = reader.result;
 *     const { duration, fileInfo } = await drawToCanvas(canvas, arrayBuffer);
 *     console.log(`Image drawn in ${duration} ms`);
 *     console.log(fileInfo);
 *   };
 * 
 *   reader.readAsArrayBuffer(file);
 * });
 * 
 * @example
 * // Read a TGA file from a URL and draw it to a canvas
 * const canvas = document.getElementById('canvas');
 * const url = 'https://example.com/image.tga';
 * 
 * fetch(url)
 *   .then((response) => response.arrayBuffer())
 *   .then((arrayBuffer) => drawToCanvas(canvas, arrayBuffer))
 *   .then(({ duration, fileInfo }) => {
 *     console.log(`Image drawn in ${duration} ms`);
 *     console.log(fileInfo);
 *   });
 * 
 * @param canvas The canvas to draw the image to
 * @param arrayBuffer The TGA image file as an ArrayBuffer
 * @returns A promise that resolves to the duration of the operation and the image metadata
 */
export function drawToCanvas(canvas: HTMLCanvasElement, arrayBuffer: ArrayBuffer): Promise<{ duration: number, fileInfo: ImageFileInfo }> {
  const context = canvas.getContext('2d');

  if (!context) {
    alert('Failed to get canvas context');
    return Promise.reject(new Error('Failed to get canvas context'));
  }

  const start = performance.now();

  // read the TGA file, get image width, height and other metadata
  const tgaFile = new TGAFile(arrayBuffer);

  // reset the canvas and set it to correct size
  resetCanvas(context, tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);

  // decode the TGA and get an ImageData object to draw to the canvas
  const imageData = decodeTGA(tgaFile, context);

  // if the image has transparency, draw a grid to show it
  if (tgaFile.fileInfo.hasTransparency) {
    const gridSize = Math.floor(Math.min(tgaFile.fileInfo.imageWidth / 5, 30));
    drawTransparencyGrid({
      context,
      gridSize,
      imageWidth: tgaFile.fileInfo.imageWidth,
      imageHeight: tgaFile.fileInfo.imageHeight,
    });
  }

  return createImageBitmap(imageData, { premultiplyAlpha: tgaFile.fileInfo.hasTransparency ? 'premultiply' : 'none' })
    .then((bitmap) => {
      if (!tgaFile.fileInfo.topToBottom) {
        flipCanvasVertically(context);
      }

      context.drawImage(bitmap, 0, 0);
      bitmap.close();

      const end = performance.now();
      return { duration: end - start, fileInfo: tgaFile.fileInfo };
    });
}
