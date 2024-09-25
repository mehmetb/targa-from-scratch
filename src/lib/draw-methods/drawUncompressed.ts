import { ImageType, AttributesType } from '../types';
import TGAFile from '../TGAFile';

export default function drawUncompressed(imageData: ImageData, tgaFile: TGAFile) {
  const { imageHeight, imageWidth, pixelSize, attributesType, imageType, imageDataFieldOffset } = tgaFile.fileInfo;
  const { data } = imageData;
  const { imageDataBytes, dataView } = tgaFile;
  let byteOffset = 0;
  let canvasOffset = 0;
  let hasAlpha = true;

  if (
    attributesType &&
    attributesType !== AttributesType.USEFUL_ALPHA_CHANNEL &&
    attributesType !== AttributesType.PREMULTIPLIED_ALPHA
  ) {
    hasAlpha = false;
  }

  for (let y = 0; y < imageHeight; ++y) {
    for (let x = 0; x < imageWidth; ++x) {
      switch (pixelSize) {
        // 15-bit RGB
        case 2: {
          if (imageType === ImageType.GRAY_SCALE) {
            data[canvasOffset] = 0;
            data[canvasOffset + 1] = 0;
            data[canvasOffset + 2] = 0;
            data[canvasOffset + 3] = imageDataBytes[byteOffset + 1];
          } else {
            const byteValue = dataView.getUint16(imageDataFieldOffset + byteOffset, true);

            // convert 5 bits to 8 bits
            data[canvasOffset] = Math.round(((byteValue & 0x7C00) >> 10) / 31 * 255);
            data[canvasOffset + 1] = Math.round(((byteValue & 0x03E0) >> 5) / 31 * 255);
            data[canvasOffset + 2] = Math.round((byteValue & 0x001F) / 31 * 255);
          }

          break;
        }

        // 24-bit RGB
        case 3: {
          data[canvasOffset] = imageDataBytes[byteOffset + 2];
          data[canvasOffset + 1] = imageDataBytes[byteOffset + 1];
          data[canvasOffset + 2] = imageDataBytes[byteOffset];
          break;
        }

        // 32-bit RGBA
        case 4: {
          data[canvasOffset] = imageDataBytes[byteOffset + 2];
          data[canvasOffset + 1] = imageDataBytes[byteOffset + 1];
          data[canvasOffset + 2] = imageDataBytes[byteOffset];

          if (hasAlpha) {
            data[canvasOffset + 3] = imageDataBytes[byteOffset + 3];
          }

          break;
        }
      }

      byteOffset += pixelSize;
      canvasOffset += 4;
    }
  }
}
