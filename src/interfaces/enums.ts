export const enum AuthForms {
	SIGN_IN = 'sign_in',
	SIGN_UP = 'sign_up',
}

export const enum TextFieldTypes {
	EMAIL = 'email',
	PASSWORD = 'password',
	TEXT = 'text',
}

export const enum AuthFormErrorMessages {
	EMAIL_EXISTS = 'This email address is already in use!',
	INVALID_CREDENTIALS = 'Invalid email address or password.',
	ORG_CODE_NOT_EXIST = 'This organisation code does not exist',
	EMAIL_NOT_VERIFIED = 'Email is not verified',
	UNKNOWN_ERROR_OCCURRED = 'An unknown error occurred.',
	PASSWORD_TOO_SHORT = 'Password must be at least 6 characters long.',
	PASSWORD_NO_LETTER = 'Password must contain at least one letter.',
	// PASSWORD_NO_UPPERCASE = 'Password must contain at least one uppercase letter.',
	// PASSWORD_NO_LOWERCASE = 'Password must contain at least one lowercase letter.',
	PASSWORD_NO_NUMBER = 'Password must contain at least one number.',
	// PASSWORD_NO_SPECIAL_CHAR = 'Password must contain at least one special character.',
}

export const enum Mode {
	DARK_MODE = 'dark',
	LIGHT_MODE = 'light',
}

export const enum PageName {
	ADMIN_DASHBOARD = 'Dashboard',
	ADMIN_USERS = 'Users',
	ADMIN_COURSES = 'Courses',
	ADMIN_LESSONS = 'Lessons',
	ADMIN_QUESTIONS = 'Questions',
	ADMIN_DOCUMENTS = 'Documents',
	ADMIN_SCHEDULE = 'Schedule',
	ADMIN_MESSAGES = 'Messages',
	ADMIN_COMMUNITY = 'Community',
	ADMIN_SETTINGS = 'Settings',
	DASHBOARD = 'Dashboard',
	COURSES = 'Courses',
	SCHEDULE = 'Schedule',
	MESSAGES = 'Messages',
	COMMUNITY = 'Community',
	SETTINGS = 'Settings',
}

export const enum Roles {
	ADMIN = 'admin',
	USER = 'learner',
}

export const enum QuestionType {
	MULTIPLE_CHOICE = 'Multiple Choice',
	OPEN_ENDED = 'Open-ended',
	TRUE_FALSE = 'True-False',
	FLIP_CARD = 'Flip Card',
	AUDIO_VIDEO = 'Audio/Video',
	MATCHING = 'Matching',
	FITB_TYPING = 'FITB-Typing',
	FITB_DRAG_DROP = 'FITB-Drag/Drop',
}

export const enum LessonType {
	INSTRUCTIONAL_LESSON = 'Instructional Lesson',
	PRACTICE_LESSON = 'Practice Lesson',
	QUIZ = 'Quiz',
}
