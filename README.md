# ClipSmart AI

A web application that allows users to select, trim, and merge YouTube video clips, generating a single, shareable video.

## Features

- **Video Clip Selection**: Select specific portions of YouTube videos by specifying start and end times
- **Clip Processing**: Backend handles downloading, trimming, and merging video clips
- **Robust Video Download**: Uses both ytdl-core and youtube-dl-exec for reliable YouTube downloads
- **AWS S3 Integration**: Uploads processed videos to AWS S3 for storage and sharing
- **Progress Tracking**: Visual indicators for each step of the processing pipeline
- **Error Handling**: Comprehensive error handling with troubleshooting suggestions
- **Sharing Integration**: Easy sharing options for social media
- **Responsive Design**: Works on both desktop and mobile devices

## Project Structure

The application consists of two main components:

### Frontend (React)

- Located in the `frontend` directory
- Built with React.js and styled with Tailwind CSS
- Provides a clean interface for selecting, processing, and viewing video clips

### Backend (Node.js)

- Located in the `backend` directory
- Express.js API for processing video requests
- Uses FFmpeg for video manipulation
- Integrates with AWS S3 for storage

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- FFmpeg installed and available in your PATH
- AWS account with S3 bucket (for production use)

### Installing FFmpeg

FFmpeg is required for video processing. Here's how to install it:

#### Windows
1. Download FFmpeg from the [official website](https://ffmpeg.org/download.html#build-windows) or use [gyan.dev builds](https://www.gyan.dev/ffmpeg/builds/)
2. Extract the downloaded zip file
3. Add the `bin` folder to your system's PATH:
   - Right-click on 'This PC' or 'My Computer' and select 'Properties'
   - Click on 'Advanced system settings'
   - Click the 'Environment Variables' button
   - Under 'System variables', find and select the 'Path' variable, then click 'Edit'
   - Click 'New' and add the path to the FFmpeg bin folder (e.g., `C:\ffmpeg\bin`)
   - Click 'OK' on all dialogs to save the changes
4. Restart any open command prompts or PowerShell windows
5. Verify installation by typing `ffmpeg -version` in a new command prompt

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

### Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```
# Server Configuration
PORT=4001

# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your_bucket_name
AWS_REGION=your_aws_region
```

### S3 Bucket Setup for Public Access

For your S3 uploads to be publicly accessible, configure your S3 bucket with the appropriate policy:

1. Go to the AWS S3 console and select your bucket
2. Go to the "Permissions" tab
3. If you're using the newer "Object Ownership" settings:
   - Set Object Ownership to "Bucket owner preferred" or "Object writer"
   - Or keep "Bucket owner enforced" and use a bucket policy for public access

Sample bucket policy for public read access:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

### Installation

1. Clone the repository
2. Install dependencies for all components:

```bash
npm run install-all
```

This will install dependencies for the root project, frontend, and backend.

### Running the Application

#### Development Mode

Start both frontend and backend servers:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:4001`.

#### Production Mode

Build the frontend and start the backend server:

```bash
npm run deploy
```

### Testing

To test the backend functionality specifically:

```bash
cd backend
node test-clips-merge.js
```

## Troubleshooting

If you encounter issues, try these solutions:

### Backend Issues

- **AWS Errors**: Check your AWS credentials in the `.env` file
- **FFmpeg Errors**: Ensure FFmpeg is installed and in your PATH
- **YouTube Download Errors**: Some videos may have restrictions or protections
- **Temporary File Issues**: Ensure your server has write permissions

### Frontend Issues

- **API Connection**: Check that the backend server is running and accessible
- **Video Processing Timeouts**: For longer videos, increase the timeout in `OutputPage.js`
- **UI Rendering Issues**: Clear browser cache and reload

## Security Note

Never commit your AWS credentials or other sensitive information to version control. Use environment variables for configuration.

## License

ISC
