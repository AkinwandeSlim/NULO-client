'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Calendar, 
  User, 
  Clock, 
  ChevronRight, 
  Home, 
  TrendingUp, 
  Shield, 
  CreditCard, 
  MapPin, 
  Users, 
  Building,
  Key,
  BookOpen,
  Lightbulb,
  AlertCircle,
  Star,
  Heart,
  MessageSquare,
  Share2,
  Bookmark
} from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorAvatar: string;
  publishDate: string;
  readTime: string;
  category: string;
  tags: string[];
  featured: boolean;
  image: string;
  views: number;
  likes: number;
  comments: number;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: "Complete Guide to Renting in Lagos: 2024 Edition",
    excerpt: "Everything you need to know about finding the perfect rental property in Lagos. From neighborhood guides to negotiation tips, we've got you covered.",
    content: "Finding the perfect rental property in Lagos can be overwhelming, but with the right knowledge and preparation, you can navigate the market successfully...",
    author: "Tunde Adebayo",
    authorAvatar: "/avatars/tunde.jpg",
    publishDate: "2024-03-15",
    readTime: "8 min read",
    category: "Renting Guide",
    tags: ["Lagos", "Renting", "First-time", "Negotiation"],
    featured: true,
    image: "/blog/lagos-renting-guide.jpg",
    views: 15420,
    likes: 342,
    comments: 28
  },
  {
    id: '2',
    title: "10 Red Flags to Watch for When Renting a Property",
    excerpt: "Don't get caught in rental scams. Learn the warning signs that should make you think twice before signing any lease agreement.",
    content: "The rental market can be tricky, and knowing what to look for can save you from costly mistakes and potential scams...",
    author: "Amara Okonkwo",
    authorAvatar: "/avatars/Amara.jpg",
    publishDate: "2024-03-12",
    readTime: "6 min read",
    category: "Safety Tips",
    tags: ["Safety", "Scams", "Due Diligence", "Legal"],
    featured: true,
    image: "/blog/rental-red-flags.jpg",
    views: 12350,
    likes: 289,
    comments: 45
  },
  {
    id: '3',
    title: "Landlord's Guide: How to Find Reliable Tenants",
    excerpt: "Finding good tenants is crucial for successful property management. Learn proven strategies to attract and screen the best renters for your property.",
    content: "As a landlord, finding reliable tenants can make the difference between a profitable investment and a stressful experience...",
    author: "Chidi Nwosu",
    authorAvatar: "/avatars/chidi.jpg",
    publishDate: "2024-03-10",
    readTime: "7 min read",
    category: "Landlord Tips",
    tags: ["Landlord", "Screening", "Property Management", "Tenants"],
    featured: false,
    image: "/blog/landlord-tenant-guide.jpg",
    views: 8930,
    likes: 167,
    comments: 22
  },
  {
    id: '4',
    title: "Understanding Rental Agreements in Nigeria",
    excerpt: "A comprehensive breakdown of Nigerian rental laws and what you should know before signing any tenancy agreement.",
    content: "Rental agreements in Nigeria come with specific legal requirements that both tenants and landlords need to understand...",
    author: "Funke Adeyemi",
    authorAvatar: "/avatars/funke.jpg",
    publishDate: "2024-03-08",
    readTime: "10 min read",
    category: "Legal Guide",
    tags: ["Legal", "Agreement", "Nigeria", "Rights"],
    featured: false,
    image: "/blog/rental-agreements.jpg",
    views: 11200,
    likes: 234,
    comments: 31
  },
  {
    id: '5',
    title: "Best Neighborhoods for Young Professionals in Abuja",
    excerpt: "Discover the most sought-after neighborhoods in Abuja that offer the perfect balance of affordability, amenities, and lifestyle for young professionals.",
    content: "Abuja offers diverse neighborhoods catering to different lifestyles and budgets. Here's our comprehensive guide...",
    author: "Muhammad Sani",
    authorAvatar: "/avatars/muhammad.jpg",
    publishDate: "2024-03-05",
    readTime: "6 min read",
    category: "Neighborhood Guides",
    tags: ["Abuja", "Neighborhoods", "Young Professionals", "Lifestyle"],
    featured: false,
    image: "/blog/abuja-neighborhoods.jpg",
    views: 9870,
    likes: 198,
    comments: 19
  },
  {
    id: '6',
    title: "How to Negotiate Rent Like a Pro",
    excerpt: "Master the art of rent negotiation with these proven strategies that can help you save thousands on your annual rent.",
    content: "Negotiating rent isn't just about asking for a discount. It's about understanding the market, timing your approach, and presenting yourself as the ideal tenant...",
    author: "Tunde Adebayo",
    authorAvatar: "/avatars/tunde.jpg",
    publishDate: "2024-03-03",
    readTime: "5 min read",
    category: "Money Tips",
    tags: ["Negotiation", "Saving Money", "Rent", "Strategy"],
    featured: false,
    image: "/blog/rent-negotiation.jpg",
    views: 14560,
    likes: 412,
    comments: 67
  },
  {
    id: '7',
    title: "Property Maintenance: Landlord vs Tenant Responsibilities",
    excerpt: "Clear guidelines on who's responsible for what when it comes to property maintenance and repairs in Nigerian rental properties.",
    content: "Understanding maintenance responsibilities can prevent conflicts between landlords and tenants. Here's what Nigerian law says...",
    author: "Chidi Nwosu",
    authorAvatar: "/avatars/chidi.jpg",
    publishDate: "2024-03-01",
    readTime: "8 min read",
    category: "Property Management",
    tags: ["Maintenance", "Responsibilities", "Repairs", "Legal"],
    featured: false,
    image: "/blog/property-maintenance.jpg",
    views: 7890,
    likes: 145,
    comments: 23
  },
  {
    id: '8',
    title: "Digital Tools Transforming Nigeria's Rental Market",
    excerpt: "How technology is making it easier to find, verify, and manage rental properties in Nigeria's major cities.",
    content: "The Nigerian rental market is undergoing a digital transformation. From virtual tours to online payments, technology is solving age-old problems...",
    author: "Amara Okonkwo",
    authorAvatar: "/avatars/Amara.jpg",
    publishDate: "2024-02-28",
    readTime: "6 min read",
    category: "Technology",
    tags: ["Technology", "Digital", "Innovation", "Market Trends"],
    featured: false,
    image: "/blog/digital-rental-tools.jpg",
    views: 6540,
    likes: 123,
    comments: 15
  }
];

const categories = [
  { name: "All Posts", icon: FileText, count: blogPosts.length },
  { name: "Renting Guide", icon: BookOpen, count: 1 },
  { name: "Safety Tips", icon: Shield, count: 1 },
  { name: "Landlord Tips", icon: Users, count: 2 },
  { name: "Legal Guide", icon: AlertCircle, count: 1 },
  { name: "Neighborhood Guides", icon: MapPin, count: 1 },
  { name: "Money Tips", icon: CreditCard, count: 1 },
  { name: "Property Management", icon: Building, count: 1 },
  { name: "Technology", icon: Lightbulb, count: 1 }
];

const popularTags = [
  "Lagos", "Renting", "Safety", "Landlord", "Negotiation", 
  "Legal", "Abuja", "First-time", "Technology", "Property Management"
];

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Posts');
  const [sortBy, setSortBy] = useState('latest');

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All Posts' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.views - a.views;
      case 'most_liked':
        return b.likes - a.likes;
      case 'most_commented':
        return b.comments - a.comments;
      default: // latest
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    }
  });

  const featuredPosts = sortedPosts.filter(post => post.featured);
  const regularPosts = sortedPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-600 via-orange-500 to-orange-400 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-6 text-orange-200" />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              NuloAfrica Blog
            </h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto mb-8">
              Expert guides, tips, and insights for navigating Nigeria's rental market
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles, topics, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-orange-600">{blogPosts.length}</div>
              <div className="text-gray-600">Articles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">15K+</div>
              <div className="text-gray-600">Monthly Readers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">50+</div>
              <div className="text-gray-600">Expert Contributors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">100K+</div>
              <div className="text-gray-600">Total Views</div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Categories */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {categories.map(category => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                        selectedCategory === category.name
                          ? 'bg-orange-100 text-orange-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center">
                        <Icon className="h-4 w-4 mr-2" />
                        <span className="text-sm">{category.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">{category.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Popular Tags */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">Popular Tags</h3>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSearchTerm(tag)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-orange-100 hover:text-orange-700 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-gradient-to-br from-orange-600 to-orange-500 rounded-lg p-6 text-white">
              <BookOpen className="h-8 w-8 mb-3 text-orange-200" />
              <h3 className="font-semibold mb-2">Stay Updated</h3>
              <p className="text-orange-100 text-sm mb-4">
                Get the latest rental tips and market insights delivered to your inbox
              </p>
              <input
                type="email"
                placeholder="Your email"
                className="w-full px-3 py-2 rounded text-gray-900 text-sm mb-3"
              />
              <button className="w-full bg-white text-orange-600 px-3 py-2 rounded font-semibold text-sm hover:bg-orange-50 transition-colors">
                Subscribe
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Sort Options */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCategory === 'All Posts' ? 'Latest Articles' : selectedCategory}
              </h2>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="latest">Latest</option>
                <option value="popular">Most Popular</option>
                <option value="most_liked">Most Liked</option>
                <option value="most_commented">Most Commented</option>
              </select>
            </div>

            {/* Featured Posts */}
            {featuredPosts.length > 0 && (
              <div className="mb-12">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Featured Articles</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {featuredPosts.map(post => (
                    <FeaturedPostCard key={post.id} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Regular Posts */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Articles</h3>
              {sortedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No articles found</h3>
                  <p className="text-gray-600">Try searching with different keywords or browse all categories.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {regularPosts.map(post => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Lightbulb className="h-16 w-16 text-orange-600 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Want to Contribute to Our Blog?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Share your expertise and help thousands of Nigerians navigate the rental market
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="inline-flex items-center px-8 py-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors">
              <FileText className="h-5 w-5 mr-2" />
              Submit Article
            </button>
            <Link 
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-white text-orange-600 border-2 border-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeaturedPostCard({ post }: { post: BlogPost }) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group cursor-pointer">
      <div className="relative h-48 bg-gradient-to-br from-orange-400 to-orange-600">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute bottom-4 left-4 text-white">
          <span className="inline-block px-3 py-1 bg-orange-600 rounded-full text-xs font-semibold mb-2">
            {post.category}
          </span>
          <h3 className="text-xl font-bold line-clamp-2">{post.title}</h3>
        </div>
      </div>
      <div className="p-6">
        <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Clock className="h-4 w-4 mr-1" />
              {post.readTime}
            </span>
            <span className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              {post.author}
            </span>
          </div>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}

function BlogPostCard({ post }: { post: BlogPost }) {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 group cursor-pointer">
      <div className="flex items-start space-x-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
              {post.category}
            </span>
            <span className="text-sm text-gray-500">{post.publishDate}</span>
            <span className="text-sm text-gray-500">•</span>
            <span className="text-sm text-gray-500">{post.readTime}</span>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
            {post.title}
          </h3>
          
          <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map(tag => (
              <button
                key={tag}
                className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-orange-100 hover:text-orange-600 transition-colors"
              >
                #{tag}
              </button>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <User className="h-4 w-4 mr-1" />
                {post.author}
              </span>
              <span className="flex items-center">
                <Star className="h-4 w-4 mr-1" />
                {post.likes}
              </span>
              <span className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-1" />
                {post.comments}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  );
}
