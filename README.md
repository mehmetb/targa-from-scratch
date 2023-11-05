# Targa From Scratch

Reads a .tga file into a JavaScript `ArrayBuffer` and draws it on a canvas element. Works entirely in the browser (no back-end).

[Live Demo](https://mehmetb.github.io/targa-from-scratch-demo/)


### How to run

```
yarn install
yarn start
```

Then go to http://127.0.0.1:8000 in your browser.

### Supported TGA Image Types

- Uncompressed color-mapped image (`1`)
- Uncompressed true-color image (`2`)
- Uncompressed grayscale image (`3`)
- Run-length encoded color-mapped image (`9`) (*I haven't tested this yet but it should be working*)
- Run-length encoded true-color image (`10`)
- Run-length encoded grayscale image (`11`)

### Supported Pixel Sizes

- 1 byte / 8 bits (only when the image is Type 3 or Type 11)
- 3 bytes / 24 bits
- 4 bytes / 32 bits

### Resources

- [Truvision TGA on Wikipedia](https://en.wikipedia.org/wiki/Truevision_TGA)
- [Creating Image Files (written by Paul Bourke)](http://www.paulbourke.net/dataformats/tga/)
- [TGA Files - University of South Carolina](https://people.math.sc.edu/Burkardt/data/tga/tga.html)
- [Truevision TGA File Format Specification Version 2.0](https://www.dca.fee.unicamp.br/~martino/disciplinas/ea978/tgaffs.pdf)
- [www/images/testdata from ftrvxmtrx/tga](https://github.com/ftrvxmtrx/tga)
