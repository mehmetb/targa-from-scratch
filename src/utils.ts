import { ImageType } from './types';
import TGAImage from './TGAImage';

export function readFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.addEventListener('load', () => {
      const result = fileReader.result as ArrayBuffer;
      resolve(result);
    });

    fileReader.addEventListener('error', reject);

    fileReader.readAsArrayBuffer(file);
  });
}

function capitalize(str: string): string {
  return str.replace(/\b(\w)/g, (_, group1) => {
    return group1.toUpperCase();
  });
}

export function generateImageInformationTable(tga: TGAImage) {
  const stats = {
    version: tga.version,
    imageType: capitalize(ImageType[tga.imageType].toLowerCase().replace(/_/g, ' ')),
    xOrigin: tga.xOrigin,
    yOrigin: tga.yOrigin,
    imageWidth: tga.imageWidth,
    imageHeight: tga.imageHeight,
    pixelSize: tga.pixelSize,
    imageDescriptor: tga.imageDescriptor.toString(2).padStart(8, '0'),
    imageIdentificationFieldLength: tga.imageIdentificationFieldLength,
    topToBottom: tga.isTopToBottom(),
    colorMapOrigin: tga.colorMapOrigin,
    colorMapLength: tga.colorMapLength,
    colorMapPixelSize: tga.colorMapPixelSize,
    RLEDecodeDuration: `${tga.durations.RLEDecodeDuration} ms`,
    DrawDuration: `${tga.durations.CanvasDrawDuration} ms`,
  };

  const rows: { [key: string]: string } = {};

  for (const [key, value] of Object.entries(stats)) {
    const firsCharacter = key[0];
    const field = `${firsCharacter.toUpperCase()}${key.replace(/(?!\b[A-Z])([A-Z])/g, ' $1').substring(1)}`;

    if (typeof value === 'boolean') {
      rows[field] = value ? 'Yes' : 'No';
      continue;
    }

    rows[field] = value as string;
  }

  return rows;
}
