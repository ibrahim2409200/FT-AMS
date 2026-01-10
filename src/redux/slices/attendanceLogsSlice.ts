import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import api from '../../utils/api';

interface AttendanceLogObj {
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  shiftHours: string | null;
  status: string | 'In' | 'Out';
}

// API full response type (for thunk)
interface AttendanceLogResponse {
  attendanceLogs: AttendanceLogObj[];
  status: string;
  message: string;
}

// Redux state type
interface AttendanceLogsState {
  attendanceLogs: AttendanceLogObj[]; // ✅ Only store logs here
  apiStatus: string | null;
  apiMessage: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// Initial state
const initialState: AttendanceLogsState = {
  attendanceLogs: [],
  apiStatus: null,
  apiMessage: null,
  status: 'idle',
  error: null,
};

// Async thunk to fetch logs
export const fetchAttendanceLogs = createAsyncThunk(
  'attendanceLogs/fetchLogs',
  async (
    payload: { fromDate: string; toDate: string; employeeId: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post('attendance/attendance-logs', payload);
      return response.data.data as AttendanceLogResponse;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch logs');
    }
  }
);

// Slice
const attendanceLogsSlice = createSlice({
  name: 'attendanceLogs',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceLogs.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(
        fetchAttendanceLogs.fulfilled,
        (state, action: PayloadAction<AttendanceLogResponse>) => {
          state.attendanceLogs = action.payload.attendanceLogs;
          state.apiStatus = action.payload.status;
          state.apiMessage = action.payload.message;
          state.status = 'succeeded';
        }
      )
      .addCase(fetchAttendanceLogs.rejected, (state, action: PayloadAction<any>) => {
        state.status = 'failed';
        state.error = typeof action.payload === 'string' ? action.payload : 'Error';
      });
  },
});

export default attendanceLogsSlice.reducer;
