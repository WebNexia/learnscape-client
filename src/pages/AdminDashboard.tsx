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
import DashboardQuizSubmissions from '../components/layouts/dashboard/DashboardQuizSubmissions';
import DashboardCommunityTopics from '../components/layouts/dashboard/DashboardCommunityTopics';
import AdminInquiries from '../components/layouts/dashboard/AdminInquiries';

Chart.register(...registerables);

const AdminDashboard = () => {
	const { users } = useContext(UsersContext);
	const { courses } = useContext(CoursesContext);
	const { sortedEventsData } = useContext(EventsContext);

	const navigate = useNavigate();

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
		const totalNumberOfUsers: number = users?.filter((user) => user?.role !== Roles.ADMIN)?.length || 0;
		setTotalUsers(totalNumberOfUsers);

		// Process user data to create chart data
		const processUserData = () => {
			const dataMap: { [date: string]: number } = {};
			users
				?.sort((a: User, b: User) => a.createdAt.localeCompare(b.createdAt))
				?.forEach((user) => {
					if (user?.role !== Roles.ADMIN) {
						const date = new Date(user.createdAt).toISOString().split('T')[0];
						dataMap[date] = (dataMap[date] || 0) + 1;
					}
				});

			const labels =
				Object.keys(dataMap)
					?.map((date) => new Date(date)) // Convert to Date objects
					?.sort((a: any, b: any) => a - b) // Sort in ascending order
					?.map((date) => format(date, 'yyyy-MM-dd')) || []; // Convert back to formatted string

			const data = Object.values(dataMap);
			setChartData({
				labels, // x-axis values (dates)
				datasets: [
					{
						label: '# New Learners',
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
			const labels = courses?.map((course: any) => course.title) || []; // Course titles
			const data = courses?.map((course: any) => course.enrolledUsersCount) || []; // Enrolled users count per course

			setBarChartData({
				labels, // x-axis values (course titles)
				datasets: [
					{
						label: '# Enrolled Users per Course',
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
	}, [users]);

	return (
		<DashboardPagesLayout pageName='Dashboard' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ display: 'flex', width: '100%', padding: '1.5rem', flexDirection: 'column', alignItems: 'center' }}>
				<Grid container spacing={2}>
					<Grid
						item
						md={4}
						sm={12}
						xs={12}
						onClick={() => {
							navigate(`/admin/users`);
						}}
						sx={{ cursor: 'pointer' }}>
						<AdminLearnersLineGraph chartData={chartData} totalUsers={totalUsers} totalNumberOfEnrolledLearners={courses?.length} />
					</Grid>
					<Grid
						item
						md={4}
						sm={12}
						xs={12}
						onClick={() => {
							navigate(`/admin/courses`);
						}}
						sx={{ cursor: 'pointer' }}>
						<AdminCoursesBarGraph barChartData={barChartData} totalCourses={courses?.length} />
					</Grid>
					<Grid
						item
						md={4}
						sm={12}
						xs={12}
						onClick={() => {
							navigate(`/admin/payments`);
						}}
						sx={{ cursor: 'pointer' }}>
						<AdminPayment />
					</Grid>
					<Grid item sm={2.4} xs={6} onClick={() => navigate(`/admin/calendar`)}>
						<UpcomingEvents sortedEventsData={sortedEventsData} />
					</Grid>
					<Grid
						item
						sm={2.4}
						xs={6}
						onClick={() => {
							navigate(`/admin/messages`);
						}}>
						<UnreadMessages />
					</Grid>
					<Grid
						item
						sm={2.4}
						xs={6}
						onClick={() => {
							navigate(`/admin/submissions`);
						}}>
						<DashboardQuizSubmissions />
					</Grid>
					<Grid
						item
						sm={2.4}
						xs={6}
						onClick={() => {
							navigate(`/admin/community`);
						}}>
						<DashboardCommunityTopics />
					</Grid>
					<Grid
						item
						sm={2.4}
						xs={6}
						onClick={() => {
							navigate(`/admin/inquiries`);
						}}>
						<AdminInquiries />
					</Grid>
				</Grid>
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminDashboard;
