export enum ImageType {
  NO_IMAGE_DATA = 0,
  COLOR_MAPPED = 1,
  TRUE_COLOR = 2,
  GRAY_SCALE = 3,
  RUN_LENGTH_ENCODED_COLOR_MAPPED = 9,
  RUN_LENGTH_ENCODED_TRUE_COLOR = 10,
  RUN_LENGTH_ENCODED_GRAY_SCALE = 11,
}

export type Color = {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}
