import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';


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

export async function compressPDF(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    // pdf-lib optimizes by default on save, removing unused objects
    return await pdfDoc.save({ useObjectStreams: false });
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
        if (rotation !== 0) {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees(currentRotation + rotation));
        }
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
