import { ImageType, Color, ImageDescriptorFields } from './types';
import { decodeRunLengthEncoding } from './RLE-Decoder';
import { concatArrayBuffers } from './utils';

export default class TGAImage {
  private static GRID_SIZE = 30;

  #arrayBuffer: ArrayBuffer;
  private dataView: DataView;
  private bytes: Uint8Array;

  colorMapType: number;
  imageType: ImageType;
  xOrigin: number;
  yOrigin: number;
  imageWidth: number;
  imageHeight: number;
  pixelSize: number;
  imageDescriptor: number;
  imageIdentificationFieldLength: number;
  imageDataFieldOffset: number;
  colorMapOrigin: number;
  colorMapLength: number;
  colorMapPixelSize: number;
  extensionOffset: number;
  version: 1|2;
  durations: { RLEDecodeDuration: number, CanvasDrawDuration: number } = {
    RLEDecodeDuration: 0,
    CanvasDrawDuration: 0,
  };

  get arrayBuffer() {
    return this.#arrayBuffer;
  }

  set arrayBuffer(arrayBuffer: ArrayBuffer) {
    this.#arrayBuffer = arrayBuffer;
    this.dataView = new DataView(arrayBuffer);
    this.bytes = new Uint8Array(arrayBuffer);
  }

  constructor(arrayBuffer: ArrayBuffer) {
    this.arrayBuffer = arrayBuffer;
    this.imageIdentificationFieldLength = this.bytes[0];
    this.colorMapType = this.bytes[1];
    this.imageType = this.bytes[2];
    this.colorMapOrigin = this.dataView.getUint16(3, true);
    this.colorMapLength = this.dataView.getUint16(5, true);
    this.colorMapPixelSize = this.bytes[7] / 8;
    this.xOrigin = this.bytes[8];
    this.yOrigin = this.bytes[10];
    this.imageWidth = this.dataView.getUint16(12, true);
    this.imageHeight = this.dataView.getUint16(14, true);
    this.pixelSize = this.bytes[16] / 8;
    this.imageDescriptor = this.bytes[17];
    this.imageDataFieldOffset = this.getImageDataFieldOffset();
    this.detectVersion();

    if (this.imageType > 8) {
      const begin = performance.now();
      this.decodeRunLengthEncoding();
      const end = performance.now();
      this.durations.RLEDecodeDuration = end - begin;
    }

    if (this.version === 2) {
      this.extensionOffset = this.dataView.getUint32(this.dataView.byteLength - 26, true);
    }
  }

  private detectVersion() {
    const v2Footer =  'TRUEVISION-XFILE.\0';
    const footer = this.arrayBuffer.slice(-18);
    const textDecoder = new TextDecoder();
    const footerStr = textDecoder.decode(footer);
    this.version = footerStr === v2Footer ? 2 : 1;
  }

  private decodeRunLengthEncoding() {
    // Slice Image Data and decode RLE
    const decodedArrayBuffer = decodeRunLengthEncoding(
      this.arrayBuffer.slice(this.imageDataFieldOffset),
      this.imageWidth,
      this.imageHeight,
      this.pixelSize
    );

    switch (this.version) {
      case 1: {
        const header = this.arrayBuffer.slice(0, this.imageDataFieldOffset);
        this.arrayBuffer = concatArrayBuffers(header, decodedArrayBuffer);
        break;
      }

      case 2: {
        const header = this.arrayBuffer.slice(0, this.imageDataFieldOffset);
        let footer;
        
        if (this.extensionOffset !== 0) {
          footer = this.arrayBuffer.slice(this.extensionOffset);
        } else {
          footer = this.arrayBuffer.slice(-26);
        }

        this.arrayBuffer = concatArrayBuffers(header, decodedArrayBuffer, footer);
        break;
      }

      // no default
    }
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

  isTopToBottom(): boolean {
    return (this.imageDescriptor & ImageDescriptorFields.TOP_TO_BOTTOM) === ImageDescriptorFields.TOP_TO_BOTTOM;
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
        offset = this.bytes[offset];
      }

      return 18 + this.imageIdentificationFieldLength + this.colorMapOrigin + offset * this.colorMapPixelSize;
    }

    throw new Error(`Color map type ${this.colorMapType} is not supported`);
  }

  private getPixelColor( x: number, y: number): Color {
    const pixelSize = this.colorMapType === 0 ? this.pixelSize : this.colorMapPixelSize;
    const offset = this.getPixelOffset(x, y);

    switch (pixelSize) {
      case 1: {
        const value = this.bytes[offset];
        return { red: value, green: value, blue: value, alpha: 255 };
      }

      case 3: {
        const blue = this.bytes[offset];
        const green = this.bytes[offset + 1];
        const red = this.bytes[offset + 2];

        // canvas requires an alpha value. Sending 255 for a fully opaque pixel.
        return { red, green, blue, alpha: 255 };
      }

      case 4: {
        const blue = this.bytes[offset];
        const green = this.bytes[offset + 1];
        const red = this.bytes[offset + 2];
        const alpha = this.bytes[offset + 3];
        return { blue, green, red, alpha };
      }

      default:
        throw new Error(`Pixel Size (${this.pixelSize}) is not supported!`);
    }
  }

  static getCanvasBackgroundColor(x: number, y: number): Color {
    const evenX = Math.floor(x / this.GRID_SIZE) % 2 === 0;
    const evenY = Math.floor(y / this.GRID_SIZE) % 2 === 0;

    if (Number(evenX) ^ Number(evenY)) {
      return { red: 100, green: 100, blue: 100, alpha: 255 };
    }

    return { red: 180, green: 180, blue: 180, alpha: 255 };
  }

  static blendColors(backgroundColor: Color, color: Color): Color {
    const colorPercentage = color.alpha / 255;
    const bgPercentage = 1 - colorPercentage;

    return {
      red: Math.min(255, color.red * colorPercentage + backgroundColor.red * bgPercentage),
      green: Math.min(255, color.green * colorPercentage + backgroundColor.green * bgPercentage),
      blue: Math.min(255, color.blue * colorPercentage + backgroundColor.blue * bgPercentage),
      alpha: 255,
    };
  }

  draw(canvas: HTMLCanvasElement) {
    const begin = performance.now();
    const context = canvas.getContext('2d');

    if (!context) {
      alert('Failed to get canvas context');
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = this.imageWidth;
    canvas.height = this.imageHeight;

    const imageData = context.createImageData(this.imageWidth, this.imageHeight);

    for (let y = 0; y < this.imageHeight; ++y) {
      for (let x = 0; x < this.imageWidth; ++x) {
        const color = this.getPixelColor(x, y);
        const canvasOffset = y * this.imageWidth * 4 + x * 4;

        const backgroundColor = TGAImage.getCanvasBackgroundColor(x, y);
        const blended = TGAImage.blendColors(backgroundColor, color);

        imageData.data[canvasOffset] = blended.red;
        imageData.data[canvasOffset + 1] = blended.green;
        imageData.data[canvasOffset + 2] = blended.blue;
        imageData.data[canvasOffset + 3] = blended.alpha;
      }
    }

    context.putImageData(imageData, 0, 0);
    const end = performance.now();
    this.durations.CanvasDrawDuration = end - begin;
  }
}
