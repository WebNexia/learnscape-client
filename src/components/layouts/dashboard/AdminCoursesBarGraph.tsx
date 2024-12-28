import { Box, Typography } from '@mui/material';
import { useContext } from 'react';
import { Bar } from 'react-chartjs-2';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface AdminCoursesBarGraphProps {
	barChartData: any;
	totalCourses: number;
}

const AdminCoursesBarGraph = ({ barChartData, totalCourses }: AdminCoursesBarGraphProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				height: '26rem',
				borderRadius: '0.35rem',
				boxShadow: '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				padding: '1rem 1rem 2rem 1rem',
				transition: '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Typography variant={isMobileSize ? 'h6' : 'h5'}>Total Courses</Typography>
			<Typography sx={{ fontSize: isMobileSize ? '2rem' : '3rem' }}>{totalCourses}</Typography>

			<Box sx={{ height: 250, width: '95%' }}>
				{barChartData && (
					<Bar
						data={barChartData}
						options={{
							responsive: true,
							maintainAspectRatio: false,
							indexAxis: 'y',
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
										stepSize: 1, // Set the step size to 1 to show only integers
										callback: function (value) {
											if (Number.isInteger(value)) {
												return value; // Only return integer values
											}
										},
									},
								},
								y: {
									beginAtZero: true,
								},
							},
						}}
					/>
				)}
			</Box>
		</Box>
	);
};

export default AdminCoursesBarGraph;
