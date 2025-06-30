import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import './index.css';
import UserAuthContextProvider from './contexts/UserAuthContextProvider.tsx';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
	<>
		<QueryClientProvider client={queryClient}>
			<UserAuthContextProvider>
				<RouterProvider router={router} />
			</UserAuthContextProvider>
		</QueryClientProvider>
	</>
);
