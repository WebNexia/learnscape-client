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
	USERNAME_EXISTS = 'This username is already in use!',
	EMAIL_NOT_EXIST = 'This email address is not registered!',
	WRONG_PASSWORD = 'Enter the correct password!',
}

export const enum Mode {
	DARK_MODE = 'dark',
	LIGHT_MODE = 'light',
}

export const enum PageName {
	ADMIN_COURSES = 'Admin Crs',
	ADMIN_LESSONS = 'Admin Lessons',
	DASHBOARD = 'Dashboard',
	COURSES = 'Courses',
	SCHEDULE = 'Schedule',
	MESSAGES = 'Messages',
	COMMUNITY = 'Community',
	SETTINGS = 'Settings',
}
