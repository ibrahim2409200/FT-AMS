import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import api from '../../utils/api';

// Define the type for the state
interface AttendanceState {
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Async action for clock-in
export const clockIn = createAsyncThunk(
  'attendance/clockIn',
  async (payload: any, {rejectWithValue}) => {
    try {
      const timeRes = await api.get('employee/get-datetime');
      const serverTime = timeRes?.data?.data?.data?.datetime;
      
      let finalPayload;

      if (serverTime) {
        finalPayload = {...payload, time: serverTime, date: serverTime};
        
      } else {
        finalPayload = payload;
        
      }

      const response = await api.post(
        'attendance/mark-attendance',
        finalPayload,
      );
      console.log(finalPayload,"final payload");
      
      return response.data;
    } catch (error: any) {
      console.log(error);

      return rejectWithValue(
        error.response?.data?.message || 'Attendance failed',
      );
    }
  },
);

export const missedAttendance = createAsyncThunk(
  'attendance/clockIn',
  async (payload: any, {rejectWithValue}) => {
    try {
      console.log(payload);
      
      const response = await api.post(
        'attendance/mark-missed-attendance',
        payload,
      );
      return response.data;
    } catch (error: any) {
      console.log(error);

      return rejectWithValue(
        error.response?.data?.message || 'Attendance failed',
      );
    }
  },
);

// Initial state with defined types
const initialState: AttendanceState = {
  status: 'idle',
  error: null,
};

// Slice for attendance
const attendanceSlice = createSlice({
  name: 'attendance',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(clockIn.pending, state => {
        state.status = 'loading';
        state.error = null; // Reset the error when starting a new request
      })
      .addCase(clockIn.fulfilled, state => {
        state.status = 'succeeded';
        state.error = null; // Clear error on success
      })
      .addCase(clockIn.rejected, (state, action: PayloadAction<unknown>) => {
        state.status = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'An error occurred'; // Assign the error message
      })
      .addCase(missedAttendance.pending, state => {
        state.status = 'loading';
        state.error = null; // Reset the error when starting a new request
      })
      .addCase(missedAttendance.fulfilled, state => {
        state.status = 'succeeded';
        state.error = null; // Clear error on success
      })
      .addCase(missedAttendance.rejected, (state, action: PayloadAction<unknown>) => {
        state.status = 'failed';
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'An error occurred'; // Assign the error message
      });
  },
});

export default attendanceSlice.reducer;

