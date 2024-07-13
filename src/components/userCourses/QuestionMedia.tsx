import { Box } from '@mui/material';
import ReactPlayer from 'react-player';
import { QuestionInterface } from '../../interfaces/question';

interface QuestionMediaProps {
	question: QuestionInterface;
}

const QuestionMedia = ({ question }: QuestionMediaProps) => {
	return (
		<Box
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				width: '100%',
				height: question?.imageUrl || question?.videoUrl ? '18rem' : '0',
				margin: question?.imageUrl || question?.videoUrl ? '10rem 0 2rem 0' : 'none',
			}}>
			{question?.imageUrl && (
				<Box
					sx={{
						height: '100%',
						flex: 1,
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
					}}>
					<img
						src={question?.imageUrl}
						alt='question_img'
						style={{
							height: '100%',
							width: question?.videoUrl ? '90%' : '50%',
							borderRadius: '0.2rem',
							boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
						}}
					/>
				</Box>
			)}

			{question?.videoUrl && (
				<Box
					sx={{
						height: '100%',
						flex: 1,
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
					}}>
					<ReactPlayer
						url={question.videoUrl}
						width={question?.imageUrl ? '90%' : '50%'}
						height='100%'
						style={{
							boxShadow: '0 0.1rem 0.4rem 0.2rem rgba(0,0,0,0.3)',
						}}
						controls
					/>
				</Box>
			)}
		</Box>
	);
};

export default QuestionMedia;
