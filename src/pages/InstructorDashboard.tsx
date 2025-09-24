import { Box, Grid } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useEffect, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import InstructorLearnersLineGraph from '../components/layouts/dashboard/InstructorLearnersLineGraph';
import InstructorCoursesBarGraph from '../components/layouts/dashboard/InstructorCoursesBarGraph';
import UpcomingEvents from '../components/layouts/dashboard/UpcomingEvents';
import UnreadMessages from '../components/layouts/dashboard/UnreadMessages';
import DashboardQuizSubmissions from '../components/layouts/dashboard/DashboardQuizSubmissions';
import DashboardCommunityTopics from '../components/layouts/dashboard/DashboardCommunityTopics';
import { useNavigate } from 'react-router-dom';
import { useDashboardSummary } from '../hooks/useDashboardSummary';

Chart.register(...registerables);

const InstructorDashboard = () => {
	const navigate = useNavigate();

	// Dashboard summary hook
	const { dashboardData } = useDashboardSummary();

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
		// Use dashboard data for total users (instructor's course enrollments)
		if (dashboardData && dashboardData.roleSpecific && 'totalUsers' in dashboardData.roleSpecific) {
			setTotalUsers((dashboardData.roleSpecific as any).totalUsers || 0);
		}

		// Process user data to create chart data (instructor's course enrollments)
		const processUserData = () => {
			if (dashboardData && dashboardData.roleSpecific && 'userTimeline' in dashboardData.roleSpecific) {
				const userTimeline = (dashboardData.roleSpecific as any).userTimeline;

				if (userTimeline && userTimeline.labels && userTimeline.labels.length > 0) {
					setChartData({
						labels: userTimeline.labels,
						datasets: [
							{
								label: 'New Learners',
								data: userTimeline.data,
								borderColor: '#01435A',
								backgroundColor: 'rgba(1, 67, 90, 0.1)',
								tension: 0.4,
							},
						],
					});
				}
			}
		};

		// Process course data to create bar chart data (instructor's courses)
		const processCourseData = () => {
			if (dashboardData && dashboardData.roleSpecific && 'courseEnrollments' in dashboardData.roleSpecific) {
				const courseEnrollments = (dashboardData.roleSpecific as any).courseEnrollments;

				if (courseEnrollments && courseEnrollments.labels && courseEnrollments.labels.length > 0) {
					setBarChartData({
						labels: courseEnrollments.labels,
						datasets: [
							{
								label: 'Enrolled Users',
								data: courseEnrollments.data,
								backgroundColor: '#01435A',
							},
						],
					});
				}
			}
		};

		processUserData();
		processCourseData();
	}, [dashboardData]);

	return (
		<DashboardPagesLayout pageName='Dashboard'>
			<Box sx={{ padding: '1.5rem' }}>
				<Grid container spacing={2}>
					{/* Total Learners (enrolled in instructor's courses) */}
					<Grid item md={6} sm={12} xs={12}>
						<InstructorLearnersLineGraph totalUsers={totalUsers} chartData={chartData} />
					</Grid>

					{/* Total Courses (instructor's courses with enrollments) */}
					<Grid item md={6} sm={12} xs={12}>
						<InstructorCoursesBarGraph barChartData={barChartData} totalCourses={(dashboardData?.roleSpecific as any)?.totalCourses || 0} />
					</Grid>

					{/* Upcoming Events (instructor's events + public events) */}
					<Grid item sm={3} xs={6} onClick={() => navigate(`/instructor/calendar`)}>
						<UpcomingEvents dashboardEvents={dashboardData?.common.upcomingEvents} />
					</Grid>

					{/* Unread Messages */}
					<Grid
						item
						sm={3}
						xs={6}
						onClick={() => {
							navigate(`/instructor/messages`);
						}}>
						<UnreadMessages />
					</Grid>

					{/* Unchecked Quizzes (for this instructor) */}
					<Grid
						item
						sm={3}
						xs={6}
						onClick={() => {
							navigate(`/instructor/submissions`);
						}}>
						<DashboardQuizSubmissions quizNotification={dashboardData?.common.quizNotification} />
					</Grid>

					{/* Recent Topics (like everyone) */}
					<Grid
						item
						sm={3}
						xs={6}
						onClick={() => {
							navigate(`/instructor/community`);
						}}>
						<DashboardCommunityTopics recentTopics={dashboardData?.common.recentTopics} />
					</Grid>
				</Grid>
			</Box>
		</DashboardPagesLayout>
	);
};

export default InstructorDashboard;
