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

import { readFile, generateImageInformationTable } from './utils';
import { drawToCanvas } from '.';
import ImageFileInfo from './lib/ImageFileInfo';

// @ts-ignore
if (!window.IS_PRODUCTION) {
  // Esbuild Live Reload
  new EventSource('/esbuild').addEventListener('change', () => location.reload());
}

const fileInput = document.querySelector('input[type=file]') as HTMLInputElement;
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const table = document.querySelector('table') as HTMLTableElement;
const template = document.querySelector('#row') as HTMLTemplateElement;

function populateStatsTable(fileInfo: ImageFileInfo, duration: number) {
  table.innerHTML = '';

  const rows = generateImageInformationTable(fileInfo, duration);

  for (const [key, value] of Object.entries(rows)) {
    const clone = template.content.cloneNode(true) as HTMLElement;
    const tds = clone.querySelectorAll('td');

    tds[0].innerText = key;
    tds[1].innerText = value;
    table.appendChild(clone);
  }

  console.table(rows);
}

async function readFileAndDrawToCanvas() {
  try {
    const { files } = fileInput;

    if (!files?.length) {
      return;
    }

    const file = files.item(0);

    if (!file) return;

    const arrayBuffer = await readFile(file);
    const { duration, fileInfo } = await drawToCanvas(canvas, arrayBuffer);
    populateStatsTable(fileInfo, duration);
  } catch (ex) {
    alert(ex.message);
  }
}

fileInput.addEventListener('change', () => {
  readFileAndDrawToCanvas();
});
