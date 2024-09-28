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

import { ImageType, AttributesType } from '../types';
import TGAFile from '../TGAFile';

export default function drawRunLengthEncoded(imageData: ImageData, tgaFile: TGAFile) {
  const { pixelSize, attributesType, imageType } = tgaFile.fileInfo;
  const { data } = imageData;
  const { imageDataBytes } = tgaFile;
  const readArrayLength = imageDataBytes.length;
  const ab = new ArrayBuffer(2);
  const ua = new Uint8Array(ab);
  const dv = new DataView(ab);
  let canvasOffset = 0;
  let hasAlpha = true;
  let readCursor = 0;
  let byte1;
  let byte2;
  let byte3;
  let byte4;

  if (
    attributesType &&
    attributesType !== AttributesType.USEFUL_ALPHA_CHANNEL &&
    attributesType !== AttributesType.PREMULTIPLIED_ALPHA
  ) {
    hasAlpha = false;
  }

  for (let i = 0; i < readArrayLength; ++i) {
    const packet = imageDataBytes[readCursor++];
    const isRLEPacket = packet >= 128;
    const repetition = isRLEPacket ? packet - 128 : packet;

    if (isRLEPacket) {
      switch (pixelSize) {
        case 1:
          byte1 = imageDataBytes[readCursor++];
          break;

        case 2:
          byte1 = imageDataBytes[readCursor++];
          byte2 = imageDataBytes[readCursor++];

          if (imageType !== ImageType.RUN_LENGTH_ENCODED_GRAY_SCALE) {
            ua[0] = byte1;
            ua[1] = byte2;
            const byteValue = dv.getUint16(0, true);
            // convert 5 bits to 8 bits
            byte3 = Math.round(((byteValue & 0x7C00) >> 10) / 31 * 255);
            byte2 = Math.round(((byteValue & 0x03E0) >> 5) / 31 * 255);
            byte1 = Math.round((byteValue & 0x001F) / 31 * 255);
          }

          break;

        case 3:
          byte1 = imageDataBytes[readCursor++];
          byte2 = imageDataBytes[readCursor++];
          byte3 = imageDataBytes[readCursor++];
          break;

        case 4:
          byte1 = imageDataBytes[readCursor++];
          byte2 = imageDataBytes[readCursor++];
          byte3 = imageDataBytes[readCursor++];
          byte4 = imageDataBytes[readCursor++];
          break;
      }

      for (let j = 0; j <= repetition; ++j) {
        switch (pixelSize) {
          case 1:
            data[canvasOffset] = byte1 as number;
            data[canvasOffset + 1] = byte1 as number;
            data[canvasOffset + 1] = byte1 as number;
            break;

          case 2:
            if (imageType === ImageType.RUN_LENGTH_ENCODED_GRAY_SCALE) {
              data[canvasOffset] = 0;
              data[canvasOffset + 1] = 0;
              data[canvasOffset + 2] = 0;
              data[canvasOffset + 1] = byte1 as number;
            } else {
              data[canvasOffset + 1] = byte1 as number;
              data[canvasOffset + 1] = byte2 as number;
              data[canvasOffset + 2] = byte1 as number;
            }
            break;

          case 3:
            data[canvasOffset] = byte3 as number;
            data[canvasOffset + 1] = byte2 as number;
            data[canvasOffset + 2] = byte1 as number;
            break;

          case 4:
            data[canvasOffset] = byte3 as number;
            data[canvasOffset + 1] = byte2 as number;
            data[canvasOffset + 2] = byte1 as number;

            if (hasAlpha) {
              data[canvasOffset + 3] = byte4 as number;
            }

            break;
        }

        canvasOffset += 4;
      }

      continue;
    }

    for (let j = 0; j <= repetition; ++j) {
      switch (pixelSize) {
        case 1: {
          data[canvasOffset] = imageDataBytes[readCursor];
          data[canvasOffset + 1] = imageDataBytes[readCursor];
          data[canvasOffset + 2] = imageDataBytes[readCursor];
          readCursor += 1;
          break;
        }

        case 2: {
          if (imageType === ImageType.RUN_LENGTH_ENCODED_GRAY_SCALE) {
            readCursor += 1;
            data[canvasOffset] = 0;
            data[canvasOffset + 1] = 0;
            data[canvasOffset + 2] = 0;
            data[canvasOffset + 3] = imageDataBytes[readCursor++];
          } else {
            ua[0] = imageDataBytes[readCursor++];
            ua[1] = imageDataBytes[readCursor++];
            const byteValue = dv.getUint16(0, true);
            // convert 5 bits to 8 bits
            data[canvasOffset] = Math.round(((byteValue & 0x7C00) >> 10) / 31 * 255);
            data[canvasOffset + 1] = Math.round(((byteValue & 0x03E0) >> 5) / 31 * 255);
            data[canvasOffset + 2] = Math.round((byteValue & 0x001F) / 31 * 255);
          }
          break;
        }

        case 3: {
          data[canvasOffset] = imageDataBytes[readCursor + 2];
          data[canvasOffset + 1] = imageDataBytes[readCursor + 1];
          data[canvasOffset + 2] = imageDataBytes[readCursor];
          readCursor += 3;
          break;
        }

        case 4: {
          data[canvasOffset] = imageDataBytes[readCursor + 2];
          data[canvasOffset + 1] = imageDataBytes[readCursor + 1];
          data[canvasOffset + 2] = imageDataBytes[readCursor];

          if (hasAlpha) {
            data[canvasOffset + 3] = imageDataBytes[readCursor + 3];
          }

          readCursor += 4;
          break;
        }
      }

      canvasOffset += 4;
    }
  }
}
