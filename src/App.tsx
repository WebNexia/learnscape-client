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
import ActiveCoursesContextProvider from './contexts/ActiveCoursesContextProvider';
import MediaQueryContextProvider from './contexts/MediaQueryContextProvider';
import LessonPage from './pages/LessonPage';
import UserCourseLessonDataContextProvider from './contexts/UserCourseLessonDataContextProvider';

const queryClient = new QueryClient();

function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<MediaQueryContextProvider>
				<UserCourseLessonDataContextProvider>
					<ActiveCoursesContextProvider>
						<ThemeProvider theme={theme}>
							<Router>
								<Routes>
									<Route path='' element={<HomePage />} />
									<Route path='/auth' element={<Auth />} />
									<Route path='/dashboard/user/:id' element={<Dashboard />} />
									<Route path='/courses/user/:id' element={<Courses />} />
									<Route path='/schedule/user/:id' element={<Schedule />} />
									<Route path='/messages/user/:id' element={<Messages />} />
									<Route path='/community/user/:id' element={<Community />} />
									<Route path='/settings/user/:id' element={<Settings />} />
									<Route
										path='/course/:courseId/user/:userId/userCourseId/:userCourseId'
										element={<CoursePage />}
									/>
									<Route
										path='user/:userId/course/:courseId/userCourseId/:userCourseId/lesson/:lessonId/'
										element={<LessonPage />}
									/>
								</Routes>
							</Router>
						</ThemeProvider>
					</ActiveCoursesContextProvider>
				</UserCourseLessonDataContextProvider>
			</MediaQueryContextProvider>
		</QueryClientProvider>
	);
}

export default App;
