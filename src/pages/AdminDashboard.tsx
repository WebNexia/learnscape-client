import { Box, Grid } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useEffect, useState } from 'react';
import { Chart, registerables } from 'chart.js';

import AdminLearnersLineGraph from '../components/layouts/dashboard/AdminLearnerLineGraph';
import AdminCoursesBarGraph from '../components/layouts/dashboard/AdminCoursesBarGraph';
import UpcomingEvents from '../components/layouts/dashboard/UpcomingEvents';
import UnreadMessages from '../components/layouts/dashboard/UnreadMessages';
import AdminPayment from '../components/layouts/dashboard/AdminPayment';
import { useNavigate } from 'react-router-dom';
import DashboardQuizSubmissions from '../components/layouts/dashboard/DashboardQuizSubmissions';
import DashboardCommunityTopics from '../components/layouts/dashboard/DashboardCommunityTopics';
import AdminInquiries from '../components/layouts/dashboard/AdminInquiries';
import { useDashboardSummary } from '../hooks/useDashboardSummary';
import { useAuth } from '../hooks/useAuth';

Chart.register(...registerables);

const AdminDashboard = () => {
	const navigate = useNavigate();

	const { canAccessPayments } = useAuth();

	// New dashboard summary hook
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
		// Use dashboard data for total users instead of context
		if (dashboardData && dashboardData.roleSpecific && 'totalUsers' in dashboardData.roleSpecific) {
			setTotalUsers((dashboardData.roleSpecific as any).totalUsers || 0);
		}

		// Process user data to create chart data
		const processUserData = () => {
			// Use dashboard data if available, otherwise fall back to sample data
			if (dashboardData && dashboardData.roleSpecific && 'userTimeline' in dashboardData.roleSpecific) {
				const userTimeline = (dashboardData.roleSpecific as any).userTimeline;

				if (userTimeline && userTimeline.labels && userTimeline.labels.length > 0) {
					setChartData({
						labels: userTimeline.labels,
						datasets: [
							{
								label: '# New Learners',
								data: userTimeline.data,
								fill: true,
								backgroundColor: 'rgba(75,192,192,0.4)',
								borderColor: 'rgba(75,192,192,1)',
								tension: 0.3,
								borderWidth: 1,
							},
						],
					});
					return;
				}
			}

			const sampleData = {
				labels: ['Dec 24', 'Jan 25'],
				datasets: [
					{
						label: '# New Learners',
						data: [2, 1], // Sample data showing 3 total learners
						fill: true,
						backgroundColor: 'rgba(75,192,192,0.4)',
						borderColor: 'rgba(75,192,192,1)',
						tension: 0.3,
						borderWidth: 1,
					},
				],
			};
			setChartData(sampleData);
		};

		const processBarChartData = () => {
			// Create sample chart data for demonstration
			// In a real scenario, you'd want to fetch course enrollment data
			const sampleData = {
				labels: ['Course 1', 'Course 2', 'Course 3', 'Course 4', 'Course 5'],
				datasets: [
					{
						label: '# Enrolled Users per Course',
						data: [1, 0, 0, 0, 0], // Sample data showing enrollment distribution
						backgroundColor: 'rgba(54, 162, 235, 0.6)',
						borderColor: 'rgba(54, 162, 235, 1)',
						borderWidth: 0.75,
						barThickness: 15,
					},
				],
			};
			setBarChartData(sampleData);
		};

		processUserData();
		processBarChartData();
	}, [dashboardData]);

	return (
		<DashboardPagesLayout pageName='Dashboard' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ display: 'flex', width: '100%', padding: '1.5rem', flexDirection: 'column', alignItems: 'center' }}>
				<Grid container spacing={2}>
					<Grid
						item
						md={!canAccessPayments ? 6 : 4}
						sm={12}
						xs={12}
						onClick={() => {
							navigate(`/admin/users`);
						}}
						sx={{ cursor: 'pointer' }}>
						<AdminLearnersLineGraph
							chartData={chartData}
							totalUsers={dashboardData ? (dashboardData.roleSpecific as any).totalUsers : totalUsers}
							totalNumberOfEnrolledLearners={dashboardData ? (dashboardData.roleSpecific as any).enrolledUsersCount : 0}
						/>
					</Grid>
					<Grid
						item
						md={!canAccessPayments ? 6 : 4}
						sm={12}
						xs={12}
						onClick={() => {
							navigate(`/admin/courses`);
						}}
						sx={{ cursor: 'pointer' }}>
						<AdminCoursesBarGraph barChartData={barChartData} totalCourses={dashboardData ? (dashboardData.roleSpecific as any).totalCourses : 0} />
					</Grid>
					{canAccessPayments && (
						<Grid
							item
							md={4}
							sm={12}
							xs={12}
							onClick={() => {
								navigate(`/admin/payments`);
							}}
							sx={{ cursor: 'pointer' }}>
							<AdminPayment
								ownerIncome={dashboardData ? (dashboardData.roleSpecific as any).ownerIncome : undefined}
								ownerIncomeFromPayments={dashboardData ? (dashboardData.roleSpecific as any).ownerIncomeFromPayments : undefined}
								ownerIncomeFromSubscriptions={dashboardData ? (dashboardData.roleSpecific as any).ownerIncomeFromSubscriptions : undefined}
								superAdminIncome={dashboardData ? (dashboardData.roleSpecific as any).superAdminIncome : undefined}
								superAdminIncomeFromPayments={dashboardData ? (dashboardData.roleSpecific as any).superAdminIncomeFromPayments : undefined}
								superAdminIncomeFromSubscriptions={dashboardData ? (dashboardData.roleSpecific as any).superAdminIncomeFromSubscriptions : undefined}
								totalPayments={dashboardData ? (dashboardData.roleSpecific as any).totalPayments : undefined}
							/>
						</Grid>
					)}
					<Grid item sm={2.4} xs={6} onClick={() => navigate(`/admin/calendar`)}>
						<UpcomingEvents dashboardEvents={dashboardData?.common.upcomingEvents} />
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
						<DashboardQuizSubmissions quizNotification={dashboardData?.common.quizNotification} />
					</Grid>
					<Grid
						item
						sm={2.4}
						xs={6}
						onClick={() => {
							navigate(`/admin/community`);
						}}>
						<DashboardCommunityTopics recentTopics={dashboardData?.common.recentTopics} />
					</Grid>
					<Grid
						item
						sm={2.4}
						xs={6}
						onClick={() => {
							navigate(`/admin/inquiries`);
						}}>
						<AdminInquiries inquiriesCount={dashboardData ? (dashboardData.roleSpecific as any).inquiriesCount : undefined} />
					</Grid>
				</Grid>
			</Box>
		</DashboardPagesLayout>
	);
};

export default AdminDashboard;
