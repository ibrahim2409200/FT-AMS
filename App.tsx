import React, { useEffect, useRef, useState } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { Provider, useSelector } from 'react-redux';
import { RootState, store } from './src/redux/store';
import AppNavigator from './src/navigation/AppNavigator';
import { initBackgroundFetch } from './src/utils/backgroundTask';
import { requestLocationPermission } from './src/utils/permission';
import OneSignal from 'react-native-onesignal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { loginAsync, logout, updateNSUserInfo } from './src/redux/slices/authSlice';
import { updateNSUserInfoInStorage,removeUserData } from './src/utils/updateUserStorage';
import { debugLog } from './src/utils/logger';
import NetInfo from '@react-native-community/netinfo';

const SOCKET_URL = 'http://182.184.70.16:3003';

const App = () => {
  const socketRef = useRef<Socket | null>(null);
  const [socketStatus,setSocketStatus] = useState('disconnected')


  // ✅ Auto-login logic on app cold start
  useEffect(() => {
    // const autoLoginIfUserExists = async () => {
    //   try {
    //     const storedUser = await AsyncStorage.getItem('user');
    //     const deviceId = await AsyncStorage.getItem('deviceId');
    //     console.log(storedUser,":::::app.tsx");
        
    //     if (storedUser && deviceId) {
    //       console.log('🔑 Stored user found, trying auto-login...');
    //       try {
    //         await store.dispatch(loginAsync(deviceId)).unwrap();
    //         console.log('✅ Auto-login success');
    //       } catch (err) {
    //         Alert.alert('Error', 'Device ID is required.');
    //         store.dispatch(logout());
    //         console.log('❌ Auto-login failed:', err);
    //         await AsyncStorage.removeItem('user');
    //         console.log('cleared Auto-login failed:');
    //       }
    //     } else {
    //       console.log('⚠️ No stored user, skipping auto-login.');
    //     }
    //   } catch (err) {
    //     console.log('❌ Auto-login error:', err);
    //   }
    // };

    // autoLoginIfUserExists();
  }, []);

  useEffect(() => {
    // ✅ Initialize OneSignal
    OneSignal.setAppId('8a14c7d8-4d93-4c92-9af3-8cb19f93fdd7');
    OneSignal.setLogLevel(6, 0);

    OneSignal.promptForPushNotificationsWithUserResponse(response => {
      console.log('Prompt response:', response);
    });

    OneSignal.setNotificationOpenedHandler(notification => {
      console.log('Notification opened:', notification);
    });

    const requestPermissions = async () => {
      const granted = await requestLocationPermission();
      if (granted) {
        await initBackgroundFetch();
      }
    };

    requestPermissions();

      const connectSocket = async () => {
      try {
        const deviceId = await AsyncStorage.getItem('deviceId');
        console.log('🔍 [SOCKET] Device ID:', deviceId);

        if (socketRef.current) {
          console.log('🔄 [SOCKET] Disconnecting previous socket...');
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        console.log('🚀 [SOCKET] Creating new connection to:', SOCKET_URL);

        const socket = io(SOCKET_URL, {
          transports: ['websocket', 'polling'],
          query: {
            deviceId: deviceId ?? 'unknown',
            platform: 'ios',
            appVersion: '1.0.0'
          },
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          forceNew: true,
        });

        // ✅ Connection events with DETAILED LOGS
        socket.on('connect', () => {
          console.log(' [SOCKET] CONNECTED - ID:', socket.id);
          console.log('[SOCKET] Connected at:', new Date().toLocaleTimeString());
          debugLog('Socket connected:', socket.id);
          setSocketStatus('connected');
        });

        socket.on('disconnect', (reason) => {
          console.log(' [SOCKET] DISCONNECTED - Reason:', reason);
          console.log(' [SOCKET] Disconnected at:', new Date().toLocaleTimeString());
          debugLog('⚠️ Socket disconnected:', reason);
          setSocketStatus('disconnected');

          if (reason === 'io server disconnect') {
            console.log('🔄 [SOCKET] Server initiated disconnect, reconnecting...');
            setTimeout(() => {
              socket.connect();
            }, 2000);
          }
        });

        socket.on('reconnect', (attempt) => {
          console.log(' [SOCKET] RECONNECTED - Attempt:', attempt);
          console.log('[SOCKET] Reconnected at:', new Date().toLocaleTimeString());
          debugLog(' [SOCKET] Reconnected at:', new Date().toLocaleTimeString())
          setSocketStatus('reconnected');
        });

        socket.on('reconnect_attempt', (attempt) => {
          console.log('[SOCKET] Reconnect attempt:', attempt, 'at:', new Date().toLocaleTimeString());
        });

        socket.on('reconnecting', (attempt) => {
          console.log(' [SOCKET] Reconnecting... Attempt:', attempt);
        });

        // ✅ Error events with DETAILED LOGS
        socket.on('connect_error', (error) => {
          console.log('❌ [SOCKET] CONNECT ERROR:', error);
          console.log('❌ [SOCKET] Connect error at:', new Date().toLocaleTimeString());
          debugLog('❌ Socket connect error:', error?.message || error);
          setSocketStatus('error');
        });

        socket.on('connect_timeout', () => {
          console.log('⏳⏳⏳ [SOCKET] CONNECT TIMEOUT at:', new Date().toLocaleTimeString());
          debugLog('⏳ Socket connect timeout');
          setSocketStatus('timeout');
        });

        socket.on('error', (error) => {
          console.log('🚨 [SOCKET] GENERAL ERROR:', error, 'at:', new Date().toLocaleTimeString());
          debugLog('🚨 Socket general error:', error);
          setSocketStatus('error');
        });

        socket.on('reconnect_error', (error) => {
          console.log(' [SOCKET] Reconnect error:', error, 'at:', new Date().toLocaleTimeString());
          debugLog(' Reconnect error:', error);
        });

        socket.on('reconnect_failed', () => {
          console.log('❌ [SOCKET] RECONNECT FAILED at:', new Date().toLocaleTimeString());
          debugLog('❌ Reconnect failed');
          setSocketStatus('failed');
        });

        // ✅ Employee Info Event with DETAILED LOGS
        socket.on(`employeeInfo_${deviceId}`, async (data: { message: any }) => {
          console.log('📢 [SOCKET] EMPLOYEE INFO RECEIVED at:', new Date().toLocaleTimeString());
          console.log('📢 [SOCKET] Employee data:', JSON.stringify(data, null, 2));
          debugLog('📢 [SOCKET] Employee data:', JSON.stringify(data, null, 2))


          if (data && data.message) {
            console.log('🔄 [SOCKET] Dispatching to Redux store...');
            store.dispatch(updateNSUserInfo(data.message));
            await updateNSUserInfoInStorage(data.message);
            console.log('💾 [SOCKET] Data saved to storage');
          } else {
            console.log('❌ [SOCKET] Invalid employeeInfo data received');
          }
        });

        socket.on(`employeeDelete_${deviceId}`, async (data: { message: any }) => {
          console.log('📢 [SOCKET] EMPLOYEE DELETE RECEIVED at:', new Date().toLocaleTimeString());
          console.log('📢 [SOCKET] Employee data:', JSON.stringify(data, null, 2));
          debugLog('📢 [SOCKET] Employee data:', JSON.stringify(data, null, 2));
          const success = await removeUserData();

          if (success) {
            // ✅ Redux store se bhi logout karo
            store.dispatch(logout());
            debugLog("cache clearedd")

            // ✅ User ko alert dikhao
            Alert.alert(
              'Account Deleted',
              'Your account has been deleted by administrator. Please contact support if this is a mistake.',
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Error',
              'Failed to remove account data. Please restart the app.',
              [{ text: 'OK' }]
            );
          }
        });

        // ✅ Listen for ANY event (debugging ke liye)
        socket.onAny((eventName, ...args) => {
          console.log(`🎯 [SOCKET] ANY EVENT: ${eventName}`, args);
        });

        // ✅ Periodic connection status logger
        const statusInterval = setInterval(() => {
          const status = socket.connected ? 'CONNECTED' : 'DISCONNECTED';
          console.log('📡 [SOCKET] Status Check:', status, '| ID:', socket.id, '| Time:', new Date().toLocaleTimeString());
        }, 15000); // Every 15 seconds

        socketRef.current = socket;

        console.log('[SOCKET] Setup completed at:', new Date().toLocaleTimeString());

        // Cleanup interval on unmount
        return () => {
          console.log('[SOCKET] Cleaning up status interval');
          clearInterval(statusInterval);
        };

      } catch (error) {
        console.log('[SOCKET] SETUP ERROR:', error);
      }
    };

    connectSocket();

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('📱 [APP] State Changed:', nextAppState, 'at:', new Date().toLocaleTimeString());

      if (nextAppState === 'active') {
        console.log('🔄 [APP] Became active, checking socket connection...');
        if (socketRef.current) {
          const isConnected = socketRef.current.connected;
          console.log('🔌 [APP] Socket connection status:', isConnected ? 'CONNECTED' : 'DISCONNECTED');

          if (!isConnected) {
            console.log('🔄 [APP] Attempting to reconnect socket...');
            socketRef.current.connect();
          }
        } else {
          console.log('❌ [APP] No socket reference found');
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      console.log('🧹🧹🧹 [APP] Cleaning up at:', new Date().toLocaleTimeString());
      debugLog('🧹🧹🧹 [APP] Cleaning up at:', new Date().toLocaleTimeString());
      subscription.remove();
      if (socketRef.current) {
        console.log('🔌 [APP] Disconnecting socket...');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };

    // const connectSocket = async () => {
    //   const deviceId = await AsyncStorage.getItem('deviceId');

    //   // Disconnect previous socket if exists
    //   if (socketRef.current) {
    //     socketRef.current.disconnect();
    //   }

    //   const socket = io(SOCKET_URL, {
    //     transports: ['websocket'],
    //     query: { deviceId: deviceId ?? 'unknown' },
    //     reconnection: true,
    //     reconnectionAttempts: Infinity, // infinite retries
    //     reconnectionDelay: 2000,
    //     timeout: 20000,
    //   });

    //   // ✅ Connection events
    //   socket.on('connect', () => {
    //     console.log('✅ Socket connected:', socket.id);
    //   });

    //   socket.on('disconnect', reason => {
    //     console.log('⚠️ Socket disconnected:', reason);
    //     if (socket.disconnected) {
    //       socket.connect();
    //     }
    //   });

    //   socket.on('reconnect_attempt', attempt => {
    //     console.log('🔄 Reconnect attempt:', attempt);
    //   });

    //   socket.on('reconnect_failed', () => {
    //     console.log('❌ Reconnect failed. Retrying...');
    //     setTimeout(() => socket.connect(), 2000);
    //   });

    //   // ✅ Error events for better debugging
    //   socket.on('connect_error', error => {
    //     console.log('❌ Socket connect error:', error);
    //   });

    //   socket.on('connect_timeout', () => {
    //     console.log('⏳ Socket connect timeout');
    //   });

    //   socket.on('error', error => {
    //     console.log('🚨 Socket general error:', error);
    //   });

    //   socket.on('reconnect_error', error => {
    //     console.log('⚠️ Reconnect error:', error);
    //   });

    //   // ✅ Employee Info Event
    //   socket.on('employeeInfo', async (data: { message: any }) => {
    //     console.log('📢 employeeInfo received:', data);
    //     store.dispatch(updateNSUserInfo(data.message));
    //     await updateNSUserInfoInStorage(data.message);
    //   });

    //   socket.on('employeeDelete', async (data: { message: any }) => {
    //     console.log('⚠️ employeeDel received:', data);
    //     store.dispatch(logout());
    //     await AsyncStorage.removeItem('user');
    //   });

      

    //   socketRef.current = socket;
    // };

    // connectSocket();

    // // ✅ App Resume Handling
    // const handleAppStateChange = (nextAppState: AppStateStatus) => {
    //   if (nextAppState === 'active' && socketRef.current && !socketRef.current.connected) {
    //     console.log('🔄 App resumed. Reconnecting socket...');
    //     socketRef.current.connect();
    //   }
    // };

    // const subscription = AppState.addEventListener('change', handleAppStateChange);

    // // ✅ Network Change Listener
    // const unsubscribeNetInfo = NetInfo.addEventListener(state => {
    //   if (state.isConnected && socketRef.current && !socketRef.current.connected) {
    //     console.log('🌐 Network restored. Reconnecting socket...');
    //     socketRef.current.connect();
    //   }
    // });

    // return () => {
    //   subscription.remove();
    //   unsubscribeNetInfo();
    //   if (socketRef.current) {
    //     socketRef.current.disconnect();
    //   }
    // };
  }, []);

  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
};

export default App;
