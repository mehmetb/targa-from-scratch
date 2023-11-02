import { ImageType } from './types';
import { ImageStats } from './ImageStats';

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

  private drawUncompressed(imageData: ImageData) {
    console.time('uncompressed loop');
    const { imageHeight, imageWidth, pixelSize, topToBottom } = this.stats;
    const { data } = imageData;
    const { imageDataBytes } = this;
    const { GRID_SIZE } = TGAImage;

    for (let y = 0; y < imageHeight; ++y) {
      for (let x = 0; x < imageWidth; ++x) {
        const canvasOffset = topToBottom
          ? y * imageWidth * 4 + x * 4
          : (imageHeight - y - 1) * imageWidth * 4 + x * 4;

        data[canvasOffset + 3] = 255;

        switch (pixelSize) {
          case 1: {
            const byteOffset = x + y * imageWidth;
            data[canvasOffset] = imageDataBytes[byteOffset];
            data[canvasOffset + 1] = imageDataBytes[byteOffset];
            data[canvasOffset + 2] = imageDataBytes[byteOffset];
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

            if (imageDataBytes[byteOffset + 3] === 255) {
              data[canvasOffset] = imageDataBytes[byteOffset + 3];
              data[canvasOffset + 1] = imageDataBytes[byteOffset + 2];
              data[canvasOffset + 2] = imageDataBytes[byteOffset + 1];
            } else {
              const blue = imageDataBytes[byteOffset];
              const green = imageDataBytes[byteOffset + 1];
              const red = imageDataBytes[byteOffset + 2];
              const alpha = imageDataBytes[byteOffset + 3];
              const evenX = Number(Math.floor(x / GRID_SIZE) % 2 === 0);
              const evenY = Number(Math.floor(y / GRID_SIZE) % 2 === 0);
              const colorPercentage = alpha / 255;
              const bgPercentage = 1 - colorPercentage;

              if (evenX ^ evenY) {
                data[canvasOffset] = Math.min(255, red * colorPercentage + 100 * bgPercentage);
                data[canvasOffset + 1] = Math.min(
                  255,
                  green * colorPercentage + 100 * bgPercentage,
                );
                data[canvasOffset + 2] = Math.min(255, blue * colorPercentage + 100 * bgPercentage);
              } else {
                data[canvasOffset] = Math.min(255, red * colorPercentage + 180 * bgPercentage);
                data[canvasOffset + 1] = Math.min(
                  255,
                  green * colorPercentage + 180 * bgPercentage,
                );
                data[canvasOffset + 2] = Math.min(255, blue * colorPercentage + 180 * bgPercentage);
              }
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
    const { imageHeight, imageWidth, pixelSize, topToBottom } = this.stats;
    const { data } = imageData;
    const { imageDataBytes } = this;
    const { GRID_SIZE } = TGAImage;
    const readArrayLength = imageDataBytes.length;
    let readCursor = 0;
    let x = 0;
    let y = 0;
    let byte1;
    let byte2;
    let byte3;
    let byte4;

    for (let i = 0; i < readArrayLength; ++i) {
      const packet = imageDataBytes[readCursor++];

      // RLE packet
      if (packet >= 128) {
        const repetition = packet - 128;
        byte1 = imageDataBytes[readCursor++];

        if (pixelSize > 2) {
          byte2 = imageDataBytes[readCursor++];
          byte3 = imageDataBytes[readCursor++];
        }

        if (pixelSize > 3) {
          byte4 = imageDataBytes[readCursor++];
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

            case 3: {
              data[canvasOffset] = byte3;
              data[canvasOffset + 1] = byte2;
              data[canvasOffset + 2] = byte1;
              break;
            }

            case 4: {
              if (byte4 === 255) {
                data[canvasOffset] = byte3;
                data[canvasOffset + 1] = byte2;
                data[canvasOffset + 2] = byte1;
              } else {
                const evenX = Number(Math.floor(x / GRID_SIZE) % 2 === 0);
                const evenY = Number(Math.floor(y / GRID_SIZE) % 2 === 0);
                const colorPercentage = byte4 / 255;
                const bgPercentage = 1 - colorPercentage;

                if (evenX ^ evenY) {
                  data[canvasOffset] = Math.min(255, byte3 * colorPercentage + 100 * bgPercentage);
                  data[canvasOffset + 1] = Math.min(
                    255,
                    byte2 * colorPercentage + 100 * bgPercentage,
                  );
                  data[canvasOffset + 2] = Math.min(
                    255,
                    byte1 * colorPercentage + 100 * bgPercentage,
                  );
                } else {
                  data[canvasOffset] = Math.min(255, byte3 * colorPercentage + 180 * bgPercentage);
                  data[canvasOffset + 1] = Math.min(
                    255,
                    byte2 * colorPercentage + 180 * bgPercentage,
                  );
                  data[canvasOffset + 2] = Math.min(
                    255,
                    byte1 * colorPercentage + 180 * bgPercentage,
                  );
                }
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

            case 3: {
              data[canvasOffset] = imageDataBytes[readCursor + 2];
              data[canvasOffset + 1] = imageDataBytes[readCursor + 1];
              data[canvasOffset + 2] = imageDataBytes[readCursor];
              readCursor += 3;
              break;
            }

            case 4: {
              const blue = imageDataBytes[readCursor++];
              const green = imageDataBytes[readCursor++];
              const red = imageDataBytes[readCursor++];
              const alpha = imageDataBytes[readCursor++];
              const evenX = Number(Math.floor(x / GRID_SIZE) % 2 === 0);
              const evenY = Number(Math.floor(y / GRID_SIZE) % 2 === 0);
              const colorPercentage = alpha / 255;
              const bgPercentage = 1 - colorPercentage;

              if (evenX ^ evenY) {
                data[canvasOffset] = Math.min(255, red * colorPercentage + 100 * bgPercentage);
                data[canvasOffset + 1] = Math.min(
                  255,
                  green * colorPercentage + 100 * bgPercentage,
                );
                data[canvasOffset + 2] = Math.min(255, blue * colorPercentage + 100 * bgPercentage);
              } else {
                data[canvasOffset] = Math.min(255, red * colorPercentage + 180 * bgPercentage);
                data[canvasOffset + 1] = Math.min(
                  255,
                  green * colorPercentage + 180 * bgPercentage,
                );
                data[canvasOffset + 2] = Math.min(255, blue * colorPercentage + 180 * bgPercentage);
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
    const { GRID_SIZE } = TGAImage;
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

          case 3: {
            data[canvasOffset] = bytes[colorMapEntryOffset + 2];
            data[canvasOffset + 1] = bytes[colorMapEntryOffset + 1];
            data[canvasOffset + 2] = bytes[colorMapEntryOffset];
            break;
          }

          case 4: {
            if (bytes[colorMapEntryOffset + 3] === 255) {
              data[canvasOffset] = bytes[colorMapEntryOffset + 3];
              data[canvasOffset + 1] = bytes[colorMapEntryOffset + 2];
              data[canvasOffset + 2] = bytes[colorMapEntryOffset + 1];
            } else {
              const blue = bytes[colorMapEntryOffset];
              const green = bytes[colorMapEntryOffset + 1];
              const red = bytes[colorMapEntryOffset + 2];
              const alpha = bytes[colorMapEntryOffset + 3];
              const evenX = Number(Math.floor(x / GRID_SIZE) % 2 === 0);
              const evenY = Number(Math.floor(y / GRID_SIZE) % 2 === 0);
              const colorPercentage = alpha / 255;
              const bgPercentage = 1 - colorPercentage;

              if (evenX ^ evenY) {
                data[canvasOffset] = Math.min(255, red * colorPercentage + 100 * bgPercentage);
                data[canvasOffset + 1] = Math.min(
                  255,
                  green * colorPercentage + 100 * bgPercentage,
                );
                data[canvasOffset + 2] = Math.min(255, blue * colorPercentage + 100 * bgPercentage);
              } else {
                data[canvasOffset] = Math.min(255, red * colorPercentage + 180 * bgPercentage);
                data[canvasOffset + 1] = Math.min(
                  255,
                  green * colorPercentage + 180 * bgPercentage,
                );
                data[canvasOffset + 2] = Math.min(255, blue * colorPercentage + 180 * bgPercentage);
              }
            }

            break;
          }
        }
      }
    }

    console.timeEnd('color mapped loop');
  }

  draw(canvas: HTMLCanvasElement) {
    console.time('draw');
    const context = canvas.getContext('2d');

    if (!context) {
      alert('Failed to get canvas context');
      return;
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = this.stats.imageWidth;
    canvas.height = this.stats.imageHeight;

    const imageData = context.createImageData(this.stats.imageWidth, this.stats.imageHeight);
    const begin = performance.now();

    if (this.stats.rleEncoded) {
      this.drawRunLengthEncoded(imageData);
    } else {
      if (this.stats.imageType === ImageType.COLOR_MAPPED) {
        this.drawColorMapped(imageData);
      } else {
        this.drawUncompressed(imageData);
      }
    }

    this.stats.duration = performance.now() - begin;
    context.putImageData(imageData, 0, 0);
    console.info(this.stats.duration);
    console.timeEnd('draw');
  }
}
