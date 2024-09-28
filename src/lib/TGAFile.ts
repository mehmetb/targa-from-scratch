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

import ImageFileInfo from './ImageFileInfo';

export default class TGAFile {
  imageDataBytes: Uint8Array;

  fileInfo: ImageFileInfo;

  bytes: Uint8Array;

  dataView: DataView;

  constructor(arrayBuffer: ArrayBuffer) {
    this.fileInfo = new ImageFileInfo(arrayBuffer);

    this.bytes = this.fileInfo.bytes;
    this.dataView = this.fileInfo.dataView;

    if (this.fileInfo.rleEncoded) {
      this.imageDataBytes = this.fileInfo.bytes.subarray(
        this.fileInfo.imageDataFieldOffset,
        this.fileInfo.getFooterOffset(),
      );
    } else {
      this.imageDataBytes = this.fileInfo.bytes.subarray(this.fileInfo.imageDataFieldOffset);
    }
  }
}
