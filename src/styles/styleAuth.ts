export const formContainerStyles = (
	isVerySmallScreen: boolean,
	isSmallScreen: boolean,
	isRotated: boolean,
	isRotatedMedium: boolean,
	isSignIn: boolean
) => ({
	'position': 'relative',
	'width': isVerySmallScreen ? '100%' : isRotatedMedium ? '50%' : isSmallScreen ? '80%' : '42.5%',
	'height': isRotated ? '90vh' : isRotatedMedium ? '88vh' : 'fit-content',
	'padding': isVerySmallScreen
		? '5rem 0.75rem 4rem 0.75rem'
		: isRotated
			? '3rem 1rem 2rem 1rem'
			: isRotatedMedium
				? '5rem 1rem 2rem 1rem'
				: isSignIn
					? '6rem 2rem 3rem 2rem'
					: '5rem 2rem 1.5rem 2rem',
	'border': 'none',
	'borderRadius': '0.35rem',
	'boxShadow': isVerySmallScreen || isRotated ? '0.1rem 0.2rem 0.2rem 0.1rem rgba(0,0,0,0.1)' : '0.1rem 0.3rem 0.2rem 0.2rem rgba(0,0,0,0.1)',
	'transition': '0.3s',
	':hover': {
		boxShadow: '0rem 0.1rem 0.4rem 0.1rem rgba(0,0,0,0.2)',
	},
});
