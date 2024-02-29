import { Box, Typography } from '@mui/material';
import theme from '../themes';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import Questions from '../components/courses/Questions';
import ReactPlayer from 'react-player';
import DashboardHeader from '../components/layouts/DashboardLayout/DashboardHeader';

const LessonPage = () => {
	const { userId, lessonId } = useParams();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const {
		data: lessonData,
		isLoading: isLessonDataLoading,
		isError: lessonError,
	} = useQuery('singleLessonData', async () => {
		const response = await axios.get(`${base_url}/lessons/${lessonId}`);

		return response.data.data[0];
	});

	const {
		data: userData,
		isLoading: isUserDataLoading,
		isError: userError,
	} = useQuery('userData', async () => {
		const response = await axios.get(`${base_url}/users/${userId}`);

		return response.data.data[0];
	});

	if (isUserDataLoading || isLessonDataLoading) {
		return <Box>Loading...</Box>;
	}

	if (userError || lessonError) {
		return <Box>Error fetching data</Box>;
	}

	return (
		<Box
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				backgroundColor: theme.bgColor?.secondary,
				minHeight: '100vh',
				padding: '0 0 3rem 0',
			}}>
			<DashboardHeader pageName='Kaizen' />
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0 3rem 0' }}>
				<Typography variant='h5' sx={{ marginBottom: '1.5rem' }}>
					{lessonData.title}
				</Typography>
				<ReactPlayer url={'https://www.youtube.com/watch?v=g06q54-10f4'} />
			</Box>
			<Box sx={{ padding: '3rem' }}>
				<Questions questions={lessonData.questions} />
			</Box>
		</Box>
	);
};

export default LessonPage;
