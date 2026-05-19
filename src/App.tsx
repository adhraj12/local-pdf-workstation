import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Layout } from './components/Layout';
import { Loader2 } from 'lucide-react';

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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
