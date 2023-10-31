class RLEDecoder {
  private decodedArrayBuffer: ArrayBuffer;
  private readerBytes: Uint8Array;
  private writerBytes: Uint8Array;
  private pixelSize: number;

  private readCursor = 0;
  private writeCursor = 0;

  constructor(
    arrayBuffer: ArrayBuffer,
    width: number,
    height: number,
    pixelSize: number
  ) {
    this.decodedArrayBuffer = new ArrayBuffer(width * height * pixelSize);
    this.readerBytes = new Uint8Array(arrayBuffer);
    this.writerBytes = new Uint8Array(this.decodedArrayBuffer);
    this.pixelSize = pixelSize;
  }

  private read(): number {
    const packet = this.readerBytes[this.readCursor];
    this.readCursor += 1;
    return packet;
  }

  private write(value: number) {
    this.writerBytes[this.writeCursor] = value;
    this.writeCursor += 1;
  }

  private readNextPixel(): number[] {
    const arr: number[] = [];

    for (let i = 0; i < this.pixelSize; ++i) {
      arr.push(this.read());
    }

    return arr;
  }

  private writePixel(pixel: number[]) {
    for (const byte of pixel) {
      this.write(byte);
    }
  }

  decode(): ArrayBuffer {
    while (this.writeCursor < this.writerBytes.byteLength) {
      const packet = this.read();

      // RLE packet
      if (packet >= 128) {
        const repetition = packet - 128;
        const nextPixel = this.readNextPixel();

        for (let i = 0; i <= repetition; ++i) {
          this.writePixel(nextPixel);
        }
      } else {
        // raw packet
        const repetition = packet;

        for (let i = 0; i <= repetition; ++i) {
          const nextPixel = this.readNextPixel();
          this.writePixel(nextPixel);
        }
      }
    }

    return this.decodedArrayBuffer;
  }
}

export function decodeRunLengthEncoding(
  arrayBuffer: ArrayBuffer,
  width: number,
  height: number,
  pixelSize: number
): ArrayBuffer {
  const decoder = new RLEDecoder(arrayBuffer, width, height, pixelSize);
  return decoder.decode();
}
