import Constants from 'expo-constants';
import { Platform, Alert } from 'react-native';

// ======= AUTOMATIC API SELECTION =======
// Automatically uses local API in development, and Render for Production/APK
export const USE_LOCAL_API = __DEV__;
// ==============================================

// Helper to get local IP for development
const getLocalIp = () => {
  // Constants.expoConfig.hostUri gives the IP:Port of the dev machine
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (!debuggerHost) return 'localhost';
  return debuggerHost.split(':')[0];
};

// API URLs
const LOCAL_API_URL = `http://${getLocalIp()}:5000/api`;

const PRODUCTION_API_URL = 'https://campusconnect-api-nx9k.onrender.com/api';

// Select API based on toggle
export const API_URL = USE_LOCAL_API ? LOCAL_API_URL : PRODUCTION_API_URL;

const headers = {
  'Content-Type': 'application/json',
};

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const request = async (endpoint: string, method: string, body?: any, retryCount = 0): Promise<any> => {
  try {
    // Get token from AsyncStorage, with localStorage fallback for web
    let token = await require('@react-native-async-storage/async-storage').default.getItem('userToken');

    // Fallback to localStorage on web if AsyncStorage returns null
    if (!token && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      token = localStorage.getItem('userToken');
    }

    const authHeaders = { ...headers, Authorization: token ? `Bearer ${token}` : '' };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn(`[API] Request timed out after 60s: ${method} ${endpoint}`);
      controller.abort();
    }, 60000); // 60 second timeout (increased for cold starts)

    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: authHeaders,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error(`[API] Response parsing failed for ${endpoint}:`, text);
      throw new Error(`Server Error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return { data };
  } catch (error: any) {
    // Determine if this was an actual timeout or just a generic abort
    const isTimeout = error.name === 'AbortError' && !error.message?.includes('user aborted');
    const isNetworkError = error.name === 'AbortError' ||
      error.message?.includes('Network request failed') ||
      error.message?.includes('fetch');

    console.error(`[API Error] ${method} ${endpoint}:`, {
      name: error.name,
      message: error.message,
      isTimeout,
      retryCount
    });

    if (isNetworkError && retryCount < MAX_RETRIES) {
      console.log(`[API] Retrying ${endpoint}... Attempt ${retryCount + 2}/${MAX_RETRIES + 1}`);
      await sleep(RETRY_DELAY);
      return request(endpoint, method, body, retryCount + 1);
    }

    // Give user-friendly error message
    if (isNetworkError) {
      const msg = isTimeout
        ? 'Request timed out. Please check your connection.'
        : 'Server is starting up or temporarily unavailable. Please try again.';
      throw new Error(msg);
    }

    throw error;
  }
};

export const authAPI = {
  sendOtp: (phoneNumber?: string, email?: string) => request('/auth/send-otp', 'POST', { phoneNumber, email }),
  verifyOtp: (phoneNumber?: string, email?: string, otp?: string) => request('/auth/verify-otp', 'POST', { phoneNumber, email, otp }),
  sendCollegeVerify: (email: string) => request('/auth/college-verify/send', 'POST', { email }),
  verifyCollegeEmail: (email: string, otp: string) => request('/auth/college-verify/verify', 'POST', { email, otp }),
  registerPushToken: (token: string) => request('/notifications/register', 'POST', { token }),
  getNotifications: (page = 1) => request(`/notifications?page=${page}`, 'GET'),
  updateProfile: (data: any) => request('/users/profile', 'PATCH', data),
  getMe: () => request('/users/me', 'GET'),
  deleteAccount: () => request('/users/profile', 'DELETE'),

  // Dating & Coins
  getRecommendations: () => request('/dating/recommendations', 'GET'),
  switchMatch: (userId: string) => request(`/dating/match/${userId}`, 'POST'),
  buyCoins: (amount: number) => request('/dating/buy-coins', 'POST', { amount }),
  createPaymentOrder: (amount: number, price: number, packType: string = 'coins') => request('/payment/create-order', 'POST', { amount, price, packType }),
  verifyPayment: (paymentData: any) => request('/payment/verify-payment', 'POST', paymentData),
  acceptDatingTerms: () => request('/dating/accept-terms', 'POST'),
  updateDatingProfile: (data: any) => request('/dating/profile', 'PATCH', data),
  getDatingProfile: () => request('/dating/profile', 'GET'),
  resetDatingProfile: () => request('/users/profile/reset-dating', 'POST'),

  // Likes System
  getLikesStatus: () => request('/likes/my-status', 'GET'),
  sendLike: (userId: string) => request(`/likes/like/${userId}`, 'POST'),
  getReceivedLikes: () => request('/likes/likes', 'GET'),
  revealProfile: (likeId: string) => request(`/likes/reveal/${likeId}`, 'POST'),
  startChatFromLike: (likeId: string) => request(`/likes/start-chat/${likeId}`, 'POST'),
  directChat: (likeId: string) => request(`/likes/direct-chat/${likeId}`, 'POST'),
  declineLike: (likeId: string) => request(`/likes/decline/${likeId}`, 'POST'),
  passUser: (userId: string) => request(`/likes/pass/${userId}`, 'POST'),
  buyLikes: () => request('/likes/buy-likes', 'POST'),
  buyChatSlot: () => request('/likes/buy-chat-slot', 'POST'),
  getActiveChats: () => request('/likes/active-chats', 'GET'),
  unmatchUser: (likeId: string) => request(`/likes/unmatch/${likeId}`, 'POST'),

  // Posts
  getPosts: (page: number = 1, limit: number = 10) => request(`/posts?page=${page}&limit=${limit}`, 'GET'),
  createPost: (data: any) => request('/posts', 'POST', data),
  getUserPosts: (userId: string) => request(`/posts/user/${userId}`, 'GET'),
  addComment: (postId: string, text: string) => request(`/posts/${postId}/comment`, 'POST', { text }),
  toggleLike: (postId: string) => request(`/posts/${postId}/like`, 'PUT'),
  getPost: (id: string) => request(`/posts/${id}`, 'GET'), // Need this too
  deletePost: (id: string) => request(`/posts/${id}`, 'DELETE'),

  // User Utils
  checkUsername: (username: string) => request('/users/check-username', 'POST', { username }),
  searchUsers: (query: string) => request(`/users/search?q=${query}`, 'GET'),
  getUser: (id: string) => request(`/users/${id}`, 'GET'),
  followUser: (id: string) => request(`/users/${id}/follow`, 'POST'),
  reportUser: (targetUserId: string, reason: string, details?: string) => request('/users/report', 'POST', { targetUserId, reason, details }),
  blockUser: (targetUserId: string) => request('/users/block', 'POST', { targetUserId }),
  unblockUser: (targetUserId: string) => request('/users/unblock', 'POST', { targetUserId }),
  getAllUsers: () => request('/users/admin/all', 'GET'),

  // Chat
  sendMessage: (receiverId: string, text: string) => request('/chat/send', 'POST', { receiverId, text }),
  getMessages: (userId: string) => request(`/chat/${userId}`, 'GET'),
  markMessagesRead: (userId: string) => request(`/chat/read/${userId}`, 'PUT'),
  deleteConversation: (userId: string) => request(`/chat/${userId}`, 'DELETE'),

  // Blind Dating
  joinBlindQueue: () => request('/blind/join', 'POST'),
  leaveBlindQueue: () => request('/blind/leave', 'POST'),
  getBlindStatus: () => request('/blind/status', 'GET'),
  sendBlindMessage: (sessionId: string, text: string) => request(`/blind/session/${sessionId}/message`, 'POST', { text }),
  getBlindMessages: (sessionId: string) => request(`/blind/session/${sessionId}/messages`, 'GET'),
  extendBlindSession: (sessionId: string) => request(`/blind/session/${sessionId}/extend`, 'POST'),
  recordBlindChoice: (sessionId: string, choice: string) => request(`/blind/session/${sessionId}/choice`, 'POST', { choice }),
  endBlindSession: (sessionId: string) => request(`/blind/session/${sessionId}/end`, 'POST'),

  // Upload (Cloudinary)
  uploadImage: (image: string, folder: string = 'campusconnect') => request('/upload', 'POST', { image, folder }),

  // Stories
  getStories: () => request('/stories', 'GET'),
  createStory: (image: string) => request('/stories', 'POST', { image }),
  viewStory: (id: string) => request(`/stories/${id}/view`, 'POST'),
  archiveStory: (id: string) => request(`/stories/${id}`, 'DELETE'),
  getArchivedStories: () => request('/stories/archive', 'GET'),
};

export default { request };
