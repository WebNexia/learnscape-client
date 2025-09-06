import { Box, Typography } from '@mui/material';
import theme from '../../themes';
import Lesson from './Lesson';
import { LessonById } from '../../interfaces/lessons';
import { ChapterLessonData } from '../../pages/AdminCourseEditPage';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface ChapterProps {
	chapter: ChapterLessonData;
	isEnrolledStatus: boolean;
	nextChapterFirstLessonId: string;
}

const Chapter = ({ chapter, isEnrolledStatus, nextChapterFirstLessonId }: ChapterProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isRotatedMedium || isSmallScreen;
	return (
		<Box
			sx={{
				marginBottom: isMobileSize ? '1rem' : '2rem',
				backgroundColor: theme.bgColor?.common,
			}}>
			<Box sx={{ backgroundColor: theme.palette.secondary.main, padding: isMobileSize ? '0.25rem 0 0.5rem 0' : '1rem 0' }}>
				<Typography variant='h4' sx={{ fontSize: isMobileSize ? '0.9rem' : null }}>
					{chapter.title}
				</Typography>
			</Box>
			<Box sx={{ boxShadow: '0.1rem 0 0.3rem 0.2rem rgba(0, 0, 0, 0.2)', borderRadius: '0.5rem' }}>
				{chapter &&
					chapter?.lessons &&
					chapter?.lessons
						?.filter?.((lesson) => lesson !== null)
						?.map?.((lesson: LessonById, index) => {
							let nextLessonId: string = '';
							if (index !== chapter.lessons?.length - 1) {
								nextLessonId = chapter.lessons[index + 1]._id;
							}
							let lessonOrder: number = index + 1;
							return (
								<Lesson
									key={lesson._id}
									lesson={lesson}
									isEnrolledStatus={isEnrolledStatus}
									nextLessonId={nextLessonId}
									nextChapterFirstLessonId={nextChapterFirstLessonId}
									lessonOrder={lessonOrder}
								/>
							);
						})}
			</Box>
		</Box>
	);
};

export default Chapter;
