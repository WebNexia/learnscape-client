import { Box, Typography } from '@mui/material';
import theme from '../themes';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import Questions from '../components/courses/Questions';

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
				justifyContent: 'center',
				backgroundColor: theme.bgColor?.secondary,
				minHeight: '100vh',
				padding: '3rem',
			}}>
			<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
				<Typography variant='h3'>{userData.username}</Typography>
				<Typography variant='h5'>{lessonData.title}</Typography>
				<img src={lessonData.imageUrl} alt='lesson_pic' height='250px' width='300px' />
			</Box>
			<Questions questions={lessonData.questions} />
		</Box>
	);
};

export default LessonPage;
