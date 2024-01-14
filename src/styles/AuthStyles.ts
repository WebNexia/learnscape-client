export const formContainerStyles = () => ({
	position: 'relative',
	width: '50%',
	height: '60vh',
	padding: '6rem 3rem ',
	border: '#01435A solid 0.1rem',
	borderRadius: '0.2rem',
	boxShadow: '0.1rem 0.1rem 0.2rem 0.2rem rgba(0,0,0,0.3)',
	transition: '0.3s',
	':hover': {
		boxShadow: '0.2rem 0.2rem 0.2rem 0.2rem rgba(0,0,0,0.5)',
	},
});

export const submitBtnStyles = () => ({
	backgroundColor: '#1EC28B',
	marginTop: '1.25rem',
	fontSize: '1.25rem',
	fontWeight: 500,
	':hover': {
		backgroundColor: '#FDF7F0',
		color: '#1EC28B',
		border: 'solid #1EC28B',
	},
});
