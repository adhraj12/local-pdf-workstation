import { 
  PDFDocument, 
  degrees, 
  rgb, 
  StandardFonts, 
  PDFRawStream, 
  PDFName, 
  PDFNumber, 
  decodePDFRawStream 
} from 'pdf-lib';


export async function mergePDFs(files: File[]): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create();

    for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    return await mergedPdf.save();
}

export async function getPageCount(file: File): Promise<number> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    return pdf.getPageCount();
}

export async function extractPages(file: File, pages: number[]): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const copiedPages = await newPdf.copyPages(srcPdf, pages);
    copiedPages.forEach((page) => newPdf.addPage(page));

    return await newPdf.save();
}

export async function embedImages(
    pdfFile: File,
    images: { dataUrl: string; x: number; y: number; width: number; height: number; pageIndex: number }[]
): Promise<Uint8Array> {
    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    for (const img of images) {
        const page = pdfDoc.getPage(img.pageIndex);
        const embedder = img.dataUrl.startsWith('data:image/png')
            ? pdfDoc.embedPng(img.dataUrl)
            : pdfDoc.embedJpg(img.dataUrl);
        const image = await embedder;

        page.drawImage(image, {
            x: img.x,
            y: img.y,
            width: img.width,
            height: img.height,
        });
    }

    return await pdfDoc.save();
}

async function compressImageBytes(
  bytes: Uint8Array,
  quality: number,
  maxDim: number
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([bytes as any], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);

      const origW = img.width;
      const origH = img.height;

      let newW = origW;
      let newH = origH;

      if (origW > maxDim || origH > maxDim) {
        if (origW > origH) {
          newW = maxDim;
          newH = Math.round((origH * maxDim) / origW);
        } else {
          newH = maxDim;
          newW = Math.round((origW * maxDim) / origH);
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, newW, newH);

      canvas.toBlob(
        async (compressedBlob) => {
          if (!compressedBlob) {
            reject(new Error('Canvas blob generation failed'));
            return;
          }
          const arrayBuffer = await compressedBlob.arrayBuffer();
          resolve(new Uint8Array(arrayBuffer));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };

    img.src = url;
  });
}

async function compressRawPixels(
  bytes: Uint8Array,
  width: number,
  height: number,
  colorSpace: string,
  quality: number,
  maxDim: number
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;
      
      const pixelCount = width * height;
      
      if (colorSpace === '/DeviceRGB') {
        for (let i = 0, j = 0; i < pixelCount; i++, j += 3) {
          data[i * 4] = bytes[j];
          data[i * 4 + 1] = bytes[j + 1];
          data[i * 4 + 2] = bytes[j + 2];
          data[i * 4 + 3] = 255;
        }
      } else if (colorSpace === '/DeviceGray') {
        for (let i = 0, j = 0; i < pixelCount; i++, j++) {
          const val = bytes[j];
          data[i * 4] = val;
          data[i * 4 + 1] = val;
          data[i * 4 + 2] = val;
          data[i * 4 + 3] = 255;
        }
      } else if (colorSpace === '/DeviceCMYK') {
         for (let i = 0, j = 0; i < pixelCount; i++, j += 4) {
             const c = bytes[j] / 255;
             const m = bytes[j+1] / 255;
             const y = bytes[j+2] / 255;
             const k = bytes[j+3] / 255;
             data[i * 4] = 255 * (1 - c) * (1 - k);
             data[i * 4 + 1] = 255 * (1 - m) * (1 - k);
             data[i * 4 + 2] = 255 * (1 - y) * (1 - k);
             data[i * 4 + 3] = 255;
         }
      } else {
        reject(new Error('Unsupported colorspace ' + colorSpace));
        return;
      }

      ctx.putImageData(imageData, 0, 0);

      let newW = width;
      let newH = height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          newW = maxDim;
          newH = Math.round((height * maxDim) / width);
        } else {
          newH = maxDim;
          newW = Math.round((width * maxDim) / height);
        }
      }

      if (newW !== width || newH !== height) {
        const resizeCanvas = document.createElement('canvas');
        resizeCanvas.width = newW;
        resizeCanvas.height = newH;
        const resizeCtx = resizeCanvas.getContext('2d');
        if (!resizeCtx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        resizeCtx.drawImage(canvas, 0, 0, newW, newH);
        
        resizeCanvas.toBlob(
          async (blob) => {
            if (!blob) return reject(new Error('Canvas blob generation failed'));
            resolve(new Uint8Array(await blob.arrayBuffer()));
          },
          'image/jpeg',
          quality
        );
      } else {
        canvas.toBlob(
          async (blob) => {
            if (!blob) return reject(new Error('Canvas blob generation failed'));
            resolve(new Uint8Array(await blob.arrayBuffer()));
          },
          'image/jpeg',
          quality
        );
      }
    } catch (e) {
      reject(e);
    }
  });
}

async function compressPDFWithQPDF(
  pdfData: Uint8Array,
  qualityMode: 'extreme' | 'medium' | 'low'
): Promise<Uint8Array> {
  // @ts-ignore
  const qpdfModule = await import('@neslinesli93/qpdf-wasm');
  const qpdf = qpdfModule.default;

  const instance = await qpdf({
    locateFile: () => '/qpdf.wasm'
  }) as any;

  instance.FS.writeFile('input.pdf', pdfData);

  let compressionLevel = '6';
  if (qualityMode === 'extreme') {
    compressionLevel = '9';
  } else if (qualityMode === 'low') {
    compressionLevel = '3';
  }

  try {
    instance.callMain([
      '--linearize',
      '--compress-streams=y',
      '--object-streams=generate',
      '--recompress-flate',
      `--compression-level=${compressionLevel}`,
      'input.pdf',
      'output.pdf'
    ]);
  } catch (e) {
    // Emscripten exits with throw on main finished
  }

  const outputData = instance.FS.readFile('output.pdf');
  return outputData;
}

export async function compressPDF(
  file: File,
  qualityMode: 'extreme' | 'medium' | 'low' = 'medium'
): Promise<Uint8Array> {
  let quality = 0.5;
  let maxDim = 900;

  if (qualityMode === 'extreme') {
    quality = 0.3;
    maxDim = 600;
  } else if (qualityMode === 'low') {
    quality = 0.75;
    maxDim = 1400;
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer);

  const enumeratedObjects = pdfDoc.context.enumerateIndirectObjects();

  for (const [_, pdfObject] of enumeratedObjects) {
    if (pdfObject instanceof PDFRawStream) {
      const subtype = pdfObject.dict.get(PDFName.of('Subtype'));
      if (subtype === PDFName.of('Image')) {
        let filterNames: string[] = [];
        const filter = pdfObject.dict.get(PDFName.of('Filter'));
        
        if (filter instanceof PDFName) {
            filterNames.push(filter.toString());
        } else if (filter?.constructor?.name === 'PDFArray') {
            const arr = filter as any;
            for (let i = 0; i < arr.size(); i++) {
                const item = arr.get(i);
                if (item instanceof PDFName) {
                    filterNames.push(item.toString());
                }
            }
        }

        const isDCT = filterNames.includes('/DCTDecode');
        const isFlate = filterNames.includes('/FlateDecode');

        if (isDCT || isFlate) {
          try {
            let compressedBytes: Uint8Array | null = null;
            let origW = 0;
            let origH = 0;
            const widthObj = pdfObject.dict.get(PDFName.of('Width'));
            const heightObj = pdfObject.dict.get(PDFName.of('Height'));
            if (widthObj && widthObj.constructor.name === 'PDFNumber') origW = (widthObj as any).asNumber();
            if (heightObj && heightObj.constructor.name === 'PDFNumber') origH = (heightObj as any).asNumber();

            if (isDCT) {
              // Try to use original contents first if it's raw JPEG, fallback to decode
              const bytes = (pdfObject as any).contents || decodePDFRawStream(pdfObject).decode();
              compressedBytes = await compressImageBytes(bytes, quality, maxDim);
            } else if (isFlate) {
              const csObj = pdfObject.dict.get(PDFName.of('ColorSpace'));
              const csName = csObj instanceof PDFName ? csObj.toString() : '';
              
              if (['/DeviceRGB', '/DeviceGray', '/DeviceCMYK'].includes(csName) && origW > 0 && origH > 0) {
                 const bytes = decodePDFRawStream(pdfObject).decode();
                 compressedBytes = await compressRawPixels(bytes, origW, origH, csName, quality, maxDim);
              }
            }

            if (compressedBytes && compressedBytes.length < (pdfObject as any).contents.length) {
              (pdfObject as any).contents = compressedBytes;
              pdfObject.dict.set(PDFName.of('Length'), PDFNumber.of(compressedBytes.length));
              
              if (isFlate) {
                 pdfObject.dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
                 pdfObject.dict.delete(PDFName.of('DecodeParms'));
              }

              if (origW > maxDim || origH > maxDim) {
                let newW = origW;
                let newH = origH;
                if (origW > origH) {
                  newW = maxDim;
                  newH = Math.round((origH * maxDim) / origW);
                } else {
                  newH = maxDim;
                  newW = Math.round((origW * maxDim) / origH);
                }
                pdfObject.dict.set(PDFName.of('Width'), PDFNumber.of(newW));
                pdfObject.dict.set(PDFName.of('Height'), PDFNumber.of(newH));
              }
            }
          } catch (err) {
            console.error('Failed to compress image object:', err);
          }
        }
      }
    }
  }

  const savedBytes = await pdfDoc.save();

  try {
    const qcompressedBytes = await compressPDFWithQPDF(savedBytes, qualityMode);
    return qcompressedBytes;
  } catch (err) {
    console.warn('QPDF final compression failed, returning pdf-lib bytes:', err);
    return savedBytes;
  }
}

export async function rotatePDF(file: File, rotation: 90 | 180 | 270, pageIndices?: number[]): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();

    pages.forEach((page, index) => {
        if (!pageIndices || pageIndices.includes(index)) {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees(currentRotation + rotation));
        }
    });

    return await pdfDoc.save();
}

export async function organizePDF(
    file: File,
    pages: { index: number; rotation: number }[]
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const srcPdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    // Copy pages based on the new order
    const indices = pages.map(p => p.index);
    const copiedPages = await newPdf.copyPages(srcPdf, indices);

    // Add pages and apply rotation
    copiedPages.forEach((page, i) => {
        const rotation = pages[i].rotation;
        page.setRotation(degrees(rotation));
        newPdf.addPage(page);
    });

    return await newPdf.save();
}

export async function watermarkPDF(
    file: File,
    text: string,
    options: { opacity: number; size: number; color: { r: number; g: number; b: number } }
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(text, {
            x: width / 2 - (text.length * options.size) / 4, // Rough centering
            y: height / 2,
            size: options.size,
            font: font,
            color: rgb(options.color.r, options.color.g, options.color.b),
            opacity: options.opacity,
            rotate: degrees(45),
        });
    });

    return await pdfDoc.save();
}

export async function addPageNumbers(
    file: File,
    options: { position: 'bottom-center' | 'bottom-right' | 'top-right' }
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const totalPages = pages.length;

    pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const text = `Page ${index + 1} of ${totalPages}`;
        const fontSize = 12;
        const textWidth = font.widthOfTextAtSize(text, fontSize);

        let x = 0;
        let y = 20;

        switch (options.position) {
            case 'bottom-center':
                x = width / 2 - textWidth / 2;
                break;
            case 'bottom-right':
                x = width - textWidth - 20;
                break;
            case 'top-right':
                x = width - textWidth - 20;
                y = height - 20 - fontSize;
                break;
        }

        page.drawText(text, {
            x,
            y,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
        });
    });

    return await pdfDoc.save();
}

export async function encryptPDF(file: File, password: string): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const inputData = new Uint8Array(arrayBuffer);

    try {
        // @ts-ignore
        const qpdfModule = await import('@neslinesli93/qpdf-wasm');
        const qpdf = qpdfModule.default;

        const instance = await qpdf({
            locateFile: () => '/qpdf.wasm'
        }) as any;

        // Write input file to virtual filesystem
        instance.FS.writeFile('input.pdf', inputData);

        // Run qpdf command: qpdf --encrypt user-password owner-password 256 -- input.pdf output.pdf
        // callMain takes an array of strings (argv)
        // Note: callMain might throw an error on non-zero exit, or return exit code depending on implementation
        // We wrap in try-catch to be safe
        try {
            instance.callMain([
                '--encrypt',
                password,
                password,
                '256',
                '--',
                'input.pdf',
                'output.pdf'
            ]);
        } catch (e) {
            // Emscripten might throw "ExitStatus" on exit
            if (e instanceof Error && e.message.includes('ExitStatus')) {
                // Check if it was success (0) or failure
                // Usually we can assume if output exists it worked?
            } else {
                throw e;
            }
        }

        // Read output file
        const outputData = instance.FS.readFile('output.pdf');
        return outputData;
    } catch (error) {
        console.error('QPDF encryption failed:', error);
        throw error;
    }
}

export async function decryptPDF(file: File, password: string): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer, { password } as any);
    return await pdfDoc.save();
}

export async function imagesToPDF(images: string[]): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();

    for (const imgUrl of images) {
        const response = await fetch(imgUrl);
        const imageBuffer = await response.arrayBuffer();

        let image;
        try {
            image = await pdfDoc.embedJpg(imageBuffer);
        } catch (e) {
            try {
                image = await pdfDoc.embedPng(imageBuffer);
            } catch (e2) {
                console.error('Failed to embed image', e2);
                continue;
            }
        }

        const page = pdfDoc.addPage([image.width, image.height]);
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: image.width,
            height: image.height,
        });
    }

    return await pdfDoc.save();
}

export async function modifyPDF(
    file: File,
    modifications: { type: 'text' | 'image'; content: string; x: number; y: number; size?: number; width?: number; height?: number; pageIndex: number }[]
): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const mod of modifications) {
        const page = pdfDoc.getPage(mod.pageIndex);
        if (mod.type === 'text') {
            page.drawText(mod.content, {
                x: mod.x,
                y: mod.y,
                size: mod.size || 12,
                font: font,
                color: rgb(0, 0, 0),
            });
        } else if (mod.type === 'image') {
            const embedder = mod.content.startsWith('data:image/png')
                ? pdfDoc.embedPng(mod.content)
                : pdfDoc.embedJpg(mod.content);
            const image = await embedder;
            page.drawImage(image, {
                x: mod.x,
                y: mod.y,
                width: mod.width || 100,
                height: mod.height || 100,
            });
        }
    }

    return await pdfDoc.save();
}
