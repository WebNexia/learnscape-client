import { Box, Grid } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useContext, useEffect, useState } from 'react';
import { UsersContext } from '../contexts/UsersContextProvider';
import { Roles } from '../interfaces/enums';
import { Chart, registerables } from 'chart.js';
import { CoursesContext } from '../contexts/CoursesContextProvider';
import { format } from 'date-fns';
import { User } from '../interfaces/user';
import { EventsContext } from '../contexts/EventsContextProvider';
import AdminLearnersLineGraph from '../components/layouts/dashboard/AdminLearnerLineGraph';
import AdminCoursesBarGraph from '../components/layouts/dashboard/AdminCoursesBarGraph';
import UpcomingEvents from '../components/layouts/dashboard/UpcomingEvents';
import UnreadMessages from '../components/layouts/dashboard/UnreadMessages';
import AdminPayment from '../components/layouts/dashboard/AdminPayment';
import { useNavigate } from 'react-router-dom';
import { UserAuthContext } from '../contexts/UserAuthContextProvider';
import DashboardQuizSubmissions from '../components/layouts/dashboard/DashboardQuizSubmissions';
import DashboardCommunityTopics from '../components/layouts/dashboard/DashboardCommunityTopics';

Chart.register(...registerables);

const AdminDashboard = () => {
	const { sortedUsersData } = useContext(UsersContext);
	const { coursesSummary, totalCourses, totalNumberOfEnrolledLearners } = useContext(CoursesContext);
	const { sortedEventsData } = useContext(EventsContext);

	const navigate = useNavigate();
	const { user } = useContext(UserAuthContext);

	const [totalUsers, setTotalUsers] = useState<number>(1);
	const [chartData, setChartData] = useState<any>({
		labels: [],
		datasets: [],
	});
	const [barChartData, setBarChartData] = useState<any>({
		labels: [],
		datasets: [],
	});

	useEffect(() => {
		const totalNumberOfUsers: number = sortedUsersData?.filter((user) => user?.role !== Roles.ADMIN).length;
		setTotalUsers(totalNumberOfUsers);

		// Process user data to create chart data
		const processUserData = () => {
			const dataMap: { [date: string]: number } = {};
			sortedUsersData
				?.sort((a: User, b: User) => a.createdAt.localeCompare(b.createdAt))
				.forEach((user) => {
					if (user?.role !== Roles.ADMIN) {
						const date = new Date(user.createdAt).toISOString().split('T')[0];
						dataMap[date] = (dataMap[date] || 0) + 1;
					}
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
						label: 'Number of New Learners',
						data: data, // y-axis values (number of learners)
						fill: true,
						backgroundColor: 'rgba(75,192,192,0.4)',
						borderColor: 'rgba(75,192,192,1)',
						tension: 0.3,
						borderWidth: 1,
					},
				],
			});
		};

		const processBarChartData = () => {
			const labels = coursesSummary?.map((course) => course.title); // Course titles
			const data = coursesSummary?.map((course) => course.enrolledUsersCount); // Enrolled users count per course

			setBarChartData({
				labels, // x-axis values (course titles)
				datasets: [
					{
						label: 'Number of Enrolled Users',
						data, // y-axis values (number of enrolled users)
						backgroundColor: 'rgba(54, 162, 235, 0.6)', // Bar color
						borderColor: 'rgba(54, 162, 235, 1)',
						borderWidth: 0.75,
						barThickness: 15,
					},
				],
			});
		};

		processUserData();
		processBarChartData();
	}, [sortedUsersData, coursesSummary]);

	return (
		<DashboardPagesLayout pageName='Dashboard' customSettings={{ justifyContent: 'flex-start' }}>
			<Box sx={{ display: 'flex', width: '100%', padding: '1.5rem', flexDirection: 'column', alignItems: 'center' }}>
				<Grid container spacing={3}>
					<Grid item md={4}>
						<AdminLearnersLineGraph chartData={chartData} totalUsers={totalUsers} totalNumberOfEnrolledLearners={totalNumberOfEnrolledLearners} />
					</Grid>
					<Grid item md={4}>
						<AdminCoursesBarGraph barChartData={barChartData} totalCourses={totalCourses} />
					</Grid>
					<Grid item md={4}>
						<AdminPayment />
					</Grid>
					<Grid item xs={3} onClick={() => navigate(`/admin/calendar/user/${user?._id}`)}>
						<UpcomingEvents sortedEventsData={sortedEventsData} />
					</Grid>
					<Grid
						item
						xs={3}
						onClick={() => {
							navigate(`/admin/messages/user/${user?._id}`);
						}}>
						<UnreadMessages />
					</Grid>
					<Grid
						item
						xs={3}
						onClick={() => {
							navigate(`/admin/submissions/user/${user?._id}`);
						}}>
						<DashboardQuizSubmissions />
					</Grid>
					<Grid
						item
						xs={3}
						onClick={() => {
							navigate(`/admin/community/user/${user?._id}`);
						}}>
						<DashboardCommunityTopics />
					</Grid>
				</Grid>
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminDashboard;
