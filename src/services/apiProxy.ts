// API Proxy Service
// This service acts as a proxy between the frontend and external APIs like LinkedIn
// It helps to keep API keys secure and handle CORS issues

// In a real implementation, this would be a separate backend service
// For demonstration purposes, we'll simulate the proxy behavior

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

// Simulate fetching LinkedIn organization data through a proxy
export const fetchLinkedInOrganizationProxy = async (): Promise<LinkedInOrganization> => {
  try {
    // In a real implementation, this would call your backend proxy:
    // const response = await fetch('/api/linkedin/organization');
    // const data = await response.json();
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return mock data for demonstration
    return {
      id: "5050062a6",
      name: "Centurion University andhra pradesh",
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
  } catch (error) {
    console.error("Error fetching LinkedIn organization through proxy:", error);
    throw new Error("Failed to fetch LinkedIn organization");
  }
};

// Simulate fetching LinkedIn posts through a proxy
export const fetchLinkedInPostsProxy = async (count: number = 10): Promise<LinkedInPost[]> => {
  try {
    // In a real implementation, this would call your backend proxy:
    // const response = await fetch(`/api/linkedin/posts?count=${count}`);
    // const data = await response.json();
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Return mock data for demonstration, sorted by timestamp (newest first)
    return [
      {
        id: "1",
        author: "Centurion University andhra pradesh",
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
        author: "Centurion University andhra pradesh",
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
        author: "Centurion University andhra pradesh",
        authorTitle: "Educational Institution",
        content: "Join us for our upcoming Industry-Academia Conclave on October 15th. Leading experts from various fields will share insights on the future of education and technology.",
        timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
        likes: 210,
        comments: 34,
        shares: 22
      },
      {
        id: "4",
        author: "Centurion University andhra pradesh",
        authorTitle: "Educational Institution",
        content: "Congratulations to our alumni who were featured in the latest issue of Education Today magazine for their outstanding contributions to their respective fields!",
        timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
        likes: 156,
        comments: 22,
        shares: 18
      },
      {
        id: "5",
        author: "Centurion University andhra pradesh",
        authorTitle: "Educational Institution",
        content: "Our research team has published a groundbreaking paper on sustainable energy solutions in the International Journal of Renewable Energy. Read the full article at the link below.",
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        likes: 98,
        comments: 15,
        shares: 9,
        imageUrl: "https://placehold.co/600x300"
      }
    ].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error("Error fetching LinkedIn posts through proxy:", error);
    throw new Error("Failed to fetch LinkedIn posts");
  }
};

// Simulate LinkedIn authentication through a proxy
export const authenticateLinkedInProxy = async (): Promise<string> => {
  try {
    // In a real implementation, this would call your backend proxy:
    // const response = await fetch('/api/linkedin/auth', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     clientId: '86myb1r7p7k5b9',
    //     clientSecret: process.env.LINKEDIN_CLIENT_SECRET || ''
    //   })
    // });
    // const data = await response.json();
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock token for demonstration
    return "mock_linkedin_access_token_12345";
  } catch (error) {
    console.error("Error authenticating with LinkedIn through proxy:", error);
    throw new Error("Failed to authenticate with LinkedIn");
  }
};