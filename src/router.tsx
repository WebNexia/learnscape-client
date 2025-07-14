import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import React from 'react';
import AdminRouteGuard from './components/guards/AdminRouteGuard';
import LearnerRouteGuard from './components/guards/LearnerRouteGuard';

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
const AdminInquiries = React.lazy(() => import('./pages/AdminInquiries'));
const AdminPublicEvents = React.lazy(() => import('./pages/AdminPublicEvents'));
const PasswordResetPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const HandleAuthResetPassword = React.lazy(() => import('./pages/HandleAuthResetPassword'));
const RateLimitError = React.lazy(() => import('./pages/RateLimitError'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Wrapper to provide setUserRole to Auth
const AuthWrapper = () => {
	return <Auth setUserRole={() => {}} />;
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
			{
				path: 'admin/dashboard',
				element: (
					<AdminRouteGuard>
						<AdminDashboard />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/users',
				element: (
					<AdminRouteGuard>
						<AdminUsers />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/courses',
				element: (
					<AdminRouteGuard>
						<AdminCourses />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/course-edit/course/:courseId',
				element: (
					<AdminRouteGuard>
						<AdminCourseEditPage />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/lessons',
				element: (
					<AdminRouteGuard>
						<AdminLessons />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/lesson-edit/lesson/:lessonId',
				element: (
					<AdminRouteGuard>
						<AdminLessonEditPage />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/questions',
				element: (
					<AdminRouteGuard>
						<AdminQuestions />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/documents',
				element: (
					<AdminRouteGuard>
						<AdminDocuments />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/submissions',
				element: (
					<AdminRouteGuard>
						<AdminQuizSubmissions />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/check-submission/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
				element: (
					<AdminRouteGuard>
						<AdminQuizSubmissionCheck />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/payments',
				element: (
					<AdminRouteGuard>
						<AdminPayments />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/calendar',
				element: (
					<AdminRouteGuard>
						<Calendar />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/messages',
				element: (
					<AdminRouteGuard>
						<Messages />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/community',
				element: (
					<AdminRouteGuard>
						<Community />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/community/topic/:topicId',
				element: (
					<AdminRouteGuard>
						<CommunityTopicPage />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/settings',
				element: (
					<AdminRouteGuard>
						<Settings />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/inquiries',
				element: (
					<AdminRouteGuard>
						<AdminInquiries />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/calendar/public-events',
				element: (
					<AdminRouteGuard>
						<AdminPublicEvents />
					</AdminRouteGuard>
				),
			},
			{
				path: 'dashboard',
				element: (
					<LearnerRouteGuard>
						<Dashboard />
					</LearnerRouteGuard>
				),
			},
			{
				path: 'courses',
				element: (
					<LearnerRouteGuard>
						<Courses />
					</LearnerRouteGuard>
				),
			},
			{
				path: 'submissions',
				element: (
					<LearnerRouteGuard>
						<Submissions />
					</LearnerRouteGuard>
				),
			},
			{
				path: 'submission-feedback/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
				element: (
					<LearnerRouteGuard>
						<SubmissionFeedbackDetails />
					</LearnerRouteGuard>
				),
			},
			{
				path: 'course/:courseId/userCourseId/:userCourseId',
				element: (
					<LearnerRouteGuard>
						<CoursePage />
					</LearnerRouteGuard>
				),
			},
			{
				path: 'course/:courseId/userCourseId/:userCourseId/lesson/:lessonId/',
				element: (
					<LearnerRouteGuard>
						<LessonPage />
					</LearnerRouteGuard>
				),
			},
			{
				path: 'calendar',
				element: (
					<LearnerRouteGuard>
						<Calendar />
					</LearnerRouteGuard>
				),
			},
			{
				path: 'messages',
				element: (
					<LearnerRouteGuard>
						<Messages />
					</LearnerRouteGuard>
				),
			},
			{
				path: 'community',
				element: (
					<LearnerRouteGuard>
						<Community />
					</LearnerRouteGuard>
				),
			},
			{
				path: 'community/topic/:topicId',
				element: (
					<LearnerRouteGuard>
						<CommunityTopicPage />
					</LearnerRouteGuard>
				),
			},
			{
				path: 'settings',
				element: (
					<LearnerRouteGuard>
						<Settings />
					</LearnerRouteGuard>
				),
			},
			// Catch-all route for 404 errors - must be last
			{
				path: '*',
				element: <NotFound />,
			},
		],
	},
]);
