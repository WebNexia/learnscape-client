import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import React from 'react';
import AdminRouteGuard from './components/guards/AdminRouteGuard';
import LearnerRouteGuard from './components/guards/LearnerRouteGuard';
import QuestionsContextProvider from './contexts/QuestionsContextProvider';
import InquiriesContextProvider from './contexts/InquiriesContextProvider';
import UsersContextProvider from './contexts/UsersContextProvider';
import CoursesContextProvider from './contexts/CoursesContextProvider';
import LessonsContextProvider from './contexts/LessonsContextProvider';
import DocumentsContextProvider from './contexts/DocumentsContextProvider';
import AdminQuizSubmissionsContextProvider from './contexts/AdminQuizSubmissionsContextProvider';
import LearnerQuizSubmissionsContextProvider from './contexts/LearnerQuizSubmissionsContextProvider';
import UserCourseLessonDataContextProvider from './contexts/UserCourseLessonDataContextProvider';
import PaymentsContextProvider from './contexts/PaymentsContextProvider';
import PromoCodesContextProvider from './contexts/PromoCodesContextProvider';
import EventsContextProvider from './contexts/EventsContextProvider';
import AdminPublicEventsContextProvider from './contexts/AdminPublicEventsContextProvider';
import CommunityContextProvider from './contexts/CommunityContextProvider';
import CommunityMessagesContextProvider from './contexts/CommunityMessagesContextProvider';
import LandingPageUpcomingPublicEventsContextProvider from './contexts/LandingPageUpcomingPublicEventsContextProvider';
import LandingPageLatestCoursesContextProvider from './contexts/LandingPageLatestCoursesContextProvider';
import AllPublicCoursesContextProvider from './contexts/AllPublicCoursesContextProvider';
import LandingPageResourcesContextProvider from './contexts/LandingPageResourcesContextProvider';
// Context wrapper'lar kaldırıldı - artık gerekli değil

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
const AdminRecycleBin = React.lazy(() => import('./pages/AdminRecycleBin'));
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
			{
				path: '',
				element: (
					<LandingPageUpcomingPublicEventsContextProvider>
						<LandingPageLatestCoursesContextProvider>
							<LandingPage />
						</LandingPageLatestCoursesContextProvider>
					</LandingPageUpcomingPublicEventsContextProvider>
				),
			},
			{
				path: 'resources',
				element: (
					<LandingPageResourcesContextProvider>
						<LandingPageResources />
					</LandingPageResourcesContextProvider>
				),
			},
			{
				path: 'landing-page-course/:title/:courseId',
				element: (
					<AllPublicCoursesContextProvider>
						<LandingPageCourse />
					</AllPublicCoursesContextProvider>
				),
			},
			{
				path: 'landing-page-courses',
				element: (
					<AllPublicCoursesContextProvider>
						<LandingPageCourses />
					</AllPublicCoursesContextProvider>
				),
			},
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
						<UsersContextProvider>
							<AdminUsers />
						</UsersContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/courses',
				element: (
					<AdminRouteGuard>
						<CoursesContextProvider>
							<AdminCourses />
						</CoursesContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/course-edit/course/:courseId',
				element: (
					<AdminRouteGuard>
						<CoursesContextProvider>
							<LessonsContextProvider>
								<DocumentsContextProvider>
									<AdminCourseEditPage />
								</DocumentsContextProvider>
							</LessonsContextProvider>
						</CoursesContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/lessons',
				element: (
					<AdminRouteGuard>
						<LessonsContextProvider>
							<AdminLessons />
						</LessonsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/lesson-edit/lesson/:lessonId',
				element: (
					<AdminRouteGuard>
						<LessonsContextProvider>
							<QuestionsContextProvider>
								<DocumentsContextProvider>
									<AdminLessonEditPage />
								</DocumentsContextProvider>
							</QuestionsContextProvider>
						</LessonsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/questions',
				element: (
					<AdminRouteGuard>
						<QuestionsContextProvider>
							<AdminQuestions />
						</QuestionsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/documents',
				element: (
					<AdminRouteGuard>
						<DocumentsContextProvider>
							<AdminDocuments />
						</DocumentsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/submissions',
				element: (
					<AdminRouteGuard>
						<AdminQuizSubmissionsContextProvider>
							<QuestionsContextProvider>
								<AdminQuizSubmissions />
							</QuestionsContextProvider>
						</AdminQuizSubmissionsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/check-submission/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
				element: (
					<AdminRouteGuard>
						<AdminQuizSubmissionsContextProvider>
							<QuestionsContextProvider>
								<AdminQuizSubmissionCheck />
							</QuestionsContextProvider>
						</AdminQuizSubmissionsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/payments',
				element: (
					<AdminRouteGuard>
						<PaymentsContextProvider>
							<PromoCodesContextProvider>
								<CoursesContextProvider>
									<AdminPayments />
								</CoursesContextProvider>
							</PromoCodesContextProvider>
						</PaymentsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/calendar',
				element: (
					<AdminRouteGuard>
						<UsersContextProvider>
							<EventsContextProvider>
								<Calendar />
							</EventsContextProvider>
						</UsersContextProvider>
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
						<CommunityContextProvider>
							<Community />
						</CommunityContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/community/topic/:topicId',
				element: (
					<AdminRouteGuard>
						<CommunityContextProvider>
							<CommunityMessagesContextProvider>
								<CommunityTopicPage />
							</CommunityMessagesContextProvider>
						</CommunityContextProvider>
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
						<InquiriesContextProvider>
							<AdminInquiries />
						</InquiriesContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/recycle-bin',
				element: (
					<AdminRouteGuard>
						<QuestionsContextProvider>
							<LessonsContextProvider>
								<CoursesContextProvider>
									<DocumentsContextProvider>
										<AdminRecycleBin />
									</DocumentsContextProvider>
								</CoursesContextProvider>
							</LessonsContextProvider>
						</QuestionsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/calendar/public-events',
				element: (
					<AdminRouteGuard>
						<AdminPublicEventsContextProvider>
							<AdminPublicEvents />
						</AdminPublicEventsContextProvider>
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
						<CoursesContextProvider>
							<Courses />
						</CoursesContextProvider>
					</LearnerRouteGuard>
				),
			},
			{
				path: 'submissions',
				element: (
					<LearnerRouteGuard>
						<LearnerQuizSubmissionsContextProvider>
							<QuestionsContextProvider>
								<Submissions />
							</QuestionsContextProvider>
						</LearnerQuizSubmissionsContextProvider>
					</LearnerRouteGuard>
				),
			},
			{
				path: 'submission-feedback/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
				element: (
					<LearnerRouteGuard>
						<LearnerQuizSubmissionsContextProvider>
							<QuestionsContextProvider>
								<SubmissionFeedbackDetails />
							</QuestionsContextProvider>
						</LearnerQuizSubmissionsContextProvider>
					</LearnerRouteGuard>
				),
			},
			{
				path: 'course/:courseId/userCourseId/:userCourseId',
				element: (
					<LearnerRouteGuard>
						<CoursesContextProvider>
							<UserCourseLessonDataContextProvider>
								<CoursePage />
							</UserCourseLessonDataContextProvider>
						</CoursesContextProvider>
					</LearnerRouteGuard>
				),
			},
			{
				path: 'course/:courseId/userCourseId/:userCourseId/lesson/:lessonId/',
				element: (
					<LearnerRouteGuard>
						<UserCourseLessonDataContextProvider>
							<LessonPage />
						</UserCourseLessonDataContextProvider>
					</LearnerRouteGuard>
				),
			},
			{
				path: 'calendar',
				element: (
					<LearnerRouteGuard>
						<UsersContextProvider>
							<EventsContextProvider>
								<Calendar />
							</EventsContextProvider>
						</UsersContextProvider>
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
						<CommunityContextProvider>
							<Community />
						</CommunityContextProvider>
					</LearnerRouteGuard>
				),
			},
			{
				path: 'community/topic/:topicId',
				element: (
					<LearnerRouteGuard>
						<CommunityContextProvider>
							<CommunityMessagesContextProvider>
								<CommunityTopicPage />
							</CommunityMessagesContextProvider>
						</CommunityContextProvider>
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
