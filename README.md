# TGA for Web

Reads a .tga file into a JavaScript `ArrayBuffer` and draws it on a canvas element. Works entirely in the browser.

[Live Demo](https://mehmetb.github.io/tga-for-web-live-demo/)

## Installation

```bash
npm install tga-for-web
```

## Usage

Read a TGA file from an input element and draw it to a canvas:

```js
import { drawToCanvas } from 'tga-for-web';

const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('fileInput');

fileInput.addEventListener('change', (event) => {
  const file = fileInput.files?.item(0);
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async (event) => {
    const arrayBuffer = reader.result;
    const { duration, fileInfo } = await drawToCanvas(canvas, arrayBuffer);
    console.log(`Image drawn in ${duration} ms`);
    console.log(fileInfo);
  };

  reader.readAsArrayBuffer(file);
});
```

Read a TGA file from a URL and draw it to a canvas:

```js
import { drawToCanvas } from 'tga-for-web';

const canvas = document.getElementById('canvas');
const url = 'https://example.com/image.tga';

fetch(url)
  .then((response) => response.arrayBuffer())
  .then((arrayBuffer) => drawToCanvas(canvas, arrayBuffer))
  .then(({ duration, fileInfo }) => {
    console.log(`Image drawn in ${duration} ms`);
    console.log(fileInfo);
  });


```

## How to run the Live Demo locally?

```
git clone git@github.com:mehmetb/tga-for-web.git
cd tga-for-web
yarn install
yarn start
```

Then go to http://127.0.0.1:8000 in your browser.

## Supported TGA Image Types

- Color-mapped images
- True-color images
- Black and white (unmapped) images
- Run-length encoded, color-mapped images
- Run-length encoded, true-color images
- Run-length encoded, black and white images

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Credits

I would like to extend my sincere thanks to [@bulentv](https://github.com/bulentv) for his invaluable mentorship throughout the development of this project. His code reviews, guidance on understanding the nuances of the TGA format, and optimization suggestions have greatly improved the performance and direction of the library. 

## Resources

- [Truvision TGA on Wikipedia](https://en.wikipedia.org/wiki/Truevision_TGA)
- [Creating Image Files (written by Paul Bourke)](http://www.paulbourke.net/dataformats/tga/)
- [TGA Files - University of South Carolina](https://people.math.sc.edu/Burkardt/data/tga/tga.html)
- [Truevision TGA File Format Specification Version 2.0](https://www.dca.fee.unicamp.br/~martino/disciplinas/ea978/tgaffs.pdf)
- [www/images/testdata from ftrvxmtrx/tga](https://github.com/ftrvxmtrx/tga)

## License

![GNU GPLv3 - Free as ın Freedom](https://www.gnu.org/graphics/gplv3-with-text-136x68.png)

GNU General Public License v3.0 or later.

See [COPYING](COPYING) for the full text.
