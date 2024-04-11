import { Box } from '@mui/material';
import { SingleCourse } from '../../interfaces/course';
import Chapter from './Chapter';

interface ChaptersProps {
	course: SingleCourse;
	isEnrolledStatus: boolean;
}

const Chapters = ({ course, isEnrolledStatus }: ChaptersProps) => {
	return (
		<Box sx={{ width: '85%' }}>
			{course &&
				course.chapters &&
				course.chapters.map((chapter, index) => {
					let nextChapterFirstLessonId: string = '';
					if (index + 1 < course.chapters.length) {
						nextChapterFirstLessonId = course.chapters[index + 1].lessonIds[0];
					}
					return (
						<Chapter
							key={chapter._id}
							chapter={chapter}
							isEnrolledStatus={isEnrolledStatus}
							nextChapterFirstLessonId={nextChapterFirstLessonId}
						/>
					);
				})}
		</Box>
	);
};

export default Chapters;
