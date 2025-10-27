import { Box } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import DashboardCourseCard from '../components/userCourses/DashboardCourseCard';
import { SingleCourse } from '../interfaces/course';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import CoursesSkeleton from '../components/layouts/skeleton/CoursesSkeleton';
import CustomSubmitButton from '../components/forms/customButtons/CustomSubmitButton';
import FilterSearchRow from '../components/layouts/FilterSearchRow';
import { UserCoursesIdsWithCourseIds, UserCourseLessonDataContext } from '../contexts/UserCourseLessonDataContextProvider';
import { useLearnerFilterSearch } from '../hooks/useLearnerFilterSearch';
import CoursesInfoDialog from '../components/layouts/CoursesInfoDialog';
import { InfoOutlined } from '@mui/icons-material';

const Courses = () => {
	const { courses, loading, hasMore, loadMore, enableCoursesFetch } = useContext(CoursesContext);
	const { userCoursesData } = useContext(UserCourseLessonDataContext);

	// Get user course data from context for enrollment and progress tracking
	const userCourseData: UserCoursesIdsWithCourseIds[] = userCoursesData || [];
	const enrolledCourseIds = userCourseData?.map((data) => data.courseId) || [];

	// Dialog state for course info
	const [isInfoDialogOpen, setIsInfoDialogOpen] = useState<boolean>(false);

	useEffect(() => {
		enableCoursesFetch();
	}, []);

	// Filter options for the learner
	const filterOptions = [
		{ value: '', label: 'All Courses' },
		{ value: 'my courses', label: 'My Courses' },
		{ value: 'completed courses', label: 'Completed Courses' },
		{ value: 'in progress courses', label: 'In Progress Courses' },
		{ value: 'paid courses', label: 'Paid Courses' },
		{ value: 'free courses', label: 'Free Courses' },
		{ value: 'platform courses', label: 'Platform Courses' },
		{ value: 'external courses', label: 'External Courses' },
	];

	// Custom filter function for courses
	const customFilterFn = (course: SingleCourse, filterValue: string): boolean => {
		// Base filter: ALWAYS show only active (published) courses for learners
		if (!course.isActive) return false;

		// Apply specific filter logic
		switch (filterValue) {
			case 'my courses':
				return enrolledCourseIds.includes(course._id);
			case 'paid courses':
				return course.prices && course.prices.some((price) => price.amount !== 'Free' && price.amount !== '0' && price.amount !== '');
			case 'free courses':
				return (
					!course.prices ||
					course.prices.length === 0 ||
					course.prices.every((price) => price.amount === 'Free' || price.amount === '0' || price.amount === '')
				);
			case 'completed courses': {
				const userCourse = userCourseData.find((data) => data.courseId === course._id);
				return userCourse?.isCourseCompleted === true;
			}
			case 'in progress courses': {
				const userCourse = userCourseData.find((data) => data.courseId === course._id);
				return !!(userCourse && !userCourse.isCourseCompleted);
			}
			case 'platform courses':
				return course.courseManagement.isExternal === false;
			case 'external courses':
				return course.courseManagement.isExternal === true;
			default:
				// 'all courses' - show all active courses (already filtered above)
				return true;
		}
	};

	// Use the learner filter search hook
	const {
		searchValue,
		filterValue,
		searchedValue,
		setSearchValue,
		setFilterValue,
		filteredData: filteredCourses,
		totalItems,
		isSearchActive,
		handleSearch,
		resetSearch,
		resetFilter,
		resetAll,
	} = useLearnerFilterSearch({
		data: courses || [],
		searchFields: ['title', 'description'],
		customFilterFn,
	});

	// Show loading state while courses are being fetched
	if (loading) {
		return (
			<DashboardPagesLayout pageName='Courses' customSettings={{ flexDirection: 'row', alignItems: 'flex-start' }} showCopyRight={true}>
				<Box sx={{ width: '100%' }}>
					<FilterSearchRow
						filterValue={filterValue}
						onFilterChange={setFilterValue}
						filterOptions={filterOptions}
						filterPlaceholder='Filter Courses'
						searchValue={searchValue}
						onSearchChange={setSearchValue}
						onSearch={handleSearch}
						onReset={resetAll}
						searchPlaceholder='Search in Course Title and Description'
						isSearchLoading={false}
						isSearchActive={isSearchActive || !!filterValue}
						searchResultsTotalItems={totalItems}
						totalItems={totalItems || courses?.length || 0}
						searchedValue={searchedValue}
						onResetSearch={resetSearch}
						onResetFilter={resetFilter}
						actionButtons={[
							{
								label: 'Info',
								onClick: () => setIsInfoDialogOpen(true),
								startIcon: <InfoOutlined />,
							},
						]}
						isSticky={true}
					/>
					<CoursesSkeleton rows={6} />
				</Box>
			</DashboardPagesLayout>
		);
	}

	return (
		<DashboardPagesLayout pageName='Courses' customSettings={{ flexDirection: 'row', alignItems: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ width: '100%' }}>
				<FilterSearchRow
					filterValue={filterValue}
					onFilterChange={setFilterValue}
					filterOptions={filterOptions}
					filterPlaceholder='Filter Courses'
					searchValue={searchValue}
					onSearchChange={setSearchValue}
					onSearch={handleSearch}
					onReset={resetAll}
					searchPlaceholder='Search in Course Title and Description'
					isSearchLoading={false}
					isSearchActive={isSearchActive || !!filterValue}
					searchResultsTotalItems={totalItems}
					totalItems={totalItems}
					searchedValue={searchedValue}
					onResetSearch={resetSearch}
					onResetFilter={resetFilter}
					actionButtons={[
						{
							label: 'Info',
							onClick: () => setIsInfoDialogOpen(true),
							startIcon: <InfoOutlined />,
						},
					]}
					isSticky={true}
				/>
				<Box
					sx={{
						display: 'flex',
						flexWrap: 'wrap',
						justifyContent: 'center',
						alignItems: 'center',
						margin: '0 2rem 2rem 2rem',
					}}>
					{filteredCourses &&
						filteredCourses?.map((course: SingleCourse) => {
							const isEnrolled: boolean = enrolledCourseIds.includes(course._id);

							const userCourseId: string = userCourseData?.filter((data) => data?.courseId === course._id)?.[0]?.userCourseId || '';

							const singleUserCourseData: UserCoursesIdsWithCourseIds | undefined = userCourseData?.find(
								(data: UserCoursesIdsWithCourseIds) => data.userCourseId === userCourseId
							);
							const isCourseCompleted: boolean = singleUserCourseData?.isCourseCompleted || false;

							return (
								<DashboardCourseCard
									key={course._id}
									course={course}
									isEnrolled={isEnrolled}
									displayMyCourses={false}
									userCourseId={userCourseId}
									isCourseCompleted={isCourseCompleted}
									fromHomePage={true}
								/>
							);
						})}

					{/* Load More Button */}
					{hasMore && (
						<Box sx={{ width: '100%', textAlign: 'center', mt: '2rem', mb: '2rem' }}>
							<CustomSubmitButton
								onClick={loadMore}
								disabled={loading}
								sx={{
									padding: '0.5rem 1rem',
									textTransform: 'capitalize',
								}}>
								{loading ? 'Loading...' : 'Load More'}
							</CustomSubmitButton>
						</Box>
					)}
				</Box>
			</Box>
			<CoursesInfoDialog isInfoDialogOpen={isInfoDialogOpen} setIsInfoDialogOpen={setIsInfoDialogOpen} />
		</DashboardPagesLayout>
	);
};

export default Courses;
