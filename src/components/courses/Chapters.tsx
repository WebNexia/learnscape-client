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
				course.chapters
					.sort((a, b) => a.order - b.order)
					.map((chapter, index) => {
						let nextChapterFirstLessonId: string = '';
						let nextChapterFirstLessonOrder: number = 1;
						if (index + 1 < course.chapters.length) {
							const nextChapterFirstLesson = course.chapters[index + 1].lessons.sort(
								(a, b) => a.order - b.order
							)[0];

							nextChapterFirstLessonId = nextChapterFirstLesson._id;
							nextChapterFirstLessonOrder = nextChapterFirstLesson.order;
						}
						return (
							<Chapter
								key={chapter._id}
								chapter={chapter}
								isEnrolledStatus={isEnrolledStatus}
								nextChapterFirstLessonId={nextChapterFirstLessonId}
								nextChapterFirstLessonOrder={nextChapterFirstLessonOrder}
							/>
						);
					})}
		</Box>
	);
};

export default Chapters;
