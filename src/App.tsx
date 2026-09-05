import './App.css';
import { Outlet } from 'react-router-dom';
import { Suspense, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import { HelmetProvider } from 'react-helmet-async';
import theme from './themes';
import Loading from './components/layouts/loading/Loading';
import ErrorBoundary from './components/error/ErrorBoundary';
import CookieConsent from './components/common/CookieConsent';
import PageViewTracker from './components/analytics/PageViewTracker';

// Import only essential context providers for initial dashboard load
import UserAuthContextProvider from './contexts/UserAuthContextProvider';
import OrganisationContextProvider from './contexts/OrganisationContextProvider';
import MediaQueryContextProvider from './contexts/MediaQueryContextProvider';
import { UploadLimitProvider } from './contexts/UploadLimitContextProvider';
import CoursesContextProvider from './contexts/CoursesContextProvider';
import UserCourseLessonDataContextProvider from './contexts/UserCourseLessonDataContextProvider';
import { CookieConsentProvider, useCookieConsent } from './contexts/CookieConsentContext';
import { ConsultationCartProvider } from './contexts/ConsultationCartContextProvider';
import { DocumentCartProvider } from './contexts/DocumentCartContextProvider';

const queryClient = new QueryClient();

// UploadLimitProvider for all roles
const ConditionalUploadLimitProvider = ({ children }: { children: React.ReactNode }) => {
	return <UploadLimitProvider>{children}</UploadLimitProvider>;
};

const CookieConsentWrapper = () => {
	const { isOpen, closeCookieConsent } = useCookieConsent();

	// If forced open from footer, show with forceOpen prop
	if (isOpen) {
		return <CookieConsent forceOpen={true} onClose={closeCookieConsent} />;
	}

	// Otherwise, show normal initial banner
	return <CookieConsent />;
};

function App() {
	return (
		<HelmetProvider>
			<QueryClientProvider client={queryClient}>
				<ThemeProvider theme={theme}>
					<CookieConsentProvider>
						<MediaQueryContextProvider>
							<OrganisationContextProvider>
								<UserAuthContextProvider>
									<UserCourseLessonDataContextProvider>
										<ConditionalUploadLimitProvider>
											<ConsultationCartProvider>
												<DocumentCartProvider>
													{/* Centralized context providers - only one instance of each */}
													<CoursesContextProvider>
														<ErrorBoundary context='Application'>
															<PageViewTracker />
															<Suspense fallback={<Loading />}>
																<Outlet />
															</Suspense>
														</ErrorBoundary>
														<CookieConsentWrapper />
													</CoursesContextProvider>
												</DocumentCartProvider>
											</ConsultationCartProvider>
										</ConditionalUploadLimitProvider>
									</UserCourseLessonDataContextProvider>
								</UserAuthContextProvider>
							</OrganisationContextProvider>
						</MediaQueryContextProvider>
					</CookieConsentProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</HelmetProvider>
	);
}

export default App;
