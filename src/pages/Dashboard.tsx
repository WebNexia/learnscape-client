import { Box, CircularProgress, Grid } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import UpcomingEvents from '../components/layouts/dashboard/UpcomingEvents';
import { useNavigate } from 'react-router-dom';
import UnreadMessages from '../components/layouts/dashboard/UnreadMessages';
import { useMemo } from 'react';

import DashboardQuizSubmissions from '../components/layouts/dashboard/DashboardQuizSubmissions';
import DashboardCommunityTopics from '../components/layouts/dashboard/DashboardCommunityTopics';
import EnrolledCoursesLineGraph from '../components/layouts/dashboard/EnrolledCoursesLineGraph';
import { Chart, registerables } from 'chart.js';
import CompletedLessonsBarGraph from '../components/layouts/dashboard/CompletedLessonsBarGraph';
import { LearnerData, useDashboardSummary } from '../hooks/useDashboardSummary';

Chart.register(...registerables);

const buildCourseChartData = (timeline?: { labels: string[]; data: number[] }) => ({
	labels: timeline?.labels ?? [],
	datasets: [
		{
			label: 'Number of New Courses Enrolled',
			data: timeline?.data ?? [],
			fill: true,
			backgroundColor: 'rgba(75,192,192,0.4)',
			borderColor: 'rgba(75,192,192,1)',
			tension: 0.3,
			borderWidth: 1,
		},
	],
});

const buildLessonChartData = (timeline?: { labels: string[]; data: number[] }) => ({
	labels: timeline?.labels ?? [],
	datasets: [
		{
			label: 'Number of Lessons Completed',
			data: timeline?.data ?? [],
			backgroundColor: 'rgba(75, 192, 192, 0.6)',
			borderColor: 'rgba(75, 192, 192, 1)',
			borderWidth: 1,
			barThickness: 15,
		},
	],
});

interface DashboardProps {}

const Dashboard = ({}: DashboardProps) => {
	const navigate = useNavigate();
	const { dashboardData, loading } = useDashboardSummary();

	const learnerData = useMemo((): LearnerData | null => {
		if (dashboardData?.roleSpecific && 'courseTimeline' in dashboardData.roleSpecific) {
			return dashboardData.roleSpecific as LearnerData;
		}
		return null;
	}, [dashboardData]);

	const chartData = useMemo(() => buildCourseChartData(learnerData?.courseTimeline), [learnerData]);
	const barChartData = useMemo(() => buildLessonChartData(learnerData?.lessonTimeline), [learnerData]);
	const showInitialLoading = loading && !dashboardData;

	return (
		<DashboardPagesLayout pageName='Dashboard' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			{showInitialLoading ? (
				<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '12rem', width: '100%' }}>
					<CircularProgress />
				</Box>
			) : (
				<Box sx={{ width: '100%', padding: '1.5rem' }}>
					<Grid container spacing={2}>
						<Grid item md={6} sm={12} xs={12}>
							<EnrolledCoursesLineGraph
								chartData={chartData}
								totalEnrolledCourses={learnerData?.enrolledCourses ?? 0}
								totalCompletedCourses={learnerData?.completedCourses ?? 0}
							/>
						</Grid>
						<Grid item md={6} sm={12} xs={12}>
							<CompletedLessonsBarGraph
								barChartData={barChartData}
								numberOfCompletedLessons={learnerData?.completedLessons ?? 0}
							/>
						</Grid>

						<Grid item sm={3} xs={6} onClick={() => navigate(`/calendar`)}>
							<UpcomingEvents dashboardEvents={dashboardData?.common.upcomingEvents} />
						</Grid>
						<Grid
							item
							sm={3}
							xs={6}
							onClick={() => {
								navigate(`/messages`);
							}}>
							<UnreadMessages />
						</Grid>
						<Grid
							item
							sm={3}
							xs={6}
							onClick={() => {
								navigate(`/submissions`);
							}}>
							<DashboardQuizSubmissions quizNotification={dashboardData?.common.quizNotification} />
						</Grid>
						<Grid
							item
							sm={3}
							xs={6}
							onClick={() => {
								navigate(`/community`);
							}}>
							<DashboardCommunityTopics recentTopics={dashboardData?.common.recentTopics} />
						</Grid>
					</Grid>
				</Box>
			)}
		</DashboardPagesLayout>
	);
};

export default Dashboard;
