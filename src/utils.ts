export function concatArrayBuffers(...buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((acc, buffer) => acc + buffer.byteLength, 0);
  const resultBuffer = new ArrayBuffer(totalLength);
  const resultArray = new Uint8Array(resultBuffer);
  let index = 0;

  for (const buffer of buffers) {
    const arr = new Uint8Array(buffer);
    
    for (const elem of arr) {
      resultArray[index++] = elem;
    }
  }

  return resultBuffer;
}

export function readFile(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.addEventListener('load', () => {
      const result = fileReader.result as ArrayBuffer;
      resolve(result);
    });

    fileReader.addEventListener('error', reject);

    fileReader.readAsArrayBuffer(file);
  });
}
