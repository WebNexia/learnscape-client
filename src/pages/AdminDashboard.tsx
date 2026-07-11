import { Box, CircularProgress, Grid } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import { useMemo } from 'react';
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
import { AdminData, useDashboardSummary } from '../hooks/useDashboardSummary';
import { useAuth } from '../hooks/useAuth';

Chart.register(...registerables);

const buildUserChartData = (userTimeline?: { labels: string[]; data: number[] }) => ({
	labels: userTimeline?.labels ?? [],
	datasets: [
		{
			label: '# New Learners',
			data: userTimeline?.data ?? [],
			fill: true,
			backgroundColor: 'rgba(75,192,192,0.4)',
			borderColor: 'rgba(75,192,192,1)',
			tension: 0.3,
			borderWidth: 1,
		},
	],
});

const buildCourseChartData = (courseEnrollments?: { labels: string[]; data: number[] }) => ({
	labels: courseEnrollments?.labels ?? [],
	datasets: [
		{
			label: '# Enrolled Users per Course',
			data: courseEnrollments?.data ?? [],
			backgroundColor: 'rgba(54, 162, 235, 0.6)',
			borderColor: 'rgba(54, 162, 235, 1)',
			borderWidth: 0.75,
			barThickness: 15,
		},
	],
});

const AdminDashboard = () => {
	const navigate = useNavigate();
	const { canAccessPayments } = useAuth();
	const { dashboardData, commonData, commonLoading, roleLoading, incomeLoading } = useDashboardSummary();

	const adminData = useMemo(() => {
		if (dashboardData?.roleSpecific && 'totalUsers' in dashboardData.roleSpecific) {
			return dashboardData.roleSpecific as AdminData;
		}
		return null;
	}, [dashboardData]);

	const chartData = useMemo(() => buildUserChartData(adminData?.userTimeline), [adminData]);
	const barChartData = useMemo(() => buildCourseChartData(adminData?.courseEnrollments), [adminData]);

	const showInitialLoading = commonLoading && !commonData;

	return (
		<DashboardPagesLayout pageName='Dashboard' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			{showInitialLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '12rem', width: '100%' }}>
					<CircularProgress />
				</Box>
			) : (
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
							{roleLoading ? (
								<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '26rem' }}>
									<CircularProgress size={28} />
								</Box>
							) : (
								<AdminLearnersLineGraph
									chartData={chartData}
									totalUsers={adminData?.totalUsers ?? 0}
									totalNumberOfEnrolledLearners={adminData?.enrolledUsersCount ?? 0}
								/>
							)}
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
							{roleLoading ? (
								<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '26rem' }}>
									<CircularProgress size={28} />
								</Box>
							) : (
								<AdminCoursesBarGraph barChartData={barChartData} totalCourses={adminData?.totalCourses ?? 0} />
							)}
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
								{incomeLoading ? (
									<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '26rem' }}>
										<CircularProgress size={28} />
									</Box>
								) : (
									<AdminPayment
										ownerIncome={adminData?.ownerIncome}
										ownerIncomeFromPayments={adminData?.ownerIncomeFromPayments}
										ownerIncomeFromSubscriptions={adminData?.ownerIncomeFromSubscriptions}
										superAdminIncome={adminData?.superAdminIncome}
										superAdminIncomeFromPayments={adminData?.superAdminIncomeFromPayments}
										superAdminIncomeFromSubscriptions={adminData?.superAdminIncomeFromSubscriptions}
										totalPayments={adminData?.totalPayments}
									/>
								)}
							</Grid>
						)}
						<Grid item sm={2.4} xs={6} onClick={() => navigate(`/admin/calendar`)}>
							<UpcomingEvents dashboardEvents={commonData?.upcomingEvents} />
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
							<DashboardQuizSubmissions quizNotification={commonData?.quizNotification} />
						</Grid>
						<Grid
							item
							sm={2.4}
							xs={6}
							onClick={() => {
								navigate(`/admin/community`);
							}}>
							<DashboardCommunityTopics recentTopics={commonData?.recentTopics} />
						</Grid>
						<Grid
							item
							sm={2.4}
							xs={6}
							onClick={() => {
								navigate(`/admin/inquiries`);
							}}>
							<AdminInquiries inquiriesCount={adminData?.inquiriesCount} />
						</Grid>
					</Grid>
				</Box>
			)}
		</DashboardPagesLayout>
	);
};

export default AdminDashboard;
