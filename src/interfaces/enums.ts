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
	EMAIL_NOT_EXIST = 'This email address is not registered!',
	WRONG_PASSWORD = 'Enter the correct password!',
	ORG_CODE_NOT_EXIST = 'This organisation code does not exist',
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
