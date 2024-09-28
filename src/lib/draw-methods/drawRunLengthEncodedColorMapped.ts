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
import { ImageType } from "../types";

export default function drawRunLengthEncodedColorMapped(imageData: ImageData, tgaFile: TGAFile) {
  const { pixelSize, imageIdentificationFieldLength, colorMapOrigin, imageDataFieldOffset, colorMapPixelSize, imageType } = tgaFile.fileInfo;
  const { data } = imageData;
  const { imageDataBytes, bytes, dataView } = tgaFile;
  const readArrayLength = imageDataBytes.length;
  const padding = 18 + imageIdentificationFieldLength + colorMapOrigin;
  let canvasOffset = 0;
  let readCursor = 0;
  let byte1 = 0;
  let byte2 = 0;
  let byte3 = 0;
  let byte4 = 0;
  let colorMapEntryOffset: number = 0;

  for (let i = 0; i < readArrayLength; ++i) {
    const packet = imageDataBytes[readCursor++];

    // RLE packet
    if (packet >= 128) {
      if (pixelSize === 1) {
        colorMapEntryOffset = padding + colorMapPixelSize * imageDataBytes[readCursor++];
      } else {
        colorMapEntryOffset = padding + colorMapPixelSize * dataView.getUint16(imageDataFieldOffset + readCursor, true);
        readCursor += 2;
      }

      const repetition = packet - 128;
      byte1 = bytes[colorMapEntryOffset];

      if (colorMapPixelSize > 2) {
        byte2 = bytes[colorMapEntryOffset + 1];
        byte3 = bytes[colorMapEntryOffset + 2];
      }

      if (colorMapPixelSize > 3) {
        byte4 = bytes[colorMapEntryOffset + 3];
      }

      if (colorMapPixelSize === 2) {
        if (imageType === ImageType.GRAY_SCALE) {
          byte4 = imageDataBytes[colorMapEntryOffset + 1];
        } else {
          const byteValue = dataView.getUint16(colorMapEntryOffset, true);
          // convert 5 bits to 8 bits
          byte3 = Math.round(((byteValue & 0x7C00) >> 10) / 31 * 255);
          byte2 = Math.round(((byteValue & 0x03E0) >> 5) / 31 * 255);
          byte1 = Math.round((byteValue & 0x001F) / 31 * 255);
        }
      }

      for (let i = 0; i <= repetition; ++i) {
        switch (colorMapPixelSize) {
          case 1: {
            data[canvasOffset] = byte1;
            data[canvasOffset + 1] = byte1;
            data[canvasOffset + 2] = byte1;
            break;
          }

          case 2: {
            if (imageType === ImageType.GRAY_SCALE) {
              data[canvasOffset + 3] = byte4;
            } else {
              data[canvasOffset] = byte3;
              data[canvasOffset + 1] = byte2;
              data[canvasOffset + 2] = byte1;
            }

            break;
          }

          case 3: {
            data[canvasOffset] = byte3;
            data[canvasOffset + 1] = byte2;
            data[canvasOffset + 2] = byte1;
            break;
          }

          case 4: {
            data[canvasOffset] = byte3;
            data[canvasOffset + 1] = byte2;
            data[canvasOffset + 2] = byte1;
            data[canvasOffset + 3] = byte4;
            break;
          }
        }

        canvasOffset += 4;
      }
    } else {
      // raw packet
      const repetition = packet;

      for (let i = 0; i <= repetition; ++i) {
        if (pixelSize === 1) {
          colorMapEntryOffset = padding + colorMapPixelSize * imageDataBytes[readCursor++];
        } else {
          colorMapEntryOffset = padding + colorMapPixelSize * dataView.getUint16(imageDataFieldOffset + readCursor, true);
          readCursor += 2;
        }

        switch (colorMapPixelSize) {
          case 1: {
            data[canvasOffset] = bytes[colorMapEntryOffset];
            data[canvasOffset + 1] = bytes[colorMapEntryOffset];
            data[canvasOffset + 2] = bytes[colorMapEntryOffset];
            break;
          }

          case 2: {
            const byteValue = dataView.getUint16(colorMapEntryOffset, true);
            // convert 5 bits to 8 bits
            data[canvasOffset] = Math.round(((byteValue & 0x7C00) >> 10) / 31 * 255);
            data[canvasOffset + 1] = Math.round(((byteValue & 0x03E0) >> 5) / 31 * 255);
            data[canvasOffset + 2] = Math.round((byteValue & 0x001F) / 31 * 255);
            break;
          }

          case 3: {
            data[canvasOffset] = bytes[colorMapEntryOffset + 2];
            data[canvasOffset + 1] = bytes[colorMapEntryOffset + 1];
            data[canvasOffset + 2] = bytes[colorMapEntryOffset];
            break;
          }

          case 4: {
            data[canvasOffset] = bytes[colorMapEntryOffset + 2];
            data[canvasOffset + 1] = bytes[colorMapEntryOffset + 1];
            data[canvasOffset + 2] = bytes[colorMapEntryOffset];
            data[canvasOffset + 3] = bytes[colorMapEntryOffset + 3];
            break;
          }
        }

        canvasOffset += 4;
      }
    }
  }
}
