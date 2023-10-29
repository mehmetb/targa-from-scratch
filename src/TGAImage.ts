import { ImageType } from './types';
import { decodeRunLengthEncoding } from './RLE-Decoder';

export default class TGAImage {
  private arrayBuffer: ArrayBuffer;
  private dataView: DataView;

  private colorMapType: number;
  private imageType: ImageType;
  private xOrigin: number;
  private yOrigin: number;
  private imageWidth: number;
  private imageHeight: number;
  private pixelSize: number;
  private imageDescriptor: number;
  private imageIdentificationFieldLength: number;
  private imageDataFieldOffset: number;
  private colorMapOrigin: number;
  private colorMapLength: number;
  private colorMapPixelSize: number;

  constructor(arrayBuffer: ArrayBuffer) {
    this.arrayBuffer = arrayBuffer;
    this.dataView = new DataView(arrayBuffer);
    this.colorMapType = this.getColorMapType();
    this.imageType = this.getImageType();
    this.xOrigin = this.getXOrigin();
    this.yOrigin = this.getYOrigin();
    this.imageWidth = this.getImageWidth();
    this.imageHeight = this.getImageHeight();
    this.pixelSize = this.getPixelSize();
    this.imageDescriptor = this.getImageDescriptor();
    this.imageIdentificationFieldLength = this.getImageIdentificationFieldLength();
    this.colorMapOrigin = this.getColorMapOrigin();
    this.colorMapLength = this.getColorMapLength();
    this.colorMapPixelSize = this.getColorMapPixelSize();
    this.imageDataFieldOffset = this.getImageDataFieldOffset();
  }

  private getColorMapType(): number {
    return this.dataView.getUint8(1);
  }

  private getColorMapOrigin(): number {
    return this.dataView.getUint16(3, true);
  }

  private getColorMapLength(): number {
    return this.dataView.getUint16(5, true);
  }

  private getColorMapPixelSize(): number {
    return this.dataView.getUint8(7) / 8;
  }

  private getImageType(): ImageType {
    return this.dataView.getUint8(2);
  }

  private getXOrigin(): number {
    return this.dataView.getUint16(8);
  }

  private getYOrigin(): number {
    return this.dataView.getUint16(10);
  }

  private getImageWidth(): number {
    return this.dataView.getUint16(12, true);
  }

  private getImageHeight(): number {
    return this.dataView.getUint16(14, true);
  }

  private getPixelSize(): number {
    return this.dataView.getUint8(16) / 8;
  }

  private getImageDescriptor(): number {
    return this.dataView.getUint8(17);
  }

  private getImageIdentificationFieldLength(): number {
    return this.dataView.getUint8(0);
  }

  private getImageDataFieldOffset(): number {
    switch (this.colorMapType) {
      case 0:
        return 18 + this.imageIdentificationFieldLength;

      case 1:
        return (
          18 +
          this.imageIdentificationFieldLength +
          this.colorMapLength * this.colorMapPixelSize
        );

      default:
        throw new Error(
          `Color Map Type "${this.colorMapType}" is not supported!`
        );
    }
  }

  private isTopToBottom(): boolean {
    return (4 & this.imageDescriptor) === 4;
  }

  private getPixelOffset(x: number, y: number): number {
    let offset;

    if (this.isTopToBottom()) {
      offset = y * this.imageWidth * this.pixelSize + x * this.pixelSize;
    } else {
      offset =
        (this.imageHeight - y - 1) * this.imageWidth * this.pixelSize +
        x * this.pixelSize;
    }

    offset += this.imageDataFieldOffset;

    if (this.colorMapType === 0) {
      return offset;
    }

    if (this.colorMapType === 1) {
      if (this.pixelSize === 2) {
        offset = this.dataView.getUint16(offset, true);
      } else {
        offset = this.dataView.getUint8(offset);
      }

      return (
        18 +
        this.imageIdentificationFieldLength +
        this.colorMapOrigin +
        offset * this.colorMapPixelSize
      );
    }

    throw new Error(`Color map type ${this.colorMapType} is not supported`);
  }

  private getPixelColor(
    x: number,
    y: number
  ): {
    red: number;
    green: number;
    blue: number;
    alpha: number;
    offset;
  } | null {
    const pixelSize =
      this.colorMapType === 0 ? this.pixelSize : this.colorMapPixelSize;
    const offset = this.getPixelOffset(x, y);

    switch (pixelSize) {
      case 3: {
        const blue = this.dataView.getUint8(offset);
        const green = this.dataView.getUint8(offset + 1);
        const red = this.dataView.getUint8(offset + 2);
        return { red, green, blue, alpha: 255, offset };
      }

      default:
        break;
    }

    return null;
  }

  private decodeRunLengthEncoding() {
    const decodedArrayBuffer = decodeRunLengthEncoding(
      this.arrayBuffer.slice(this.imageDataFieldOffset),
      this.imageWidth,
      this.imageHeight,
      this.pixelSize
    );

    const newArrayBuffer = new ArrayBuffer(
      decodedArrayBuffer.byteLength + this.imageDataFieldOffset
    );
    const newDataView = new DataView(newArrayBuffer);

    for (let i = 0; i < this.imageDataFieldOffset; ++i) {
      const value = this.dataView.getUint8(i);
      newDataView.setUint8(i, value);
    }

    const decodedDataView = new DataView(decodedArrayBuffer);

    for (let i = 0; i < decodedArrayBuffer.byteLength; ++i) {
      const value = decodedDataView.getUint8(i);
      newDataView.setUint8(this.imageDataFieldOffset + i, value);
    }

    this.arrayBuffer = newArrayBuffer;
    this.dataView = newDataView;
  }

  draw(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');

    if (!context) {
      alert('Failed to get canvas context');
      return;
    }

    if (this.imageType > 8) {
      this.decodeRunLengthEncoding();
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = this.imageWidth;
    canvas.height = this.imageHeight;

    const imageData = context.createImageData(
      this.imageWidth,
      this.imageHeight
    );

    for (let y = 0; y < this.imageHeight; ++y) {
      for (let x = 0; x < this.imageWidth; ++x) {
        const color = this.getPixelColor(x, y);

        if (!color) {
          alert('Pixel size is not supported');
          return;
        }

        const canvasOffset = y * this.imageWidth * 4 + x * 4;

        imageData.data[canvasOffset] = color.red;
        imageData.data[canvasOffset + 1] = color.green;
        imageData.data[canvasOffset + 2] = color.blue;
        imageData.data[canvasOffset + 3] = color.alpha;
      }
    }

    context.putImageData(imageData, 0, 0);
  }

  toJSON() {
    return JSON.stringify(this.getStats(), null, 2);
  }

  toTable() {
    const stats = this.getStats();
    const rows: { [key: string]: string } = {};

    for (const [key, value] of Object.entries(stats)) {
      const firsCharacter = key[0];
      const field = `${firsCharacter.toUpperCase()}${key.replace(/([A-Z])/g, ' $1').substring(1)}`;
      rows[field] = value as string;
    }

    return rows;
  }

  getStats() {
    return {
      colorMapType: this.colorMapType,
      imageType: ImageType[this.imageType],
      xOrigin: this.xOrigin,
      yOrigin: this.yOrigin,
      imageWidth: this.imageWidth,
      imageHeight: this.imageHeight,
      pixelSize: this.pixelSize,
      imageDescriptor: this.imageDescriptor.toString(2),
      imageIdentificationFieldLength: this.imageIdentificationFieldLength,
      topToBottom: this.isTopToBottom(),
      colorMapOrigin: this.colorMapOrigin,
      colorMapLength: this.colorMapLength,
      colorMapPixelSize: this.colorMapPixelSize,
    };
  }
}
