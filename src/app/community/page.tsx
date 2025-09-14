'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share, Plus, Search, Filter } from 'lucide-react';
import PageTransition from '@/components/shared/pageTransition';
import Button from '@/components/shared/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { fadeInUp, staggerContainer } from '@/lib/animations';

export default function CommunityPage() {
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&w=150&q=80',
      timestamp: '2 hours ago',
      content: 'Great community meeting today! Thank you everyone for participating in the discussion about the new playground equipment. Looking forward to seeing it installed next month! 🎉',
      likes: 12,
      comments: 5,
      isLiked: false,
    },
    {
      id: 2,
      author: 'Michael Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&w=150&q=80',
      timestamp: '5 hours ago',
      content: 'Reminder: Swimming pool will be closed for maintenance tomorrow from 9 AM to 2 PM. Thank you for your understanding!',
      likes: 8,
      comments: 3,
      isLiked: true,
    },
    {
      id: 3,
      author: 'Emily Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&w=150&q=80',
      timestamp: '1 day ago',
      content: 'Lost cat found near building C! Orange tabby with white paws. Very friendly. Please contact me if this is your pet. 🐱',
      likes: 25,
      comments: 8,
      isLiked: false,
    },
  ]);

  const [newPost, setNewPost] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const handleNewPost = () => {
    if (newPost.trim()) {
      const post = {
        id: posts.length + 1,
        author: 'You',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=150&q=80',
        timestamp: 'Just now',
        content: newPost,
        likes: 0,
        comments: 0,
        isLiked: false,
      };
      setPosts([post, ...posts]);
      setNewPost('');
      setShowNewPost(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen cream-gradient py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-6"
          >
            {/* Header */}
            <motion.div variants={fadeInUp} className="text-center">
              <h1 className="text-4xl font-bold text-dark-green-800 mb-4">
                Community Feed
              </h1>
              <p className="text-dark-green-600 text-lg">
                Stay connected with your neighbors and community updates
              </p>
            </motion.div>

            {/* Search and Actions */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-green-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search posts..."
                  className="pl-11"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
                <Button onClick={() => setShowNewPost(!showNewPost)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Post
                </Button>
              </div>
            </motion.div>

            {/* New Post Form */}
            <AnimatePresence>
              {showNewPost && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <div className="space-y-4">
                      <textarea
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        placeholder="What's on your mind?"
                        className="w-full p-4 border border-cream-300 rounded-lg resize-none focus:ring-2 focus:ring-dark-green-500 focus:border-transparent"
                        rows={4}
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => setShowNewPost(false)}
                        >
                          Cancel
                        </Button>
                        <Button onClick={handleNewPost}>
                          Post
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Posts Feed */}
            <motion.div variants={staggerContainer} className="space-y-6">
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  variants={fadeInUp}
                  layout
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card hover>
                    {/* Post Header */}
                    <div className="flex items-center space-x-4 mb-4">
                      <img
                        src={post.avatar}
                        alt={post.author}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-dark-green-800">
                          {post.author}
                        </h3>
                        <p className="text-dark-green-600 text-sm">
                          {post.timestamp}
                        </p>
                      </div>
                    </div>

                    {/* Post Content */}
                    <div className="mb-6">
                      <p className="text-dark-green-700 leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    {/* Post Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-cream-200">
                      <div className="flex space-x-6">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-2 transition-colors ${
                            post.isLiked 
                              ? 'text-red-600' 
                              : 'text-dark-green-600 hover:text-red-600'
                          }`}
                        >
                          <Heart 
                            className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} 
                          />
                          <span className="text-sm font-medium">{post.likes}</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center space-x-2 text-dark-green-600 hover:text-dark-green-800 transition-colors"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">{post.comments}</span>
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center space-x-2 text-dark-green-600 hover:text-dark-green-800 transition-colors"
                        >
                          <Share className="w-5 h-5" />
                          <span className="text-sm font-medium">Share</span>
                        </motion.button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Load More */}
            <motion.div 
              variants={fadeInUp}
              className="text-center pt-8"
            >
              <Button variant="outline" size="lg">
                Load More Posts
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}