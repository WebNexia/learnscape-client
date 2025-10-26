import { Box, Grid } from '@mui/material';
import DashboardPagesLayout from '../components/layouts/dashboardLayout/DashboardPagesLayout';
import UpcomingEvents from '../components/layouts/dashboard/UpcomingEvents';
import { useNavigate } from 'react-router-dom';
import UnreadMessages from '../components/layouts/dashboard/UnreadMessages';
import { useEffect, useState, useContext } from 'react';

import DashboardQuizSubmissions from '../components/layouts/dashboard/DashboardQuizSubmissions';
import DashboardCommunityTopics from '../components/layouts/dashboard/DashboardCommunityTopics';
import { UserCoursesIdsWithCourseIds, UserCourseLessonDataContext } from '../contexts/UserCourseLessonDataContextProvider';
import EnrolledCoursesLineGraph from '../components/layouts/dashboard/EnrolledCoursesLineGraph';
import { Chart, registerables } from 'chart.js';
import CompletedLessonsBarGraph from '../components/layouts/dashboard/CompletedLessonsBarGraph';
import { useDashboardSummary } from '../hooks/useDashboardSummary';

Chart.register(...registerables);

interface DashboardProps {}

const Dashboard = ({}: DashboardProps) => {
	const navigate = useNavigate();
	const { userCoursesData } = useContext(UserCourseLessonDataContext);

	// New dashboard summary hook
	const { dashboardData } = useDashboardSummary();

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
		// Use dashboard data if available, otherwise fall back to context data
		if (dashboardData && dashboardData.roleSpecific && 'courseTimeline' in dashboardData.roleSpecific) {
			const learnerData = dashboardData.roleSpecific as any;

			// Set totals from backend data
			setTotalEnrolledCourses(learnerData.enrolledCourses);
			setNumberOfCompletedLessons(learnerData.completedLessons);
			setTotalCompletedCourses(learnerData.completedCourses);

			// Process course enrollment chart data
			const processCourseData = () => {
				if (learnerData.courseTimeline && learnerData.courseTimeline.labels && learnerData.courseTimeline.labels.length > 0) {
					setChartData({
						labels: learnerData.courseTimeline.labels,
						datasets: [
							{
								label: 'Number of New Courses Enrolled',
								data: learnerData.courseTimeline.data,
								fill: true,
								backgroundColor: 'rgba(75,192,192,0.4)',
								borderColor: 'rgba(75,192,192,1)',
								tension: 0.3,
								borderWidth: 1,
							},
						],
					});
				} else {
					// No data available - show empty chart
					setChartData({
						labels: [],
						datasets: [
							{
								label: 'Number of New Courses Enrolled',
								data: [],
								fill: true,
								backgroundColor: 'rgba(75,192,192,0.4)',
								borderColor: 'rgba(75,192,192,1)',
								tension: 0.3,
								borderWidth: 1,
							},
						],
					});
				}
			};

			// Process lesson completion chart data
			const processLessonData = () => {
				if (learnerData.lessonTimeline && learnerData.lessonTimeline.labels && learnerData.lessonTimeline.labels.length > 0) {
					setBarChartData({
						labels: learnerData.lessonTimeline.labels,
						datasets: [
							{
								label: 'Number of Lessons Completed',
								data: learnerData.lessonTimeline.data,
								backgroundColor: 'rgba(75, 192, 192, 0.6)',
								borderColor: 'rgba(75, 192, 192, 1)',
								borderWidth: 1,
								barThickness: 15,
							},
						],
					});
				} else {
					// No data available - show empty chart
					setBarChartData({
						labels: [],
						datasets: [
							{
								label: 'Number of Lessons Completed',
								data: [],
								backgroundColor: 'rgba(75, 192, 192, 0.6)',
								borderColor: 'rgba(75, 192, 192, 1)',
								borderWidth: 1,
								barThickness: 15,
							},
						],
					});
				}
			};

			processCourseData();
			processLessonData();
		} else {
			// Fallback to context data if dashboard data not available
			const userCourses = userCoursesData || [];

			setTotalEnrolledCourses(userCourses?.length || 0);
			setNumberOfCompletedLessons(0); // Will be updated by dashboard data when available
			setTotalCompletedCourses(userCourses?.filter((userCourse: UserCoursesIdsWithCourseIds) => userCourse.isCourseCompleted)?.length || 0);

			// Set empty chart data as fallback
			setChartData({
				labels: [],
				datasets: [
					{
						label: 'Number of New Courses Enrolled',
						data: [],
						fill: true,
						backgroundColor: 'rgba(75,192,192,0.4)',
						borderColor: 'rgba(75,192,192,1)',
						tension: 0.3,
						borderWidth: 1,
					},
				],
			});

			setBarChartData({
				labels: [],
				datasets: [
					{
						label: 'Number of Lessons Completed',
						data: [],
						backgroundColor: 'rgba(75, 192, 192, 0.6)',
						borderColor: 'rgba(75, 192, 192, 1)',
						borderWidth: 1,
						barThickness: 15,
					},
				],
			});
		}
	}, [dashboardData]);

	return (
		<DashboardPagesLayout pageName='Dashboard' customSettings={{ justifyContent: 'flex-start' }} showCopyRight={true}>
			<Box sx={{ width: '100%', padding: '1.5rem' }}>
				<Grid container spacing={2}>
					<Grid item md={6} sm={12} xs={12}>
						<EnrolledCoursesLineGraph
							chartData={chartData}
							totalEnrolledCourses={dashboardData ? (dashboardData.roleSpecific as any).enrolledCourses : totalEnrolledCourses}
							totalCompletedCourses={dashboardData ? (dashboardData.roleSpecific as any).completedCourses : totalCompletedCourses}
						/>
					</Grid>
					<Grid item md={6} sm={12} xs={12}>
						<CompletedLessonsBarGraph
							barChartData={barChartData}
							numberOfCompletedLessons={dashboardData ? (dashboardData.roleSpecific as any).completedLessons : numberOfCompletedLessons}
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
		</DashboardPagesLayout>
	);
};

export default Dashboard;
