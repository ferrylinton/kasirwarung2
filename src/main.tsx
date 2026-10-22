import { createRoot } from 'react-dom/client';
import '../frontend/src/i18n.ts';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
