import { ImageType, ImageDescriptorFields } from './types';

export class ImageStats {
  #arrayBuffer: ArrayBuffer;
  private dataView: DataView;
  private bytes: Uint8Array;

  rleEncoded: boolean = false;

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
  version: 1 | 2;
  topToBottom: boolean;
  duration: number = 0;

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

    if (this.version === 2) {
      this.extensionOffset = this.dataView.getUint32(this.dataView.byteLength - 26, true);
    }

    this.topToBottom = this.isTopToBottom();

    if (
      this.imageType === ImageType.RUN_LENGTH_ENCODED_COLOR_MAPPED ||
      this.imageType === ImageType.RUN_LENGTH_ENCODED_GRAY_SCALE ||
      this.imageType === ImageType.RUN_LENGTH_ENCODED_TRUE_COLOR
    ) {
      this.rleEncoded = true;
    }
  }

  private getImageDataFieldOffset(): number {
    switch (this.colorMapType) {
      case 0:
        return 18 + this.imageIdentificationFieldLength;

      case 1:
        return (
          18 + this.imageIdentificationFieldLength + this.colorMapLength * this.colorMapPixelSize
        );

      default:
        throw new Error(`Color Map Type "${this.colorMapType}" is not supported!`);
    }
  }

  private detectVersion() {
    const v2Footer = 'TRUEVISION-XFILE.\0';
    const footer = this.arrayBuffer.slice(-18);
    const textDecoder = new TextDecoder();
    const footerStr = textDecoder.decode(footer);
    this.version = footerStr === v2Footer ? 2 : 1;
  }

  isTopToBottom(): boolean {
    return (
      (this.imageDescriptor & ImageDescriptorFields.TOP_TO_BOTTOM) ===
      ImageDescriptorFields.TOP_TO_BOTTOM
    );
  }

  getFooterOffset(): number {
    if (this.version === 2) {
      if (this.extensionOffset !== 0) {
        return this.extensionOffset;
      }

      return this.arrayBuffer.byteLength - 26;
    }

    return this.arrayBuffer.byteLength;
  }
}
