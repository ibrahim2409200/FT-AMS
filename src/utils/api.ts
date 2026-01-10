import axios from 'axios';
import { store } from '../redux/store';
import { setUser, logoutUser } from '../redux/slices/authSlice'; // Make sure these exist
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://182.184.70.16:3003/api/v1/',
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Attach access token before request
api.interceptors.request.use(
  async (config) => {
    
    
    let token = store.getState().auth?.user?.access_token;
    if (!token) {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        let user = JSON.parse(userStr);
        token = user?.access_token;
      }
    }
    console.log("token check ",token );
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(Promise.reject);
      }

      isRefreshing = true;

      try {
        const refreshToken = store.getState().auth.user?.refresh_token;
        console.log(refreshToken,":::::::::::::ref token")
        const response = await axios.post(
          'http://182.184.70.16:3003/api/v1/refresh-token', // your refresh API
          { refreshToken }
        );

        const { access_token, refresh_token } = response.data;
        const currentUser = store.getState().auth.user;

        // Update redux with new tokens
        if (currentUser) {
          store.dispatch(setUser({
            ...currentUser,
            access_token,
            refresh_token
          }));
        }

        processQueue(null, access_token);
        originalRequest.headers['Authorization'] = 'Bearer ' + access_token;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        store.dispatch(logoutUser());
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;



