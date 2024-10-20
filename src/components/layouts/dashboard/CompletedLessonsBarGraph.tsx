import { Bar } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
import { format } from 'date-fns';

interface CompletedLessonsBarGraphProps {
	barChartData: any;
	numberOfCompletedLessons: number;
}

const CompletedLessonsBarGraph = ({ barChartData, numberOfCompletedLessons }: CompletedLessonsBarGraphProps) => {
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
			<Typography variant='h5'>Completed Lessons</Typography>
			<Typography sx={{ fontSize: '3rem' }}>{numberOfCompletedLessons}</Typography>

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
										callback: function (_, index, values) {
											// Use the index to retrieve the correct date string from your `labels`
											const dateIndex = values[index]?.value ?? 0; // Get the numeric value (index)

											// Map the index back to the correct date label
											const chartLabels = barChartData?.labels || []; // Ensure we access the correct `labels` array
											const dateValue = chartLabels[dateIndex];

											// Check if `dateValue` is valid
											if (dateValue && typeof dateValue === 'string') {
												const parsedDate = new Date(dateValue);

												// Validate the parsed date before formatting it
												if (!isNaN(parsedDate.getTime())) {
													return format(parsedDate, 'dd MMM yy'); // Format the valid date
												}
											}

											return ''; // Return an empty string if date is invalid
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
