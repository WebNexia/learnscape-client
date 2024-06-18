import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import UserAuthContextProvider from './contexts/UserAuthContextProvider.tsx';
import { QueryClient, QueryClientProvider } from 'react-query';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
	<>
		<QueryClientProvider client={queryClient}>
			<UserAuthContextProvider>
				<App />
			</UserAuthContextProvider>
		</QueryClientProvider>
	</>
);
