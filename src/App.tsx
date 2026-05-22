import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { ImageLayout } from './components/ImageLayout';
import { TextLayout } from './components/TextLayout';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const TextFormatter = lazy(() => import('./pages/TextFormatter').then(module => ({ default: module.TextFormatter })));
const TextDiff = lazy(() => import('./pages/TextDiff').then(module => ({ default: module.TextDiff })));
const WordCounter = lazy(() => import('./pages/WordCounter').then(module => ({ default: module.WordCounter })));
const JsonFormatter = lazy(() => import('./pages/JsonFormatter').then(module => ({ default: module.JsonFormatter })));
const CryptoHash = lazy(() => import('./pages/CryptoHash').then(module => ({ default: module.CryptoHash })));

// Lazy load pages
const Merge = lazy(() => import('./pages/Merge').then(module => ({ default: module.Merge })));
const Split = lazy(() => import('./pages/Split').then(module => ({ default: module.Split })));
const Sign = lazy(() => import('./pages/Sign').then(module => ({ default: module.Sign })));
const Compress = lazy(() => import('./pages/Compress').then(module => ({ default: module.Compress })));
const Rotate = lazy(() => import('./pages/Rotate').then(module => ({ default: module.Rotate })));
const Organize = lazy(() => import('./pages/Organize').then(module => ({ default: module.Organize })));
const Protect = lazy(() => import('./pages/Protect').then(module => ({ default: module.Protect })));
const Unlock = lazy(() => import('./pages/Unlock').then(module => ({ default: module.Unlock })));
const JpgToPdf = lazy(() => import('./pages/JpgToPdf').then(module => ({ default: module.JpgToPdf })));
const Scan = lazy(() => import('./pages/Scan').then(module => ({ default: module.Scan })));
const Watermark = lazy(() => import('./pages/Watermark').then(module => ({ default: module.Watermark })));
const PageNumbers = lazy(() => import('./pages/PageNumbers').then(module => ({ default: module.PageNumbers })));
const Edit = lazy(() => import('./pages/Edit').then(module => ({ default: module.Edit })));
const Landing = lazy(() => import('./pages/Landing').then(module => ({ default: module.Landing })));
const Tools = lazy(() => import('./pages/Tools').then(module => ({ default: module.Tools })));
const CropRotate = lazy(() => import('./pages/CropRotate').then(module => ({ default: module.CropRotate })));
const ImageConverter = lazy(() => import('./pages/ImageConverter').then(module => ({ default: module.ImageConverter })));
const ImageCompress = lazy(() => import('./pages/ImageCompress').then(module => ({ default: module.ImageCompress })));
const ImageResizer = lazy(() => import('./pages/ImageResizer').then(module => ({ default: module.ImageResizer })));
const ExifEditor = lazy(() => import('./pages/ExifEditor').then(module => ({ default: module.ExifEditor })));
const ImageWatermark = lazy(() => import('./pages/ImageWatermark').then(module => ({ default: module.ImageWatermark })));
const MemeGenerator = lazy(() => import('./pages/MemeGenerator').then(module => ({ default: module.MemeGenerator })));
const Steganography = lazy(() => import('./pages/Steganography').then(module => ({ default: module.Steganography })));
const ColorPalette = lazy(() => import('./pages/ColorPalette').then(module => ({ default: module.ColorPalette })));
const FaviconGenerator = lazy(() => import('./pages/FaviconGenerator').then(module => ({ default: module.FaviconGenerator })));
const QrGenerator = lazy(() => import('./pages/QrGenerator').then(module => ({ default: module.QrGenerator })));
const QrScanner = lazy(() => import('./pages/QrScanner').then(module => ({ default: module.QrScanner })));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
        <p>Loading...</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Suspense fallback={<LoadingFallback />}>
            <Landing />
          </Suspense>
        } />
        <Route path="tools" element={
          <Suspense fallback={<LoadingFallback />}>
            <Tools />
          </Suspense>
        } />
        <Route element={<Layout />}>
          <Route path="merge" element={
            <Suspense fallback={<LoadingFallback />}>
              <Merge />
            </Suspense>
          } />
          <Route path="split" element={
            <Suspense fallback={<LoadingFallback />}>
              <Split />
            </Suspense>
          } />
          <Route path="sign" element={
            <Suspense fallback={<LoadingFallback />}>
              <Sign />
            </Suspense>
          } />
          <Route path="compress" element={
            <Suspense fallback={<LoadingFallback />}>
              <Compress />
            </Suspense>
          } />
          <Route path="rotate" element={
            <Suspense fallback={<LoadingFallback />}>
              <Rotate />
            </Suspense>
          } />
          <Route path="organize" element={
            <Suspense fallback={<LoadingFallback />}>
              <Organize />
            </Suspense>
          } />
          <Route path="protect" element={
            <Suspense fallback={<LoadingFallback />}>
              <Protect />
            </Suspense>
          } />
          <Route path="unlock" element={
            <Suspense fallback={<LoadingFallback />}>
              <Unlock />
            </Suspense>
          } />
          <Route path="jpg-to-pdf" element={
            <Suspense fallback={<LoadingFallback />}>
              <JpgToPdf />
            </Suspense>
          } />
          <Route path="scan" element={
            <Suspense fallback={<LoadingFallback />}>
              <Scan />
            </Suspense>
          } />
          <Route path="watermark" element={
            <Suspense fallback={<LoadingFallback />}>
              <Watermark />
            </Suspense>
          } />
          <Route path="page-numbers" element={
            <Suspense fallback={<LoadingFallback />}>
              <PageNumbers />
            </Suspense>
          } />
          <Route path="edit" element={
            <Suspense fallback={<LoadingFallback />}>
              <Edit />
            </Suspense>
          } />
        </Route>
        <Route element={<ImageLayout />}>
          <Route path="crop-image" element={
            <Suspense fallback={<LoadingFallback />}>
              <CropRotate />
            </Suspense>
          } />
          <Route path="convert-image" element={
            <Suspense fallback={<LoadingFallback />}>
              <ImageConverter />
            </Suspense>
          } />
          <Route path="compress-image" element={
            <Suspense fallback={<LoadingFallback />}>
              <ImageCompress />
            </Suspense>
          } />
          <Route path="resize-image" element={
            <Suspense fallback={<LoadingFallback />}>
              <ImageResizer />
            </Suspense>
          } />
          <Route path="exif-editor" element={
            <Suspense fallback={<LoadingFallback />}>
              <ExifEditor />
            </Suspense>
          } />
          <Route path="watermark-image" element={
            <Suspense fallback={<LoadingFallback />}>
              <ImageWatermark />
            </Suspense>
          } />
          <Route path="meme-generator" element={
            <Suspense fallback={<LoadingFallback />}>
              <MemeGenerator />
            </Suspense>
          } />
          <Route path="steganography" element={
            <Suspense fallback={<LoadingFallback />}>
              <Steganography />
            </Suspense>
          } />
          <Route path="color-palette" element={
            <Suspense fallback={<LoadingFallback />}>
              <ColorPalette />
            </Suspense>
          } />
          <Route path="favicon-generator" element={
            <Suspense fallback={<LoadingFallback />}>
              <FaviconGenerator />
            </Suspense>
          } />
          <Route path="qr-generator" element={
            <Suspense fallback={<LoadingFallback />}>
              <QrGenerator />
            </Suspense>
          } />
          <Route path="qr-scanner" element={
            <Suspense fallback={<LoadingFallback />}>
              <QrScanner />
            </Suspense>
          } />
        </Route>
        <Route element={<TextLayout />}>
          <Route path="text-formatter" element={
            <Suspense fallback={<LoadingFallback />}>
              <TextFormatter />
            </Suspense>
          } />
          <Route path="text-diff" element={
            <Suspense fallback={<LoadingFallback />}>
              <TextDiff />
            </Suspense>
          } />
          <Route path="word-counter" element={
            <Suspense fallback={<LoadingFallback />}>
              <WordCounter />
            </Suspense>
          } />
          <Route path="json-formatter" element={
            <Suspense fallback={<LoadingFallback />}>
              <JsonFormatter />
            </Suspense>
          } />
          <Route path="crypto-hash" element={
            <Suspense fallback={<LoadingFallback />}>
              <CryptoHash />
            </Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
