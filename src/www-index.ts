import { readFile, generateImageInformationTable } from './utils';
import { drawToCanvas } from '.';
import ImageFileInfo from './lib/ImageFileInfo';

// Esbuild Live Reload
new EventSource('/esbuild').addEventListener('change', () => location.reload());

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
