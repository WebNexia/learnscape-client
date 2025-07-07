import { createBrowserRouter, RouteObject } from 'react-router-dom';
import App from './App';
import React from 'react';

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

// Wrapper to provide setUserRole to Auth
const AuthWrapper = () => {
	const [userRole, setUserRole] = React.useState<string | null>(localStorage.getItem('role'));
	return <Auth setUserRole={setUserRole} />;
};

export const router = createBrowserRouter([
	{
		path: '/',
		element: <App />, // App is the layout
		children: [
			{ path: 'rate-limit-error', element: <RateLimitError /> },
			{ path: '', element: <LandingPage /> },
			{ path: 'resources', element: <LandingPageResources /> },
			{ path: 'course/:title/:courseId', element: <LandingPageCourse /> },
			{ path: 'landing-page-courses', element: <LandingPageCourses /> },
			{ path: 'auth', element: <AuthWrapper /> },
			{ path: 'reset-password', element: <PasswordResetPage /> },
			{ path: 'verify-email', element: <VerifyEmailPage /> },
			{ path: 'handle-auth-reset', element: <HandleAuthResetPassword /> },
			{ path: 'about-us', element: <AboutUs /> },
			{ path: 'contact-us', element: <ContactUs /> },
			{ path: 'admin/dashboard', element: <AdminDashboard /> },
			{ path: 'admin/users', element: <AdminUsers /> },
			{ path: 'admin/courses', element: <AdminCourses /> },
			{ path: 'admin/course-edit/course/:courseId', element: <AdminCourseEditPage /> },
			{ path: 'admin/lessons', element: <AdminLessons /> },
			{ path: 'admin/lesson-edit/lesson/:lessonId', element: <AdminLessonEditPage /> },
			{ path: 'admin/questions', element: <AdminQuestions /> },
			{ path: 'admin/documents', element: <AdminDocuments /> },
			{ path: 'admin/submissions', element: <AdminQuizSubmissions /> },
			{
				path: 'admin/check-submission/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
				element: <AdminQuizSubmissionCheck />,
			},
			{ path: 'admin/payments', element: <AdminPayments /> },
			{ path: 'admin/calendar', element: <Calendar /> },
			{ path: 'admin/messages', element: <Messages /> },
			{ path: 'admin/community', element: <Community /> },
			{ path: 'admin/community/topic/:topicId', element: <CommunityTopicPage /> },
			{ path: 'admin/settings', element: <Settings /> },
			{ path: 'admin/contact-requests', element: <AdminContactRequests /> },
			{ path: 'admin/calendar/public-events', element: <AdminPublicEvents /> },
			{ path: 'dashboard', element: <Dashboard /> },
			{ path: 'courses', element: <Courses /> },
			{ path: 'submissions', element: <Submissions /> },
			{
				path: 'submission-feedback/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
				element: <SubmissionFeedbackDetails />,
			},
			{ path: 'course/:courseId/userCourseId/:userCourseId', element: <CoursePage /> },
			{ path: 'course/:courseId/userCourseId/:userCourseId/lesson/:lessonId/', element: <LessonPage /> },
			{ path: 'calendar', element: <Calendar /> },
			{ path: 'messages', element: <Messages /> },
			{ path: 'community', element: <Community /> },
			{ path: 'community/topic/:topicId', element: <CommunityTopicPage /> },
			{ path: 'settings', element: <Settings /> },
		],
	},
]);
