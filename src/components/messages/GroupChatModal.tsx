import { Box, IconButton, Typography } from '@mui/material';
import { Cancel } from '@mui/icons-material';
import CustomDialog from '../layouts/dialog/CustomDialog';
import CustomTextField from '../forms/customFields/CustomTextField';
import HandleImageUploadURL from '../forms/uploadImageVideoDocument/HandleImageUploadURL';
import UserSearchSelect from '../UserSearchSelect';
import { User } from '../../interfaces/user';
import { SearchUser } from '../../interfaces/search';
import theme from '../../themes';
import { useState } from 'react';
import CustomDialogActions from '../layouts/dialog/CustomDialogActions';
import { useAuth } from '../../hooks/useAuth';

interface GroupChatModalProps {
	createGroupModalOpen: boolean;
	groupName: string;
	groupImageUrl: string;
	enterGroupImageUrl: boolean;
	selectedGroupUsers: User[];
	groupSearchValue: string;

	user: any;
	blockedUsers?: string[];
	onCloseModal: () => void;
	onGroupNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onGroupImageUpload: (url: string) => void;
	onGroupImageUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onEnterGroupImageUrlChange: (value: boolean) => void;
	onGroupUserSelection: (user: User) => void;
	onRemoveGroupUser: (userId: string) => void;
	onGroupSearchChange: (value: string) => void;
	onCreateGroupChat: () => void;
}

const GroupChatModal = ({
	createGroupModalOpen,
	groupName,
	groupImageUrl,
	selectedGroupUsers,
	groupSearchValue,

	user,
	blockedUsers = [],
	onCloseModal,
	onGroupNameChange,
	onGroupImageUpload,
	onGroupImageUrlChange,
	onGroupUserSelection,
	onRemoveGroupUser,
	onGroupSearchChange,
	onCreateGroupChat,
}: GroupChatModalProps) => {
	const { hasAdminAccess } = useAuth();
	const [enterImageUrl, setEnterImageUrl] = useState<boolean>(true);

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
		<CustomDialog openModal={createGroupModalOpen} closeModal={onCloseModal} title='Create Group Chat' maxWidth='sm'>
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

				{/* Selected Users Display */}
				{selectedGroupUsers && selectedGroupUsers.length > 0 && (
					<Box sx={{ mt: 2 }}>
						<Typography variant='body2' sx={{ mb: 1 }}>
							Selected Users ({selectedGroupUsers.length})
						</Typography>
						<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
							{selectedGroupUsers?.map((selectedUser) => (
								<Box
									key={selectedUser.firebaseUserId}
									sx={{
										display: 'flex',
										alignItems: 'center',
										padding: '0.35rem',
										borderRadius: '0.35rem',
										backgroundColor: theme.bgColor?.primary,
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
									<Typography variant='body2' sx={{ fontSize: '0.8rem', color: '#fff' }}>
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
										<Cancel fontSize='small' sx={{ fontSize: '0.9rem' }} />
									</IconButton>
								</Box>
							))}
						</Box>
					</Box>
				)}

				{/* User Search */}
				<Box sx={{ mt: 2 }}>
					<Typography variant='body2' sx={{ mb: 1 }}>
						Add Users
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
							margin: '-0.85rem auto 0 auto',
							width: '100%',
						}}
						fromGroupChatSettings={true}
						excludeUserIds={selectedGroupUsers?.map((user) => user.firebaseUserId) || []}
					/>
				</Box>
			</Box>
			<CustomDialogActions
				submitBtnText='Create Group Chat'
				onSubmit={onCreateGroupChat}
				onCancel={onCloseModal}
				disableBtn={!groupName.trim() || (selectedGroupUsers && selectedGroupUsers.length === 0)}
				actionSx={{ mb: '0.75rem', mt: '-1rem' }}
			/>
		</CustomDialog>
	);
};

export default GroupChatModal;
