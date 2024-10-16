import { Box } from '@mui/material';
import { SingleCourse } from '../../interfaces/course';
import Chapter from './Chapter';

interface ChaptersProps {
	course: SingleCourse;
	isEnrolledStatus: boolean;
}

const Chapters = ({ course, isEnrolledStatus }: ChaptersProps) => {
	return (
		<Box sx={{ width: '85%', marginBottom: isEnrolledStatus ? '0rem' : '2rem' }}>
			{course &&
				course.chapters &&
				course.chapterIds.length !== 0 &&
				course.chapters?.map((chapter, index) => {
					if (chapter !== null) {
						let nextChapterFirstLessonId: string = '';
						if (index + 1 < course.chapters.length) {
							nextChapterFirstLessonId = course.chapters[index + 1].lessonIds[0];
						}
						return <Chapter key={index} chapter={chapter} isEnrolledStatus={isEnrolledStatus} nextChapterFirstLessonId={nextChapterFirstLessonId} />;
					}
				})}
		</Box>
	);
};

export default Chapters;
