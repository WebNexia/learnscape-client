import { Box, DialogActions, Typography } from '@mui/material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import { Chat } from '../../pages/Messages';
import theme from '../../themes';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { useContext } from 'react';
import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';

interface GroupMembersModalProps {
	membersModalOpen: boolean;
	activeChat: Chat | null;
	onCloseModal: () => void;
}

const GroupMembersModal = ({ membersModalOpen, activeChat, onCloseModal }: GroupMembersModalProps) => {
	if (!activeChat) return null;

	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	return (
		<CustomDialog openModal={membersModalOpen} closeModal={onCloseModal} title='Group Members' maxWidth='xs'>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, mt: '-0.5rem' }}>
				{/* Group Info */}
				<Box sx={{ textAlign: 'center', mb: 0.5 }}>
					{activeChat.groupImageUrl && (
						<img
							src={activeChat.groupImageUrl}
							alt='group_img'
							style={{
								height: '3.5rem',
								width: '3.5rem',
								borderRadius: '50%',
								objectFit: 'cover',
								border: 'solid lightgray 0.1rem',
								marginBottom: '0.5rem',
							}}
						/>
					)}
					<Typography variant='h6' sx={{ fontWeight: 'bold', mb: 0.5 }}>
						{activeChat.groupName}
					</Typography>
					<Typography variant='body2' sx={{ color: 'gray', fontSize: '0.75rem' }}>
						{activeChat.participants.length} members
					</Typography>
				</Box>

				{/* Members List */}
				<Box>
					<Typography variant='body2' sx={{ mb: 1, fontSize: isMobileSize ? '0.75rem' : undefined }}>
						Members:
					</Typography>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
						{activeChat.participants?.map((participant) => (
							<Box
								key={participant.firebaseUserId}
								sx={{
									display: 'flex',
									alignItems: 'center',
									padding: '0.35rem 0.25rem',
									borderRadius: '0.35rem',
									backgroundColor: theme.bgColor?.primary,
									color: '#fff',
									gap: 1,
								}}>
								<img
									src={participant.imageUrl}
									alt='profile_img'
									style={{
										height: '2rem',
										width: '2rem',
										borderRadius: '100%',
										border: 'solid white 0.1rem',
									}}
								/>
								<Box sx={{ display: 'flex', flex: 1 }}>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem', color: '#fff', mr: '0.25rem' }}>
										{participant.username}
									</Typography>
									{participant.firebaseUserId === activeChat.createdBy && (
										<Typography variant='caption' sx={{ fontSize: isMobileSize ? '0.6rem' : '0.7rem', opacity: 0.8 }}>
											(Group Admin)
										</Typography>
									)}
								</Box>
							</Box>
						))}
					</Box>
				</Box>
			</Box>
			<DialogActions>
				<CustomCancelButton onClick={onCloseModal} sx={{ margin: '0 0.6rem 0.75rem 0', fontSize: isMobileSize ? '0.75rem' : undefined }}>
					Close
				</CustomCancelButton>
			</DialogActions>
		</CustomDialog>
	);
};

export default GroupMembersModal;
