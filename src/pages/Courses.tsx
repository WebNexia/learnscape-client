import { Box, Checkbox, FormControlLabel } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/DashboardLayout/DashboardPagesLayout';
import { useContext, useState } from 'react';
import DashboardCourseCard from '../components/DashboardCourseCard';
import { FilteredCourse } from '../interfaces/course';
import { ActiveCoursesContext } from '../contexts/ActiveCoursesContextProvider';
import { useParams } from 'react-router-dom';

const Courses = () => {
	const [checked, setChecked] = useState<boolean>(false);

	const { data } = useContext(ActiveCoursesContext);

	const { id } = useParams();

	return (
		<DashboardPagesLayout pageName='Courses'>
			<Box sx={{ width: '100%' }}>
				<Box sx={{ margin: '2rem 0 2rem 3rem' }}>
					<FormControlLabel
						control={<Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />}
						label='Show only my courses'
					/>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexWrap: 'wrap',
						justifyContent: 'space-around',
						alignItems: 'center',
						margin: '0 3rem',
					}}>
					{data.map((course: FilteredCourse) => {
						let userCoursesIds: string[] = [];

						const storedUserCourseIds: string | null = localStorage.getItem('userCoursesIds');
						if (storedUserCourseIds !== null) {
							userCoursesIds = JSON.parse(storedUserCourseIds);
						}
						const isEnrolled: boolean = userCoursesIds?.includes(course._id);

						return (
							<DashboardCourseCard
								key={course._id}
								course={course}
								isEnrolled={isEnrolled}
								userId={id}
								displayMyCourses={checked}
							/>
						);
					})}
				</Box>
			</Box>
		</DashboardPagesLayout>
	);
};

export default Courses;
