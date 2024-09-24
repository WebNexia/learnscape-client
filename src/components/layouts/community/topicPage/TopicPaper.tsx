import { Box, Button, Paper, Typography } from '@mui/material';
import theme from '../../../../themes';
import { useContext } from 'react';
import { UserAuthContext } from '../../../../contexts/UserAuthContextProvider';
import { Roles } from '../../../../interfaces/enums';
import { KeyboardBackspaceOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { TopicInfo } from '../../../../interfaces/communityMessage';
import { formatMessageTime } from '../../../../utils/formatTime';

interface TopicPaperProps {
	topic: TopicInfo | null;
}

const TopicPaper = ({ topic }: TopicPaperProps) => {
	const { user } = useContext(UserAuthContext);
	const navigate = useNavigate();
	const isAdmin: boolean = user?.role === Roles.ADMIN;
	return (
		<Paper
			elevation={10}
			sx={{
				width: '100%',
				height: '6rem',
				marginTop: '2.25rem',
				backgroundColor: !isAdmin ? theme.bgColor?.primary : theme.bgColor?.adminPaper,
			}}>
			<Box
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					height: '100%',
					width: '100%',
				}}>
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						flex: 2,
						padding: '0.5rem',
					}}>
					<Box>
						<Button
							variant='text'
							startIcon={<KeyboardBackspaceOutlined />}
							sx={{
								color: theme.textColor?.common.main,
								textTransform: 'inherit',
								fontFamily: theme.fontFamily?.main,
								':hover': {
									backgroundColor: 'transparent',
									textDecoration: 'underline',
								},
							}}
							onClick={() => {
								if (isAdmin) {
									navigate(`/admin/community/user/${user?._id}`);
								} else {
									navigate(`/community/user/${user?._id}`);
								}

								window.scrollTo({ top: 0, behavior: 'smooth' });
							}}>
							Back to topics
						</Button>
					</Box>
					<Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
						<Box></Box>
						<Box sx={{ paddingLeft: '0.5rem', color: theme.textColor?.common.main }}></Box>
					</Box>
				</Box>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'flex-end',
						alignItems: 'flex-start',
						flex: 1,
						padding: '1rem',
					}}>
					<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
						<Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
							<Box>
								<Typography variant='h5' sx={{ color: theme.textColor?.common.main }}>
									{topic?.title}
								</Typography>
							</Box>
						</Box>

						<Box
							sx={{
								display: 'flex',
								justifyContent: 'flex-end',
								alignItems: 'center',
								width: '100%',
							}}>
							<Box sx={{ display: 'flex', alignItems: 'center' }}>
								<Typography variant='body2' sx={{ color: theme.textColor?.common.main }}>
									{topic?.userId.username}
								</Typography>
								<Typography sx={{ mx: 1 }}>-</Typography>
								<Typography variant='caption' sx={{ color: theme.textColor?.common.main }}>
									{formatMessageTime(topic?.createdAt)}
								</Typography>
							</Box>
						</Box>
					</Box>
				</Box>
			</Box>
		</Paper>
	);
};

export default TopicPaper;
