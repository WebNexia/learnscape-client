import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogTitle,
	Paper,
	Snackbar,
	Typography,
} from '@mui/material';
import theme from '../themes';
import { SingleCourse } from '../interfaces/course';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import CoursePageBannerDataCard from './CoursePageBannerDataCard';
import axios from 'axios';
import { useState } from 'react';
import {
	UserCoursesIdsWithCourseIds,
	UserLessonDataStorage,
} from '../contexts/UserCourseLessonDataContextProvider';
import { BaseChapter } from '../interfaces/chapter';

interface CoursePageBannerProps {
	course: SingleCourse;
	isEnrolledStatus: boolean;
	setIsEnrolledStatus: React.Dispatch<React.SetStateAction<boolean>>;
}

const CoursePageBanner = ({
	course,
	isEnrolledStatus,
	setIsEnrolledStatus,
}: CoursePageBannerProps) => {
	const firstChapter: BaseChapter =
		course && course?.chapters.sort((a, b) => a.order - b.order)[0];
	const firstLessonId: string = firstChapter.lessons.sort((a, b) => a.order - b.order)[0]._id;

	const navigate = useNavigate();

	const [displayEnrollmentMsg, setDisplayEnrollmentMsg] = useState<boolean>(false);
	const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

	const { courseId, userId } = useParams();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const vertical = 'top';
	const horizontal = 'center';

	const date: Date = new Date(course.startingDate);

	const options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	};

	const startDate: string = date.toLocaleString('en-US', options);

	const courseRegistration = async (): Promise<void> => {
		try {
			const response = await axios.post(`${base_url}/userCourses/`, {
				courseId,
				userId,
				isCompleted: false,
				isInProgress: true,
			});

			setIsEnrolledStatus(true);

			const responseUserLesson = await axios.post(`${base_url}/userLessons`, {
				lessonId: firstLessonId,
				userId,
				courseId,
				userCourseId: response.data._id,
				currentQuestion: 1,
				lessonOrder: firstChapter.lessons.sort((a, b) => a.order - b.order)[0].order,
				isCompleted: false,
				isInProgress: true,
			});

			const currentUserLessonData: string | null = localStorage.getItem('userLessonData');

			if (currentUserLessonData !== null) {
				const updatedUserLessonData: UserLessonDataStorage[] =
					JSON.parse(currentUserLessonData);
				if (
					!updatedUserLessonData.some(
						(data: UserLessonDataStorage) =>
							data.lessonId === firstLessonId && data.courseId === courseId
					) &&
					courseId
				) {
					const newUserLessonData: UserLessonDataStorage = {
						lessonId: firstLessonId,
						userLessonId: responseUserLesson.data._id,
						courseId,
						isCompleted: false,
						isInProgress: true,
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
				});
				localStorage.setItem('userCourseData', JSON.stringify(updatedUserCoursesIds));
			}

			setDisplayEnrollmentMsg(true);

			navigate(
				`/course/${course._id}/user/${userId}/userCourseId/${response.data._id}?isEnrolled=true`
			);
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
				width: '85%',
				height: '23rem',
				margin: '3rem 0 2rem 0',
				backgroundColor: theme.palette.primary.main,
			}}>
			<Snackbar
				open={displayEnrollmentMsg}
				autoHideDuration={4000}
				onClose={() => setDisplayEnrollmentMsg(false)}
				anchorOrigin={{ vertical, horizontal }}>
				<Alert
					onClose={() => setDisplayEnrollmentMsg(false)}
					severity='success'
					sx={{ width: '100%' }}>
					You successfully enrolled the course!
				</Alert>
			</Snackbar>

			<Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
				<DialogTitle>Enroll</DialogTitle>
				<DialogActions>
					<Button
						onClick={() => {
							courseRegistration();
							setIsDialogOpen(false);
						}}>
						Enroll
					</Button>
				</DialogActions>
			</Dialog>

			<Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						margin: '1rem 3rem 1rem 2rem',
						flex: 1,
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
								navigate(-1);
								// window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							Back to courses
						</Button>
						<Typography
							variant='h3'
							sx={{ color: theme.textColor?.common.main, margin: '0.5rem 0 1rem 0' }}>
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
						<Button
							variant='contained'
							sx={{
								visibility: isEnrolledStatus ? 'hidden' : 'visible',
								backgroundColor: theme.bgColor?.greenSecondary,
								width: '100%',
								textTransform: 'capitalize',
								position: 'absolute',
								bottom: 5,
								fontSize: '1rem',
								':hover': {
									color: theme.textColor?.greenSecondary.main,
									backgroundColor: theme.submitBtn?.[':hover'].backgroundColor,
								},
							}}
							onClick={handleEnrollment}>
							Enroll
						</Button>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						flex: 1,
					}}>
					<Box>
						<CoursePageBannerDataCard title='Starting Date' content={startDate} />
						<CoursePageBannerDataCard title='Duration' content={course.durationWeeks} />
					</Box>
					<Box>
						<CoursePageBannerDataCard title='Format' content={course.format} />

						<CoursePageBannerDataCard
							title='Price'
							content={`${
								course.price.toLowerCase() === 'free'
									? ''
									: course.priceCurrency === null
									? ''
									: course.priceCurrency
							}${course.price}`}
							customSettings={{
								color: theme.textColor?.common.main,
								bgColor: theme.bgColor?.greenSecondary,
							}}
						/>
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default CoursePageBanner;
