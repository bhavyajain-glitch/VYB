import { Platform, Alert } from 'react-native';

// ======= TOGGLE THIS FOR LOCAL TESTING =======
export const USE_LOCAL_API = false; // Set to true for local testing, false for production
// ==============================================

// API URLs
const LOCAL_API_URL = Platform.OS === 'android' 
  ? 'http://10.0.2.2:5000/api'    // Android Emulator
  : 'http://localhost:5000/api';  // iOS Simulator / Web

const PRODUCTION_API_URL = 'https://campusconnect-api-nx9k.onrender.com/api';

// Select API based on toggle
const API_URL = USE_LOCAL_API ? LOCAL_API_URL : PRODUCTION_API_URL;

const headers = {
  'Content-Type': 'application/json',
};

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // 2 seconds

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const request = async (endpoint: string, method: string, body?: any, retryCount = 0): Promise<any> => {
  try {
    const token = await require('@react-native-async-storage/async-storage').default.getItem('userToken');
    const authHeaders = { ...headers, Authorization: token ? `Bearer ${token}` : '' };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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
      console.error('API Response parsing failed:', text);
      throw new Error(`Server Error: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return { data }; 
  } catch (error: any) {
    console.error('API Error:', error);
    
    // Check if it's a network/timeout error and we can retry
    const isNetworkError = error.name === 'AbortError' || 
                           error.message?.includes('Network request failed') ||
                           error.message?.includes('fetch');
    
    if (isNetworkError && retryCount < MAX_RETRIES) {
      console.log(`Retrying request... Attempt ${retryCount + 2}/${MAX_RETRIES + 1}`);
      await sleep(RETRY_DELAY);
      return request(endpoint, method, body, retryCount + 1);
    }
    
    // Give user-friendly error message
    if (isNetworkError) {
      throw new Error('Server is starting up. Please wait a moment and try again.');
    }
    
    throw error;
  }
};

export const authAPI = {
  sendOtp: (phoneNumber: string) => request('/auth/send-otp', 'POST', { phoneNumber }),
  verifyOtp: (phoneNumber: string, otp: string) => request('/auth/verify-otp', 'POST', { phoneNumber, otp }),
  updateProfile: (data: any) => request('/users/profile', 'PATCH', data),
  getMe: () => request('/users/me', 'GET'),
  
  // Dating & Coins
  getRecommendations: () => request('/dating/recommendations', 'GET'),
  switchMatch: (userId: string) => request(`/dating/match/${userId}`, 'POST'),
  buyCoins: (amount: number) => request('/dating/buy-coins', 'POST', { amount }),

  // Posts
  getPosts: () => request('/posts', 'GET'),
  createPost: (data: any) => request('/posts', 'POST', data),
  getUserPosts: (userId: string) => request(`/posts/user/${userId}`, 'GET'),
  addComment: (postId: string, text: string) => request(`/posts/${postId}/comment`, 'POST', { text }),
  toggleLike: (postId: string) => request(`/posts/${postId}/like`, 'PUT'),
  getPost: (id: string) => request(`/posts/${id}`, 'GET'), // Need this too
  
  // User Utils
  checkUsername: (username: string) => request('/users/check-username', 'POST', { username }),
  searchUsers: (query: string) => request(`/users/search?q=${query}`, 'GET'),
  getUser: (id: string) => request(`/users/${id}`, 'GET'),
  followUser: (id: string) => request(`/users/${id}/follow`, 'POST'),

  // Chat
  sendMessage: (receiverId: string, text: string) => request('/chat/send', 'POST', { receiverId, text }),
  getMessages: (userId: string) => request(`/chat/${userId}`, 'GET'),
};

export default { request };
