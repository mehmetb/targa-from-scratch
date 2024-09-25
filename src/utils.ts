import { ImageType, AttributesType } from './lib/types';
import ImageFileInfo from './lib/ImageFileInfo';

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

function getAttributesType(fileInfo: ImageFileInfo) {
  switch (fileInfo.attributesType) {
    case AttributesType.NO_ALPHA_DATA:
      return 'No alpha';
    case AttributesType.UNDEFINED_IGNORED:
      return 'Undefined; ignored';
    case AttributesType.UNDEFINED_RETAINED:
      return 'Undefined; retained';
    case AttributesType.USEFUL_ALPHA_CHANNEL:
      return 'Useful alpha channel';
    case AttributesType.PREMULTIPLIED_ALPHA:
      return 'Premultiplied alpha';
    default:
      return undefined;
  }
}

export function generateImageInformationTable(fileInfo: ImageFileInfo, duration: number) {
  const attributesType = getAttributesType(fileInfo);
  const stats: any = {
    version: fileInfo.version,
    imageType: capitalize(ImageType[fileInfo.imageType].toLowerCase().replace(/_/g, ' ')),
    xOrigin: fileInfo.xOrigin,
    yOrigin: fileInfo.yOrigin,
    imageWidth: fileInfo.imageWidth,
    imageHeight: fileInfo.imageHeight,
    pixelSize: fileInfo.pixelSize,
    imageDescriptor: fileInfo.imageDescriptor.toString(2).padStart(8, '0'),
    attributesType,
    imageIdentificationFieldLength: fileInfo.imageIdentificationFieldLength,
    topToBottom: fileInfo.isTopToBottom(),
    colorMapOrigin: fileInfo.colorMapOrigin,
    colorMapLength: fileInfo.colorMapLength,
    colorMapPixelSize: fileInfo.colorMapPixelSize,
    extensionOffset: fileInfo.extensionOffset,
    authorName: fileInfo.authorName,
    authorComments: fileInfo.authorComments,
    dateTimeStamp: fileInfo.dateTimeStamp?.toString(),
    jobId: fileInfo.jobId,
    jobTime: fileInfo.jobTime,
    softwareId: fileInfo.softwareId,
    softwareVersion: fileInfo.softwareVersion,
    keyColor: fileInfo.keyColor,
    aspectRatio: fileInfo.aspectRatio,
    gammaValue: fileInfo.gammaValue,
    colorCorrectionOffset: fileInfo.colorCorrectionOffset,
    postageStampOffset: fileInfo.postageStampOffset,
    scanLineOffset: fileInfo.scanLineOffset,
    processingTook: `${duration} ms`,
  };

  const rows: { [key: string]: string } = {};

  for (const [key, value] of Object.entries(stats)) {
    if (value === undefined) {
      continue;
    }

    const firsCharacter = key[0];
    const field = `${firsCharacter.toUpperCase()}${key
      .replace(/(?!\b[A-Z])([A-Z])/g, ' $1')
      .substring(1)}`;

    if (typeof value === 'boolean') {
      rows[field] = value ? 'Yes' : 'No';
      continue;
    }

    if (key === 'keyColor' && fileInfo.keyColor) {
      const { red, green, blue, alpha } = fileInfo.keyColor;
      rows[field] = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
      continue;
    }

    rows[field] = value as string;
  }

  return rows;
}
