import { Box, Checkbox, FormControlLabel } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/DashboardLayout/DashboardPagesLayout';
import { useContext, useState } from 'react';
import DashboardCourseCard from '../components/DashboardCourseCard';
import { SingleCourse } from '../interfaces/course';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { useParams } from 'react-router-dom';
import { UserCoursesIdsWithCourseIds } from '../contexts/UserCourseLessonDataContextProvider';

const Courses = () => {
	const [checked, setChecked] = useState<boolean>(false);

	const { sortedData } = useContext(CoursesContext);

	const { id } = useParams();

	return (
		<DashboardPagesLayout
			pageName='Courses'
			customSettings={{ flexDirection: 'row', alignItems: 'flex-start' }}>
			<Box sx={{ width: '100%' }}>
				<Box sx={{ margin: '2rem 0 2rem 3rem' }}>
					<FormControlLabel
						control={
							<Checkbox
								checked={checked}
								onChange={(e) => setChecked(e.target.checked)}
							/>
						}
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
					{sortedData &&
						sortedData
							.filter((course: SingleCourse) => course.isActive === true)
							.map((course: SingleCourse) => {
								let userCourseData: UserCoursesIdsWithCourseIds[] = [];

								const storedUserCourseData: string | null =
									localStorage.getItem('userCourseData');
								if (storedUserCourseData !== null) {
									userCourseData = JSON.parse(storedUserCourseData);
								}
								const isEnrolled: boolean = userCourseData
									?.map((data) => data.courseId)
									.includes(course._id);

								const userCourseId: string = userCourseData?.filter(
									(data) => data?.courseId === course._id
								)[0]?.userCourseId;

								const singleUserCourseData:
									| UserCoursesIdsWithCourseIds
									| undefined = userCourseData.find(
									(data: UserCoursesIdsWithCourseIds) =>
										data.userCourseId === userCourseId
								);
								const isCourseCompleted: boolean =
									singleUserCourseData?.isCourseCompleted || false;

								return (
									<DashboardCourseCard
										key={course._id}
										course={course}
										isEnrolled={isEnrolled}
										userId={id}
										displayMyCourses={checked}
										userCourseId={userCourseId}
										isCourseCompleted={isCourseCompleted}
									/>
								);
							})}
				</Box>
			</Box>
		</DashboardPagesLayout>
	);
};

export default Courses;
