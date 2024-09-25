import TGAFile from '../TGAFile';
import { ImageType } from '../types';

export default function drawColorMapped(imageData: ImageData, tgaFile: TGAFile) {
  const {
    imageHeight,
    imageWidth,
    pixelSize,
    colorMapPixelSize,
    colorMapOrigin,
    imageIdentificationFieldLength,
    imageDataFieldOffset,
    imageType
  } = tgaFile.fileInfo;
  const { data } = imageData;
  const { imageDataBytes, bytes, dataView } = tgaFile;
  const padding = 18 + imageIdentificationFieldLength + colorMapOrigin;
  let canvasOffset = 0;
  let byteOffset = 0;

  for (let y = 0; y < imageHeight; ++y) {
    for (let x = 0; x < imageWidth; ++x) {
      const colorMapEntryOffset =
        padding +
        colorMapPixelSize *
        (pixelSize === 1
          ? imageDataBytes[byteOffset]
          : dataView.getUint16(imageDataFieldOffset + byteOffset, true));

      switch (colorMapPixelSize) {
        case 1: {
          data[canvasOffset] = bytes[colorMapEntryOffset];
          data[canvasOffset + 1] = bytes[colorMapEntryOffset];
          data[canvasOffset + 2] = bytes[colorMapEntryOffset];
          break;
        }

        case 2: {
          if (imageType === ImageType.GRAY_SCALE) {
            data[canvasOffset + 3] = imageDataBytes[colorMapEntryOffset + 1];
          } else {
            const byteValue = dataView.getUint16(colorMapEntryOffset, true);

            // convert 5 bits to 8 bits
            data[canvasOffset] = Math.round(((byteValue & 0x7C00) >> 10) / 31 * 255);
            data[canvasOffset + 1] = Math.round(((byteValue & 0x03E0) >> 5) / 31 * 255);
            data[canvasOffset + 2] = Math.round((byteValue & 0x001F) / 31 * 255);
          }

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
      byteOffset += pixelSize;
    }
  }
}
