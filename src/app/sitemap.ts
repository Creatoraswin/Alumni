import { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://alumni.sparvixainnovations.com/backend/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://alumni.sparvixainnovations.com'

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}`, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${baseUrl}/alumni-directory`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/alumni-spotlight`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/alumni-talks`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/alumni-meets`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/news`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/SignUp`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.5 },
  ]

  let dynamicRoutes: MetadataRoute.Sitemap = []
  
  try {
    const res = await fetch(`${API_URL}/students/index.php?showAll=true`)
    if (res.ok) {
      const responseData = await res.json()
      if (responseData.success && Array.isArray(responseData.data)) {
        const alumni = responseData.data.filter((s: any) => s.status === 'Approved')
        dynamicRoutes = alumni.map((student: any) => ({
          url: `${baseUrl}/alumni/${student.registration_no}`,
          lastModified: student.timestamp ? new Date(student.timestamp) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        }))
      }
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error)
  }

  return [...staticRoutes, ...dynamicRoutes]
}
