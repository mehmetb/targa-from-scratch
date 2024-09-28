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

import { ImageType, ImageDescriptorFields, AttributesType } from './types';

export default class ImageFileInfo {
  #arrayBuffer: ArrayBuffer = new ArrayBuffer(0);
  #dataView: DataView = new DataView(this.#arrayBuffer);
  #bytes: Uint8Array = new Uint8Array(this.#arrayBuffer);

  rleEncoded: boolean = false;
  hasTransparency: boolean = false;

  colorMapType: number;
  imageType: ImageType;
  xOrigin: number;
  yOrigin: number;
  imageWidth: number;
  imageHeight: number;
  pixelSize: number;
  pixelSizeRaw: number;
  imageDescriptor: number;
  imageIdentificationFieldLength: number;
  imageDataFieldOffset: number;
  colorMapOrigin: number;
  colorMapLength: number;
  colorMapPixelSize: number;
  extensionOffset: number = 0;
  version: 1 | 2 = 1;
  topToBottom: boolean;

  authorName: string|undefined;
  authorComments: string|undefined;
  dateTimeStamp: Date|undefined;
  jobId: string|undefined;
  jobTime: string|undefined;
  softwareId: string|undefined;
  softwareVersion: string|undefined;
  keyColor: { red: number, green: number, blue: number, alpha: number }|undefined;
  aspectRatio: string|undefined;
  gammaValue: string|undefined;
  colorCorrectionOffset: number|undefined;
  postageStampOffset: number|undefined;
  scanLineOffset: number|undefined;
  attributesType: AttributesType|undefined;

  get bytes() {
    return this.#bytes;
  }

  get dataView() {
    return this.#dataView;
  }

  get arrayBuffer() {
    return this.#arrayBuffer;
  }

  set arrayBuffer(arrayBuffer: ArrayBuffer) {
    this.#arrayBuffer = arrayBuffer;
    this.#dataView = new DataView(arrayBuffer);
    this.#bytes = new Uint8Array(arrayBuffer);
  }

  constructor(arrayBuffer: ArrayBuffer) {
    this.arrayBuffer = arrayBuffer;
    this.imageIdentificationFieldLength = this.#bytes[0];
    this.colorMapType = this.#bytes[1];
    this.imageType = this.#bytes[2];
    this.colorMapOrigin = this.#dataView.getUint16(3, true);
    this.colorMapLength = this.#dataView.getUint16(5, true);
    this.colorMapPixelSize = this.#bytes[7] / 8;
    this.xOrigin = this.#bytes[8];
    this.yOrigin = this.#bytes[10];
    this.imageWidth = this.#dataView.getUint16(12, true);
    this.imageHeight = this.#dataView.getUint16(14, true);
    this.pixelSize = this.#bytes[16] / 8;
    this.pixelSizeRaw = this.#bytes[16];
    this.imageDescriptor = this.#bytes[17];
    this.imageDataFieldOffset = this.getImageDataFieldOffset();
    this.detectVersion();

    if (this.version === 2) {
      this.extensionOffset = this.#dataView.getUint32(this.#dataView.byteLength - 26, true);

      if (this.extensionOffset !== 0) {
        this.readExtension();
      }
    }

    this.topToBottom = this.isTopToBottom();

    if (
      this.imageType === ImageType.RUN_LENGTH_ENCODED_COLOR_MAPPED ||
      this.imageType === ImageType.RUN_LENGTH_ENCODED_GRAY_SCALE ||
      this.imageType === ImageType.RUN_LENGTH_ENCODED_TRUE_COLOR
    ) {
      this.rleEncoded = true;
    }

    this.hasTransparency = this.pixelSize === 4
      || this.colorMapPixelSize === 4
      || (
        this.pixelSize === 2
        && (
          this.imageType === ImageType.GRAY_SCALE
          || this.imageType === ImageType.RUN_LENGTH_ENCODED_GRAY_SCALE
        )
      );
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

  readExtension() {
    const extensionSize = this.#dataView.getUint16(this.extensionOffset, true);

    if (extensionSize !== 495) {
      console.warn('Not a valid TGA extension');
      return;
    }

    const EO = this.extensionOffset;
    const textDecoder = new TextDecoder();

    const readString = (startOffset: number, endOffset: number): string => {
      const buffer = this.#bytes.subarray(startOffset, endOffset);
      return textDecoder.decode(buffer);
    }

    const readShorts = (startOffset: number, numberOfShortsToRead: number): number[] => {
      const shorts: number[] = [];
      const endOffset = startOffset + numberOfShortsToRead * 2;

      for (let offset = startOffset; offset < endOffset; offset += 2) {
        shorts.push(this.#dataView.getUint16(offset, true));
      }
      
      return shorts;
    }

    this.authorName = readString(EO + 1, EO + 42);
    this.authorComments = readString(EO + 42, EO + 366);
    this.jobId = readString(EO + 379, EO + 419);

    this.softwareId = readString(EO + 426, EO + 466);

    const softwareVersion = this.#dataView.getUint16(EO + 467, true);
    const softwareVersionLetter = String.fromCharCode(this.#dataView.getUint8(EO + 469));
    const softwareVersionUnused = softwareVersion === 0 && softwareVersionLetter === ' ';

    if (!softwareVersionUnused) {
      this.softwareVersion = `${(softwareVersion / 100).toFixed(2)}${softwareVersionLetter}`;
    }

    const [month, day, year, hour, minute, second] = readShorts(EO + 367, 6);

    if (year !== 0) {
      this.dateTimeStamp = new Date(year, month - 1, day, hour, minute, second);
    }


    this.jobTime = '0';

    const jobTimeStrParts: string[] = [];
    const jobTimeObject = {
      hour: this.#dataView.getUint16(EO + 420, true),
      minute: this.#dataView.getUint16(EO + 422, true),
      second: this.#dataView.getUint16(EO + 424, true),
    }

    for (const [key, value] of Object.entries(jobTimeObject)) {
      if (value > 1) {
        jobTimeStrParts.push(`${value} ${key}s`);
      } else if (value > 0) {
        jobTimeStrParts.push(`${value} ${key}`);
      }
    }

    this.jobTime = jobTimeStrParts.join(' ');

    const blue = this.#bytes[EO + 470];
    const green = this.#bytes[EO + 471];
    const red = this.#bytes[EO + 472];
    const alpha = this.#bytes[EO + 473];
    this.keyColor = { red, green, blue, alpha};

    const [aspectRatioNumerator, aspectRatioDenominator] = readShorts(EO + 474, 2);
    
    if (aspectRatioDenominator !== 0) {
      this.aspectRatio = `${aspectRatioNumerator}/${aspectRatioDenominator}`;
    }

    const [gammaNumerator, gammaDenominator] = readShorts(EO + 478, 2);
    
    if (gammaDenominator !== 0) {
      this.gammaValue = `${gammaNumerator}/${gammaDenominator}`;
    }

    this.colorCorrectionOffset = this.#dataView.getUint32(EO + 482, true);
    this.postageStampOffset = this.#dataView.getUint32(EO + 486, true);
    this.scanLineOffset = this.#dataView.getUint32(EO + 490, true);

    const attr = this.#dataView.getUint8(EO + 494);

    if (AttributesType[attr]) {
      this.attributesType = attr;
    }
  }
}
