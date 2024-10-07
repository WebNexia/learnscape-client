import { Alert, Box, Button, Paper, Snackbar, Typography } from '@mui/material';
import theme from '../../../themes';
import { SingleCourse } from '../../../interfaces/course';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import CoursePageBannerDataCard from './CoursePageBannerDataCard';
import axios from 'axios';
import { useContext, useState } from 'react';
import { UserCoursesIdsWithCourseIds, UserLessonDataStorage } from '../../../contexts/UserCourseLessonDataContextProvider';
import CustomSubmitButton from '../../forms/customButtons/CustomSubmitButton';
import CustomDialog from '../dialog/CustomDialog';
import CustomDialogActions from '../dialog/CustomDialogActions';
import { dateFormatter } from '../../../utils/dateFormatter';
import { OrganisationContext } from '../../../contexts/OrganisationContextProvider';

interface CoursePageBannerProps {
	course: SingleCourse;
	isEnrolledStatus: boolean;
	setIsEnrolledStatus: React.Dispatch<React.SetStateAction<boolean>>;
	documentsRef: React.RefObject<HTMLDivElement>;
}

const CoursePageBanner = ({ course, isEnrolledStatus, setIsEnrolledStatus, documentsRef }: CoursePageBannerProps) => {
	const firstLessonId: string = course && course?.chapters[0]?.lessonIds && course?.chapters[0]?.lessonIds[0];

	const navigate = useNavigate();

	const [displayEnrollmentMsg, setDisplayEnrollmentMsg] = useState<boolean>(false);
	const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

	const { courseId, userId } = useParams();
	const { orgId } = useContext(OrganisationContext);

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const vertical = 'top';
	const horizontal = 'center';

	const courseRegistration = async (): Promise<void> => {
		try {
			const response = await axios.post(`${base_url}/userCourses/`, {
				courseId,
				userId,
				isCompleted: false,
				isInProgress: true,
				orgId,
			});

			setIsEnrolledStatus(true);

			const responseUserLesson = await axios.post(`${base_url}/userlessons`, {
				lessonId: firstLessonId,
				userId,
				courseId,
				userCourseId: response.data._id,
				currentQuestion: 1,
				isCompleted: false,
				isInProgress: true,
				notes: '',
				orgId,
				teacherFeedback: '',
				isFeedbackGiven: false,
			});

			const currentUserLessonData: string | null = localStorage.getItem('userLessonData');

			if (currentUserLessonData !== null) {
				const updatedUserLessonData: UserLessonDataStorage[] = JSON.parse(currentUserLessonData);
				if (!updatedUserLessonData.some((data: UserLessonDataStorage) => data.lessonId === firstLessonId && data.courseId === courseId) && courseId) {
					const newUserLessonData: UserLessonDataStorage = {
						lessonId: firstLessonId,
						userLessonId: responseUserLesson.data._id,
						courseId,
						currentQuestion: 1,
						isCompleted: false,
						isInProgress: true,
						teacherFeedback: '',
						isFeedbackGiven: false,
					};

					updatedUserLessonData.push(newUserLessonData);
					localStorage.setItem('userLessonData', JSON.stringify(updatedUserLessonData));
				}
			}

			let updatedUserCoursesIds: UserCoursesIdsWithCourseIds[] = [];
			const storedUserCoursesIds = localStorage.getItem('userCourseData');
			if (storedUserCoursesIds !== null && courseId) {
				updatedUserCoursesIds = JSON.parse(storedUserCoursesIds);
				updatedUserCoursesIds.push({
					courseId,
					userCourseId: response.data._id,
					isCourseCompleted: false,
					isCourseInProgress: true,
					courseTitle: course.title,
				});
				localStorage.setItem('userCourseData', JSON.stringify(updatedUserCoursesIds));
			}

			setDisplayEnrollmentMsg(true);

			navigate(`/course/${course._id}/user/${userId}/userCourseId/${response.data._id}?isEnrolled=true`);
		} catch (error) {
			console.log(error);
		}
	};

	const handleEnrollment = async (): Promise<void> => {
		if (course.price.toLowerCase() === 'free') {
			await courseRegistration();
			setIsEnrolledStatus(true);
		} else {
			setIsDialogOpen(true);
		}
	};

	return (
		<Paper
			elevation={10}
			sx={{
				width: '90%',
				height: '23rem',
				margin: '3rem 0 2rem 0',
				backgroundColor: theme.palette.primary.main,
			}}>
			<Snackbar
				open={displayEnrollmentMsg}
				autoHideDuration={4000}
				onClose={() => setDisplayEnrollmentMsg(false)}
				anchorOrigin={{ vertical, horizontal }}>
				<Alert onClose={() => setDisplayEnrollmentMsg(false)} severity='success' sx={{ width: '100%' }}>
					You have successfully enrolled in the course!
				</Alert>
			</Snackbar>

			<CustomDialog openModal={isDialogOpen} closeModal={() => setIsDialogOpen(false)} title='Make Payment'>
				<CustomDialogActions
					onCancel={() => {
						setIsDialogOpen(false);
					}}
					onSubmit={() => {
						courseRegistration();
						setIsDialogOpen(false);
					}}
					submitBtnText='Enroll'
				/>
			</CustomDialog>

			<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						margin: '1rem 3rem 1rem 2rem',
						flex: 3,
						position: 'relative',
						height: '20rem',
					}}>
					<Box>
						<Button
							variant='text'
							startIcon={<KeyboardBackspaceOutlined />}
							sx={{
								color: theme.textColor?.common.main,
								textTransform: 'inherit',
								fontFamily: theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
							}}
							onClick={() => {
								navigate(`/courses/user/${userId}`);
								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							Back to courses
						</Button>
						<Typography variant='h3' sx={{ color: theme.textColor?.common.main, margin: '0.5rem 0 1rem 0' }}>
							{course.title}
						</Typography>
						<Typography
							variant='body2'
							sx={{
								color: theme.textColor?.common.main,
								fontSize: '0.85rem',
								lineHeight: 1.8,
								textAlign: 'justify',
							}}>
							{course.description}
						</Typography>
						{!isEnrolledStatus ? (
							<CustomSubmitButton
								variant='contained'
								sx={{
									width: '8rem',
									position: 'absolute',
									bottom: 5,
									fontSize: '1rem',
								}}
								onClick={handleEnrollment}>
								Enroll
							</CustomSubmitButton>
						) : (
							<Typography
								variant='body1'
								onClick={() => {
									documentsRef.current?.scrollIntoView({ behavior: 'smooth' });
								}}
								sx={{
									width: 'fit-content',
									position: 'absolute',
									bottom: 5,
									fontSize: '0.85rem',
									textTransform: 'capitalize',
									color: theme.textColor?.common.main,
									cursor: 'pointer',
									textDecoration: 'underline',
								}}>
								See Course Materials
							</Typography>
						)}
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						flex: 2,
					}}>
					<Box>
						<CoursePageBannerDataCard
							title='Price'
							content={`${course.price.toLowerCase() === 'free' ? '' : course.priceCurrency === null ? '' : course.priceCurrency}${course.price}`}
							customSettings={{
								color: theme.textColor?.common.main,
								bgColor: theme.bgColor?.greenSecondary,
							}}
						/>
						<CoursePageBannerDataCard title='Weeks(#)' content={course.durationWeeks} />
					</Box>
					<Box>
						<CoursePageBannerDataCard title='Starting Date' content={dateFormatter(course.startingDate)} />

						<CoursePageBannerDataCard title='Hours(#)' content={course.durationHours} />
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default CoursePageBanner;
