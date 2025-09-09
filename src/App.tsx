import './App.css';
import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from './themes';
import Loading from './components/layouts/loading/Loading';

// Import only essential context providers for initial dashboard load
import UserAuthContextProvider from './contexts/UserAuthContextProvider';
import OrganisationContextProvider from './contexts/OrganisationContextProvider';
import MediaQueryContextProvider from './contexts/MediaQueryContextProvider';
import { UploadLimitProvider } from './contexts/UploadLimitContextProvider';

import { UserAuthContext } from './contexts/UserAuthContextProvider';
import { useContext } from 'react';

const queryClient = new QueryClient();

// Conditional wrapper that only renders UploadLimitProvider for learners
const ConditionalUploadLimitProvider = ({ children }: { children: React.ReactNode }) => {
	const { user } = useContext(UserAuthContext);

	// Only render UploadLimitProvider for learners
	if (user?.role === 'learner') {
		return <UploadLimitProvider>{children}</UploadLimitProvider>;
	}

	// For non-learners (admin, etc.), render children directly without UploadLimitProvider
	return <>{children}</>;
};

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={theme}>
				<MediaQueryContextProvider>
					<UserAuthContextProvider>
						<OrganisationContextProvider>
							<ConditionalUploadLimitProvider>
								<Suspense fallback={<Loading />}>
									<Outlet />
								</Suspense>
							</ConditionalUploadLimitProvider>
						</OrganisationContextProvider>
					</UserAuthContextProvider>
				</MediaQueryContextProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
