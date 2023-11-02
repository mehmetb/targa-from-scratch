class RLEDecoder {
  private readArray: Uint8Array;
  private writeArray: Uint8Array;
  private pixelSize: number;

  private readCursor = 0;
  private writeCursor = 0;

  constructor(
    readArray: Uint8Array,
    writeArray: Uint8Array,
    pixelSize: number
  ) {
    this.readArray = readArray;
    this.writeArray = writeArray;
    this.pixelSize = pixelSize;
  }

  private read(): number {
    return this.readArray[this.readCursor++];
  }

  private write(value: number) {
    this.writeArray[this.writeCursor++] = value;
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

  decode(): void {
    console.time('decode loop');
    const readArrayLength = this.readArray.byteLength;

    for (let i = 0; i < readArrayLength; ++i) {
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

    console.timeEnd('decode loop');
  }
}

export function decodeRunLengthEncoding(
  readArray: Uint8Array,
  writeArray: Uint8Array,
  pixelSize: number
): void {
  const decoder = new RLEDecoder(readArray, writeArray, pixelSize);
  decoder.decode();
}
