# Open Graph Image (og-image.jpg)

## Requirements

This file should be placed in the `public` folder as `og-image.jpg`.

### Specifications:

- **Dimensions**: 1200x630 pixels (1.91:1 aspect ratio)
- **Format**: JPG or PNG
- **File size**: Under 1MB (recommended: 200-500KB)
- **Content**: Should include:
  - LearnScape branding/logo
  - Compelling visual that represents the platform
  - Text: "LearnScape - Online Learning Platform" (optional but recommended)

### Usage

The image is automatically used as the default Open Graph image for all pages via the SEO component. The URL will be converted to an absolute URL using `VITE_SITE_URL` environment variable.

### Current Status

⚠️ **Action Required**: This image file needs to be created and added to the `public` folder.

The SEO component will use `/og-image.jpg` as the default image, which will be converted to an absolute URL like:

- Development: `http://localhost:5173/og-image.jpg`
- Production: `https://learnscape-qa.netlify.app/og-image.jpg`

### Testing

After adding the image, test it using:

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)
