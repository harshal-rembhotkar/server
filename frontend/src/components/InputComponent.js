import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axios from 'axios';
import { useVideoIds } from '../context/videoIds';
import { usePrompt } from '../context/promptContext';
import { PYTHON_API, YOUTUBE_API } from '../config';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    faCloudUpload, 
    faSpinner, 
    faMagicWandSparkles, 
    faXmark, 
    faLightbulb, 
    faCircleInfo,
    faCheck,
    faArrowRight,
    faVideo,
    faImage,
    faArrowLeft,
    faLink,
    faFileVideo,
    faMusic,
    faStar,
    faWandMagicSparkles,
    faMagic,
    faExclamationTriangle,
    faUpload
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { API_URL } from '../config';

const InputComponent = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const { addVideoIds, videoIds, clearVideoIds } = useVideoIds();
    const { prompt, setPrompt } = usePrompt();
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [showTips, setShowTips] = useState(false);
    const [fileError, setFileError] = useState('');
    const [urlError, setUrlError] = useState('');
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);

    const handleYoutubeUrlChange = (e) => {
        const url = e.target.value;
        setYoutubeUrl(url);

        if (url && !url.includes('youtube.com/') && !url.includes('youtube/') && !url.includes('youtu.be/')) {
            setUrlError('Please enter a valid YouTube URL');
        } else {
            setUrlError('');
        }
    };

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 500 * 1024 * 1024) {
                setFileError('File size should be less than 500MB');
                return;
            }
            if (!selectedFile.type.includes('video/') && !selectedFile.type.includes('image/')) {
                setFileError('Only video and image files are supported');
                return;
            }
            setFileError('');
            setFile(selectedFile);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleGenerate = async () => {
        setIsLoading(true);
        setUrlError(null); // Clear any previous errors
        console.log("Generating...");
        
        try {
            // Check if user is trying to use file upload which is not implemented
            if (file) {
                setFileError('File upload is not yet implemented. Please use YouTube URL instead.');
                setIsLoading(false);
                return;
            }
            
            if (youtubeUrl) {
                if (youtubeUrl.includes('list=')) {
                    let playlistId = youtubeUrl.split('list=')[1];
                    playlistId = playlistId.split('&')[0];
                    console.log("Processing playlist:", playlistId);
                    
                    try {
                        const response = await axios.post(API_URL + "/api/v1/youtube/playlist/" + playlistId);
                        
                        if (!response.data || !response.data.data || !response.data.data.videoIds) {
                            throw new Error("Invalid response format from server");
                        }
                        
                        const newVideoIds = response.data.data.videoIds;
                        console.log(`[InputComponent] Processing ${newVideoIds.length} videos from playlist`);
                        
                        if (newVideoIds.length === 0) {
                            throw new Error("No videos found in this playlist or playlist is private");
                        }
                        
                        // Add video IDs and wait for state to update
                        await new Promise(resolve => {
                            addVideoIds(newVideoIds);
                            setTimeout(resolve, 0);
                        });
                        
                        console.log("[InputComponent] Updated videoIds:", videoIds);
                        navigate('/transcripts');
                    } catch (err) {
                        console.error("Playlist processing error:", err);
                        setUrlError(err.response?.data?.message || "Failed to process playlist. Make sure the playlist exists and is public.");
                    }
                } else {
                    let videoId = null;
                    
                    // Handle different YouTube URL formats
                    if (youtubeUrl.includes('v=')) {
                        videoId = youtubeUrl.split('v=')[1].split('&')[0];
                        console.log("Extracted from standard YouTube URL:", videoId);
                    } else if (youtubeUrl.includes('youtu.be/')) {
                        const fullPath = youtubeUrl.split('youtu.be/')[1];
                        videoId = fullPath.split('?')[0].split('&')[0];
                        console.log("Extracted from youtu.be short link:", videoId, "Full path:", fullPath);
                    } else if (/^[a-zA-Z0-9_-]{11}$/.test(youtubeUrl)) {
                        // Handle direct video ID input (11 characters)
                        videoId = youtubeUrl;
                        console.log("Using direct video ID input:", videoId);
                    }
                    
                    console.log("Final extracted Video ID:", videoId);

                    if (videoId) {
                        try {
                            console.log("Processing single video:", videoId);

                            const response = await axios.post(YOUTUBE_API + "/video/" + videoId);

                            if (!response.data || !response.data.status) {
                                throw new Error(response.data?.message || "Failed to process video");
                            }
                            
                            console.log("Video processed successfully:", response.data);
                            
                            await new Promise(resolve => {
                                // First clear all existing video IDs
                                clearVideoIds();
                                // Then add only the single video ID
                                setTimeout(() => {
                                    addVideoIds([videoId]);
                                    resolve();
                                }, 100);
                            });
                            
                            setShowSuccessMessage(true);
                            setTimeout(() => {
                                setShowSuccessMessage(false);
                                navigate('/transcripts');
                            }, 1500);
                        } catch (err) {
                            console.error("Video processing error:", err);
                            setUrlError(
                                err.response?.data?.message || 
                                "Failed to generate transcript. Make sure the video exists, is public, and has captions available."
                            );
                        }
                    } else {
                        setUrlError("Could not extract a valid YouTube video ID from the provided URL. Please enter a valid YouTube URL or ID.");
                        console.log("Failed to extract video ID from:", youtubeUrl);
                    }
                }
            } else {
                setUrlError("Please enter a YouTube URL or video ID");
                console.log("No URL provided");
            }
        } catch (err) {
            console.error("General processing error:", err);
            setUrlError(err.response?.data?.message || "Failed to process request. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const promptSuggestions = [
        {
            icon: faVideo,
            text: "Create a highlight reel of the most engaging moments from these clips",
            category: "Highlights",
            description: "Best moments compilation"
        },
        {
            icon: faMusic,
            text: "Generate a short teaser with dramatic transitions and music that builds tension",
            category: "Teaser",
            description: "Promotional content"
        },
        {
            icon: faStar,
            text: "Extract the key insights and create an educational summary clip",
            category: "Educational",
            description: "Knowledge sharing"
        },
        {
            icon: faWandMagicSparkles,
            text: "Transform these clips into a cohesive story with smooth transitions and narrative flow",
            category: "Storytelling",
            description: "Content transformation"
        }
    ];

    return (
        <div className="min-h-screen pt-14 pb-6 px-6">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `
                        radial-gradient(#6c5ce7 1.5px, transparent 1.5px),
                        radial-gradient(#8b7cf7 1.5px, transparent 1.5px)
                    `,
                    backgroundSize: '50px 50px, 25px 25px',
                    backgroundPosition: '0 0, 25px 25px',
                    animation: 'backgroundMove 60s linear infinite'
                }}></div>
            </div>

            {/* Success Message */}
            {showSuccessMessage && (
                <div className="fixed top-4 right-4 bg-gradient-to-r from-green-500/90 to-emerald-600/90 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in-top backdrop-blur-md border border-white/20">
                    <div className="bg-white/20 p-1.5 rounded-full">
                        <FontAwesomeIcon icon={faCheck} className="text-base" />
                    </div>
                    <p className="text-sm font-medium">Your clip is being generated</p>
                </div>
            )}

            <div className="max-w-[1120px] mx-auto">
                {/* Main Card */}
                <div className="relative backdrop-blur-xl bg-[#1a1a1a]/90 rounded-2xl shadow-2xl border border-gray-800/50 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-[#6c5ce7]/0 via-[#6c5ce7]/50 to-[#6c5ce7]/0"></div>
                    
                    <div className="p-8 space-y-8">
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <div className="inline-flex items-center gap-2 bg-[#6c5ce7]/10 px-4 py-1.5 rounded-full">
                                <FontAwesomeIcon icon={faWandMagicSparkles} className="text-[#6c5ce7] text-base" />
                                <h2 className="text-xl font-semibold text-white">Create New Clip</h2>
                                <FontAwesomeIcon icon={faStar} className="text-yellow-500 text-xs animate-pulse" />
                            </div>
                            <p className="text-gray-400/80 text-sm">Transform your content into engaging clips with AI-powered magic</p>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                            {/* Content Input Column */}
                            <div className="space-y-4">
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-[#6c5ce7]/20 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faFileVideo} className="text-[#6c5ce7] text-xs" />
                                    </span>
                                    Choose Your Content
                                </h3>

                                {/* File Upload Section */}
                                <div className="relative border border-gray-700/30 rounded-xl bg-[#151515]/60 shadow-md overflow-hidden">
                                    {/* Coming Soon Overlay */}
                                    <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-2">
                                        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-full mb-2">
                                            <FontAwesomeIcon icon={faUpload} className="text-white text-xl" />
                                        </div>
                                        <h3 className="text-white font-semibold text-lg">File Upload</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-gray-300 font-medium">Coming Soon</span>
                                            <FontAwesomeIcon icon={faStar} className="text-yellow-400" />
                                        </div>
                                        <p className="text-gray-400 text-sm max-w-xs">
                                            Please use the YouTube URL option below.
                                        </p>
                                    </div>
                                    
                                    {/* Disabled Upload Area */}
                                    <div className="p-8 opacity-50 pointer-events-none">
                                        <div className="border-2 border-dashed border-gray-700/50 rounded-lg p-6 flex flex-col items-center">
                                            <FontAwesomeIcon icon={faUpload} className="text-gray-400 text-2xl mb-3" />
                                            <p className="text-gray-400 text-center mb-2">Drag & drop your file here</p>
                                        </div>
                                    </div>
                                    <input 
                                        type="file" 
                                        id="fileInput" 
                                        className="hidden" 
                                        onChange={handleFileChange} 
                                        accept="video/*,audio/*" 
                                        disabled={true}
                                    />
                                </div>

                                {/* OR Divider */}
                                <div className="flex items-center gap-3 py-3">
                                    <div className="h-px bg-gray-700/30 flex-1"></div>
                                    <div className="px-4 py-1 bg-[#151515] rounded-full border border-gray-700/30">
                                        <span className="text-gray-400 text-xs font-medium">OR</span>
                                    </div>
                                    <div className="h-px bg-gray-700/30 flex-1"></div>
                                </div>

                                {/* YouTube Input */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center">
                                        <FontAwesomeIcon icon={faYoutube} className="text-red-500 text-lg" />
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Paste YouTube video or playlist link"
                                        className="w-full pl-12 pr-4 py-4 bg-[#151515]/60 rounded-xl text-white placeholder-gray-400 text-sm border border-gray-700/30 focus:border-[#6c5ce7] transition-all duration-300 focus:ring-2 focus:ring-[#6c5ce7]/20 outline-none shadow-inner"
                                        value={youtubeUrl}
                                        onChange={handleYoutubeUrlChange}
                                    />
                                    {urlError && (
                                        <p className="text-red-500 text-xs mt-2 ml-2 flex items-center gap-1.5">
                                            <FontAwesomeIcon icon={faExclamationTriangle} />
                                            <span>{urlError}</span>
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Vision Description Column */}
                            <motion.div 
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4, duration: 0.4 }}
                                className="space-y-4"
                            >
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-[#6c5ce7]/20 flex items-center justify-center">
                                        <FontAwesomeIcon icon={faMagicWandSparkles} className="text-[#6c5ce7] text-xs" />
                                    </span>
                                    Describe Your Vision
                                </h3>

                                {/* Prompt Input */}
                                <div className="space-y-4">
                                    <textarea
                                        placeholder="Describe how you want your clip to look... Be creative!"
                                        className="w-full h-[100px] p-3 bg-gray-800/30 rounded-xl text-white placeholder-gray-400 text-sm border border-gray-700/50 focus:border-[#6c5ce7] transition-all duration-300 focus:ring-2 focus:ring-[#6c5ce7]/20 outline-none resize-none"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                    />
                                    
                                    {/* Quick Suggestions */}
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <FontAwesomeIcon icon={faLightbulb} className="text-yellow-500 text-xs" />
                                            <span className="text-gray-400 text-sm">Quick Suggestions:</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {promptSuggestions.map((suggestion, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setPrompt(suggestion.text)}
                                                    className="flex items-start gap-2 p-3 bg-gray-800/30 rounded-xl hover:bg-[#6c5ce7]/10 transition-all duration-300 text-left group border border-gray-700/50 hover:border-[#6c5ce7]/50"
                                                >
                                                    <span className="w-6 h-6 rounded-lg bg-[#6c5ce7]/20 flex items-center justify-center shrink-0">
                                                        <FontAwesomeIcon icon={suggestion.icon} className="text-[#6c5ce7] text-xs group-hover:scale-110 transition-transform" />
                                                    </span>
                                                    <div>
                                                        <span className="block text-[10px] text-[#6c5ce7] mb-0.5 font-medium uppercase tracking-wide">{suggestion.category}</span>
                                                        <span className="block text-xs text-gray-300 group-hover:text-white transition-colors leading-relaxed">{suggestion.text}</span>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Generate Button */}
                        <button
                            className={`w-full py-4 rounded-xl text-white font-medium transition-all duration-300 flex items-center justify-center gap-3
                            ${isLoading || !youtubeUrl 
                                ? 'bg-gray-800/50 cursor-not-allowed shadow-inner' 
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transform hover:scale-[1.01] hover:shadow-xl shadow-lg'}`}
                            onClick={handleGenerate}
                            disabled={isLoading || !youtubeUrl}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={faWandMagicSparkles} className="text-lg" />
                                    <span>Generate From YouTube</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <style>
                {`
                @keyframes backgroundMove {
                    0% { background-position: 0 0, 25px 25px; }
                    100% { background-position: 50px 50px, 75px 75px; }
                }
                `}
            </style>
        </div>
    );
};

export default InputComponent;
