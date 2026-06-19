"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Youtube, ArrowLeft, Play } from "lucide-react";
import { useRouter } from 'next/navigation';

interface NewsNavigationProps {
  currentPage: 'news' | 'youtube';
  className?: string;
}

const NewsNavigation = ({ currentPage, className = "" }: NewsNavigationProps) => {
  const router = useRouter();

  return (
    <div className={`flex items-center justify-between mb-6 ${className}`}>
      <div className="flex items-center">
        <div className="inline-flex items-center justify-center w-10 h-10 bg-red-500 rounded-full mr-3">
          <Youtube className="h-5 w-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-primary">
          {currentPage === 'news' ? 'News Corner' : 'CUTMAP YouTube Channel'}
        </h1>
      </div>
      
      {currentPage === 'youtube' ? (
        <Button 
          onClick={() => router.push("/news")} 
          variant="outline" 
          className="border-2 border-transparent hover:border-primary"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to News
        </Button>
      ) : (
        <Button 
          onClick={() => router.push("/youtube")} 
          className="bg-red-600 hover:bg-red-700 text-white border-2 border-transparent hover:border-red-700"
        >
          <Play className="h-4 w-4 mr-2" />
          Explore YouTube
        </Button>
      )}
    </div>
  );
};

export default NewsNavigation;