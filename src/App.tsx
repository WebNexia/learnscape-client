import './App.css';
import { Outlet } from 'react-router-dom';
import { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import { HelmetProvider } from 'react-helmet-async';
import theme from './themes';
import Loading from './components/layouts/loading/Loading';
import ErrorBoundary from './components/error/ErrorBoundary';

// Import only essential context providers for initial dashboard load
import UserAuthContextProvider from './contexts/UserAuthContextProvider';
import OrganisationContextProvider from './contexts/OrganisationContextProvider';
import MediaQueryContextProvider from './contexts/MediaQueryContextProvider';
import { UploadLimitProvider } from './contexts/UploadLimitContextProvider';
import CoursesContextProvider from './contexts/CoursesContextProvider';
import UserCourseLessonDataContextProvider from './contexts/UserCourseLessonDataContextProvider';

const queryClient = new QueryClient();

// UploadLimitProvider for all roles
const ConditionalUploadLimitProvider = ({ children }: { children: React.ReactNode }) => {
	return <UploadLimitProvider>{children}</UploadLimitProvider>;
};

function App() {
	return (
		<HelmetProvider>
			<QueryClientProvider client={queryClient}>
				<ThemeProvider theme={theme}>
					<MediaQueryContextProvider>
						<OrganisationContextProvider>
							<UserAuthContextProvider>
								<UserCourseLessonDataContextProvider>
									<ConditionalUploadLimitProvider>
										{/* Centralized context providers - only one instance of each */}
										<CoursesContextProvider>
											<ErrorBoundary context='Application'>
												<Suspense fallback={<Loading />}>
													<Outlet />
												</Suspense>
											</ErrorBoundary>
										</CoursesContextProvider>
									</ConditionalUploadLimitProvider>
								</UserCourseLessonDataContextProvider>
							</UserAuthContextProvider>
						</OrganisationContextProvider>
					</MediaQueryContextProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</HelmetProvider>
	);
}

export default App;
