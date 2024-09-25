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
