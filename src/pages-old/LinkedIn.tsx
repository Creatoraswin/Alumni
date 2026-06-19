"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Linkedin, Loader2 } from "lucide-react";
import UniversalNav from "@/components/UniversalNav";
import { useAuth } from "@/contexts/useAuth";

// Define TypeScript interfaces
interface LinkedInPost {
  id: string;
  author: string;
  authorTitle: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  imageUrl?: string;
}

interface LinkedInOrganization {
  id: string;
  name: string;
  tagline: string;
  locations: Array<{
    address: {
      country: string;
      geographicArea: string;
    };
  }>;
  profilePicture?: {
    displayImage: string;
  };
  coverPhoto?: {
    displayImage: string;
  };
}

const LinkedIn = () => {
  const router = useRouter();
  const { isLoggedIn, userRole, currentStudent, currentDepartmentUser, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<LinkedInOrganization | null>(null);
  const [posts, setPosts] = useState<LinkedInPost[]>([]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Fetch LinkedIn data from backend proxy
  useEffect(() => {
    const fetchLinkedInData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // For demo purposes, we'll use mock data
        // In a real implementation, this would call your backend proxy:
        // const response = await fetch('http://localhost:3001/api/linkedin/feed');
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock organization data
        const mockOrganization: LinkedInOrganization = {
          id: "10278658",
          name: "Centurion University of Technology and Management, Andhra Pradesh",
          tagline: "Educational Institution",
          locations: [{
            address: {
              country: "IN",
              geographicArea: "Andhra Pradesh"
            }
          }],
          profilePicture: {
            displayImage: "https://placehold.co/100x100"
          },
          coverPhoto: {
            displayImage: "https://placehold.co/800x200"
          }
        };
        
        // Mock posts data
        const mockPosts: LinkedInPost[] = [
          {
            id: "1",
            author: "Centurion University",
            authorTitle: "Educational Institution",
            content: "We're proud to announce that our students have won the National Innovation Challenge 2025! This achievement reflects our commitment to fostering innovation and excellence in education.",
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
            likes: 124,
            comments: 28,
            shares: 15,
            imageUrl: "https://placehold.co/600x300"
          },
          {
            id: "2",
            author: "Centurion University",
            authorTitle: "Educational Institution",
            content: "Our new campus facility is now open! Featuring state-of-the-art laboratories, collaborative workspaces, and sustainable design elements that support our students' learning journey.",
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            likes: 89,
            comments: 12,
            shares: 7,
            imageUrl: "https://placehold.co/600x300"
          },
          {
            id: "3",
            author: "Centurion University",
            authorTitle: "Educational Institution",
            content: "Join us for our upcoming Industry-Academia Conclave on October 15th. Leading experts from various fields will share insights on the future of education and technology.",
            timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
            likes: 210,
            comments: 34,
            shares: 22
          },
          {
            id: "4",
            author: "Centurion University",
            authorTitle: "Educational Institution",
            content: "Congratulations to our alumni who were featured in the latest issue of Education Today magazine for their outstanding contributions to their respective fields!",
            timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
            likes: 156,
            comments: 22,
            shares: 18
          },
          {
            id: "5",
            author: "Centurion University",
            authorTitle: "Educational Institution",
            content: "Our research team has published a groundbreaking paper on sustainable energy solutions in the International Journal of Renewable Energy. Read the full article at the link below.",
            timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
            likes: 98,
            comments: 15,
            shares: 9,
            imageUrl: "https://placehold.co/600x300"
          }
        ];
        
        // Sort by timestamp (newest first)
        const sortedPosts = mockPosts.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setOrganization(mockOrganization);
        setPosts(sortedPosts);
      } catch (err) {
        console.error('Error fetching LinkedIn data:', err);
        setError('Failed to load LinkedIn data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedInData();
  }, []);

  const handleViewOnLinkedIn = () => {
    window.open("https://www.linkedin.com/company/centurion-university-of-technology-and-management-andhra-pradesh", "_blank");
  };

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">LinkedIn Updates</h1>
          <p className="text-muted-foreground">
            Stay connected with our professional network and latest updates
          </p>
        </div>

        {/* LinkedIn Company Page Content */}
        <Card className="overflow-hidden mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-600 rounded-full mr-3">
                  <Linkedin className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-primary">Centurion University Updates</h2>
              </div>
              <Button 
                size="sm" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleViewOnLinkedIn}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View on LinkedIn
              </Button>
            </div>
            
            <p className="text-muted-foreground mb-6">
              Latest updates from Centurion University of Technology and Management, Andhra Pradesh
            </p>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
                <p className="text-muted-foreground">Loading LinkedIn content...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                  <Linkedin className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-primary mb-2">Error Loading Content</h3>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Company Information */}
                {organization && (
                  <div className="border rounded-lg p-6 bg-white">
                    <h3 className="text-lg font-bold text-primary mb-4">Company Profile</h3>
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                      <div className="flex-shrink-0">
                        <img 
                          src={organization.profilePicture?.displayImage || "https://placehold.co/100x100"} 
                          alt={organization.name} 
                          className="w-24 h-24 rounded-full object-cover border-4 border-blue-100"
                        />
                      </div>
                      <div className="text-center md:text-left">
                        <h4 className="text-xl font-bold text-primary">{organization.name}</h4>
                        <p className="text-muted-foreground mt-1">{organization.tagline}</p>
                        <div className="flex items-center justify-center md:justify-start mt-2">
                          <span className="text-muted-foreground text-sm">
                            {organization.locations[0]?.address?.geographicArea}, {organization.locations[0]?.address?.country}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Updates */}
                <div className="border rounded-lg p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-primary">Recent Updates</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleViewOnLinkedIn}
                    >
                      View All Posts
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {posts.map((post) => (
                      <div key={post.id} className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-lg">
                        <div className="flex items-start">
                          <div className="bg-blue-100 p-2 rounded-full mr-3">
                            <Linkedin className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-primary">{post.author}</h4>
                            <p className="text-muted-foreground text-sm">{post.authorTitle}</p>
                            <p className="text-muted-foreground mt-2">{post.content}</p>
                            {post.imageUrl && (
                              <img 
                                src={post.imageUrl} 
                                alt="Post content" 
                                className="mt-3 rounded-lg w-full max-w-md"
                              />
                            )}
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span>{formatTimestamp(post.timestamp)}</span>
                              <span>{post.likes} Likes</span>
                              <span>{post.comments} Comments</span>
                              <span>{post.shares} Shares</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Follow Section */}
                <div className="border rounded-lg p-6 bg-blue-50">
                  <div className="text-center">
                    <Linkedin className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-primary mb-2">Stay Connected</h3>
                    <p className="text-muted-foreground mb-4 max-w-2xl mx-auto">
                      Follow our LinkedIn page to receive updates directly in your feed and never miss important news and achievements.
                    </p>
                    <Button 
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleViewOnLinkedIn}
                    >
                      <Linkedin className="mr-2 h-5 w-5" />
                      Follow on LinkedIn
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LinkedIn;