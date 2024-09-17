import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { Suspense, useState } from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from './themes';
import { Roles } from './interfaces/enums';
import Loading from './components/layouts/loading/Loading';

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

// Lazy load pages
const Auth = React.lazy(() => import('./pages/Auth'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Courses = React.lazy(() => import('./pages/Courses'));
const Submissions = React.lazy(() => import('./pages/Submissions'));
const SubmissionFeedbackDetails = React.lazy(() => import('./pages/SubmissionFeedbackDetails'));
const Schedule = React.lazy(() => import('./pages/Schedule'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Community = React.lazy(() => import('./pages/Community'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Settings = React.lazy(() => import('./pages/Settings'));
const CoursePage = React.lazy(() => import('./pages/CoursePage'));
const LessonPage = React.lazy(() => import('./pages/LessonPage'));
const AdminCourseEditPage = React.lazy(() => import('./pages/AdminCourseEditPage'));
const AdminCourses = React.lazy(() => import('./pages/AdminCourses'));
const AdminLessons = React.lazy(() => import('./pages/AdminLessons'));
const AdminLessonEditPage = React.lazy(() => import('./pages/AdminLessonEditPage'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminQuestions = React.lazy(() => import('./pages/AdminQuestions'));
const AdminSettings = React.lazy(() => import('./pages/AdminSettings'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminSchedule = React.lazy(() => import('./pages/AdminSchedule'));
const AdminCommunity = React.lazy(() => import('./pages/AdminCommunity'));
const AdminDocuments = React.lazy(() => import('./pages/AdminDocuments'));
const AdminQuizSubmissions = React.lazy(() => import('./pages/AdminQuizSubmissions'));
const AdminQuizSubmissionCheck = React.lazy(() => import('./pages/AdminQuizSubmissionCheck'));

const queryClient = new QueryClient();

function App() {
	const [userRole, setUserRole] = useState<string | null>(
		localStorage.getItem('role') // Retrieve user role from localStorage
	);

	const hasRole = (role: string) => {
		return userRole && userRole === role;
	};

	const renderRoute = (path: string, element: JSX.Element, requiredRole: string) => {
		return hasRole(requiredRole) ? <Route path={path} element={element} /> : <Route path='/' element={<HomePage />} />;
	};

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
														<Suspense fallback={<Loading />}>
															<Router>
																<Routes>
																	<Route path='/' element={<HomePage />} />
																	<Route path='/auth' element={<Auth setUserRole={setUserRole} />} />

																	<>
																		{renderRoute('/admin/dashboard/user/:userId', <AdminDashboard />, Roles.ADMIN)}
																		{renderRoute('/admin/users/user/:userId', <AdminUsers />, Roles.ADMIN)}
																		{renderRoute('/admin/courses/user/:userId', <AdminCourses />, Roles.ADMIN)}
																		{renderRoute('/admin/course-edit/user/:userId/course/:courseId', <AdminCourseEditPage />, Roles.ADMIN)}
																		{renderRoute('/admin/lessons/user/:userId', <AdminLessons />, Roles.ADMIN)}
																		{renderRoute('admin/lesson-edit/user/:userId/lesson/:lessonId', <AdminLessonEditPage />, Roles.ADMIN)}
																		{renderRoute('/admin/questions/user/:userId', <AdminQuestions />, Roles.ADMIN)}
																		{renderRoute('/admin/documents/user/:userId', <AdminDocuments />, Roles.ADMIN)}
																		{renderRoute('/admin/submissions/user/:userId', <AdminQuizSubmissions />, Roles.ADMIN)}
																		{renderRoute(
																			'/admin/check-submission/user/:userId/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
																			<AdminQuizSubmissionCheck />,
																			Roles.ADMIN
																		)}
																		{renderRoute('/admin/schedule/user/:userId', <AdminSchedule />, Roles.ADMIN)}
																		{renderRoute('/admin/messages/user/:userId', <Messages />, Roles.ADMIN)}
																		{renderRoute('/admin/community/user/:userId', <AdminCommunity />, Roles.ADMIN)}
																		{renderRoute('/admin/notifications/user/:id', <Notifications />, Roles.ADMIN)}
																		{renderRoute('/admin/settings/user/:userId', <AdminSettings />, Roles.ADMIN)}
																	</>
																	<>
																		{renderRoute('/dashboard/user/:id', <Dashboard />, Roles.USER)}
																		{renderRoute('/courses/user/:id', <Courses />, Roles.USER)}
																		{renderRoute('/submissions/user/:userId', <Submissions />, Roles.USER)}
																		{renderRoute(
																			'/submission-feedback/user/:userId/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
																			<SubmissionFeedbackDetails />,
																			Roles.USER
																		)}
																		{renderRoute('/course/:courseId/user/:userId/userCourseId/:userCourseId', <CoursePage />, Roles.USER)}
																		{renderRoute(
																			'/user/:userId/course/:courseId/userCourseId/:userCourseId/lesson/:lessonId/',
																			<LessonPage />,
																			Roles.USER
																		)}
																		{renderRoute('/schedule/user/:id', <Schedule />, Roles.USER)}
																		{renderRoute('/messages/user/:userId', <Messages />, Roles.USER)}
																		{renderRoute('/community/user/:id', <Community />, Roles.USER)}
																		{renderRoute('/notifications/user/:id', <Notifications />, Roles.USER)}
																		{renderRoute('/settings/user/:id', <Settings />, Roles.USER)}
																	</>
																</Routes>
															</Router>
														</Suspense>
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
