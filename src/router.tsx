import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import React from 'react';
import AdminRouteGuard from './components/guards/AdminRouteGuard';
import LearnerRouteGuard from './components/guards/LearnerRouteGuard';
import InstructorRouteGuard from './components/guards/InstructorRouteGuard';
import PaymentsRouteGuard from './components/guards/PaymentsRouteGuard';
import AdminQuizSubmissionsContextProvider from './contexts/AdminQuizSubmissionsContextProvider';
import LearnerQuizSubmissionsContextProvider from './contexts/LearnerQuizSubmissionsContextProvider';
import LandingPageUpcomingPublicEventsContextProvider from './contexts/LandingPageUpcomingPublicEventsContextProvider';
import LandingPageLatestCoursesContextProvider from './contexts/LandingPageLatestCoursesContextProvider';
import AllPublicCoursesContextProvider from './contexts/AllPublicCoursesContextProvider';
import LandingPageResourcesContextProvider from './contexts/LandingPageResourcesContextProvider';
import InquiriesContextProvider from './contexts/InquiriesContextProvider';
import AdminPublicEventsContextProvider from './contexts/AdminPublicEventsContextProvider';
import UsersContextProvider from './contexts/UsersContextProvider';
import LessonsContextProvider from './contexts/LessonsContextProvider';
import QuestionsContextProvider from './contexts/QuestionsContextProvider';
import DocumentsContextProvider from './contexts/DocumentsContextProvider';
import { RecycleBinQuestionsProvider } from './contexts/RecycleBinQuestionsContextProvider';
import { RecycleBinDocumentsProvider } from './contexts/RecycleBinDocumentsContextProvider';
import FeedbackFormsContextProvider from './contexts/FeedbackFormsContextProvider';
import SubscriptionsContextProvider from './contexts/SubscriptionsContextProvider';
import PromoCodesContextProvider from './contexts/PromoCodesContextProvider';
import PaymentsContextProvider from './contexts/PaymentsContextProvider';
import EventsContextProvider from './contexts/EventsContextProvider';
import CommunityContextProvider from './contexts/CommunityContextProvider';
import CommunityMessagesContextProvider from './contexts/CommunityMessagesContextProvider';
// Context providers are now centralized in App.tsx

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
const AdminSetup = React.lazy(() => import('./pages/AdminSetup'));
const ZoomMeetingPage = React.lazy(() => import('./pages/ZoomMeetingPage'));
const EventRecordingPage = React.lazy(() => import('./pages/EventRecordingPage'));
const CoursePage = React.lazy(() => import('./pages/CoursePage'));
const LessonPage = React.lazy(() => import('./pages/LessonPage'));
const AdminCourseEditPage = React.lazy(() => import('./pages/AdminCourseEditPage'));
const AdminCourseAnalytics = React.lazy(() => import('./pages/AdminCourseAnalytics'));
const AdminCourses = React.lazy(() => import('./pages/AdminCourses'));
const AdminLessons = React.lazy(() => import('./pages/AdminLessons'));
const AdminLessonEditPage = React.lazy(() => import('./pages/AdminLessonEditPage'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const InstructorDashboard = React.lazy(() => import('./pages/InstructorDashboard'));
const AdminQuestions = React.lazy(() => import('./pages/AdminQuestions'));
const AdminUsers = React.lazy(() => import('./pages/AdminUsers'));
const AdminDocuments = React.lazy(() => import('./pages/AdminDocuments'));
const AdminCheckoutsFeedback = React.lazy(() => import('./pages/AdminCheckoutsFeedback'));
const AdminQuizSubmissions = React.lazy(() => import('./pages/AdminQuizSubmissions'));
const AdminQuizSubmissionCheck = React.lazy(() => import('./pages/AdminQuizSubmissionCheck'));
const AdminPayments = React.lazy(() => import('./pages/AdminPayments'));
const AdminInquiries = React.lazy(() => import('./pages/AdminInquiries'));
const AdminRecycleBin = React.lazy(() => import('./pages/AdminRecycleBin'));
const AdminPublicEvents = React.lazy(() => import('./pages/AdminPublicEvents'));
const AdminCourseFeedbackForms = React.lazy(() => import('./pages/AdminCourseFeedbackForms'));
const AdminForms = React.lazy(() => import('./pages/AdminForms'));
const AdminFeedbackFormTemplates = React.lazy(() => import('./pages/AdminFeedbackFormTemplates'));
const FeedbackFormSubmissions = React.lazy(() => import('./pages/FeedbackFormSubmissions'));
const PublicFeedbackFormPage = React.lazy(() => import('./pages/PublicFeedbackFormPage'));
const CourseAnalytics = React.lazy(() => import('./pages/CourseAnalytics'));
const PasswordResetPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const VerifyEmailPage = React.lazy(() => import('./pages/VerifyEmailPage'));
const HandleAuthResetPassword = React.lazy(() => import('./pages/HandleAuthResetPassword'));
const CertificateVerificationPage = React.lazy(() => import('./pages/CertificateVerificationPage'));
const RateLimitError = React.lazy(() => import('./pages/RateLimitError'));
const NotFound = React.lazy(() => import('./pages/NotFound'));

// Wrapper to provide setUserRole to Auth
const AuthWrapper = () => {
	return <Auth />;
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
			{ path: 'courses/certificates/verify/:certificateId', element: <CertificateVerificationPage /> },
			{ path: 'zoom-meeting/:eventId', element: <ZoomMeetingPage /> },
			{ path: 'event-recording/:eventId/:recordingId?', element: <EventRecordingPage /> }, // recordingId optional for YouTube recordings
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
						<LessonsContextProvider>
							<DocumentsContextProvider>
								<AdminCourses />
							</DocumentsContextProvider>
						</LessonsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/course-edit/course/:courseId',
				element: (
					<AdminRouteGuard>
						<LessonsContextProvider>
							<DocumentsContextProvider>
								<AdminCourseEditPage />
							</DocumentsContextProvider>
						</LessonsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/course-analytics/course/:courseId',
				element: (
					<AdminRouteGuard>
						<AdminCourseAnalytics />
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/lessons',
				element: (
					<AdminRouteGuard>
						<LessonsContextProvider>
							<QuestionsContextProvider>
								<DocumentsContextProvider>
									<AdminLessons />
								</DocumentsContextProvider>
							</QuestionsContextProvider>
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
				path: 'admin/feedbacks',
				element: (
					<AdminRouteGuard>
						<AdminCheckoutsFeedback />
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
					<PaymentsRouteGuard>
						<PaymentsContextProvider>
							<SubscriptionsContextProvider>
								<PromoCodesContextProvider>
									<AdminPayments />
								</PromoCodesContextProvider>
							</SubscriptionsContextProvider>
						</PaymentsContextProvider>
					</PaymentsRouteGuard>
				),
			},
			{
				path: 'admin/calendar',
				element: (
					<AdminRouteGuard>
						<EventsContextProvider>
							<UsersContextProvider>
								<Calendar />
							</UsersContextProvider>
						</EventsContextProvider>
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
						<UsersContextProvider>
							<CommunityContextProvider>
								<Community />
							</CommunityContextProvider>
						</UsersContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/community/topic/:topicId',
				element: (
					<AdminRouteGuard>
						<UsersContextProvider>
							<CommunityMessagesContextProvider>
								<CommunityTopicPage />
							</CommunityMessagesContextProvider>
						</UsersContextProvider>
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
				path: 'admin/setup',
				element: (
					<AdminRouteGuard>
						<AdminSetup />
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
						<RecycleBinQuestionsProvider>
							<RecycleBinDocumentsProvider>
								<QuestionsContextProvider>
									<DocumentsContextProvider>
										<AdminRecycleBin />
									</DocumentsContextProvider>
								</QuestionsContextProvider>
							</RecycleBinDocumentsProvider>
						</RecycleBinQuestionsProvider>
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
				path: 'admin/course/:courseId/forms',
				element: (
					<AdminRouteGuard>
						<FeedbackFormsContextProvider>
							<AdminCourseFeedbackForms />
						</FeedbackFormsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/forms',
				element: (
					<AdminRouteGuard>
						<FeedbackFormsContextProvider>
							<AdminForms />
						</FeedbackFormsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/form-templates',
				element: (
					<AdminRouteGuard>
						<FeedbackFormsContextProvider>
							<AdminFeedbackFormTemplates />
						</FeedbackFormsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/course/:courseId/forms/:formId/submissions',
				element: (
					<AdminRouteGuard>
						<FeedbackFormsContextProvider>
							<React.Suspense>
								<FeedbackFormSubmissions />
							</React.Suspense>
						</FeedbackFormsContextProvider>
					</AdminRouteGuard>
				),
			},
			{
				path: 'admin/forms/:formId/submissions',
				element: (
					<AdminRouteGuard>
						<FeedbackFormsContextProvider>
							<React.Suspense>
								<FeedbackFormSubmissions />
							</React.Suspense>
						</FeedbackFormsContextProvider>
					</AdminRouteGuard>
				),
			},
			// Instructor Routes
			{
				path: 'instructor/dashboard',
				element: (
					<InstructorRouteGuard>
						<InstructorDashboard />
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/courses',
				element: (
					<InstructorRouteGuard>
						<LessonsContextProvider>
							<DocumentsContextProvider>
								<AdminCourses />
							</DocumentsContextProvider>
						</LessonsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/course-edit/course/:courseId',
				element: (
					<InstructorRouteGuard>
						<LessonsContextProvider>
							<DocumentsContextProvider>
								<AdminCourseEditPage />
							</DocumentsContextProvider>
						</LessonsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/course-analytics/course/:courseId',
				element: (
					<InstructorRouteGuard>
						<AdminCourseAnalytics />
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/lessons',
				element: (
					<InstructorRouteGuard>
						<LessonsContextProvider>
							<QuestionsContextProvider>
								<DocumentsContextProvider>
									<AdminLessons />
								</DocumentsContextProvider>
							</QuestionsContextProvider>
						</LessonsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/lesson-edit/lesson/:lessonId',
				element: (
					<InstructorRouteGuard>
						<LessonsContextProvider>
							<QuestionsContextProvider>
								<DocumentsContextProvider>
									<AdminLessonEditPage />
								</DocumentsContextProvider>
							</QuestionsContextProvider>
						</LessonsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/questions',
				element: (
					<InstructorRouteGuard>
						<QuestionsContextProvider>
							<AdminQuestions />
						</QuestionsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/documents',
				element: (
					<InstructorRouteGuard>
						<DocumentsContextProvider>
							<AdminDocuments />
						</DocumentsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/submissions',
				element: (
					<InstructorRouteGuard>
						<AdminQuizSubmissionsContextProvider>
							<QuestionsContextProvider>
								<AdminQuizSubmissions />
							</QuestionsContextProvider>
						</AdminQuizSubmissionsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/check-submission/submission/:submissionId/lesson/:lessonId/userlesson/:userLessonId',
				element: (
					<InstructorRouteGuard>
						<AdminQuizSubmissionsContextProvider>
							<QuestionsContextProvider>
								<AdminQuizSubmissionCheck />
							</QuestionsContextProvider>
						</AdminQuizSubmissionsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/calendar',
				element: (
					<InstructorRouteGuard>
						<EventsContextProvider>
							<UsersContextProvider>
								<Calendar />
							</UsersContextProvider>
						</EventsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/messages',
				element: (
					<InstructorRouteGuard>
						<Messages />
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/community',
				element: (
					<InstructorRouteGuard>
						<UsersContextProvider>
							<CommunityContextProvider>
								<Community />
							</CommunityContextProvider>
						</UsersContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/community/topic/:topicId',
				element: (
					<InstructorRouteGuard>
						<UsersContextProvider>
							<CommunityMessagesContextProvider>
								<CommunityTopicPage />
							</CommunityMessagesContextProvider>
						</UsersContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/settings',
				element: (
					<InstructorRouteGuard>
						<Settings />
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/course/:courseId/forms',
				element: (
					<InstructorRouteGuard>
						<FeedbackFormsContextProvider>
							<AdminCourseFeedbackForms />
						</FeedbackFormsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/forms',
				element: (
					<InstructorRouteGuard>
						<FeedbackFormsContextProvider>
							<AdminForms />
						</FeedbackFormsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/form-templates',
				element: (
					<InstructorRouteGuard>
						<FeedbackFormsContextProvider>
							<AdminFeedbackFormTemplates />
						</FeedbackFormsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/course/:courseId/forms/:formId/submissions',
				element: (
					<InstructorRouteGuard>
						<FeedbackFormsContextProvider>
							<React.Suspense>
								<FeedbackFormSubmissions />
							</React.Suspense>
						</FeedbackFormsContextProvider>
					</InstructorRouteGuard>
				),
			},
			{
				path: 'instructor/forms/:formId/submissions',
				element: (
					<InstructorRouteGuard>
						<FeedbackFormsContextProvider>
							<React.Suspense>
								<FeedbackFormSubmissions />
							</React.Suspense>
						</FeedbackFormsContextProvider>
					</InstructorRouteGuard>
				),
			},
			// Learner Routes
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
						<LearnerQuizSubmissionsContextProvider>
							<Submissions />
						</LearnerQuizSubmissionsContextProvider>
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
				path: 'course/:courseId/userCourseId/:userCourseId/analytics',
				element: (
					<LearnerRouteGuard>
						<CourseAnalytics />
					</LearnerRouteGuard>
				),
			},
			{
				path: 'calendar',
				element: (
					<LearnerRouteGuard>
						<EventsContextProvider>
							<Calendar />
						</EventsContextProvider>
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
						<CommunityMessagesContextProvider>
							<CommunityTopicPage />
						</CommunityMessagesContextProvider>
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
			// Public Feedback Form Route (no authentication required)
			{
				path: 'feedback-form/:publicLink',
				element: (
					<React.Suspense>
						<PublicFeedbackFormPage />
					</React.Suspense>
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
