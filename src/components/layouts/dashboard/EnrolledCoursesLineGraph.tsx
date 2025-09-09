import { Box, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface EnrolledCoursesLineGraphProps {
	chartData: any;
	totalEnrolledCourses: number;
	totalCompletedCourses: number;
}

const EnrolledCoursesLineGraph = ({ chartData, totalEnrolledCourses, totalCompletedCourses }: EnrolledCoursesLineGraphProps) => {
	const { isRotated, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotated;
	return (
		<Box
			sx={{
				'display': 'flex',
				'flexDirection': 'column',
				'alignItems': 'center',
				'height': '26rem',
				'borderRadius': '0.35rem',
				'boxShadow': '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				'padding': '1rem',
				'transition': '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Typography variant='h5' sx={{ fontSize: isMobileSize ? '1rem' : null }}>
				Enrolled Courses
			</Typography>
			<Typography sx={{ fontSize: isMobileSize ? '2rem' : '3rem' }}>{totalEnrolledCourses}</Typography>
			<Box sx={{ marginTop: '1rem', height: 250, width: '95%' }}>
				{chartData && (
					<Line
						data={chartData}
						options={{
							responsive: true,
							maintainAspectRatio: false, // Allow the chart to take full height
							plugins: {
								legend: {
									display: true,
									labels: {
										font: {
											family: 'Poppins',
											size: 12,
										},
									},
								},
							},
							scales: {
								x: {
									ticks: {
										callback: function (_, index) {
											// Simply return the label at the current index
											const chartLabels = chartData?.labels || [];
											return chartLabels[index] || '';
										},
									},
								},
								y: {
									beginAtZero: true,

									ticks: {
										stepSize: 1, // Set the step size to 1 to show only integers
										callback: function (value) {
											if (Number.isInteger(value)) {
												return value; // Only return integer values
											}
										},
										padding: 10,
									},
								},
							},
						}}
					/>
				)}
			</Box>
			<Box sx={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
				<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.7rem' : '0.9rem', margin: '0.5rem 0 1rem 2rem' }}>
					Total Number of Completed Courses: {totalCompletedCourses}
				</Typography>
			</Box>
		</Box>
	);
};

export default EnrolledCoursesLineGraph;
