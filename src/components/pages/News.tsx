"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Youtube, Play, Calendar, Eye, ExternalLink, Users, Facebook, Instagram, Linkedin } from "lucide-react";
import { fetchYouTubeVideos, clearYouTubeCache } from "@/services/youtubeService";
import UniversalNav from "@/components/UniversalNav";
import NewsNavigation from "@/components/NewsNavigation";
import LinkedInFeed from "@/components/LinkedInFeed";
import { useAuth } from "@/contexts/useAuth";
import AuthModal from "@/components/AuthModal";
import { Student } from "@/services/apiService";
import { DepartmentUser } from "@/contexts/AuthContext";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  publishedAt: string;
  viewCount: string;
}

const News = () => {
  const router = useRouter();
  const { isLoggedIn, userRole, currentStudent, currentDepartmentUser, logout, login } = useAuth();
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // YouTube API configuration
  const API_KEY = "AIzaSyCTtWBJc0n1yVt1WInpcr7b7BKH-bBipQE";
  const CHANNEL_ID = "UCd6iyFcfC8mQxUP5Laltplg"; // You can replace this with your actual channel ID
  const MAX_RESULTS = 6; // Reduced to make space for social media cards

  useEffect(() => {
    // Clear cache when component mounts to ensure we fetch from the new channel
    clearYouTubeCache();
    
    const loadYouTubeVideos = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading YouTube videos in News page');
        const fetchedVideos = await fetchYouTubeVideos(MAX_RESULTS);
        
        setVideos(fetchedVideos);
      } catch (err) {
        console.error("Error fetching YouTube videos in News page:", err);
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

    loadYouTubeVideos();
  }, []);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Social media platforms data
  const socialMediaPlatforms = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600",
      description: "Connect with us on Facebook for updates and community discussions",
      link: "https://www.facebook.com/CenturionUniversityAndhraPradesh/"
    },
    {
      name: "Instagram",
      icon: Instagram,
      color: "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500",
      description: "Follow us on Instagram for visual stories and behind-the-scenes content",
      link: "https://www.instagram.com/centurion_university_ap/"
    },
    {
      name: "LinkedIn",
      icon: Linkedin, // Fixed: Use the imported Linkedin icon from lucide-react
      color: "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500",
      description: "Connect with us on LinkedIn for professional connections and industry updates",
      link: "https://www.linkedin.com/in/centurion-university-andhra-pradesh-5050062a6/"
    }
  ];

  const handleLogin = (role: "student" | "admin" | "department" | "school" | "alumni-manager" | "cadmin", student?: Student, departmentUser?: DepartmentUser) => {
    login(role, student, departmentUser);
    setIsAuthModalOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-background">
      <UniversalNav
        isLoggedIn={isLoggedIn}
        userRole={userRole}
        currentStudent={currentStudent}
        currentDepartmentUser={currentDepartmentUser}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <NewsNavigation currentPage="news" />
        
        <div className="text-center mb-12">
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Stay updated with the latest news, events, and achievements from CUTMAP University
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse">
                <Card className="overflow-hidden">
                  <div className="bg-gray-200 h-48 w-full" />
                  <CardContent className="p-6">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <Youtube className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Error Loading Videos</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* YouTube Channel Info Card */}
              <Card className="lg:col-span-2 overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 gradient-primary rounded-full mr-3">
                        <Youtube className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-primary">CUTMAP YouTube Channel latest updates</h2>
                    </div>
                    <Button 
                      size="sm" 
                      className="gradient-primary hover:bg-primary/90 text-white"
                      onClick={() => router.push("/youtube")}
                    >
                      Explore
                    </Button>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Watch our latest videos and stay updated with university events, student achievements, and campus life.
                  </p>
                
                  {videos && videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.slice(0, 4).map((video) => (
                        <Card 
                          key={video.id} 
                          className="overflow-hidden hover:shadow-xl transition-shadow duration-300 group cursor-pointer"
                          onClick={() => router.push(`/youtube?v=${video.id}`)}
                        >
                          <div className="relative">
                            <img 
                              src={video.thumbnail} 
                              alt={video.title} 
                              className="h-32 w-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <Button 
                                size="sm" 
                                className="gradient-primary hover:bg-primary/90 text-white rounded-full h-10 w-10 p-0"
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <h3 className="text-sm font-bold text-primary mb-1 line-clamp-2">{video.title}</h3>
                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                              <span className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                {formatDate(video.publishedAt)}
                              </span>
                              <span className="flex items-center">
                                <Eye className="mr-1 h-3 w-3" />
                                {video.viewCount} views
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No videos available at the moment.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            
              {/* Social Media Cards - Updated color scheme */}
              <div className="space-y-6">
                {socialMediaPlatforms.map((platform, index) => {
                  const Icon = platform.icon;
                  return (
                    <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <CardContent className="p-6">
                        <div className={`w-full h-2 rounded-t-lg ${
                          platform.name === "Facebook" ? "bg-blue-600" : 
                          platform.name === "Instagram" ? "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" : 
                          "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                        }`}></div>
                        <div className="flex items-center mt-4 mb-3">
                          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${
                            platform.name === "Facebook" ? "bg-blue-600" : 
                            platform.name === "Instagram" ? "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" : 
                            "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                          } mr-3`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <h3 className="text-lg font-bold text-primary">{platform.name}</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">
                          {platform.description}
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full border-primary/30 hover:gradient-accent hover:text-dark"
                          onClick={() => window.open(platform.link, "_blank")}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Visit {platform.name}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* LinkedIn Feed Section */}
            {/* <div className="mb-8">
              <LinkedInFeed />
            </div> */}
            
            {/* Social Media Embeds */}
            <div className="mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Facebook Page Embed */}
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full mr-3">
                        <Facebook className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-primary">CUTMAP Facebook Page</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Stay connected with our Facebook page for the latest updates, events, and community discussions.
                    </p>
                    <div className="flex justify-center">
                      <iframe 
                        src="https://www.facebook.com/plugins/page.php?href=https://www.facebook.com/CenturionUniversityAndhraPradesh/&tabs=timeline&width=500&height=600&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true" 
                        width="500" 
                        height="600" 
                        style={{ border: 'none', overflow: 'hidden' }}
                        scrolling="no" 
                        frameBorder="0" 
                        allowFullScreen={true}
                        className="w-full max-w-full"
                        onError={(e) => {
                          // Suppress Facebook SDK errors
                          e.preventDefault();
                          console.warn('Facebook embed failed to load');
                        }}
                        onLoad={() => {
                          // Facebook embed loaded successfully
                          console.log('Facebook embed loaded');
                        }}
                      >
                      </iframe>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Instagram Profile Embed */}
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-full mr-3">
                        <Instagram className="h-5 w-5 text-white" />
                      </div>
                      <h2 className="text-xl font-bold text-primary">CUTMAP Instagram Profile</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Follow us on Instagram for visual stories, campus life updates, and behind-the-scenes content.
                    </p>
                    <div className="flex justify-center">
                      <iframe 
                        src="https://www.instagram.com/centurion_university_ap/embed" 
                        width="500" 
                        height="600" 
                        style={{ border: 'none', overflow: 'hidden' }}
                        scrolling="no" 
                        frameBorder="0" 
                        allowFullScreen={true}
                        className="w-full max-w-full"
                        onError={(e) => {
                          // Suppress Instagram SDK errors
                          e.preventDefault();
                          console.warn('Instagram embed failed to load');
                        }}
                        onLoad={() => {
                          // Instagram embed loaded successfully
                          console.log('Instagram embed loaded');
                        }}
                      >
                      </iframe>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
};

export default News;