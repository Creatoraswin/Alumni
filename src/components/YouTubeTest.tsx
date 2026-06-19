"use client";

import React, { useState, useEffect } from 'react';
import { clearYouTubeCache } from '@/services/youtubeService';
import { Button } from "@/components/ui/button";

const YouTubeTest = () => {
  // Clear cache when component mounts
  React.useEffect(() => {
    clearYouTubeCache();
  }, []);
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const API_KEY = "AIzaSyCTtWBJc0n1yVt1WInpcr7b7BKH-bBipQE";
  const CHANNEL_ID = "UCd6iyFcfC8mQxUP5Laltplg";
  const PLAYLIST_ID = "UUd6iyFcfC8mQxUP5Laltplg";

  const testYouTubeAPI = async () => {
    setIsLoading(true);
    setTestResult('Testing YouTube API...');
    
    try {
      // Test 1: Basic channel info
      const channelUrl = `https://www.googleapis.com/youtube/v3/channels?key=${API_KEY}&id=${CHANNEL_ID}&part=snippet`;
      setTestResult(`Fetching channel info from: ${channelUrl}`);
      
      const channelResponse = await fetch(channelUrl);
      const channelText = await channelResponse.text();
      
      if (!channelResponse.ok) {
        console.error('YouTube API error response:', channelText);
        
        // Handle quota exceeded error specifically
        if (channelResponse.status === 403 && channelText.includes('quota')) {
          throw new Error('YouTube API quota exceeded. Please try again later (quota resets every 24 hours).');
        }
        
        throw new Error(`Channel API error: ${channelResponse.status} - ${channelText}`);
      }
      
      const channelData = JSON.parse(channelText);
      
      setTestResult(`Channel info retrieved successfully. Channel name: ${channelData.items[0]?.snippet?.title || 'Unknown'}`);
      
      // Test 2: Try playlist approach (uploads playlist)
      setTestResult(prev => `${prev}\n\nTrying playlist approach with playlist ID: ${PLAYLIST_ID}`);
      
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?key=${API_KEY}&playlistId=${PLAYLIST_ID}&part=snippet,id,contentDetails&maxResults=3`;
      setTestResult(prev => `${prev}\n\nFetching playlist items from: ${playlistUrl}`);
      
      const playlistResponse = await fetch(playlistUrl);
      const playlistText = await playlistResponse.text();
      
      if (!playlistResponse.ok) {
        console.error('YouTube API error response:', playlistText);
        
        // Handle quota exceeded error specifically
        if (playlistResponse.status === 403 && playlistText.includes('quota')) {
          throw new Error('YouTube API quota exceeded. Please try again later (quota resets every 24 hours).');
        }
        
        throw new Error(`Playlist API error: ${playlistResponse.status} - ${playlistText}`);
      }
      
      const playlistData = JSON.parse(playlistText);
      
      // Validate response structure
      if (!playlistData || !playlistData.items || !Array.isArray(playlistData.items)) {
        throw new Error('Invalid playlist response structure from YouTube API');
      }
      
      setTestResult(prev => `${prev}\n\nPlaylist items retrieved successfully. Found ${playlistData.items.length} items.`);
      
      // Test 3: Video statistics for playlist items
      if (playlistData.items.length > 0) {
        const videoIds = playlistData.items.map((item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId).join(',');
        const statsUrl = `https://www.googleapis.com/youtube/v3/videos?key=${API_KEY}&id=${videoIds}&part=statistics`;
        setTestResult(prev => `${prev}\n\nFetching video statistics from: ${statsUrl}`);
        
        const statsResponse = await fetch(statsUrl);
        const statsText = await statsResponse.text();
        
        if (!statsResponse.ok) {
          console.error('YouTube API error response:', statsText);
          
          // Handle quota exceeded error specifically
          if (statsResponse.status === 403 && statsText.includes('quota')) {
            throw new Error('YouTube API quota exceeded. Please try again later (quota resets every 24 hours).');
          }
          
          throw new Error(`Statistics API error: ${statsResponse.status} - ${statsText}`);
        }
        
        const statsData = JSON.parse(statsText);
        
        // Validate response structure
        if (!statsData || !statsData.items || !Array.isArray(statsData.items)) {
          throw new Error('Invalid statistics response structure from YouTube API');
        }
        
        setTestResult(prev => `${prev}\n\nStatistics retrieved successfully. Found data for ${statsData.items.length} videos.`);
      }
      
      setTestResult(prev => `${prev}\n\nAll tests passed! YouTube API is working correctly with playlist approach.`);
    } catch (error) {
      console.error('YouTube API Test Error:', error);
      let errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Handle quota exceeded error specifically
      if (errorMessage.includes('quota')) {
        errorMessage = 'YouTube API quota exceeded. Please try again later.';
      }
      
      setTestResult(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">YouTube API Test</h2>
      <p className="mb-4">This tool tests the YouTube API connection with your channel.</p>
      
      <Button 
        onClick={testYouTubeAPI} 
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? 'Testing...' : 'Test YouTube API'}
      </Button>
      
      <div className="bg-gray-100 p-4 rounded-lg whitespace-pre-wrap">
        <pre>{testResult || 'Click the button above to test the YouTube API.'}</pre>
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Channel ID:</strong> {CHANNEL_ID}</p>
        <p><strong>API Key:</strong> {API_KEY.substring(0, 10)}...{API_KEY.substring(API_KEY.length - 5)}</p>
      </div>
    </div>
  );
};

export default YouTubeTest;