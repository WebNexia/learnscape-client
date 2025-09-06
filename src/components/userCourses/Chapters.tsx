import { Box } from '@mui/material';
import { SingleCourse } from '../../interfaces/course';
import Chapter from './Chapter';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface ChaptersProps {
	course: SingleCourse;
	isEnrolledStatus: boolean;
}

const Chapters = ({ course, isEnrolledStatus }: ChaptersProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);
	const isMobileSize = isRotatedMedium || isSmallScreen;
	return (
		<Box sx={{ width: isMobileSize ? '90%' : '85%', marginBottom: isEnrolledStatus ? '0rem' : '2rem' }}>
			{course &&
				course?.chapters &&
				course?.chapterIds.length !== 0 &&
				course?.chapters?.map?.((chapter, index) => {
					if (chapter !== null && chapter.lessonIds.length > 0) {
						let nextChapterFirstLessonId: string = '';
						if (index + 1 < course?.chapters?.length) {
							nextChapterFirstLessonId = course?.chapters[index + 1].lessonIds[0];
						}
						return <Chapter key={index} chapter={chapter} isEnrolledStatus={isEnrolledStatus} nextChapterFirstLessonId={nextChapterFirstLessonId} />;
					}
				})}
		</Box>
	);
};

export default Chapters;
