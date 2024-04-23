import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Auth from './pages/Auth';
import HomePage from './pages/HomePage';
import { ThemeProvider } from '@mui/material/styles';
import theme from './themes';
import Dashboard from './pages/Dashboard';
import { QueryClient, QueryClientProvider } from 'react-query';
import Courses from './pages/Courses';
import Schedule from './pages/Schedule';
import Messages from './pages/Messages';
import Community from './pages/Community';
import Settings from './pages/Settings';
import CoursePage from './pages/CoursePage';
import MediaQueryContextProvider from './contexts/MediaQueryContextProvider';
import LessonPage from './pages/LessonPage';
import UserCourseLessonDataContextProvider from './contexts/UserCourseLessonDataContextProvider';
import AdminCourseEditPage from './pages/AdminCourseEditPage';
import AdminCourses from './pages/AdminCourses';
import AdminLessons from './pages/AdminLessons';
import CoursesContextProvider from './contexts/CoursesContextProvider';
import LessonsContextProvider from './contexts/LessonsContextProvider';
import AdminLessonEditPage from './pages/AdminLessonEditPage';
import UserAuthContextProvider from './contexts/UserAuthContextProvider';
import { useState } from 'react';
import { Roles } from './interfaces/enums';

const queryClient = new QueryClient();

function App() {
	const [userRole, setUserRole] = useState<string>('');

	const hasRole = (role: string) => {
		return userRole && userRole === role;
	};

	const renderRoute = (path: string, element: JSX.Element, requiredRole: string) => {
		return hasRole(requiredRole) ? <Route path={path} element={element} /> : <Route path='/' element={<HomePage />} />;
	};

	return (
		<QueryClientProvider client={queryClient}>
			<UserAuthContextProvider setUserRole={setUserRole}>
				<MediaQueryContextProvider>
					<UserCourseLessonDataContextProvider>
						<CoursesContextProvider>
							<LessonsContextProvider>
								<ThemeProvider theme={theme}>
									<Router>
										<Routes>
											<Route path='' element={<HomePage />} />
											<Route path='/auth' element={<Auth />} />

											{renderRoute('/admin/courses/user/:userId', <AdminCourses />, Roles.ADMIN)}
											{renderRoute('/admin/course-edit/user/:userId/course/:courseId', <AdminCourseEditPage />, Roles.ADMIN)}
											{renderRoute('/admin/lessons/user/:userId', <AdminLessons />, Roles.ADMIN)}
											{renderRoute('admin/lesson-edit/user/:userId/lesson/:lessonId', <AdminLessonEditPage />, Roles.ADMIN)}
											{renderRoute('/dashboard/user/:id', <Dashboard />, Roles.USER)}
											{renderRoute('/courses/user/:id', <Courses />, Roles.USER)}
											{renderRoute('/schedule/user/:id', <Schedule />, Roles.USER)}
											{renderRoute('/messages/user/:id', <Messages />, Roles.USER)}
											{renderRoute('/community/user/:id', <Community />, Roles.USER)}
											{renderRoute('/settings/user/:id', <Settings />, Roles.USER)}
											{renderRoute('/course/:courseId/user/:userId/userCourseId/:userCourseId', <CoursePage />, Roles.USER)}
											{renderRoute('/user/:userId/course/:courseId/userCourseId/:userCourseId/lesson/:lessonId/', <LessonPage />, Roles.USER)}
										</Routes>
									</Router>
								</ThemeProvider>
							</LessonsContextProvider>
						</CoursesContextProvider>
					</UserCourseLessonDataContextProvider>
				</MediaQueryContextProvider>
			</UserAuthContextProvider>
		</QueryClientProvider>
	);
}

export default App;
