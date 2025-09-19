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
import CoursesContextProvider from './contexts/CoursesContextProvider';
import LessonsContextProvider from './contexts/LessonsContextProvider';
import DocumentsContextProvider from './contexts/DocumentsContextProvider';
import QuestionsContextProvider from './contexts/QuestionsContextProvider';
import PaymentsContextProvider from './contexts/PaymentsContextProvider';
import PromoCodesContextProvider from './contexts/PromoCodesContextProvider';
import SubscriptionsContextProvider from './contexts/SubscriptionsContextProvider';
import InquiriesContextProvider from './contexts/InquiriesContextProvider';
import UsersContextProvider from './contexts/UsersContextProvider';
import CommunityContextProvider from './contexts/CommunityContextProvider';
import CommunityMessagesContextProvider from './contexts/CommunityMessagesContextProvider';
import EventsContextProvider from './contexts/EventsContextProvider';
import AdminPublicEventsContextProvider from './contexts/AdminPublicEventsContextProvider';

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
					<OrganisationContextProvider>
						<UserAuthContextProvider>
							<ConditionalUploadLimitProvider>
								{/* Centralized context providers - only one instance of each */}
								<CoursesContextProvider>
									<LessonsContextProvider>
										<DocumentsContextProvider>
											<QuestionsContextProvider>
												<PaymentsContextProvider>
													<PromoCodesContextProvider>
														<SubscriptionsContextProvider>
															<InquiriesContextProvider>
																<UsersContextProvider>
																	<CommunityContextProvider>
																		<CommunityMessagesContextProvider>
																			<EventsContextProvider>
																				<AdminPublicEventsContextProvider>
																					<Suspense fallback={<Loading />}>
																						<Outlet />
																					</Suspense>
																				</AdminPublicEventsContextProvider>
																			</EventsContextProvider>
																		</CommunityMessagesContextProvider>
																	</CommunityContextProvider>
																</UsersContextProvider>
															</InquiriesContextProvider>
														</SubscriptionsContextProvider>
													</PromoCodesContextProvider>
												</PaymentsContextProvider>
											</QuestionsContextProvider>
										</DocumentsContextProvider>
									</LessonsContextProvider>
								</CoursesContextProvider>
							</ConditionalUploadLimitProvider>
						</UserAuthContextProvider>
					</OrganisationContextProvider>
				</MediaQueryContextProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
