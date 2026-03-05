import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import api from '../../utils/api';

interface Location {
  geoFencing?: string;
  latitude: string;
  longitude: string;
  locationId: string;
  locationName: string;
}

interface NSUserInfo {
  employeeName: string;
  employeeId: string;
  latitude: any;
  longitude: any;
  refresh_token: string | null;
  location: Location[] | null;
  allowedAnywhere: Boolean | any;
}

interface User {
  id: number;
  employeeId: string;
  employeeName: string;
  latitude: any;
  longitude: any;
  access_token: string | null;
  nsUserInfo: NSUserInfo | null;
  refresh_token: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  loginError: string | null;
  signupError: string | null;
  signupSuccess?: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  loginError: null,
  signupError: null,
  signupSuccess: false,
};

// AsyncThunk: Login
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (id: string, {rejectWithValue}) => {
    try {
      const timeout = new Promise<any>((_, reject) =>
        setTimeout(() => reject(new Error('Server not responding')), 30000),
      );
      console.log('::::: id :::::', id);
      const response = await Promise.race([
        api.post('/employee/login', {deviceId: id}),
        timeout,
      ]);

      if (response.data) {
        console.log(':::: login data ::::', response.data);
        return response.data.data;
      } else {
        console.log('::::: error 1  :::::', response.data);

        return rejectWithValue(
          response.data.data.message || 'Server not responding',
        );
      }
    } catch (error: any) {
      console.log("::::: error :::::", error);
      
      return rejectWithValue(
        JSON.stringify(error.response?.data?.message) || 'Something went wrong',
      );
    }
  },
);

// AsyncThunk: Signup
export const signupAsync = createAsyncThunk(
  'auth/signup',
  async (
    data: {
      email: string;
      nsAccountId: string;
      password: string;
      deviceId: string;
      devicePlatform: string;
      model: string;
      manufacturer: string;
      version: string;
    },
    {rejectWithValue},
  ) => {
    try {
      const response = await api.post('/employee/signup', data);

      if (response) {
        return response.data;
      } else {
        return rejectWithValue(response || 'Signup failed');
      }
    } catch (error: any) {
      console.log('error', JSON.stringify(error.response?.data?.message));
      return rejectWithValue(
        JSON.stringify(error.response?.data?.message) || 'Something went wrong',
      );
    }
  },
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: state => {
      state.isAuthenticated = false;
      state.user = null;
    },
    loggedIn: (state, action: PayloadAction<User | null>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    resetSignupStatus: state => {
      state.signupSuccess = false;
      state.signupError = null;
    },
    clearLoginError: state => {
      state.loginError = null;
    },
    clearSignupError: state => {
      state.signupError = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    logoutUser: state => {
      state.isAuthenticated = false;
      state.user = null;
    },
    updateNSUserInfo: (state, action: PayloadAction<NSUserInfo>) => {
      if (state.user) {
        state.user.nsUserInfo = action.payload;
      }
    },
  },
  extraReducers: builder => {
    builder
      // Login
      .addCase(loginAsync.pending, state => {
        state.loading = true;
        state.loginError = null;
      })
      .addCase(loginAsync.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.loading = false;
        state.loginError = action.payload as string;
      })

      // Signup
      .addCase(signupAsync.pending, state => {
        state.loading = true;
        state.signupError = null;
        state.signupSuccess = false;
      })
      .addCase(signupAsync.fulfilled, state => {
        state.loading = false;
        state.signupSuccess = true;
      })
      .addCase(signupAsync.rejected, (state, action) => {
        state.loading = false;
        state.signupError = action.payload as string;
        state.signupSuccess = false;
      });
  },
});

export const {
  logout,
  loggedIn,
  resetSignupStatus,
  clearLoginError,
  clearSignupError,
  setUser,
  logoutUser,
  updateNSUserInfo
} = authSlice.actions;

export default authSlice.reducer;

