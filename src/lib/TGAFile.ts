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
