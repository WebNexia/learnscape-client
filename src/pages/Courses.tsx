import { Box, Checkbox, FormControlLabel } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useState } from 'react';
import DashboardCourseCard from '../components/userCourses/DashboardCourseCard';
import { SingleCourse } from '../interfaces/course';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { useParams } from 'react-router-dom';
import { UserCoursesIdsWithCourseIds } from '../contexts/UserCourseLessonDataContextProvider';
import { MediaQueryContext } from '../contexts/MediaQueryContextProvider';

const Courses = () => {
	const [checked, setChecked] = useState<boolean>(false);

	const { sortedCoursesData } = useContext(CoursesContext);

	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotated;

	const { id } = useParams();

	return (
		<DashboardPagesLayout pageName='Courses' customSettings={{ flexDirection: 'row', alignItems: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ width: '100%' }}>
				<Box sx={{ margin: isMobileSize ? '1rem 0 1rem 2rem' : '2rem 0 2rem 3rem' }}>
					<FormControlLabel
						control={
							<Checkbox
								checked={checked}
								onChange={(e) => setChecked(e.target.checked)}
								sx={{
									'& .MuiSvgIcon-root': {
										fontSize: isMobileSize ? '1.1rem' : '1.35rem',
									},
								}}
							/>
						}
						label='Show only my courses'
						sx={{
							'& .MuiFormControlLabel-label': {
								fontSize: isMobileSize ? '0.8rem' : '0.95rem',
							},
						}}
					/>
				</Box>
				<Box
					sx={{
						display: 'flex',
						flexWrap: 'wrap',
						justifyContent: 'center',
						alignItems: 'center',
						margin: '0 2rem 2rem 2rem',
					}}>
					{sortedCoursesData &&
						sortedCoursesData
							?.filter((course: SingleCourse) => course.isActive === true && course.courseManagement.isExternal === false)
							?.map((course: SingleCourse) => {
								let userCourseData: UserCoursesIdsWithCourseIds[] = [];

								const storedUserCourseData: string | null = localStorage.getItem('userCourseData');
								if (storedUserCourseData !== null) {
									userCourseData = JSON.parse(storedUserCourseData);
								}
								const isEnrolled: boolean = userCourseData?.map((data) => data.courseId).includes(course._id);

								const userCourseId: string = userCourseData?.filter((data) => data?.courseId === course._id)[0]?.userCourseId;

								const singleUserCourseData: UserCoursesIdsWithCourseIds | undefined = userCourseData.find(
									(data: UserCoursesIdsWithCourseIds) => data.userCourseId === userCourseId
								);
								const isCourseCompleted: boolean = singleUserCourseData?.isCourseCompleted || false;

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
