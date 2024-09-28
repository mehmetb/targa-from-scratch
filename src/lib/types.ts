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

export enum ImageType {
  NO_IMAGE_DATA = 0,
  COLOR_MAPPED = 1,
  TRUE_COLOR = 2,
  GRAY_SCALE = 3,
  RUN_LENGTH_ENCODED_COLOR_MAPPED = 9,
  RUN_LENGTH_ENCODED_TRUE_COLOR = 10,
  RUN_LENGTH_ENCODED_GRAY_SCALE = 11,
}

export enum ImageDescriptorFields {
  TOP_TO_BOTTOM = 32, // byte: 00100000
}

export enum AttributesType {
  NO_ALPHA_DATA = 0,
  UNDEFINED_IGNORED = 1,
  UNDEFINED_RETAINED = 2,
  USEFUL_ALPHA_CHANNEL = 3,
  PREMULTIPLIED_ALPHA = 4,
}
