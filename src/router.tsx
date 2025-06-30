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
			{ path: 'admin/dashboard/user/:userId', element: <AdminDashboard /> },
			{ path: 'admin/users/user/:userId', element: <AdminUsers /> },
			{ path: 'admin/courses/user/:userId', element: <AdminCourses /> },
			{ path: 'admin/course-edit/user/:userId/course/:courseId', element: <AdminCourseEditPage /> },
			{ path: 'admin/lessons/user/:userId', element: <AdminLessons /> },
			{ path: 'admin/lesson-edit/user/:userId/lesson/:lessonId', element: <AdminLessonEditPage /> },
			{ path: 'admin/questions/user/:userId', element: <AdminQuestions /> },
			{ path: 'admin/documents/user/:userId', element: <AdminDocuments /> },
			{ path: 'admin/submissions/user/:userId', element: <AdminQuizSubmissions /> },
			{
				path: 'admin/check-submission/user/:userId/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
				element: <AdminQuizSubmissionCheck />,
			},
			{ path: 'admin/payments/user/:userId', element: <AdminPayments /> },
			{ path: 'admin/calendar/user/:userId', element: <Calendar /> },
			{ path: 'admin/messages/user/:userId', element: <Messages /> },
			{ path: 'admin/community/user/:userId', element: <Community /> },
			{ path: 'admin/community/user/:userId/topic/:topicId', element: <CommunityTopicPage /> },
			{ path: 'admin/settings/user/:userId', element: <Settings /> },
			{ path: 'admin/contact-requests/user/:userId', element: <AdminContactRequests /> },
			{ path: 'admin/calendar/public-events/user/:userId', element: <AdminPublicEvents /> },
			{ path: 'dashboard/user/:id', element: <Dashboard /> },
			{ path: 'courses/user/:id', element: <Courses /> },
			{ path: 'submissions/user/:userId', element: <Submissions /> },
			{
				path: 'submission-feedback/user/:userId/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
				element: <SubmissionFeedbackDetails />,
			},
			{ path: 'course/:courseId/user/:userId/userCourseId/:userCourseId', element: <CoursePage /> },
			{ path: 'user/:userId/course/:courseId/userCourseId/:userCourseId/lesson/:lessonId/', element: <LessonPage /> },
			{ path: 'calendar/user/:id', element: <Calendar /> },
			{ path: 'messages/user/:userId', element: <Messages /> },
			{ path: 'community/user/:id', element: <Community /> },
			{ path: 'community/user/:id/topic/:topicId', element: <CommunityTopicPage /> },
			{ path: 'settings/user/:id', element: <Settings /> },
		],
	},
]);
