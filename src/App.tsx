import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Merge } from './pages/Merge';
import { Split } from './pages/Split';
import { Sign } from './pages/Sign';
import { Compress } from './pages/Compress';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Merge />} />
          <Route path="split" element={<Split />} />
          <Route path="sign" element={<Sign />} />
          <Route path="compress" element={<Compress />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
