import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Merge } from './pages/Merge';
import { Split } from './pages/Split';
import { Sign } from './pages/Sign';
import { Compress } from './pages/Compress';
import { Rotate } from './pages/Rotate';
import { Organize } from './pages/Organize';
import { Protect } from './pages/Protect';
import { Unlock } from './pages/Unlock';
import { JpgToPdf } from './pages/JpgToPdf';
import { Scan } from './pages/Scan';
import { Watermark } from './pages/Watermark';
import { PageNumbers } from './pages/PageNumbers';
import { Edit } from './pages/Edit';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Merge />} />
          <Route path="split" element={<Split />} />
          <Route path="sign" element={<Sign />} />
          <Route path="compress" element={<Compress />} />
          <Route path="rotate" element={<Rotate />} />
          <Route path="organize" element={<Organize />} />
          <Route path="protect" element={<Protect />} />
          <Route path="unlock" element={<Unlock />} />
          <Route path="jpg-to-pdf" element={<JpgToPdf />} />
          <Route path="scan" element={<Scan />} />
          <Route path="watermark" element={<Watermark />} />
          <Route path="page-numbers" element={<PageNumbers />} />
          <Route path="edit" element={<Edit />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
