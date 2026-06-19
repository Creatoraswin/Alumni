"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Youtube, Play, Calendar, Eye } from "lucide-react";
import { fetchYouTubeVideos, clearYouTubeCache } from "@/services/youtubeService";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
}

const NewsCorner = () => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MAX_RESULTS = 6;

  useEffect(() => {
    // Clear cache when component mounts to ensure we fetch from the new channel
    clearYouTubeCache();
    
    const loadYouTubeVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading YouTube videos in NewsCorner');
        const fetchedVideos = await fetchYouTubeVideos(MAX_RESULTS);
        console.log('Fetched videos in NewsCorner:', fetchedVideos);
        setVideos(fetchedVideos);
      } catch (err) {
        console.error("Error fetching YouTube videos in NewsCorner:", err);
        if (err instanceof Error && err.message.includes('quota')) {
          setError("YouTube API quota exceeded. Please try again later.");
        } else {
          setError("Failed to load videos. Please try again later.");
        }
        console.error("Error fetching YouTube videos:", err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadYouTubeVideos();
    }
  }, [isOpen]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="text-primary hover:bg-accent hover:text-primary font-medium transition-all duration-200 p-2 rounded-lg group"
        >
          <div className="flex items-center">
            <Youtube className="h-5 w-5 group-hover:scale-110 transition-transform" />
            <span className="ml-2 hidden sm:inline">News Corner</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[350px] sm:w-[450px] lg:w-[550px] max-h-[80vh] overflow-y-auto mr-4 mt-2"
      >
        <div className="p-4">
          <h3 className="text-lg font-bold text-primary mb-4 flex items-center">
            <Youtube className="mr-2 h-5 w-5 text-red-500" />
            Latest News & Updates
          </h3>
          
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="flex space-x-3">
                    <div className="bg-gray-200 rounded-lg h-16 w-24" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-6 text-red-500">
              <p>{error}</p>
            </div>
          ) : videos && videos.length > 0 ? (
            <div className="space-y-4">
              {videos.map((video) => (
                <DropdownMenuItem 
                  key={video.id} 
                  className="p-0 focus:bg-transparent hover:bg-transparent"
                  asChild
                >
                  <div 
                    onClick={() => router.push(`/youtube/${video.id}`)}
                    className="block cursor-pointer"
                  >
                    <Card className="hover:shadow-lg transition-shadow duration-200 hover:border-primary/50">
                      <CardContent className="p-3">
                        <div className="flex space-x-3">
                          <div className="relative flex-shrink-0">
                            <img 
                              src={video.thumbnail} 
                              alt={video.title} 
                              className="rounded-md h-16 w-24 object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-md">
                              <Play className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm line-clamp-2 mb-1">{video.title}</h4>
                            <div className="flex items-center text-xs text-muted-foreground space-x-2">
                              <span className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                {formatDate(video.publishedAt)}
                              </span>
                              <span className="flex items-center">
                                <Eye className="mr-1 h-3 w-3" />
                                {video.viewCount} views
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </DropdownMenuItem>
              ))}
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push("/youtube")}
                >
                  View All Videos
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <p>No videos available at the moment.</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NewsCorner;