import { PDFDocument } from 'pdf-lib';

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
