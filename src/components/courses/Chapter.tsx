import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import Lesson from './Lesson';
import { BaseChapter } from '../../interfaces/chapter';
import { useQuery } from 'react-query';
import axios from 'axios';
import { useParams } from 'react-router-dom';

interface ChapterProps {
	chapter: BaseChapter;
	isEnrolledStatus: boolean;
	firstChapterOrder: number;
}

const Chapter = ({ chapter, isEnrolledStatus, firstChapterOrder }: ChapterProps) => {
	const isFirstChapter: boolean = chapter.order === firstChapterOrder;

	const firstLessonOrder: number = chapter.lessons?.sort((a, b) => a.order - b.order)[0].order;

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;
	const { userId } = useParams();

	const { data, isLoading, isError } = useQuery('userLessonsData', async () => {
		const response = await axios.get(`${base_url}/userlessons/user/${userId}`);

		const userLessonsIds = response.data.response.map((userLesson: any) => userLesson.lessonId._id);

		localStorage.setItem('userLessonIds', JSON.stringify(userLessonsIds));

		return response.data.response.map((userLesson: any) => userLesson.lessonId._id);
	});

	if (isLoading) {
		return <Box>Loading...</Box>;
	}

	if (isError) {
		return <Box>Error fetching data</Box>;
	}

	return (
		<Box
			sx={{
				marginBottom: '2rem',
				backgroundColor: theme.bgColor?.common,
			}}>
			<Box sx={{ backgroundColor: theme.palette.secondary.main, padding: '1rem 0' }}>
				<Typography variant='h3'>{chapter.title}</Typography>
			</Box>
			{chapter.lessons
				.sort((a, b) => a.order - b.order)
				.map((lesson, index) => {
					return (
						<Lesson
							key={index}
							lesson={lesson}
							isEnrolledStatus={isEnrolledStatus}
							lessonOrder={lesson.order}
							isFirstChapter={isFirstChapter}
							firstLessonOrder={firstLessonOrder}
							userLessonIdsList={data}
						/>
					);
				})}
		</Box>
	);
};

export default Chapter;
