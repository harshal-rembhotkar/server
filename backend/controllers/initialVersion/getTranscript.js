const { google } = require('googleapis');
const { YoutubeTranscript } = require('youtube-transcript');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

//const PYTHON_API = process.env.PYTHON_API;
const APPLICATION_URL = process.env.APPLICATION_URL || 'https://clip-smart-ai-backend.onrender.com';

// Configure global settings for Google APIs
google.options({
    http2: true,
    headers: {
        'Referer': APPLICATION_URL,
        'Origin': APPLICATION_URL
    }
});

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://clip-smart-ai-backend.onrender.com/api/v1/youtube/oauth2callback'
);

// Create YouTube API client with correct configuration
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY
});

// Configure axios default headers for YouTube API requests
axios.defaults.headers.common['Referer'] = APPLICATION_URL;
axios.defaults.headers.common['Origin'] = APPLICATION_URL;

function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/youtube.force-ssl']
    });
}

const getTranscript = async (req, res) => {
    try {
        const { videoId } = req.params;
        console.log("---->" ,videoId);
        if (!videoId) {
            console.log('Request failed: No video ID provided');
            return res.status(400).json({
                message: "Video ID is required",
                status: false
            });
        }

        if (!process.env.YOUTUBE_API_KEY) {
            console.error('YouTube API key is not configured');
            return res.status(500).json({
                message: "Server configuration error: YouTube API key is missing",
                status: false
            });
        }

        try {
            console.log(`Checking if video ${videoId} exists...`);
            
            const videoResponse = await youtube.videos.list({
                part: 'snippet',
                id: videoId
            }, {
                headers: {
                    'Referer': APPLICATION_URL,
                    'Origin': APPLICATION_URL
                }
            });

            if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
                console.log(`Video with ID ${videoId} not found or is not accessible`);
                return res.status(404).json({
                    message: "Video not found or is not accessible",
                    status: false
                });
            }

            console.log(`Video found: ${videoResponse.data.items[0].snippet.title}`);
        } catch (error) {
            console.error("Error checking video existence:", error);
        }

        try {
            console.log(`Attempting to fetch transcript for video ${videoId}...`);

            let transcriptList;
            let transcriptError = null;
            
            try {
                console.log('Trying to fetch English transcript...');
                console.log("http://54.161.100.146:5000" + `/transcript/${videoId}`);
                transcriptList = await axios.get("http://54.161.100.146:5000" + `/transcript/${videoId}`);
                transcriptList = transcriptList.data.data;
                console.log('Successfully fetched English transcript');
            } catch (err) {
                transcriptError = err;
                console.log('Failed to fetch English transcript:', err.message);
                
                try {
                    console.log('Trying to fetch transcript in any language...');
                    transcriptList = await axios.get("http://54.161.100.146:5000" + `/transcript/${videoId}`);
                    console.log('Successfully fetched transcript in non-English language');
                } catch (fallbackErr) {
                    console.error('Failed to fetch transcript in any language:', fallbackErr.message);
                    return res.status(404).json({
                        message: "No transcript available for this video. The video might not have captions enabled.",
                        originalError: transcriptError?.message,
                        fallbackError: fallbackErr.message,
                        status: false
                    });
                }
            }
            
            if (!transcriptList || transcriptList.length === 0) {
                console.log('No transcript segments found');
                return res.status(404).json({
                    message: "No transcript segments found for this video. The video might not have captions.",
                    status: false
                });
            }
 
            const processedTranscript = transcriptList;

            if (processedTranscript.length === 0) {
                return res.status(404).json({
                    message: "Failed to process transcript segments. The transcript may be malformed.",
                    status: false
                });
            }

            console.log(`Successfully processed ${processedTranscript.length} transcript segments`);

            return res.status(200).json({
                message: "Transcript fetched successfully",
                data: processedTranscript,
                status: true,
                totalSegments: processedTranscript.length,
                metadata: {
                    videoId,
                    language: 'en',
                    isAutoGenerated: true
                }
            });

        } catch (error) {
            console.error("Transcript fetch error:", error);
            return res.status(404).json({
                message: "Failed to fetch transcript. The video might be private or captions are disabled.",
                error: error.message,
                status: false
            });
        }

    } catch (error) {
        console.error("Detailed transcript fetch error:", {
            message: error.message,
            stack: error.stack,
            videoId: req.params.videoId
        });

        res.status(500).json({
            message: "Failed to fetch transcript",
            error: error.message,
            errorDetails: error.stack,
            status: false
        });
    }
};

module.exports = { getTranscript, getAuthUrl, oauth2Client };
