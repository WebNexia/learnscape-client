import './App.css';
import { Outlet } from 'react-router-dom';
import React, { Suspense } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from './themes';
import Loading from './components/layouts/loading/Loading';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Import context providers directly
import MediaQueryContextProvider from './contexts/MediaQueryContextProvider';
import UserCourseLessonDataContextProvider from './contexts/UserCourseLessonDataContextProvider';
import CoursesContextProvider from './contexts/CoursesContextProvider';
import LessonsContextProvider from './contexts/LessonsContextProvider';
import QuestionsContextProvider from './contexts/QuestionsContextProvider';
import UserAuthContextProvider from './contexts/UserAuthContextProvider';
import OrganisationContextProvider from './contexts/OrganisationContextProvider';
import UsersContextProvider from './contexts/UsersContextProvider';
import DocumentsContextProvider from './contexts/DocumentsContextProvider';
import QuizSubmissionsContextProvider from './contexts/QuizSubmissionsContextProvider';
import CommunityContextProvider from './contexts/CommunityContextProvider';
import EventsContextProvider from './contexts/EventsContextProvider';
import PaymentsContextProvider from './contexts/PaymentsContextProvider';
import PromoCodesContextProvider from './contexts/PromoCodesContextProvider';
import InquiriesProvider from './contexts/InquiriesContextProvider';

const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={theme}>
				<MediaQueryContextProvider>
					<UserAuthContextProvider>
						<OrganisationContextProvider>
							<UsersContextProvider>
								<CoursesContextProvider>
									<UserCourseLessonDataContextProvider>
										<LessonsContextProvider>
											<QuestionsContextProvider>
												<DocumentsContextProvider>
													<QuizSubmissionsContextProvider>
														<CommunityContextProvider>
															<EventsContextProvider>
																<PaymentsContextProvider>
																	<PromoCodesContextProvider>
																		<InquiriesProvider>
																			<Suspense fallback={<Loading />}>
																				<Elements stripe={stripePromise}>
																					<Outlet />
																				</Elements>
																			</Suspense>
																		</InquiriesProvider>
																	</PromoCodesContextProvider>
																</PaymentsContextProvider>
															</EventsContextProvider>
														</CommunityContextProvider>
													</QuizSubmissionsContextProvider>
												</DocumentsContextProvider>
											</QuestionsContextProvider>
										</LessonsContextProvider>
									</UserCourseLessonDataContextProvider>
								</CoursesContextProvider>
							</UsersContextProvider>
						</OrganisationContextProvider>
					</UserAuthContextProvider>
				</MediaQueryContextProvider>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
