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

import TGAFile from "../TGAFile";

export default function drawUncompressedGrayscale(imageData: ImageData, tgaFile: TGAFile) {
  const { imageHeight, imageWidth, pixelSize } = tgaFile.fileInfo;
  const { data } = imageData;
  const { imageDataBytes } = tgaFile;
  let canvasOffset = 0;
  let byteOffset = 0;

  for (let y = 0; y < imageHeight; ++y) {
    for (let x = 0; x < imageWidth; ++x) {
      switch (pixelSize) {
        case 1: {
          data[canvasOffset] = imageDataBytes[byteOffset];
          data[canvasOffset + 1] = imageDataBytes[byteOffset];
          data[canvasOffset + 2] = imageDataBytes[byteOffset];
          break;
        }

        case 4: {
          data[canvasOffset] = imageDataBytes[byteOffset];
          data[canvasOffset + 1] = imageDataBytes[byteOffset];
          data[canvasOffset + 2] = imageDataBytes[byteOffset];
          break;
        }

        default: {
          alert('Unsupported pixel size');
          return;
        }
      }

      canvasOffset += 4;
      byteOffset += 1;
    }
  }
}
