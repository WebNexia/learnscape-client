import { Box, Button, Link, Typography } from '@mui/material';
import theme from '../themes';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import ReactPlayer from 'react-player';
import DashboardHeader from '../components/layouts/dashboardLayout/DashboardHeader';
import { DoneAll, KeyboardBackspaceOutlined, KeyboardDoubleArrowRight } from '@mui/icons-material';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { useContext, useState } from 'react';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { Document } from '../interfaces/document';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import Questions from '../components/userCourses/Questions';
import { useUserCourseLessonData } from '../hooks/useUserCourseLessonData';

const LessonPage = () => {
	const { lessonId, userId, courseId, userCourseId } = useParams();
	const { organisation } = useContext(OrganisationContext);
	const navigate = useNavigate();

	const [isQuestionsVisible, setIsQuestionsVisible] = useState<boolean>(false);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { handleNextLesson, nextLessonId } = useUserCourseLessonData();

	const {
		data: lesson,
		isLoading,
		isError,
	} = useQuery(['singleLessonData', lessonId], async () => {
		const response = await axios.get(`${base_url}/lessons/${lessonId}`);
		return response.data;
	});

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
	}

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'flex-start',
				alignItems: 'center',
				backgroundColor: theme.bgColor?.secondary,
				minHeight: '100vh',
				padding: '0 0 3rem 0',
			}}>
			<Box sx={{ width: '100vw', position: 'fixed', top: 0, zIndex: 1111 }}>
				<DashboardHeader pageName={organisation?.orgName || ''} />
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					position: 'fixed',
					top: '4rem',
					width: '100%',
					backgroundColor: theme.bgColor?.secondary,
					zIndex: 1111,
				}}>
				<Box>
					<Button
						variant='text'
						startIcon={<KeyboardBackspaceOutlined />}
						sx={{
							color: theme.textColor?.primary,
							width: 'fit-content',
							margin: '0.75rem 0 0 0.25rem',
							textTransform: 'inherit',
							fontFamily: theme.fontFamily?.main,
							':hover': {
								backgroundColor: 'transparent',
								textDecoration: 'underline',
							},
						}}
						onClick={() => {
							navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId === undefined ? 'none' : userCourseId}?isEnrolled=true`);
							window.scrollTo({ top: 0, behavior: 'smooth' });
						}}>
						Back to Course Home Page
					</Button>
				</Box>
				<Box sx={{ alignSelf: 'center' }}>
					<Typography variant='h3' sx={{ marginBottom: '1.5rem' }}>
						{lesson.title}
					</Typography>
				</Box>
			</Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					margin: '0.5rem 0 0 0',
					width: '100%',
				}}>
				{lesson.videoUrl && !isQuestionsVisible && (
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							margin: '11rem 0 2rem 0',
							width: '100%',
							height: '22rem',
						}}>
						<Box
							sx={{
								height: '100%',
								flex: 1,
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
							}}>
							<ReactPlayer
								url={lesson.videoUrl}
								width='55%'
								height='100%'
								style={{
									boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
								}}
								controls
							/>
						</Box>
					</Box>
				)}
			</Box>

			{lesson.type !== 'Instructional Lesson' && !isQuestionsVisible && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '85%', margin: lesson.videoUrl ? '3rem 0 1rem 0' : '12rem 0 1rem 0' }}>
					<Typography variant='h5'>Instructions</Typography>
				</Box>
			)}

			{lesson.text && !isQuestionsVisible && (
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-start',
						alignItems: 'flex-start',
						margin: lesson.videoUrl ? '1rem 0 3rem 0' : '12rem 0 3rem 0',
						width: '85%',
						boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)',
						padding: '2rem',
					}}>
					<Box>
						<Typography
							variant='body1'
							component='div'
							dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.text) }}
							sx={{ lineHeight: 1.9, textAlign: 'justify' }}
						/>
					</Box>
				</Box>
			)}

			{lesson.type !== 'Instructional Lesson' && !isQuestionsVisible && (
				<Box>
					<CustomSubmitButton
						onClick={() => {
							setIsQuestionsVisible(true);
						}}>
						Go to Questions
					</CustomSubmitButton>
				</Box>
			)}

			{isQuestionsVisible && (
				<Box sx={{ width: '85%' }}>
					<Questions questions={lesson.questions} lessonType={lesson.type} />
				</Box>
			)}

			{lesson.documents.length !== 0 && (
				<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem', width: '85%' }}>
					<Box sx={{ display: 'flex', alignSelf: 'flex-start' }}>
						<Typography variant='h5'>Lesson Materials</Typography>
					</Box>
					<Box sx={{ display: 'flex', alignSelf: 'flex-start' }}>
						{lesson.documents
							?.filter((doc: Document) => doc !== null)
							.map((doc: Document) => (
								<Box sx={{ margin: '0.5rem 0' }} key={doc._id}>
									<Link href={doc?.documentUrl} target='_blank' rel='noopener noreferrer' variant='body2'>
										{doc?.name}
									</Link>
								</Box>
							))}
					</Box>
				</Box>
			)}

			{lesson.type === 'Instructional Lesson' && (
				<Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '85%', marginTop: 'auto' }}>
					<Box sx={{ alignSelf: 'flex-end' }}>
						<CustomSubmitButton
							endIcon={!nextLessonId ? <DoneAll /> : <KeyboardDoubleArrowRight />}
							onClick={async () => {
								await handleNextLesson();
								window.scrollTo({ top: 0, behavior: 'smooth' });
								navigate(`/course/${courseId}/user/${userId}/userCourseId/${userCourseId}?isEnrolled=true`);
							}}
							type='button'>
							{nextLessonId ? 'Next Lesson' : 'Complete Course'}
						</CustomSubmitButton>
					</Box>
				</Box>
			)}
		</Box>
	);
};

export default LessonPage;
