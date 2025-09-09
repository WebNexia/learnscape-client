import { Bar } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
import { useContext } from 'react';
import { MediaQueryContext } from '../../../contexts/MediaQueryContextProvider';

interface CompletedLessonsBarGraphProps {
	barChartData: any;
	numberOfCompletedLessons: number;
}

const CompletedLessonsBarGraph = ({ barChartData, numberOfCompletedLessons }: CompletedLessonsBarGraphProps) => {
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
				'padding': '1rem 1rem 2rem 1rem',
				'transition': '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Typography variant='h5' sx={{ fontSize: isMobileSize ? '1rem' : null }}>
				Completed Lessons
			</Typography>
			<Typography sx={{ fontSize: isMobileSize ? '2rem' : '3rem' }}>{numberOfCompletedLessons}</Typography>

			<Box sx={{ marginTop: '1rem', height: 250, width: '95%' }}>
				{barChartData && (
					<Bar
						data={barChartData}
						options={{
							responsive: true,
							maintainAspectRatio: false,
							scales: {
								x: {
									ticks: {
										callback: function (_, index) {
											// Simply return the label at the current index
											const chartLabels = barChartData?.labels || [];
											return chartLabels[index] || '';
										},
									},
								},
								y: {
									beginAtZero: true,

									ticks: {
										stepSize: 1,
									},
								},
							},
							plugins: {
								legend: {
									display: true,
									position: 'top',
								},
							},
						}}
					/>
				)}
			</Box>
		</Box>
	);
};

export default CompletedLessonsBarGraph;
