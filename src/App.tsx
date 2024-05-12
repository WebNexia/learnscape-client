import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import React, { Suspense, useState } from 'react';
import { ReactQueryDevtools } from 'react-query/devtools';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import theme from './themes';
import { Roles } from './interfaces/enums';
import Loading from './components/layouts/loading/Loading';

const Auth = React.lazy(() => import('./pages/Auth'));
const HomePage = React.lazy(() => import('./pages/HomePage'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Courses = React.lazy(() => import('./pages/Courses'));
const Schedule = React.lazy(() => import('./pages/Schedule'));
const Messages = React.lazy(() => import('./pages/Messages'));
const Community = React.lazy(() => import('./pages/Community'));
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
const AdminMessages = React.lazy(() => import('./pages/AdminMessages'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminSchedule = React.lazy(() => import('./pages/AdminSchedule'));
const AdminCommunity = React.lazy(() => import('./pages/AdminCommunity'));
const MediaQueryContextProvider = React.lazy(() => import('./contexts/MediaQueryContextProvider'));
const UserCourseLessonDataContextProvider = React.lazy(() => import('./contexts/UserCourseLessonDataContextProvider'));
const CoursesContextProvider = React.lazy(() => import('./contexts/CoursesContextProvider'));
const LessonsContextProvider = React.lazy(() => import('./contexts/LessonsContextProvider'));
const QuestionsContextProvider = React.lazy(() => import('./contexts/QuestionsContextProvider'));
const UserAuthContextProvider = React.lazy(() => import('./contexts/UserAuthContextProvider'));
const OrganisationContextProvider = React.lazy(() => import('./contexts/OrganisationContextProvider'));
const UsersContextProvider = React.lazy(() => import('./contexts/UsersContextProvider'));

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
												<Suspense fallback={<Loading />}>
													<Router>
														<Routes>
															<Route path='' element={<HomePage />} />
															<Route path='/auth' element={<Auth setUserRole={setUserRole} />} />

															<>
																{renderRoute('/admin/dashboard/user/:userId', <AdminDashboard />, Roles.ADMIN)}
																{renderRoute('/admin/users/user/:userId', <AdminUsers />, Roles.ADMIN)}
																{renderRoute('/admin/courses/user/:userId', <AdminCourses />, Roles.ADMIN)}
																{renderRoute('/admin/course-edit/user/:userId/course/:courseId', <AdminCourseEditPage />, Roles.ADMIN)}
																{renderRoute('/admin/lessons/user/:userId', <AdminLessons />, Roles.ADMIN)}
																{renderRoute('admin/lesson-edit/user/:userId/lesson/:lessonId', <AdminLessonEditPage />, Roles.ADMIN)}
																{renderRoute('/admin/questions/user/:userId', <AdminQuestions />, Roles.ADMIN)}
																{renderRoute('/admin/schedule/user/:userId', <AdminSchedule />, Roles.ADMIN)}
																{renderRoute('/admin/messages/user/:userId', <AdminMessages />, Roles.ADMIN)}
																{renderRoute('/admin/community/user/:userId', <AdminCommunity />, Roles.ADMIN)}
																{renderRoute('/admin/settings/user/:userId', <AdminSettings />, Roles.ADMIN)}
															</>
															<>
																{renderRoute('/dashboard/user/:id', <Dashboard />, Roles.USER)}
																{renderRoute('/courses/user/:id', <Courses />, Roles.USER)}
																{renderRoute('/course/:courseId/user/:userId/userCourseId/:userCourseId', <CoursePage />, Roles.USER)}
																{renderRoute(
																	'/user/:userId/course/:courseId/userCourseId/:userCourseId/lesson/:lessonId/',
																	<LessonPage />,
																	Roles.USER
																)}
																{renderRoute('/schedule/user/:id', <Schedule />, Roles.USER)}
																{renderRoute('/messages/user/:id', <Messages />, Roles.USER)}
																{renderRoute('/community/user/:id', <Community />, Roles.USER)}
																{renderRoute('/settings/user/:id', <Settings />, Roles.USER)}
															</>
														</Routes>
													</Router>
												</Suspense>
											</QuestionsContextProvider>
										</LessonsContextProvider>
									</UserCourseLessonDataContextProvider>
								</CoursesContextProvider>
							</UsersContextProvider>
						</OrganisationContextProvider>
					</UserAuthContextProvider>
				</MediaQueryContextProvider>
			</ThemeProvider>

			<ReactQueryDevtools initialIsOpen={true} />
		</QueryClientProvider>
	);
}

export default App;
