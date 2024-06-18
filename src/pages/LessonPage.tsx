import { Box, Button, Typography } from '@mui/material';
import theme from '../themes';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import axios from 'axios';
import Questions from '../components/userCourses/Questions';
import ReactPlayer from 'react-player';
import DashboardHeader from '../components/layouts/dashboardLayout/DashboardHeader';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import Loading from '../components/layouts/loading/Loading';
import LoadingError from '../components/layouts/loading/LoadingError';
import { OrganisationContext } from '../contexts/OrganisationContextProvider';
import { useContext } from 'react';

const LessonPage = () => {
	const { lessonId } = useParams();
	const { organisation } = useContext(OrganisationContext);
	const navigate = useNavigate();

	const base_url = import.meta.env.VITE_SERVER_BASE_URL;

	const { data, isLoading, isError } = useQuery('singleLessonData', async () => {
		const response = await axios.get(`${base_url}/lessons/${lessonId}`);

		return response.data.data[0];
	});

	if (isLoading) {
		return <Loading />;
	}

	if (isError) {
		return <LoadingError />;
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
			<DashboardHeader pageName={organisation?.orgName || ''} />
			<Button
				variant='text'
				startIcon={<KeyboardBackspaceOutlined />}
				sx={{
					color: theme.textColor?.primary,
					textTransform: 'inherit',
					fontFamily: theme.fontFamily?.main,
					':hover': {
						backgroundColor: 'transparent',
						textDecoration: 'underline',
					},
				}}
				onClick={() => {
					navigate(-1);
					window.scrollTo({ top: 0, behavior: 'smooth' });
				}}>
				Back to Course Home Page
			</Button>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					margin: '2rem 0 3rem 0',
				}}>
				<Typography variant='h5' sx={{ marginBottom: '1.5rem' }}>
					{data.title}
				</Typography>
				<ReactPlayer url={'https://www.youtube.com/watch?v=g06q54-10f4'} width='70vw' height='50vh' />
			</Box>
			<Box sx={{ padding: '3rem' }}>
				<Questions questions={data.questions} />
			</Box>
		</Box>
	);
};

export default LessonPage;
