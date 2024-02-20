import { Box } from '@mui/material';
import { SingleCourse } from '../../interfaces/course';
import Chapter from './Chapter';

interface ChaptersProps {
	course: SingleCourse;
}

const Chapters = ({ course }: ChaptersProps) => {
	return (
		<Box sx={{ width: '85%' }}>
			{course.chapters.map((chapter) => (
				<Chapter key={chapter._id} chapter={chapter} />
			))}
		</Box>
	);
};

export default Chapters;
