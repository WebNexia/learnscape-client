import { Box, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface AdminLearnersLineGraphProps {
	chartData: any;
	totalUsers: number;
	totalNumberOfEnrolledLearners: number;
}

const AdminLearnersLineGraph = ({ chartData, totalUsers, totalNumberOfEnrolledLearners }: AdminLearnersLineGraphProps) => {
	const { isRotatedMedium, isSmallScreen } = useContext(MediaQueryContext);

	const isMobileSize: boolean = isSmallScreen || isRotatedMedium;
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
			<Typography variant={isMobileSize ? 'h6' : 'h5'}>Total Learners</Typography>
			<Typography sx={{ fontSize: isMobileSize ? '2rem' : '3rem' }}>{totalUsers}</Typography>
			<Box sx={{ height: 250, width: '95%' }}>
				{chartData && (
					<Line
						data={chartData}
						options={{
							responsive: true,
							maintainAspectRatio: false,
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
				<Typography variant='h6' sx={{ fontSize: isMobileSize ? '0.8rem' : '0.9rem', margin: '1rem 0 0 1rem' }}>
					Total Number of Enrolled Users: {totalNumberOfEnrolledLearners}
				</Typography>
			</Box>
		</Box>
	);
};

export default AdminLearnersLineGraph;
