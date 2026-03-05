import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import attendanceLogsReducer from './slices/attendanceLogsSlice';


export const store = configureStore({
  reducer: {
    auth: authReducer,
    attendanceLogs: attendanceLogsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

