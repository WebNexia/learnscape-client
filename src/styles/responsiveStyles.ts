export const responsiveStyles = {
	// Typography
	typography: {
		h1: { xs: '2rem', sm: '2.5rem', md: '3rem', lg: '3.5rem' },
		h2: { xs: '1.5rem', sm: '2rem', md: '2.25rem', lg: '2.5rem' },
		h3: { xs: '1.5rem', sm: '1.75rem', md: '2rem', lg: '2.5rem' },
		h4: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem', lg: '2rem' },
		h5: { xs: '0.85rem', sm: '1.1rem', md: '1.5rem', lg: '1.75rem' },
		body1: { xs: '0.875rem', sm: '1rem', md: '1.125rem', lg: '1.25rem' },
		body2: { xs: '0.85rem', sm: '0.875rem', md: '1rem', lg: '1.125rem' },
		button: {
			xs: '0.7rem',
			sm: '0.85rem',
			md: '1rem',
		},
		navigation: {
			xs: '0.65rem',
			sm: '0.85rem',
			md: '1rem',
		},
		icon: {
			xs: '1.5rem',
			sm: '1.75rem',
			md: '2rem',
		},
	},

	// Spacing
	spacing: {
		section: { xs: 6, sm: 4, md: 6, lg: 8 },
		container: { xs: 0.75, sm: 1, md: 2, lg: 3 },
		item: { xs: 0.75, sm: 1, md: 1.5, lg: 2 },
		navigation: { xs: 1, sm: 2, md: 3 },
		button: {
			xs: '0.1rem 0.2rem',
			sm: '0.5rem 1.75rem',
		},
	},

	// Layout
	layout: {
		containerWidth: { xs: '100%', sm: '540px', md: '720px', lg: '960px' },
		maxWidth: { xs: '100%', sm: '540px', md: '720px', lg: '960px' },
		headerHeight: { xs: '10vh', sm: '13vh' },
		logoHeight: { xs: '8vh', sm: '11vh' },
	},

	// Components
	components: {
		card: {
			padding: { xs: '1rem', sm: '1.5rem', md: '2rem' },
			borderRadius: { xs: '0.5rem', sm: '0.75rem', md: '1rem' },
		},
		button: {
			padding: {
				xs: '0.1rem 0.2rem',
				sm: '0.5rem 1.75rem',
			},
			fontSize: {
				xs: '0.7rem',
				sm: '0.85rem',
				md: '1rem',
			},
			borderRadius: '1rem',
			shadow: '0 4px 12px rgba(44, 62, 80, 0.1)',
		},
	},
};
