"use client"

/**
 * Blog Page — Articles & Guides
 * ------------------------------------------------------------------
 * Comprehensive blog page with categorized articles for NEST,
 * landlords, tenants, and general real estate topics.
 * ------------------------------------------------------------------
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"
import { 
  Search, 
  User, 
  Clock, 
  ChevronRight, 
  BookOpen,
  Lightbulb,
  FileText,
  Star,
  MessageSquare,
  Shield,
  Users,
  AlertCircle,
  MapPin,
  CreditCard,
  Building
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Footer } from "@/components/footer"

const CONTAINER = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8"
const EYEBROW = "text-[13px] font-medium uppercase tracking-[0.18em] text-orange-400"

const getCardClass = (theme: "dark" | "light") =>
  `rounded-2xl border ${theme === "dark" ? "border-white/[0.06] bg-[#0A0A0A]" : "border-slate-200/80 bg-white"}`
const getCardHoverClass = () =>
  "transition-all duration-300 hover:-translate-y-1 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/5"

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Posts");
  const [sortBy, setSortBy] = useState("latest");
  const { theme } = useTheme()

  useEffect(() => {
    document.body.classList.remove("has-navbar")
    document.body.style.paddingTop = "0"
    document.body.style.backgroundColor = theme === "dark" ? "#000000" : "#ffffff"
    return () => {
      document.body.classList.add("has-navbar")
      document.body.style.paddingTop = ""
      document.body.style.backgroundColor = ""
    }
  }, [theme])

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All Posts" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.views - a.views;
      case "most_liked":
        return b.likes - a.likes;
      case "most_commented":
        return b.comments - a.comments;
      default: // latest
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
    }
  });

  const featuredPosts = sortedPosts.filter(post => post.featured);
  const regularPosts = sortedPosts.filter(post => !post.featured);

  return (
    <div className={`flex min-h-screen flex-col font-sans antialiased ${theme === "dark" ? "text-white bg-black" : "text-slate-900 bg-white"}`}>
      <style jsx global>{`
        body {
          background-color: ${theme === "dark" ? "#000000" : "#ffffff"} !important;
        }
        .nulo-gradient-text {
          background: linear-gradient(135deg, #ea580c, #fb923c, #f97316);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          color: transparent;
        }
      `}</style>

      <main className="flex-1 pt-8">
        {/* Hero */}
        <section className={`relative py-20 sm:py-24 ${theme === "dark" ? "bg-gradient-to-b from-black to-[#0A0A0A]" : "bg-gradient-to-b from-white to-slate-50"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center max-w-3xl mx-auto"
            >
              <p className={cx(EYEBROW, "mb-4")}>Blog & Resources</p>
              <h1 className="text-[36px] sm:text-[44px] font-bold leading-tight mb-6 lg:text-[52px]">
                Expert Guides for <span className="nulo-gradient-text">African Real Estate</span>
              </h1>
              <p className={`text-[15px] sm:text-[16px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                Expert guides, tips, and insights for navigating Nigeria's rental market and building wealth through real estate.
              </p>

              {/* Search */}
              <div className="max-w-xl mx-auto relative mt-8">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`} />
                <input
                  type="text"
                  placeholder="Search articles, topics, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl text-[15px] transition-colors duration-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500/30 ${theme === "dark" ? "border-white/10 bg-black/50 text-white placeholder:text-white/25" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"}`}
                />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Categories */}
        <section className={`py-16 sm:py-20 ${theme === "dark" ? "bg-[#0A0A0A]" : "bg-white"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="text-center mb-12 sm:mb-16">
                <p className={cx(EYEBROW, "mb-3")}>Browse by Category</p>
                <h2 className="text-[28px] sm:text-[34px] font-bold leading-tight lg:text-[40px]">
                  Find What <span className="nulo-gradient-text">You Need</span>
                </h2>
              </div>

              <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
                {categories.map((category, index) => (
                  <motion.button
                    key={category.name}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                    onClick={() => setSelectedCategory(category.name)}
                    className={cx(
                      getCardClass(theme),
                      getCardHoverClass(),
                      "flex flex-col items-center gap-4 p-6 text-center",
                      selectedCategory === category.name && "border-orange-500/50"
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/25">
                      <category.icon className="h-6 w-6 text-orange-400" />
                    </div>
                    <div>
                      <h3 className={`mb-1 text-[17px] font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{category.name}</h3>
                      <p className={`text-[13px] ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{category.count} articles</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className={`py-16 sm:py-20 ${theme === "dark" ? "bg-gradient-to-b from-[#050505] to-[#0A0A0A]" : "bg-gradient-to-b from-slate-50 to-orange-50"}`}>
            <div className={cx(CONTAINER)}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <div className="text-center mb-12 sm:mb-16">
                  <p className={cx(EYEBROW, "mb-3")}>Featured</p>
                  <h2 className="text-[28px] sm:text-[34px] font-bold leading-tight lg:text-[40px]">
                    Top <span className="nulo-gradient-text">Articles</span>
                  </h2>
                </div>

                <div className="grid gap-6 sm:gap-8 md:grid-cols-2">
                  {featuredPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: index * 0.1, ease: "easeOut" }}
                      className={cx(getCardClass(theme), getCardHoverClass(), "overflow-hidden")}
                    >
                      <div className="relative h-48 bg-gradient-to-br from-orange-400 to-orange-600">
                        <div className="absolute inset-0 bg-black/20" />
                        <div className="absolute bottom-4 left-4 text-white">
                          <span className="inline-block px-3 py-1 bg-orange-600 rounded-full text-xs font-semibold mb-2">
                            {post.category}
                          </span>
                          <h3 className="text-xl font-bold line-clamp-2">{post.title}</h3>
                        </div>
                      </div>
                      <div className="p-6">
                        <p className={theme === "dark" ? "text-white/60 mb-4 line-clamp-2" : "text-slate-600 mb-4 line-clamp-2"}>{post.excerpt}</p>
                        <div className={`flex items-center justify-between text-sm ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
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
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* All Posts */}
        <section className={`py-16 sm:py-20 ${theme === "dark" ? "bg-[#0A0A0A]" : "bg-white"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <div className="flex justify-between items-center mb-12">
                <div>
                  <p className={cx(EYEBROW, "mb-3")}>All Articles</p>
                  <h2 className="text-[28px] sm:text-[34px] font-bold leading-tight lg:text-[40px]">
                    {selectedCategory === "All Posts" ? "Latest" : selectedCategory}
                  </h2>
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 ${theme === "dark" ? "bg-[#0A0A0A] border-white/10 text-white" : "border border-slate-200 bg-white text-slate-900"}`}
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Most Popular</option>
                  <option value="most_liked">Most Liked</option>
                  <option value="most_commented">Most Commented</option>
                </select>
              </div>

              {sortedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className={`h-16 w-16 mx-auto mb-4 ${theme === "dark" ? "text-white/20" : "text-slate-300"}`} />
                  <h3 className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>No articles found</h3>
                  <p className={theme === "dark" ? "text-white/60" : "text-slate-600"}>Try searching with different keywords or browse all categories.</p>
                </div>
              ) : (
                <div className="space-y-6 max-w-4xl mx-auto">
                  {regularPosts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
                      className={cx(getCardClass(theme), getCardHoverClass(), "p-6")}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="inline-block px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                              {post.category}
                            </span>
                            <span className={`text-sm ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{post.publishDate}</span>
                            <span className={`text-sm ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>•</span>
                            <span className={`text-sm ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{post.readTime}</span>
                          </div>
                          
                          <h3 className={`text-xl font-semibold mb-2 group-hover:text-orange-600 transition-colors ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                            {post.title}
                          </h3>
                          
                          <p className={theme === "dark" ? "text-white/60 mb-4 line-clamp-2" : "text-slate-600 mb-4 line-clamp-2"}>{post.excerpt}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-4">
                            {post.tags.slice(0, 3).map(tag => (
                              <button
                                key={tag}
                                onClick={() => setSearchTerm(tag)}
                                className={`px-2 py-1 rounded text-xs transition-colors ${theme === "dark" ? "bg-white/10 text-white/70 hover:bg-orange-500/20 hover:text-orange-400" : "bg-slate-100 text-slate-600 hover:bg-orange-100 hover:text-orange-600"}`}
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className={`flex items-center space-x-4 text-sm ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
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
                            <ChevronRight className={`h-4 w-4 ${theme === "dark" ? "text-white/30" : "text-slate-400"}`} />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className={`py-16 sm:py-20 ${theme === "dark" ? "bg-gradient-to-b from-[#050505] to-black" : "bg-gradient-to-b from-slate-50 to-white"}`}>
          <div className={cx(CONTAINER)}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              <h2 className="mb-4 text-[28px] sm:text-[34px] font-bold leading-tight lg:text-[40px]">
                Want to <span className="nulo-gradient-text">Contribute?</span>
              </h2>
              <p className={`mx-auto mb-8 max-w-2xl text-[14px] sm:text-[15px] leading-relaxed ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                Share your expertise and help thousands of Nigerians navigate the rental market and build wealth through real estate.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button className="rounded-lg border border-orange-500 bg-orange-500 text-black font-semibold transition-all duration-200 hover:bg-orange-400 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/25 px-8 py-4 text-[15px]">
                  Submit Article
                </Button>
                <Link href="/contact">
                  <Button className="rounded-lg border border-orange-500/70 bg-transparent text-orange-400 font-semibold transition-all duration-200 hover:bg-orange-500 hover:border-orange-500 hover:text-black px-8 py-4 text-[15px]">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
