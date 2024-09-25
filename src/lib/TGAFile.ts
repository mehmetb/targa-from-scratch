import ImageFileInfo from './ImageFileInfo';

export default class TGAFile {
  #arrayBuffer: ArrayBuffer;
  bytes: Uint8Array;
  dataView: DataView;

  imageDataBytes: Uint8Array;

  fileInfo: ImageFileInfo;

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
    this.fileInfo = new ImageFileInfo(arrayBuffer);

    if (this.fileInfo.rleEncoded) {
      this.imageDataBytes = this.bytes.subarray(
        this.fileInfo.imageDataFieldOffset,
        this.fileInfo.getFooterOffset(),
      );
    } else {
      this.imageDataBytes = this.bytes.subarray(this.fileInfo.imageDataFieldOffset);
    }
  }
}
