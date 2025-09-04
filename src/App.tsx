import './App.css';
import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from './themes';
import Loading from './components/layouts/loading/Loading';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from './config/stripe';

// Import only essential context providers for initial dashboard load
import UserAuthContextProvider from './contexts/UserAuthContextProvider';
import OrganisationContextProvider from './contexts/OrganisationContextProvider';
import { UploadLimitProvider } from './contexts/UploadLimitContextProvider';

const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={theme}>
				<Elements stripe={stripePromise}>
					<UserAuthContextProvider>
						<OrganisationContextProvider>
							<UploadLimitProvider>
								<Suspense fallback={<Loading />}>
									<Outlet />
								</Suspense>
							</UploadLimitProvider>
						</OrganisationContextProvider>
					</UserAuthContextProvider>
				</Elements>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
