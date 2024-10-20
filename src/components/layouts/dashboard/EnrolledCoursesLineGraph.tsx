import { Box, Typography } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';

interface EnrolledCoursesLineGraphProps {
	chartData: any;
	totalEnrolledCourses: number;
	totalCompletedCourses: number;
}

const EnrolledCoursesLineGraph = ({ chartData, totalEnrolledCourses, totalCompletedCourses }: EnrolledCoursesLineGraphProps) => {
	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				height: '26rem',
				borderRadius: '0.35rem',
				boxShadow: '0.1rem 0.3rem 0.3rem 0.3rem rgba(0,0,0,0.2)',
				padding: '1rem',
				transition: '0.3s',
				':hover': {
					boxShadow: '0rem 0.1rem 0.2rem 0.1rem rgba(0,0,0,0.3)',
				},
			}}>
			<Typography variant='h5'>Enrolled Courses</Typography>
			<Typography sx={{ fontSize: '3rem' }}>{totalEnrolledCourses}</Typography>
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
										callback: function (_, index, values) {
											// Use the index to retrieve the correct date string from your `labels`
											const dateIndex = values[index]?.value ?? 0; // Get the numeric value (index)

											// Map the index back to the correct date label
											const chartLabels = chartData?.labels || []; // Ensure we access the correct `labels` array
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
				<Typography variant='h6' sx={{ fontSize: '0.9rem', margin: '1rem 0 0 2rem' }}>
					Total Number of Completed Users: {totalCompletedCourses}
				</Typography>
			</Box>
		</Box>
	);
};

export default EnrolledCoursesLineGraph;
