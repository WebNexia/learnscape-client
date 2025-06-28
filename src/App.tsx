import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { Suspense, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from './themes';
import { Roles } from './interfaces/enums';
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
import ContactRequestsProvider from './contexts/ContactRequestsContextProvider';

// Lazy load pages
const Auth = React.lazy(() => import('./pages/Auth'));
const LandingPage = React.lazy(() => import('./pages/LandingPage'));
const LandingPageResources = React.lazy(() => import('./pages/LandingPageResources'));
const LandingPageCourse = React.lazy(() => import('./pages/LandingPageCourse'));
const LandingPageCourses = React.lazy(() => import('./pages/LandingPageCourses'));
const AboutUs = React.lazy(() => import('./pages/AboutUs'));
const ContactUs = React.lazy(() => import('./pages/ContactUs'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Courses = React.lazy(() => import('./pages/Courses'));
const Submissions = React.lazy(() => import('./pages/Submissions'));
const SubmissionFeedbackDetails = React.lazy(() => import('./pages/SubmissionFeedbackDetails'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Community = React.lazy(() => import('./pages/Community'));
const CommunityTopicPage = React.lazy(() => import('./pages/CommunityTopicPage'));
const Settings = React.lazy(() => import('./pages/Settings'));
const CoursePage = React.lazy(() => import('./pages/CoursePage'));
const LessonPage = React.lazy(() => import('./pages/LessonPage'));
const AdminCourseEditPage = React.lazy(() => import('./pages/AdminCourseEditPage'));
const AdminCourses = React.lazy(() => import('./pages/AdminCourses'));
const AdminLessons = React.lazy(() => import('./pages/AdminLessons'));
const AdminLessonEditPage = React.lazy(() => import('./pages/AdminLessonEditPage'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminQuestions = React.lazy(() => import('./pages/AdminQuestions'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminDocuments = React.lazy(() => import('./pages/AdminDocuments'));
const AdminQuizSubmissions = React.lazy(() => import('./pages/AdminQuizSubmissions'));
const AdminQuizSubmissionCheck = React.lazy(() => import('./pages/AdminQuizSubmissionCheck'));
const AdminPayments = React.lazy(() => import('./pages/AdminPayments'));
const AdminContactRequests = React.lazy(() => import('./pages/AdminContactRequests'));
const AdminPublicEvents = React.lazy(() => import('./pages/AdminPublicEvents'));

const PasswordResetPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const HandleAuthResetPassword = React.lazy(() => import('./pages/HandleAuthResetPassword'));

const RateLimitError = React.lazy(() => import('./pages/RateLimitError'));

const queryClient = new QueryClient();

function App() {
	const [userRole, setUserRole] = useState<string | null>(
		localStorage.getItem('role') // Retrieve user role from localStorage
	);

	const hasRole = (role: string) => {
		return userRole && userRole === role;
	};

	const renderRoute = (path: string, element: JSX.Element, requiredRole: string) => {
		return hasRole(requiredRole) ? <Route path={path} element={element} /> : <Route path='/' element={<LandingPage />} />;
	};

	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={theme}>
				<Router>
					<Routes>
						<Route path='/rate-limit-error' element={<RateLimitError />} />
						<Route
							path='*'
							element={
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
																						<ContactRequestsProvider>
																							<Suspense fallback={<Loading />}>
																								<Elements stripe={stripePromise}>
																									<Routes>
																										<Route path='/' element={<LandingPage />} />
																										<Route path='/resources' element={<LandingPageResources />} />
																										<Route path='/course/:title/:courseId' element={<LandingPageCourse />} />
																										<Route path='/landing-page-courses' element={<LandingPageCourses />} />
																										<Route path='/auth' element={<Auth setUserRole={setUserRole} />} />
																										<Route path='/reset-password' element={<PasswordResetPage />} />
																										<Route path='/verify-email' element={<VerifyEmailPage />} />
																										<Route path='/handle-auth-reset' element={<HandleAuthResetPassword />} />
																										<Route path='/about-us' element={<AboutUs />} />
																										<Route path='/contact-us' element={<ContactUs />} />
																										<>{renderRoute('/admin/dashboard/user/:userId', <AdminDashboard />, Roles.ADMIN)}</>
																										<>{renderRoute('/admin/users/user/:userId', <AdminUsers />, Roles.ADMIN)}</>
																										<>{renderRoute('/admin/courses/user/:userId', <AdminCourses />, Roles.ADMIN)}</>
																										<>
																											{renderRoute(
																												'/admin/course-edit/user/:userId/course/:courseId',
																												<AdminCourseEditPage />,
																												Roles.ADMIN
																											)}
																										</>
																										<>{renderRoute('/admin/lessons/user/:userId', <AdminLessons />, Roles.ADMIN)}</>
																										<>
																											{renderRoute(
																												'/admin/lesson-edit/user/:userId/lesson/:lessonId',
																												<AdminLessonEditPage />,
																												Roles.ADMIN
																											)}
																										</>
																										<>{renderRoute('/admin/questions/user/:userId', <AdminQuestions />, Roles.ADMIN)}</>
																										<>{renderRoute('/admin/documents/user/:userId', <AdminDocuments />, Roles.ADMIN)}</>
																										<>{renderRoute('/admin/submissions/user/:userId', <AdminQuizSubmissions />, Roles.ADMIN)}</>
																										<>
																											{renderRoute(
																												'/admin/check-submission/user/:userId/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
																												<AdminQuizSubmissionCheck />,
																												Roles.ADMIN
																											)}
																										</>
																										<>{renderRoute('/admin/payments/user/:userId', <AdminPayments />, Roles.ADMIN)}</>
																										<>{renderRoute('/admin/calendar/user/:userId', <Calendar />, Roles.ADMIN)}</>
																										<>{renderRoute('/admin/messages/user/:userId', <Messages />, Roles.ADMIN)}</>
																										<>{renderRoute('/admin/community/user/:userId', <Community />, Roles.ADMIN)}</>
																										<>
																											{renderRoute(
																												'/admin/community/user/:userId/topic/:topicId',
																												<CommunityTopicPage />,
																												Roles.ADMIN
																											)}
																										</>
																										<>{renderRoute('/admin/settings/user/:userId', <Settings />, Roles.ADMIN)}</>
																										<>{renderRoute('/admin/contact-requests/user/:userId', <AdminContactRequests />, Roles.ADMIN)}</>
																										<>
																											{renderRoute('/admin/calendar/public-events/user/:userId', <AdminPublicEvents />, Roles.ADMIN)}
																										</>

																										<>{renderRoute('/dashboard/user/:id', <Dashboard />, Roles.USER)}</>
																										<>{renderRoute('/courses/user/:id', <Courses />, Roles.USER)}</>
																										<>{renderRoute('/submissions/user/:userId', <Submissions />, Roles.USER)}</>
																										<>
																											{renderRoute(
																												'/submission-feedback/user/:userId/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
																												<SubmissionFeedbackDetails />,
																												Roles.USER
																											)}
																										</>
																										<>
																											{renderRoute(
																												'/course/:courseId/user/:userId/userCourseId/:userCourseId',
																												<CoursePage />,
																												Roles.USER
																											)}
																										</>
																										<>
																											{renderRoute(
																												'/user/:userId/course/:courseId/userCourseId/:userCourseId/lesson/:lessonId/',
																												<LessonPage />,
																												Roles.USER
																											)}
																										</>
																										<>{renderRoute('/calendar/user/:id', <Calendar />, Roles.USER)}</>
																										<>{renderRoute('/messages/user/:userId', <Messages />, Roles.USER)}</>
																										<>{renderRoute('/community/user/:id', <Community />, Roles.USER)}</>
																										<>{renderRoute('/community/user/:id/topic/:topicId', <CommunityTopicPage />, Roles.USER)}</>
																										<>{renderRoute('/settings/user/:id', <Settings />, Roles.USER)}</>
																									</Routes>
																								</Elements>
																							</Suspense>
																						</ContactRequestsProvider>
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
							}
						/>
					</Routes>
				</Router>
			</ThemeProvider>
		</QueryClientProvider>
	);
}

export default App;
