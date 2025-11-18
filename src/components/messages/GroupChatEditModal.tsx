import { Box, IconButton, Typography } from '@mui/material';
import { Cancel } from '@mui/icons-material';
import { useContext, useState } from 'react';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomTextField from '../forms/customFields/CustomTextField';
import HandleImageUploadURL from '../forms/uploadImageVideoDocument/HandleImageUploadURL';
import UserSearchSelect from '../UserSearchSelect';
import { User } from '../../interfaces/user';
import { SearchUser } from '../../interfaces/search';
import { Chat } from '../../pages/Messages';
import theme from '../../themes';

import { MediaQueryContext } from '../../contexts/MediaQueryContextProvider';
import CustomDeleteButton from '../forms/customButtons/CustomDeleteButton';
import CustomSubmitButton from '../forms/customButtons/CustomSubmitButton';
import CustomCancelButton from '../forms/customButtons/CustomCancelButton';
import { useAuth } from '../../hooks/useAuth';

interface GroupChatEditModalProps {
	editGroupModalOpen: boolean;
	activeChat: Chat | null;
	groupName: string;
	groupImageUrl: string;
	selectedGroupUsers: User[];
	groupSearchValue: string;
	removedMembers: string[];
	user: any;
	blockedUsers?: string[];
	onCloseModal: () => void;
	onGroupNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onGroupImageUpload: (url: string) => void;
	onGroupImageUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onGroupUserSelection: (user: User) => void;
	onRemoveGroupUser: (userId: string) => void;
	onRemoveExistingMember: (userId: string) => void;
	onRestoreExistingMember: (userId: string) => void;
	onGroupSearchChange: (value: string) => void;
	onUpdateGroupChat: () => void;
	onDeleteGroupChat?: () => void;
}

const GroupChatEditModal = ({
	editGroupModalOpen,
	activeChat,
	groupName,
	groupImageUrl,
	selectedGroupUsers,
	groupSearchValue,
	removedMembers,
	user,
	blockedUsers = [],
	onCloseModal,
	onGroupNameChange,
	onGroupImageUpload,
	onGroupImageUrlChange,
	onGroupUserSelection,
	onRemoveGroupUser,
	onRemoveExistingMember,
	onRestoreExistingMember,
	onGroupSearchChange,
	onUpdateGroupChat,
	onDeleteGroupChat,
}: GroupChatEditModalProps) => {
	if (!activeChat) return null;

	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);

	const { hasAdminAccess } = useAuth();
	const { isSmallScreen, isRotatedMedium } = useContext(MediaQueryContext);
	const isMobileSize = isSmallScreen || isRotatedMedium;

	const handleSearchUserSelection = (selectedUser: SearchUser) => {
		// Convert SearchUser to User format
		const userForGroup: User = {
			_id: selectedUser.firebaseUserId,
			firebaseUserId: selectedUser.firebaseUserId,
			username: selectedUser.username,
			email: selectedUser.email || '',
			imageUrl: selectedUser.imageUrl,
			role: selectedUser.role,
			firstName: selectedUser.username.split(' ')[0] || '',
			lastName: selectedUser.username?.split?.(' ')?.slice(1)?.join(' ') || '',
			phone: '',
			hasRegisteredCourse: false,
			isActive: true,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			orgId: '',
			countryCode: '',
			isEmailVerified: false,
			isSubscribed: false,
			subscriptionType: null,
			subscriptionExpiry: '',
			subscriptionStatus: 'none',
			subscriptionValidUntil: '',
			accessLevel: 'limited',
		};
		onGroupUserSelection(userForGroup);
	};

	return (
		<CustomDialog openModal={editGroupModalOpen} closeModal={onCloseModal} title='Edit Group Chat' maxWidth='sm'>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
				{/* Group Name Input */}
				<CustomTextField
					fullWidth
					label='Group Name'
					placeholder='Enter group name'
					value={groupName}
					onChange={onGroupNameChange}
					required
					InputProps={{
						inputProps: { maxLength: 50 },
					}}
				/>

				{/* Group Image Upload */}
				<HandleImageUploadURL
					label='Group Image'
					labelDescription='(Optional)'
					onImageUploadLogic={onGroupImageUpload}
					onChangeImgUrl={onGroupImageUrlChange}
					imageUrlValue={groupImageUrl}
					imageFolderName='GroupImages'
					enterImageUrl={enterImageUrl}
					setEnterImageUrl={setEnterImageUrl}
				/>

				{/* Group Image Preview */}
				{groupImageUrl && (
					<Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
						<Box sx={{ textAlign: 'center' }}>
							<img
								src={groupImageUrl}
								alt='group_img'
								style={{
									height: '4rem',
									width: '4rem',
									borderRadius: '50%',
									objectFit: 'cover',
									border: 'solid lightgray 0.1rem',
								}}
							/>
							<Typography
								variant='body2'
								sx={{
									fontSize: '0.75rem',
									textDecoration: 'underline',
									cursor: 'pointer',
									mt: 0.5,
									color: 'error.main',
								}}
								onClick={() => onGroupImageUpload('')}>
								Remove Image
							</Typography>
						</Box>
					</Box>
				)}

				{/* Current Members Display */}
				<Box sx={{ mt: 2 }}>
					<Typography variant='body2' sx={{ mb: 1, fontSize: isMobileSize ? '0.75rem' : undefined }}>
						Current Members ({activeChat.participants?.filter((p) => !removedMembers?.includes(p.firebaseUserId))?.length || 0})
					</Typography>
					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
						{activeChat.participants
							?.filter((participant) => !removedMembers?.includes(participant.firebaseUserId))
							?.map((participant) => (
								<Box
									key={participant.firebaseUserId}
									sx={{
										display: 'flex',
										alignItems: 'center',
										padding: '0.5rem',
										borderRadius: '0.5rem',
										backgroundColor: theme.bgColor?.primary,
										color: '#fff',
										gap: 1,
									}}>
									<img
										src={participant.imageUrl}
										alt='profile_img'
										style={{
											height: '1.5rem',
											width: '1.5rem',
											borderRadius: '100%',
											border: 'solid white 0.1rem',
										}}
									/>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem', color: '#fff' }}>
										{participant.username}
										{participant.firebaseUserId === activeChat.createdBy && (
											<Typography component='span' sx={{ fontSize: '0.7rem', ml: 0.5, opacity: 0.8, color: '#fff' }}>
												(Group Admin)
											</Typography>
										)}
									</Typography>
									{participant.firebaseUserId !== activeChat.createdBy && (
										<IconButton
											size='small'
											onClick={() => onRemoveExistingMember(participant.firebaseUserId)}
											sx={{
												'color': '#fff',
												'padding': '0.25rem',
												':hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
											}}>
											<Cancel fontSize='small' sx={{ fontSize: '0.85rem' }} />
										</IconButton>
									)}
								</Box>
							))}
					</Box>
				</Box>

				{/* Pending Removals Display */}
				{removedMembers && removedMembers.length > 0 && (
					<Box sx={{ mt: '1rem' }}>
						<Typography variant='body2' sx={{ mb: 1, color: 'error.main', fontSize: isMobileSize ? '0.75rem' : undefined }}>
							Members to Remove ({removedMembers.length})
						</Typography>
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
							{activeChat.participants
								?.filter((participant) => removedMembers?.includes(participant.firebaseUserId))
								?.map((participant) => (
									<Box
										key={participant.firebaseUserId}
										sx={{
											display: 'flex',
											alignItems: 'center',
											padding: '0.5rem',
											borderRadius: '0.5rem',
											backgroundColor: 'error.main',
											color: '#fff',
											gap: 1,
										}}>
										<img
											src={participant.imageUrl}
											alt='profile_img'
											style={{
												height: '1.5rem',
												width: '1.5rem',
												borderRadius: '100%',
												border: 'solid white 0.1rem',
											}}
										/>
										<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem', color: '#fff' }}>
											{participant.username}
											{participant.firebaseUserId === activeChat.createdBy && (
												<Typography component='span' sx={{ fontSize: '0.7rem', ml: 0.5, opacity: 0.8, color: '#fff' }}>
													(Admin)
												</Typography>
											)}
										</Typography>
										<IconButton
											size='small'
											onClick={() => onRestoreExistingMember(participant.firebaseUserId)}
											sx={{
												'color': '#fff',
												'padding': '0.25rem',
												':hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
											}}>
											<Cancel fontSize='small' sx={{ fontSize: '0.85rem' }} />
										</IconButton>
									</Box>
								))}
						</Box>
					</Box>
				)}

				{/* Selected New Users Display */}
				{selectedGroupUsers && selectedGroupUsers.length > 0 && (
					<Box sx={{ mt: '1rem' }}>
						<Typography variant='body2' sx={{ mb: 1, fontSize: isMobileSize ? '0.75rem' : undefined }}>
							New Members to Add ({selectedGroupUsers.length})
						</Typography>
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
							{selectedGroupUsers?.map((selectedUser) => (
								<Box
									key={selectedUser.firebaseUserId}
									sx={{
										display: 'flex',
										alignItems: 'center',
										padding: '0.5rem',
										borderRadius: '0.5rem',
										backgroundColor: theme.bgColor?.lessonInProgress,
										color: '#fff',
										gap: 1,
									}}>
									<img
										src={selectedUser.imageUrl}
										alt='profile_img'
										style={{
											height: '1.5rem',
											width: '1.5rem',
											borderRadius: '100%',
											border: 'solid white 0.1rem',
										}}
									/>
									<Typography variant='body2' sx={{ fontSize: isMobileSize ? '0.65rem' : '0.75rem', color: '#fff' }}>
										{selectedUser.username}
									</Typography>
									<IconButton
										size='small'
										onClick={() => onRemoveGroupUser(selectedUser.firebaseUserId)}
										sx={{
											'color': '#fff',
											'padding': '0.25rem',
											':hover': { backgroundColor: 'rgba(255,255,255,0.2)' },
										}}>
										<Cancel fontSize='small' sx={{ fontSize: '0.85rem' }} />
									</IconButton>
								</Box>
							))}
						</Box>
					</Box>
				)}

				{/* Add New Users */}
				<Box sx={{ mt: 2 }}>
					<Typography variant='body2' sx={{ mb: 1, fontSize: isMobileSize ? '0.75rem' : undefined }}>
						Add New Members
					</Typography>
					<UserSearchSelect
						context='messages'
						userRole={user?.role === 'instructor' ? 'admin' : hasAdminAccess ? 'admin' : 'learner'}
						value={groupSearchValue}
						onChange={onGroupSearchChange}
						onSelect={handleSearchUserSelection}
						currentUserId={user?.firebaseUserId}
						blockedUsers={blockedUsers}
						placeholder='Search users to add to group'
						sx={{ width: '100%' }}
						listSx={{
							margin: '-1rem auto 0 auto',
							width: '100%',
						}}
						fromGroupChatSettings={true}
						excludeUserIds={[
							// Exclude current members (not removed)
							...(activeChat.participants?.filter((p) => !removedMembers?.includes(p.firebaseUserId))?.map((p) => p.firebaseUserId) || []),
							// Exclude already selected new members
							...(selectedGroupUsers?.map((user) => user.firebaseUserId) || []),
						]}
					/>
				</Box>
			</Box>
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1.5rem', mt: '-1rem', px: 2 }}>
				{/* Delete Button for Admin */}
				<Box sx={{ ml: '-0.75rem' }}>
					{(hasAdminAccess || (user?.role === 'instructor' && activeChat.createdBy === user?.firebaseUserId)) && onDeleteGroupChat && (
						<CustomDeleteButton onClick={onDeleteGroupChat} sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
							Delete Group
						</CustomDeleteButton>
					)}
				</Box>

				{/* Update and Cancel Buttons */}
				<Box sx={{ display: 'flex', gap: 1 }}>
					<CustomCancelButton onClick={onCloseModal} sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
						Cancel
					</CustomCancelButton>
					<CustomSubmitButton onClick={onUpdateGroupChat} disabled={!groupName.trim()} sx={{ fontSize: isMobileSize ? '0.7rem' : '0.8rem' }}>
						Update Group Chat
					</CustomSubmitButton>
				</Box>
			</Box>
		</CustomDialog>
	);
};

export default GroupChatEditModal;
