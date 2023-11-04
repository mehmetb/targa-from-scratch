import { readFile, generateImageInformationTable } from './utils';
import TGAImage from './TGAImage';

// Esbuild Live Reload
new EventSource('/esbuild').addEventListener('change', () => location.reload());

const fileInput = document.querySelector('input[type=file]') as HTMLInputElement;
const canvas = document.querySelector('canvas') as HTMLCanvasElement;
const table = document.querySelector('table') as HTMLTableElement;
const template = document.querySelector('#row') as HTMLTemplateElement;

function populateStatsTable(tga: TGAImage) {
  table.innerHTML = '';

  const rows = generateImageInformationTable(tga);

  for (const [key, value] of Object.entries(rows)) {
    const clone = template.content.cloneNode(true) as HTMLElement;
    const tds = clone.querySelectorAll('td');

    tds[0].innerText = key;
    tds[1].innerText = value;
    table.appendChild(clone);
  }

  console.table(rows);
}

async function drawToCanvas() {
  try {
    const { files } = fileInput;

    if (!files?.length) {
      return;
    }

    const file = files.item(0);

    if (!file) return;

    const arrayBuffer = await readFile(file);
    const tga = new TGAImage(arrayBuffer);

    tga.draw(canvas)
      .then(() => {
        populateStatsTable(tga);
      })
      .catch(console.trace);
  } catch (ex) {
    alert(ex.message);
  }
}

fileInput.addEventListener('change', () => {
  drawToCanvas();
});
