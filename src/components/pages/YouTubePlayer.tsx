"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Youtube, Play, Calendar, Eye, ArrowLeft, ExternalLink, Loader2, ThumbsUp, Share2, Bell, Clock, Image } from "lucide-react";
import { fetchYouTubeVideos, fetchYouTubeContentByType, clearYouTubeCache } from "@/services/youtubeService";
import UniversalNav from "@/components/UniversalNav";
import NewsNavigation from "@/components/NewsNavigation";
import { useAuth } from "@/contexts/useAuth";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
  likeCount?: string;
  favoriteCount?: string;
  duration?: string;
  contentType: 'video' | 'short' | 'post';
}

const YouTubePlayer = () => {
  const searchParams = useSearchParams();
  const videoId = searchParams.get('v') || undefined;
  const router = useRouter();
  const { isLoggedIn, userRole, currentStudent, currentDepartmentUser, logout } = useAuth();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [shorts, setShorts] = useState<YouTubeVideo[]>([]);
  const [posts, setPosts] = useState<YouTubeVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'shorts' | 'posts'>('videos');

  const MAX_RESULTS = 50; // Increased to show all videos

  // Format large numbers (e.g., 1000 -> 1K, 1000000 -> 1M)
  const formatCount = (count: string): string => {
    const num = parseInt(count, 10);
    if (isNaN(num)) return count;
    
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Format duration (e.g., PT1M30S -> 1:30)
  const formatDuration = (duration: string): string => {
    if (!duration) return "";
    
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "";
    
    const [, hours, minutes, seconds] = match;
    const h = hours ? parseInt(hours, 10) : 0;
    const m = minutes ? parseInt(minutes, 10) : 0;
    const s = seconds ? parseInt(seconds, 10) : 0;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    } else {
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
  };

  // Memoized function to load YouTube content
  const loadYouTubeContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Clear cache to ensure fresh data
      clearYouTubeCache();

      // First, fetch all videos to see what we're working with
      const allVideos = await fetchYouTubeVideos(MAX_RESULTS);

      // Check if we have any videos at all
      if (!allVideos || allVideos.length === 0) {
        console.warn('No videos fetched from YouTube API');
        setError("No content available at the moment. Please try again later.");
        setLoading(false);
        return;
      }

      // Count content types for debugging
      const videoCount = allVideos.filter(v => v.contentType === 'video').length;
      const shortCount = allVideos.filter(v => v.contentType === 'short').length;
      const postCount = allVideos.filter(v => v.contentType === 'post').length;

      // Load all content types with error handling
      let videosData: YouTubeVideo[] = [];
      let shortsData: YouTubeVideo[] = [];
      let postsData: YouTubeVideo[] = [];

      try {
        videosData = await fetchYouTubeContentByType('videos', MAX_RESULTS);
      } catch (err) {
        console.warn('Error fetching videos, using fallback:', err);
        videosData = allVideos;
      }

      try {
        shortsData = await fetchYouTubeContentByType('shorts', MAX_RESULTS);
      } catch (err) {
        console.warn('Error fetching shorts, using fallback:', err);
        shortsData = allVideos.slice(0, Math.min(allVideos.length, 12));
      }

      try {
        postsData = await fetchYouTubeContentByType('posts', MAX_RESULTS);
      } catch (err) {
        console.warn('Error fetching posts, using fallback:', err);
        postsData = allVideos.slice(0, Math.min(allVideos.length, 6));
      }

      // Ensure we have content to display
      const finalVideosData = videosData.length > 0 ? videosData : allVideos;
      const finalShortsData = shortsData.length > 0 ? shortsData : allVideos.slice(0, Math.min(allVideos.length, 12));
      const finalPostsData = postsData.length > 0 ? postsData : allVideos.slice(0, Math.min(allVideos.length, 6));

      setVideos(finalVideosData);
      setShorts(finalShortsData);
      setPosts(finalPostsData);

      // If a videoId is provided in the URL, select that video
      if (videoId) {
        const allVideosCombined = [...finalVideosData, ...finalShortsData, ...finalPostsData];
        const video = allVideosCombined.find(v => v.id === videoId) || finalVideosData[0] || finalShortsData[0] || finalPostsData[0];
        if (video) {
          setSelectedVideo(video);
          // Set active tab based on content type
          if (video.contentType === 'short') {
            setActiveTab('shorts');
          } else if (video.contentType === 'post') {
            setActiveTab('posts');
          } else {
            setActiveTab('videos');
          }
        }
      } else if (finalVideosData.length > 0) {
        // Otherwise, select the first video
        setSelectedVideo(finalVideosData[0]);
        setActiveTab('videos');
      } else if (finalShortsData.length > 0) {
        setSelectedVideo(finalShortsData[0]);
        setActiveTab('shorts');
      } else if (finalPostsData.length > 0) {
        setSelectedVideo(finalPostsData[0]);
        setActiveTab('posts');
      } else if (allVideos.length > 0) {
        // Fallback: if filtering didn't work, just use the first available video
        setSelectedVideo(allVideos[0]);
        setActiveTab('videos');
        setVideos(allVideos); // Show all videos in the videos tab as fallback
      }
    } catch (err) {
      console.error("Error fetching YouTube content in YouTubePlayer:", err);
      if (err instanceof Error && err.message.includes('quota')) {
        setError("YouTube API quota exceeded. Please try again later.");
      } else {
        setError("Failed to load content. Please try again later.");
      }
      console.error("Error fetching YouTube content:", err);
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, [videoId]);

  useEffect(() => {
    // Load content immediately without clearing cache for faster initial load
    loadYouTubeContent();
    
    // Preload content in background after initial load for better caching
    const preloadTimer = setTimeout(() => {
      if (!initialLoad) {
        clearYouTubeCache();
        fetchYouTubeVideos(MAX_RESULTS).catch(console.error);
      }
    }, 5000); // Preload after 5 seconds
    
    return () => clearTimeout(preloadTimer);
  }, [loadYouTubeContent, initialLoad]);

  const handleVideoSelect = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    // Update the URL to reflect the selected video
    router.push(`/youtube?v=${video.id}`);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Function to handle like action
  const handleLike = (videoId: string) => {
    // In a real implementation, this would call an API to like the video
    // For now, we'll just open the YouTube video page where users can like
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
  };

  // Function to handle share action
  const handleShare = (videoId: string, title: string) => {
    // In a real implementation, this would show a share dialog
    // For now, we'll copy the video URL to clipboard
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    navigator.clipboard.writeText(videoUrl).then(() => {
      alert(`Video URL copied to clipboard!\n${videoUrl}`);
    }).catch(() => {
      // Fallback: open YouTube video page
      window.open(videoUrl, "_blank");
    });
  };

  // Function to handle subscribe action
  const handleSubscribe = () => {
    // Open YouTube channel page where users can subscribe
    window.open("https://www.youtube.com/channel/UCd6iyFcfC8mQxUP5Laltplg", "_blank");
  };

  // Get current content based on active tab
  const getCurrentContent = () => {
    switch (activeTab) {
      case 'videos': return videos;
      case 'shorts': return shorts;
      case 'posts': return posts;
      default: return videos;
    }
  };

  // Video card component for different content types
  const VideoCard = ({ video }: { video: YouTubeVideo }) => (
    <Card 
      key={video.id} 
      className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${
        selectedVideo?.id === video.id 
          ? "ring-2 ring-red-500 shadow-lg" 
          : ""
      }`}
      onClick={() => handleVideoSelect(video)}
    >
      <CardContent className="p-3">
        <div className="flex space-x-3">
          <div className="relative flex-shrink-0">
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className={`rounded-md object-cover transition-transform duration-300 hover:scale-105 ${
                video.contentType === 'short' 
                  ? "h-24 w-16" 
                  : "h-16 w-24"
              }`}
              loading="lazy"
            />
            {video.duration && video.contentType !== 'short' && (
              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                {formatDuration(video.duration)}
              </div>
            )}
            {video.contentType === 'short' && (
              <div className="absolute bottom-1 left-1 bg-red-600 text-white text-xs px-1 rounded">
                SHORT
              </div>
            )}
            {video.contentType === 'post' && (
              <div className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1 rounded">
                POST
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm line-clamp-2 mb-1">{video.title}</h4>
            <div className="flex items-center text-xs text-muted-foreground space-x-2 mb-1">
              <span className="flex items-center">
                <Calendar className="mr-1 h-3 w-3" />
                {formatDate(video.publishedAt)}
              </span>
              <span className="flex items-center">
                <Eye className="mr-1 h-3 w-3" />
                {formatCount(video.viewCount)} views
              </span>
            </div>
            <div className="flex space-x-2 mt-1">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 px-2 text-xs hover:bg-red-50 hover:text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(video.id);
                }}
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                {video.likeCount && formatCount(video.likeCount)}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Shorts grid component
  const ShortsGrid = ({ shorts }: { shorts: YouTubeVideo[] }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {shorts.map((short) => (
        <Card 
          key={short.id} 
          className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedVideo?.id === short.id 
              ? "ring-2 ring-red-500 shadow-lg" 
              : ""
          }`}
          onClick={() => handleVideoSelect(short)}
        >
          <CardContent className="p-3">
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={short.thumbnail} 
                alt={short.title} 
                className="rounded-md h-40 w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                SHORT
              </div>
            </div>
            <h4 className="font-semibold text-sm mt-2 line-clamp-2">{short.title}</h4>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <Eye className="mr-1 h-3 w-3" />
              {formatCount(short.viewCount)} views
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Posts grid component
  const PostsGrid = ({ posts }: { posts: YouTubeVideo[] }) => (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card 
          key={post.id} 
          className={`overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedVideo?.id === post.id 
              ? "ring-2 ring-red-500 shadow-lg" 
              : ""
          }`}
          onClick={() => handleVideoSelect(post)}
        >
          <CardContent className="p-4">
            <div className="relative rounded-lg overflow-hidden mb-3">
              <img 
                src={post.thumbnail} 
                alt={post.title} 
                className="rounded-md h-48 w-full object-cover transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                POST
              </div>
            </div>
            <h4 className="font-bold text-base mb-2 line-clamp-2">{post.title}</h4>
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">{post.description}</p>
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="mr-1 h-3 w-3" />
              {formatDate(post.publishedAt)}
            </div>
            <div className="flex space-x-2 mt-3">
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 px-3 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(post.id);
                }}
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                {post.likeCount && formatCount(post.likeCount)}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 px-3 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShare(post.id, post.title);
                }}
              >
                <Share2 className="h-3 w-3 mr-1" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // Optimized video player component
  const VideoPlayer = React.memo(() => {
    const [iframeError, setIframeError] = useState(false);

    if (!selectedVideo) {
      return (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-6">
            <Youtube className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-primary mb-2">No Content Selected</h3>
          <p className="text-muted-foreground">Please select a video, short, or post from the list.</p>
        </div>
      );
    }
    
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="relative pb-[56.25%] h-0 rounded-xl overflow-hidden mb-4 shadow-lg">
          {!iframeError ? (
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.id}?rel=0&modestbranding=1`}
              title={selectedVideo.title}
              className="absolute top-0 left-0 w-full h-full rounded-xl"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              onError={() => setIframeError(true)}
              onLoad={() => setIframeError(false)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
              <div className="text-center p-6">
                <Youtube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-600 mb-2">Video Unavailable</h4>
                <p className="text-sm text-gray-500 mb-4">This video cannot be embedded. Please watch it on YouTube directly.</p>
                <Button 
                  onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedVideo.id}`, "_blank")}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Watch on YouTube
                </Button>
              </div>
            </div>
          )}
        </div>
        <h2 className="text-2xl font-bold text-primary mb-3">{selectedVideo.title}</h2>
        <div className="flex flex-wrap items-center text-sm text-muted-foreground mb-4 gap-3">
          <span className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
            <Calendar className="mr-1 h-4 w-4" />
            {formatDate(selectedVideo.publishedAt)}
          </span>
          <span className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
            <Eye className="mr-1 h-4 w-4" />
            {formatCount(selectedVideo.viewCount)} views
          </span>
          {selectedVideo.likeCount && (
            <span className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
              <ThumbsUp className="mr-1 h-4 w-4" />
              {formatCount(selectedVideo.likeCount)} likes
            </span>
          )}
          {selectedVideo.duration && selectedVideo.contentType !== 'short' && (
            <span className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
              <Clock className="mr-1 h-4 w-4" />
              {formatDuration(selectedVideo.duration)}
            </span>
          )}
          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
            {selectedVideo.contentType.toUpperCase()}
          </span>
        </div>
        <p className="text-muted-foreground mb-6">{selectedVideo.description}</p>
        <div className="flex flex-wrap gap-3">
          <Button 
            onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedVideo.id}`, "_blank")}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Watch on YouTube
          </Button>
          <Button 
            onClick={() => handleLike(selectedVideo.id)}
            variant="outline"
          >
            <ThumbsUp className="mr-2 h-4 w-4" />
            Like
          </Button>
          <Button 
            onClick={() => handleShare(selectedVideo.id, selectedVideo.title)}
            variant="outline"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button 
            onClick={handleSubscribe}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            <Bell className="mr-2 h-4 w-4" />
            Subscribe
          </Button>
        </div>
      </div>
    );
  });

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        currentStudent={currentStudent}
        currentDepartmentUser={currentDepartmentUser}
        onLoginClick={() => {}}
        onLogout={logout}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <NewsNavigation currentPage="youtube" />
        
        {loading && initialLoad ? (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-2/3">
              <div className="animate-pulse bg-gray-200 rounded-xl h-96 w-full mb-4"></div>
              <div className="animate-pulse bg-gray-200 rounded-xl h-6 w-3/4 mb-2"></div>
              <div className="animate-pulse bg-gray-200 rounded-xl h-4 w-full mb-4"></div>
              <div className="animate-pulse bg-gray-200 rounded-xl h-4 w-1/4"></div>
            </div>
            <div className="lg:w-1/3">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="animate-pulse mb-4">
                  <div className="flex space-x-3">
                    <div className="bg-gray-200 rounded-lg h-16 w-24" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <Youtube className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Error Loading Content</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={loadYouTubeContent}>
              Try Again
            </Button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main content player */}
            <div className="lg:w-2/3">
              <VideoPlayer />
            </div>

            {/* Content list sidebar with tabs */}
            <div className="lg:w-1/3">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'videos' | 'shorts' | 'posts')} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4 bg-white rounded-lg shadow p-1">
                  <TabsTrigger 
                    value="videos" 
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-md py-2"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Videos ({videos.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="shorts" 
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-md py-2"
                  >
                    <Youtube className="h-4 w-4 mr-2" />
                    Shorts ({shorts.length})
                  </TabsTrigger>
                  <TabsTrigger 
                    value="posts" 
                    className="data-[state=active]:bg-red-600 data-[state=active]:text-white rounded-md py-2"
                  >
                    <Image className="h-4 w-4 mr-2" />
                    Posts ({posts.length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="videos" className="mt-0">
                  <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    {videos.length > 0 ? (
                      videos.map(video => (
                        <VideoCard key={video.id} video={video} />
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground bg-white rounded-lg shadow">
                        No videos found
                      </div>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="shorts" className="mt-0">
                  {shorts.length > 0 ? (
                    <ShortsGrid shorts={shorts} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground bg-white rounded-lg shadow">
                      No shorts found
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="posts" className="mt-0">
                  {posts.length > 0 ? (
                    <PostsGrid posts={posts} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground bg-white rounded-lg shadow">
                      No posts found
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YouTubePlayer;