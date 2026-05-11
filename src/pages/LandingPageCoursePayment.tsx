import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect } from 'react';
import LandingPageLayout from '../components/landingPage/LandingPageLayout';
import { SingleCourse } from '../interfaces/course';
import ConditionalStripeProvider from '../components/common/ConditionalStripeProvider';
import CoursePaymentForm from '../components/layouts/coursePageBanner/CoursePaymentForm';
import axios from 'axios';
import { useQuery, useQueryClient } from 'react-query';
import theme from '../themes';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';

const base_url = import.meta.env.VITE_SERVER_BASE_URL;

export default function LandingPageCoursePayment() {
	const { courseId, title } = useParams();
	const navigate = useNavigate();
	const { orgId } = useContext(OrganisationContext);
	const queryClient = useQueryClient();
	const [success, setSuccess] = useState(false);

	const detailQueryKey = ['lpPublicCourseDetail', orgId, courseId];

	const {
		data: course,
		isLoading,
		isError,
	} = useQuery(
		detailQueryKey,
		async () => {
			const res = await axios.get(`${base_url}/courses/public/${orgId}/course/${courseId}`);
			return (res?.data?.data as SingleCourse) ?? null;
		},
		{
			enabled: Boolean(orgId && courseId),
			initialData: () => queryClient.getQueryData(detailQueryKey) as SingleCourse | null | undefined,
			staleTime: 60_000,
		}
	);

	const firstLessonId =
		course?.firstLessonId ||
		(course?.chapters?.[0]?.lessonIds?.length ? course.chapters[0].lessonIds[0] : undefined);

	const courseRegistration = async (
		resolvedUserId: string,
		resolvedOrgId: string,
		groupName?: string
	): Promise<string> => {
		if (!courseId || !resolvedUserId || !resolvedOrgId) throw new Error('Missing required data for course registration');
		const response = await axios.post(`${base_url}/userCourses/`, {
			userId: resolvedUserId,
			courseId,
			isCompleted: false,
			isInProgress: true,
			orgId: resolvedOrgId,
			...(groupName && { groupName }),
		});
		if (!response.data?._id) throw new Error('User course creation failed: Missing ID');
		const userCourseId = response.data._id;
		// The server creates the initial userLesson during enrollment.
		if (courseId) queryClient.invalidateQueries(['userLessonsForCourse', courseId, resolvedUserId]);
		queryClient.invalidateQueries(['userCourseData']);
		queryClient.invalidateQueries(['singleCourseDataUser', courseId]);
		return userCourseId;
	};

	useEffect(() => {
		if (success) {
			const t = setTimeout(() => {
				navigate(`/landing-page-course/${encodeURIComponent(title || '')}/${courseId}`, { replace: true });
			}, 2500);
			return () => clearTimeout(t);
		}
	}, [success, navigate, courseId, title]);

	const courseUrl = course
		? `/landing-page-course/${encodeURIComponent(course.title)}/${course._id}`
		: '#';

	if (!isLoading && (isError || !course)) {
		return (
			<LandingPageLayout>
				<Box sx={{ py: 8, px: 2, textAlign: 'center' }}>
					<Typography sx={{ fontFamily: 'Varela Round', mb: 2 }}>Kurs bulunamadı.</Typography>
					<Button variant="outlined" onClick={() => navigate(-1)} sx={{ fontFamily: 'Varela Round' }}>
						Geri
					</Button>
				</Box>
			</LandingPageLayout>
		);
	}

	if (isLoading || !course) {
		return (
			<LandingPageLayout>
				<Box sx={{ py: 8, px: 2, textAlign: 'center' }}>
					<Typography sx={{ fontFamily: 'Varela Round', mb: 2 }}>Kurs yükleniyor...</Typography>
				</Box>
			</LandingPageLayout>
		);
	}

	return (
		<LandingPageLayout>
			<Box
				sx={{
					maxWidth: 1100,
					mx: 'auto',
					pt: { xs: '12vh', md: '15vh' },
					pb: { xs: 2, sm: 3 },
					px: { xs: 2, sm: 3 },
				}}>

				<ConditionalStripeProvider>
					<CoursePaymentForm
						course={course}
						courseRegistration={courseRegistration}
						onSuccess={() => setSuccess(true)}
						onCancel={() => navigate(courseUrl)}
					/>
				</ConditionalStripeProvider>
			</Box>

			<Snackbar
				open={success}
				autoHideDuration={6000}
				anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
				sx={{ mt: '4rem' }}
				onClose={() => setSuccess(false)}>
				<Alert
					onClose={() => setSuccess(false)}
					severity="success"
					sx={{
						width: '100%',
						fontFamily: 'Varela Round',
						backgroundColor: theme.bgColor?.greenSecondary,
						color: theme.textColor?.common?.main ?? 'inherit',
						'& .MuiAlert-icon': { color: 'white' },
					}}>
					Kursa başarıyla kayıt oldunuz! Kurs detaylarını görmek için platforma giriş yapın.
				</Alert>
			</Snackbar>
		</LandingPageLayout>
	);
}
