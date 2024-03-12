import { Box } from '@mui/material';
import { SingleCourse } from '../../interfaces/course';
import Chapter from './Chapter';

interface ChaptersProps {
	course: SingleCourse;
	isEnrolledStatus: boolean;
}

const Chapters = ({ course, isEnrolledStatus }: ChaptersProps) => {
	const firstChapterOrder: number | undefined = course.chapters.sort((a, b) => a.order - b.order)[0]?.order;

	return (
		<Box sx={{ width: '85%' }}>
			{course.chapters
				.sort((a, b) => a.order - b.order)
				.map((chapter) => (
					<Chapter
						key={chapter._id}
						chapter={chapter}
						isEnrolledStatus={isEnrolledStatus}
						firstChapterOrder={firstChapterOrder}
					/>
				))}
		</Box>
	);
};

export default Chapters;
