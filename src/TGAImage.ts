import { ImageType, Color } from './types';
import { decodeRunLengthEncoding } from './RLE-Decoder';
import { concatArrayBuffers } from './utils';

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
    this.imageIdentificationFieldLength = this.dataView.getUint8(0);
    this.colorMapType = this.dataView.getUint8(1);
    this.imageType = this.dataView.getUint8(2);
    this.colorMapOrigin = this.dataView.getUint16(3, true);
    this.colorMapLength = this.dataView.getUint16(5, true);
    this.colorMapPixelSize = this.dataView.getUint8(7) / 8;
    this.xOrigin = this.dataView.getUint16(8);
    this.yOrigin = this.dataView.getUint16(10);
    this.imageWidth = this.dataView.getUint16(12, true);
    this.imageHeight = this.dataView.getUint16(14, true);
    this.pixelSize = this.dataView.getUint8(16) / 8;
    this.imageDescriptor = this.dataView.getUint8(17);
    this.imageDataFieldOffset = this.getImageDataFieldOffset();
  }

  private getImageDataFieldOffset(): number {
    switch (this.colorMapType) {
      case 0:
        return 18 + this.imageIdentificationFieldLength;

      case 1:
        return 18 + this.imageIdentificationFieldLength + this.colorMapLength * this.colorMapPixelSize;

      default:
        throw new Error(`Color Map Type "${this.colorMapType}" is not supported!`);
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
      offset = (this.imageHeight - y - 1) * this.imageWidth * this.pixelSize + x * this.pixelSize;
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

      return 18 + this.imageIdentificationFieldLength + this.colorMapOrigin + offset * this.colorMapPixelSize;
    }

    throw new Error(`Color map type ${this.colorMapType} is not supported`);
  }

  private getPixelColor( x: number, y: number): Color {
    const pixelSize = this.colorMapType === 0 ? this.pixelSize : this.colorMapPixelSize;
    const offset = this.getPixelOffset(x, y);

    switch (pixelSize) {
      case 3: {
        const blue = this.dataView.getUint8(offset);
        const green = this.dataView.getUint8(offset + 1);
        const red = this.dataView.getUint8(offset + 2);

        // canvas requires an alpha value. Sending 255 for a fully opaque pixel.
        return { red, green, blue, alpha: 255 };
      }

      default:
        throw new Error(`Pixel Size (${this.pixelSize}) is not supported!`);
    }
  }

  private decodeRunLengthEncoding() {
    // Slice Image Data and decode RLE
    const decodedArrayBuffer = decodeRunLengthEncoding(
      this.arrayBuffer.slice(this.imageDataFieldOffset),
      this.imageWidth,
      this.imageHeight,
      this.pixelSize
    );

    const header = this.arrayBuffer.slice(0, this.imageDataFieldOffset);
    this.arrayBuffer = concatArrayBuffers(header, decodedArrayBuffer);
    this.dataView = new DataView(this.arrayBuffer);
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

    const imageData = context.createImageData(this.imageWidth, this.imageHeight);

    for (let y = 0; y < this.imageHeight; ++y) {
      for (let x = 0; x < this.imageWidth; ++x) {
        const color = this.getPixelColor(x, y);
        const canvasOffset = y * this.imageWidth * 4 + x * 4;

        imageData.data[canvasOffset] = color.red;
        imageData.data[canvasOffset + 1] = color.green;
        imageData.data[canvasOffset + 2] = color.blue;
        imageData.data[canvasOffset + 3] = color.alpha;
      }
    }

    context.putImageData(imageData, 0, 0);
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
