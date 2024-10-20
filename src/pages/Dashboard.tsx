import { Box, Grid } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import UpcomingEvents from '../components/layouts/dashboard/UpcomingEvents';
import { useNavigate } from 'react-router-dom';
import UnreadMessages from '../components/layouts/dashboard/UnreadMessages';
import { useContext, useEffect, useState } from 'react';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import { EventsContext } from '../contexts/EventsContextProvider';
import DashboardQuizSubmissions from '../components/layouts/dashboard/DashboardQuizSubmissions';
import DashboardCommunityTopics from '../components/layouts/dashboard/DashboardCommunityTopics';
import { UserCoursesIdsWithCourseIds, UserLessonDataStorage } from '../contexts/UserCourseLessonDataContextProvider';
import { format } from 'date-fns';
import EnrolledCoursesLineGraph from '../components/layouts/dashboard/EnrolledCoursesLineGraph';
import { Chart, registerables } from 'chart.js';
import CompletedLessonsBarGraph from '../components/layouts/dashboard/CompletedLessonsBarGraph';

Chart.register(...registerables);

interface DashboardProps {}

const Dashboard = ({}: DashboardProps) => {
	const navigate = useNavigate();
	const { user } = useContext(UserAuthContext);
	const { sortedEventsData } = useContext(EventsContext);

	const [totalEnrolledCourses, setTotalEnrolledCourses] = useState<number>(0);
	const [totalCompletedCourses, setTotalCompletedCourses] = useState<number>(0);
	const [numberOfCompletedLessons, setNumberOfCompletedLessons] = useState<number>(0);

	const [chartData, setChartData] = useState<any>({
		labels: [],
		datasets: [],
	});

	const [barChartData, setBarChartData] = useState<any>({
		labels: [],
		datasets: [],
	});

	useEffect(() => {
		const userCourses = JSON.parse(localStorage.getItem('userCourseData')!);
		const userLessons = JSON.parse(localStorage.getItem('userLessonData')!)?.filter((lesson: UserLessonDataStorage) => lesson.isCompleted);

		setTotalEnrolledCourses(userCourses.length);
		setNumberOfCompletedLessons(userLessons.length);
		setTotalCompletedCourses(userCourses.filter((userCourse: UserCoursesIdsWithCourseIds) => userCourse.isCourseCompleted).length);
		// Process user data to create chart data
		const processUserData = () => {
			const dataMap: { [date: string]: number } = {};
			userCourses
				?.sort((a: UserCoursesIdsWithCourseIds, b: UserCoursesIdsWithCourseIds) => a.createdAt.localeCompare(b.createdAt))
				.forEach((userCourse: UserCoursesIdsWithCourseIds) => {
					const date = new Date(userCourse.createdAt).toISOString().split('T')[0];
					dataMap[date] = (dataMap[date] || 0) + 1;
				});

			const labels = Object.keys(dataMap)
				.map((date) => new Date(date)) // Convert to Date objects
				.sort((a: any, b: any) => a - b) // Sort in ascending order
				.map((date) => format(date, 'yyyy-MM-dd')); // Convert back to formatted string

			const data = Object.values(dataMap);
			setChartData({
				labels, // x-axis values (dates)
				datasets: [
					{
						label: 'Number of New Courses Enrolled',
						data: data,
						fill: true,
						backgroundColor: 'rgba(75,192,192,0.4)',
						borderColor: 'rgba(75,192,192,1)',
						tension: 0.3,
						borderWidth: 1,
					},
				],
			});
		};

		const processUserLessonsBarChart = () => {
			const lessonsDataMap: { [date: string]: number } = {};

			userLessons?.forEach((lesson: UserLessonDataStorage) => {
				const date = new Date(lesson.updatedAt).toISOString().split('T')[0]; // Format createdAt as yyyy-MM-dd
				lessonsDataMap[date] = (lessonsDataMap[date] || 0) + 1; // Count lessons created on the same date
			});

			// Create labels (sorted dates) and data (lesson counts)
			const labels = Object.keys(lessonsDataMap)
				.map((date) => new Date(date))
				.sort((a: any, b: any) => a - b) // Sort in ascending order
				.map((date) => format(date, 'dd MMM yyyy')); // Format dates for display

			const data = Object.values(lessonsDataMap); // The number of lessons created on each date

			setBarChartData({
				labels, // x-axis: formatted dates
				datasets: [
					{
						label: 'Number of Lessons Completed',
						data, // y-axis: count of lessons created on each date
						backgroundColor: 'rgba(75, 192, 192, 0.6)', // Bar color
						borderColor: 'rgba(75, 192, 192, 1)',
						borderWidth: 1,
						barThickness: 15, // Adjust bar thickness if needed
					},
				],
			});
		};

		processUserLessonsBarChart();
		processUserData();
	}, []);
	return (
		<DashboardPagesLayout pageName='Dashboard' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ width: '100%', padding: '1.5rem' }}>
				<Grid container spacing={2}>
					<Grid item md={6}>
						<EnrolledCoursesLineGraph
							chartData={chartData}
							totalEnrolledCourses={totalEnrolledCourses}
							totalCompletedCourses={totalCompletedCourses}
						/>
					</Grid>
					<Grid item md={6}>
						<CompletedLessonsBarGraph barChartData={barChartData} numberOfCompletedLessons={numberOfCompletedLessons} />
					</Grid>

					<Grid item xs={3} onClick={() => navigate(`/calendar/user/${user?._id}`)}>
						<UpcomingEvents sortedEventsData={sortedEventsData} />
					</Grid>
					<Grid
						item
						xs={3}
						onClick={() => {
							navigate(`/messages/user/${user?._id}`);
						}}>
						<UnreadMessages />
					</Grid>
					<Grid
						item
						xs={3}
						onClick={() => {
							navigate(`/submissions/user/${user?._id}`);
						}}>
						<DashboardQuizSubmissions />
					</Grid>
					<Grid
						item
						xs={3}
						onClick={() => {
							navigate(`/community/user/${user?._id}`);
						}}>
						<DashboardCommunityTopics />
					</Grid>
				</Grid>
			</Box>
		</DashboardPagesLayout>
	);
};

export default Dashboard;
