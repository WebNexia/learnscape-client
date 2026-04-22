import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './index.css';

// QueryClientProvider lives in App.tsx so all routes share one cache (avoid duplicate clients).

ReactDOM.createRoot(document.getElementById('root')!).render(<RouterProvider router={router} />);
