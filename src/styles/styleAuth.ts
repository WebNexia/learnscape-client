export const formContainerStyles = (isVerySmallScreen: boolean, isSmallScreen: boolean, isRotated: boolean) => ({
	position: 'relative',
	width: isVerySmallScreen ? '100%' : isSmallScreen ? '80%' : '50%',
	height: isRotated ? '90vh' : 'fit-content',
	padding: isVerySmallScreen ? '6rem 0.75rem 4rem 0.75rem' : isRotated ? '3rem 1rem 2rem 1rem' : '6rem 2rem 4rem 2rem',
	border: 'none',
	borderRadius: '0.35rem',
	boxShadow: isVerySmallScreen || isRotated ? '0.1rem 0.2rem 0.2rem 0.1rem rgba(0,0,0,0.1)' : '0.2rem 0.4rem 0.3rem 0.4rem rgba(0,0,0,0.1)',
	transition: '0.3s',
	':hover': {
		boxShadow: '0rem 0.1rem 0.4rem 0.1rem rgba(0,0,0,0.2)',
	},
});
