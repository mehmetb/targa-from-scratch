# Targa From Scratch

Reads a .tga file into a JavaScript `ArrayBuffer` and draws it on a canvas element. Works entirely in the browser (no back-end).


### How to run

```
yarn install
yarn start
```

Then go to http://127.0.0.1:8000 in your browser.

### Supported TGA Image Types

- Uncompressed color-mapped image (`1`)
- Uncompressed true-color image (`2`)
- Run-length encoded color-mapped image (`9`) (*I haven't tested this yet but it should be working*)
- Run-length encoded true-color image (`10`)

Grayscale and RLE grayscale are not supported yet.

### Resources

- [Truvision TGA on Wikipedia](https://en.wikipedia.org/wiki/Truevision_TGA)
- [Creating Image Files (written by Paul Bourke)](http://www.paulbourke.net/dataformats/tga/)
- [TGA Files - University of South Carolina](https://people.math.sc.edu/Burkardt/data/tga/tga.html)
