export function decodeRunLengthEncoding(
  readArray: Uint8Array,
  writeArray: Uint8Array,
  pixelSize: number,
): void {
  console.time('decode loop');
  const readArrayLength = readArray.byteLength;
  let readCursor = 0;
  let writeCursor = 0;
  let byte1;
  let byte2;
  let byte3;
  let byte4;

  for (let i = 0; i < readArrayLength; ++i) {
    const packet = readArray[readCursor++];

    // RLE packet
    if (packet >= 128) {
      const repetition = packet - 128;
      byte1 = readArray[readCursor++];

      if (pixelSize > 2) {
        byte2 = readArray[readCursor++];
        byte3 = readArray[readCursor++];
      }

      if (pixelSize > 3) {
        byte4 = readArray[readCursor++];
      }

      for (let i = 0; i <= repetition; ++i) {
        writeArray[writeCursor++] = byte1;

        if (pixelSize > 2) {
          writeArray[writeCursor++] = byte2;
          writeArray[writeCursor++] = byte3;
        }

        if (pixelSize > 3) {
          writeArray[writeCursor++] = byte4;
        }
      }
    } else {
      // raw packet
      const repetition = packet;

      for (let i = 0; i <= repetition; ++i) {
        writeArray[writeCursor++] = readArray[readCursor++];

        if (pixelSize > 2) {
          writeArray[writeCursor++] = readArray[readCursor++];
          writeArray[writeCursor++] = readArray[readCursor++];
        }

        if (pixelSize > 3) {
          writeArray[writeCursor++] = readArray[readCursor++];
        }
      }
    }
  }

  console.timeEnd('decode loop');
}
