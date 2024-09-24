import { ImageType, AttributesType } from './types';
import { ImageStats } from './ImageStats';
import { readHighColor5BitsAndGetAsTrueColor } from './utils';

export default class TGAImage {
  private static GRID_SIZE = 30;

  #arrayBuffer: ArrayBuffer;
  private dataView: DataView;
  private bytes: Uint8Array;

  private imageDataBytes: Uint8Array;

  stats: ImageStats;

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
    this.stats = new ImageStats(arrayBuffer);

    if (this.stats.rleEncoded) {
      this.imageDataBytes = this.bytes.subarray(
        this.stats.imageDataFieldOffset,
        this.stats.getFooterOffset(),
      );
    } else {
      this.imageDataBytes = this.bytes.subarray(this.stats.imageDataFieldOffset);
    }
  }

  private drawUncompressedGrayscale(imageData: ImageData) {
    console.time('uncompressed grayscale loop');
    const { imageHeight, imageWidth, topToBottom, pixelSize } = this.stats;
    const { data } = imageData;
    const { imageDataBytes } = this;
    data.fill(255);

    for (let y = 0; y < imageHeight; ++y) {
      for (let x = 0; x < imageWidth; ++x) {
        switch (pixelSize) {
          case 1: {
            const canvasOffset = topToBottom
              ? y * imageWidth * 4 + x * 4
              : (imageHeight - y - 1) * imageWidth * 4 + x * 4;

            const byteOffset = x + y * imageWidth;
            data[canvasOffset] = imageDataBytes[byteOffset];
            data[canvasOffset + 1] = imageDataBytes[byteOffset];
            data[canvasOffset + 2] = imageDataBytes[byteOffset];
            break;
          }

          case 4: {
            const canvasOffset = topToBottom
              ? y * imageWidth * 4 + x * 4
              : (imageHeight - y - 1) * imageWidth * 4 + x * 4;

            const byteOffset = x + y * imageWidth;
            data[canvasOffset] = imageDataBytes[byteOffset];
            data[canvasOffset + 1] = imageDataBytes[byteOffset];
            data[canvasOffset + 2] = imageDataBytes[byteOffset];
            break;
          }

          default: {
            alert('Unsupported pixel size');
            return;
          }
        }
      }
    }

    console.timeEnd('uncompressed grayscale loop');
  }

  private drawUncompressed(imageData: ImageData) {
    console.time('uncompressed loop');
    const { imageHeight, imageWidth, pixelSize, topToBottom, attributesType, imageType } = this.stats;
    const { data } = imageData;
    const { imageDataBytes } = this;
    const ab = new ArrayBuffer(2);
    const ua = new Uint8Array(ab);
    const dv = new DataView(ab);
    let hasAlpha = true;

    if (
      attributesType &&
      attributesType !== AttributesType.USEFUL_ALPHA_CHANNEL &&
      attributesType !== AttributesType.PREMULTIPLIED_ALPHA
    ) {
      hasAlpha = false;
    }

    for (let y = 0; y < imageHeight; ++y) {
      for (let x = 0; x < imageWidth; ++x) {
        const canvasOffset = topToBottom
          ? y * imageWidth * 4 + x * 4
          : (imageHeight - y - 1) * imageWidth * 4 + x * 4;

        data[canvasOffset + 3] = 255;

        switch (pixelSize) {
          case 2: {
            const byteOffset = y * imageWidth * 2 + x * 2;

            if (imageType === ImageType.GRAY_SCALE) {
              data[canvasOffset + 3] = imageDataBytes[byteOffset + 1];
            } else {
              ua[0] = imageDataBytes[byteOffset];
              ua[1] = imageDataBytes[byteOffset + 1];

              const byteValue = dv.getUint16(0, true);
              data[canvasOffset] = readHighColor5BitsAndGetAsTrueColor(byteValue, 14);
              data[canvasOffset + 1] = readHighColor5BitsAndGetAsTrueColor(byteValue, 9);
              data[canvasOffset + 2] = readHighColor5BitsAndGetAsTrueColor(byteValue, 4);
            }

            break;
          }

          case 3: {
            const byteOffset = y * imageWidth * 3 + x * 3;
            data[canvasOffset] = imageDataBytes[byteOffset + 2];
            data[canvasOffset + 1] = imageDataBytes[byteOffset + 1];
            data[canvasOffset + 2] = imageDataBytes[byteOffset];
            break;
          }

          case 4: {
            const byteOffset = y * imageWidth * 4 + x * 4;
            data[canvasOffset] = imageDataBytes[byteOffset + 2];
            data[canvasOffset + 1] = imageDataBytes[byteOffset + 1];
            data[canvasOffset + 2] = imageDataBytes[byteOffset];

            if (hasAlpha) {
              data[canvasOffset + 3] = imageDataBytes[byteOffset + 3];
            }

            break;
          }
        }
      }
    }

    console.timeEnd('uncompressed loop');
  }

  private drawRunLengthEncoded(imageData: ImageData) {
    console.time('run length encoded loop');
    const { imageHeight, imageWidth, pixelSize, topToBottom, attributesType, imageType } = this.stats;
    const { data } = imageData;
    const { imageDataBytes } = this;
    const readArrayLength = imageDataBytes.length;
    const ab = new ArrayBuffer(2);
    const ua = new Uint8Array(ab);
    const dv = new DataView(ab);
    let hasAlpha = true;
    let readCursor = 0;
    let x = 0;
    let y = 0;
    let byte1;
    let byte2;
    let byte3;
    let byte4;

    if (
      attributesType &&
      attributesType !== AttributesType.USEFUL_ALPHA_CHANNEL &&
      attributesType !== AttributesType.PREMULTIPLIED_ALPHA
    ) {
      hasAlpha = false;
    }

    for (let i = 0; i < readArrayLength; ++i) {
      const packet = imageDataBytes[readCursor++];

      // RLE packet
      if (packet >= 128) {
        const repetition = packet - 128;

        switch (pixelSize) {
          case 1:
            byte1 = imageDataBytes[readCursor++];
            break;

          case 2:
            byte1 = imageDataBytes[readCursor++];
            byte2 = imageDataBytes[readCursor++];
            break;

          case 3:
            byte1 = imageDataBytes[readCursor++];
            byte2 = imageDataBytes[readCursor++];
            byte3 = imageDataBytes[readCursor++];
            break;

          case 4:
            byte1 = imageDataBytes[readCursor++];
            byte2 = imageDataBytes[readCursor++];
            byte3 = imageDataBytes[readCursor++];
            byte4 = imageDataBytes[readCursor++];
            break;
        }

        for (let i = 0; i <= repetition; ++i) {
          const canvasOffset = topToBottom
            ? y * imageWidth * 4 + x * 4
            : (imageHeight - y - 1) * imageWidth * 4 + x * 4;

          data[canvasOffset + 3] = 255;

          switch (pixelSize) {
            case 1: {
              data[canvasOffset] = byte1;
              data[canvasOffset + 1] = byte1;
              data[canvasOffset + 2] = byte1;
              break;
            }

            case 2: {
              if (imageType === ImageType.RUN_LENGTH_ENCODED_GRAY_SCALE) {
                data[canvasOffset + 3] = byte2;
              } else {
                ua[0] = byte1;
                ua[1] = byte2;
                const byteValue = dv.getUint16(0, true);
                data[canvasOffset] = readHighColor5BitsAndGetAsTrueColor(byteValue, 14);
                data[canvasOffset + 1] = readHighColor5BitsAndGetAsTrueColor(byteValue, 9);
                data[canvasOffset + 2] = readHighColor5BitsAndGetAsTrueColor(byteValue, 4);
              }
              break;
            }

            case 3: {
              data[canvasOffset] = byte3;
              data[canvasOffset + 1] = byte2;
              data[canvasOffset + 2] = byte1;
              break;
            }

            case 4: {
              data[canvasOffset] = byte3;
              data[canvasOffset + 1] = byte2;
              data[canvasOffset + 2] = byte1;

              if (hasAlpha) {
                data[canvasOffset + 3] = byte4;
              }

              break;
            }
          }

          if (x === imageWidth - 1) {
            x = 0;
            y += 1;
          } else {
            x += 1;
          }
        }
      } else {
        // raw packet
        const repetition = packet;

        for (let i = 0; i <= repetition; ++i) {
          const canvasOffset = topToBottom
            ? y * imageWidth * 4 + x * 4
            : (imageHeight - y - 1) * imageWidth * 4 + x * 4;

          data[canvasOffset + 3] = 255;

          switch (pixelSize) {
            case 1: {
              data[canvasOffset] = imageDataBytes[readCursor];
              data[canvasOffset + 1] = imageDataBytes[readCursor];
              data[canvasOffset + 2] = imageDataBytes[readCursor];
              readCursor += 1;
              break;
            }

            case 2: {
              if (imageType === ImageType.RUN_LENGTH_ENCODED_GRAY_SCALE) {
                readCursor += 1;
                data[canvasOffset + 3] = imageDataBytes[readCursor++];
              } else {
                ua[0] = imageDataBytes[readCursor++];
                ua[1] = imageDataBytes[readCursor++];
                const byteValue = dv.getUint16(0, true);
                data[canvasOffset] = readHighColor5BitsAndGetAsTrueColor(byteValue, 14);
                data[canvasOffset + 1] = readHighColor5BitsAndGetAsTrueColor(byteValue, 9);
                data[canvasOffset + 2] = readHighColor5BitsAndGetAsTrueColor(byteValue, 4);
              }
              break;
            }

            case 3: {
              data[canvasOffset] = imageDataBytes[readCursor + 2];
              data[canvasOffset + 1] = imageDataBytes[readCursor + 1];
              data[canvasOffset + 2] = imageDataBytes[readCursor];
              readCursor += 3;
              break;
            }

            case 4: {
              data[canvasOffset] = imageDataBytes[readCursor + 2];
              data[canvasOffset + 1] = imageDataBytes[readCursor + 1];
              data[canvasOffset + 2] = imageDataBytes[readCursor];

              if (hasAlpha) {
                data[canvasOffset + 3] = imageDataBytes[readCursor + 3];
              }

              readCursor += 4;
              break;
            }
          }

          if (x === imageWidth - 1) {
            x = 0;
            y += 1;
          } else {
            x += 1;
          }
        }
      }
    }
    console.timeEnd('run length encoded loop');
  }

  private drawColorMapped(imageData: ImageData) {
    console.time('color mapped loop');
    const {
      imageHeight,
      imageWidth,
      pixelSize,
      topToBottom,
      colorMapPixelSize,
      colorMapOrigin,
      imageIdentificationFieldLength,
      imageDataFieldOffset,
    } = this.stats;
    const { data } = imageData;
    const { imageDataBytes, bytes, dataView } = this;
    const padding = 18 + imageIdentificationFieldLength + colorMapOrigin;

    for (let y = 0; y < imageHeight; ++y) {
      for (let x = 0; x < imageWidth; ++x) {
        const canvasOffset = topToBottom
          ? y * imageWidth * 4 + x * 4
          : (imageHeight - y - 1) * imageWidth * 4 + x * 4;

        data[canvasOffset + 3] = 255;

        const byteOffset = y * imageWidth * pixelSize + x * pixelSize;
        const colorMapEntryOffset =
          padding +
          colorMapPixelSize *
            (pixelSize === 1
              ? imageDataBytes[byteOffset]
              : dataView.getUint16(imageDataFieldOffset + byteOffset, true));

        switch (colorMapPixelSize) {
          case 1: {
            data[canvasOffset] = bytes[colorMapEntryOffset];
            data[canvasOffset + 1] = bytes[colorMapEntryOffset];
            data[canvasOffset + 2] = bytes[colorMapEntryOffset];
            break;
          }

          case 2: {
            const byteValue = dataView.getUint16(colorMapEntryOffset, true);
            data[canvasOffset] = readHighColor5BitsAndGetAsTrueColor(byteValue, 14);
            data[canvasOffset + 1] = readHighColor5BitsAndGetAsTrueColor(byteValue, 9);
            data[canvasOffset + 2] = readHighColor5BitsAndGetAsTrueColor(byteValue, 4);
            break;
          }

          case 3: {
            data[canvasOffset] = bytes[colorMapEntryOffset + 2];
            data[canvasOffset + 1] = bytes[colorMapEntryOffset + 1];
            data[canvasOffset + 2] = bytes[colorMapEntryOffset];
            break;
          }

          case 4: {
            data[canvasOffset] = bytes[colorMapEntryOffset + 2];
            data[canvasOffset + 1] = bytes[colorMapEntryOffset + 1];
            data[canvasOffset + 2] = bytes[colorMapEntryOffset];
            data[canvasOffset + 3] = bytes[colorMapEntryOffset + 3];
            break;
          }
        }
      }
    }

    console.timeEnd('color mapped loop');
  }

  private drawRunLengthEncodedColorMapped(imageData: ImageData) {
    console.time('run length encoded color mapped loop');
    const { imageHeight, imageWidth, pixelSize, topToBottom, imageIdentificationFieldLength, colorMapOrigin, imageDataFieldOffset, colorMapPixelSize } = this.stats;
    const { data } = imageData;
    const { imageDataBytes, bytes, dataView } = this;
    const readArrayLength = imageDataBytes.length;
    const padding = 18 + imageIdentificationFieldLength + colorMapOrigin;
    let readCursor = 0;
    let x = 0;
    let y = 0;
    let byte1 = 0;
    let byte2 = 0;
    let byte3 = 0;
    let byte4 = 0;
    let colorMapEntryOffset: number = 0;

    for (let i = 0; i < readArrayLength; ++i) {
      const packet = imageDataBytes[readCursor++];

      // RLE packet
      if (packet >= 128) {
        if (pixelSize === 1) {
          colorMapEntryOffset = padding + colorMapPixelSize * imageDataBytes[readCursor++];
        } else {
          colorMapEntryOffset = padding + colorMapPixelSize * dataView.getUint16(imageDataFieldOffset + readCursor, true);
          readCursor += 2;
        }

        const repetition = packet - 128;
        byte1 = bytes[colorMapEntryOffset];

        if (colorMapPixelSize > 2) {
          byte2 = bytes[colorMapEntryOffset + 1];
          byte3 = bytes[colorMapEntryOffset + 2];
        }

        if (colorMapPixelSize > 3) {
          byte4 = bytes[colorMapEntryOffset + 3];
        }

        for (let i = 0; i <= repetition; ++i) {
          const canvasOffset = topToBottom
            ? y * imageWidth * 4 + x * 4
            : (imageHeight - y - 1) * imageWidth * 4 + x * 4;

          data[canvasOffset + 3] = 255;

          switch (colorMapPixelSize) {
            case 1: {
              data[canvasOffset] = byte1;
              data[canvasOffset + 1] = byte1;
              data[canvasOffset + 2] = byte1;
              break;
            }

            case 2: {
              const byteValue = dataView.getUint16(colorMapEntryOffset, true);
              data[canvasOffset] = readHighColor5BitsAndGetAsTrueColor(byteValue, 14);
              data[canvasOffset + 1] = readHighColor5BitsAndGetAsTrueColor(byteValue, 9);
              data[canvasOffset + 2] = readHighColor5BitsAndGetAsTrueColor(byteValue, 4);
              break;
            }

            case 3: {
              data[canvasOffset] = byte3;
              data[canvasOffset + 1] = byte2;
              data[canvasOffset + 2] = byte1;
              break;
            }

            case 4: {
              data[canvasOffset] = byte3;
              data[canvasOffset + 1] = byte2;
              data[canvasOffset + 2] = byte1;
              data[canvasOffset + 3] = byte4;
              break;
            }
          }

          if (x === imageWidth - 1) {
            x = 0;
            y += 1;
          } else {
            x += 1;
          }
        }
      } else {
        // raw packet
        const repetition = packet;

        for (let i = 0; i <= repetition; ++i) {
          const canvasOffset = topToBottom
            ? y * imageWidth * 4 + x * 4
            : (imageHeight - y - 1) * imageWidth * 4 + x * 4;

          if (pixelSize === 1) {
            colorMapEntryOffset = padding + colorMapPixelSize * imageDataBytes[readCursor++];
          } else {
            colorMapEntryOffset = padding + colorMapPixelSize * dataView.getUint16(imageDataFieldOffset + readCursor, true);
            readCursor += 2;
          }

          data[canvasOffset + 3] = 255;

          switch (colorMapPixelSize) {
            case 1: {
              data[canvasOffset] = bytes[colorMapEntryOffset];
              data[canvasOffset + 1] = bytes[colorMapEntryOffset];
              data[canvasOffset + 2] = bytes[colorMapEntryOffset];
              break;
            }

            case 2: {
              const byteValue = dataView.getUint16(colorMapEntryOffset, true);
              data[canvasOffset] = readHighColor5BitsAndGetAsTrueColor(byteValue, 14);
              data[canvasOffset + 1] = readHighColor5BitsAndGetAsTrueColor(byteValue, 9);
              data[canvasOffset + 2] = readHighColor5BitsAndGetAsTrueColor(byteValue, 4);
              break;
            }

            case 3: {
              data[canvasOffset] = bytes[colorMapEntryOffset + 2];
              data[canvasOffset + 1] = bytes[colorMapEntryOffset + 1];
              data[canvasOffset + 2] = bytes[colorMapEntryOffset];
              break;
            }

            case 4: {
              data[canvasOffset] = bytes[colorMapEntryOffset + 2];
              data[canvasOffset + 1] = bytes[colorMapEntryOffset + 1];
              data[canvasOffset + 2] = bytes[colorMapEntryOffset];
              data[canvasOffset + 3] = bytes[colorMapEntryOffset + 3];
              break;
            }
          }

          if (x === imageWidth - 1) {
            x = 0;
            y += 1;
          } else {
            x += 1;
          }
        }
      }
    }

    console.timeEnd('run length encoded color mapped loop');
  }

  async draw(canvas: HTMLCanvasElement) {
    console.time('draw');
    const context = canvas.getContext('2d');

    if (!context) {
      alert('Failed to get canvas context');
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = this.stats.imageWidth;
    canvas.height = this.stats.imageHeight;
    context.fillStyle = 'rgba(40, 40, 40, 255)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const imageData = context.createImageData(this.stats.imageWidth, this.stats.imageHeight);
    const begin = performance.now();

    if (this.stats.rleEncoded) {
      if (this.stats.imageType === ImageType.RUN_LENGTH_ENCODED_COLOR_MAPPED) {
        this.drawRunLengthEncodedColorMapped(imageData);
      } else {
        this.drawRunLengthEncoded(imageData);
      }
    } else {
      if (this.stats.imageType === ImageType.COLOR_MAPPED) {
        this.drawColorMapped(imageData);
      } else {
        if (this.stats.pixelSize === 1) {
          this.drawUncompressedGrayscale(imageData);
        } else {
          this.drawUncompressed(imageData);
        }
      }
    }

    const hasTransparency = this.stats.pixelSize === 4
      || this.stats.colorMapPixelSize === 4
      || (
        this.stats.pixelSize === 2
        && (
          this.stats.imageType === ImageType.GRAY_SCALE
          || this.stats.imageType === ImageType.RUN_LENGTH_ENCODED_GRAY_SCALE
        )
    );

    if (hasTransparency) {
      const { GRID_SIZE } = TGAImage;
      const { imageWidth, imageHeight } = this.stats;
      let evenRow = 0;

      for (let y = 0; y < imageHeight; y += GRID_SIZE) {
        let evenColumn = 0;

        for (let x = 0; x < imageWidth; x += GRID_SIZE) {
          context.fillStyle = evenRow ^ evenColumn ? 'rgba(180, 180, 180, 1)' : 'rgba(100, 100, 100, 1)';
          context.fillRect(x, y, GRID_SIZE, GRID_SIZE);
          evenColumn = evenColumn === 1 ? 0 : 1;
        }

        evenRow = evenRow === 1 ? 0 : 1;
      }

      const bitmap = await createImageBitmap(imageData, { premultiplyAlpha: 'premultiply' });
      context.drawImage(bitmap, 0, 0);
      bitmap.close();
    } else {
      context.putImageData(imageData, 0, 0);
    }

    this.stats.duration = performance.now() - begin;
    console.info(this.stats.duration);
    console.timeEnd('draw');
  }
}
