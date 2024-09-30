import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { decodeTGAIntoImageData } from '../src/index';
import TGAFile from '../src/lib/TGAFile';

const TEST_IMAGE_DIR = join(__dirname, '../www/images/testdata');
const TEST_DATA_DIR = join(__dirname, './data');

class ImageData {
  colorSpace: "display-p3" | "srgb" = "srgb";

  data: Uint8ClampedArray;

  height: number;

  width: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
  }
}

describe('TGA Decode Tests', () => {
  describe('Uncompressed images', () => {
    test('8-bit grayscale image', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'ubw8.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'ubw8.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('8-bit grayscale image [2]', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'monochrome8_bottom_left.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'monochrome8_bottom_left.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('16-bit image', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'utc16.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'utc16.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('16-bit image [2]', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'monochrome16_top_left.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'monochrome16_top_left.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('24-bit image', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'utc24.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'utc24.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('24-bit image [2]', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'rgb24_top_left.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'rgb24_top_left.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('32-bit image', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'utc32.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'utc32.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('32-bit image [2]', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'rgb32_bottom_left.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'rgb32_bottom_left.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });
  });

  describe('Run-length encoded images', () => {
    test('8-bit grayscale image', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'cbw8.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'cbw8.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('8-bit grayscale image [2]', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'monochrome8_bottom_left_rle.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'monochrome8_bottom_left_rle.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('16-bit image', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'ctc16.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'ctc16.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('16-bit image [2]', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'monochrome16_top_left_rle.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'monochrome16_top_left_rle.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('24-bit image', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'ctc24.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'ctc24.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('24-bit image [2]', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'rgb24_bottom_left_rle.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'rgb24_bottom_left_rle.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('32-bit image', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'ctc32.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'ctc32.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('32-bit image [2]', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'rgb32_top_left_rle.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'rgb32_top_left_rle.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });
  });

  describe('Color-mapped images', () => {
    test('8-bit image', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'ucm8.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'ucm8.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });

    test('24-bit image', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'rgb24_top_left_colormap.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'rgb24_top_left_colormap.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });
  });

  describe('Run-length encoded color-mapped images', () => {
    test('32-bit image', () => {
      const tgaBuffer = readFileSync(join(TEST_IMAGE_DIR, 'rgb32_top_left_rle_colormap.tga'));
      const uint8Arr = new Uint8Array(tgaBuffer);
      const tgaFile = new TGAFile(uint8Arr.buffer);
      const imageData = new ImageData(tgaFile.fileInfo.imageWidth, tgaFile.fileInfo.imageHeight);
      decodeTGAIntoImageData(tgaFile, imageData);

      const expectedBuffer = readFileSync(join(TEST_DATA_DIR, 'rgb32_top_left_rle_colormap.tga.data'));
      expect(Buffer.from(imageData.data).equals(expectedBuffer)).toBe(true);
    });
  });
});
