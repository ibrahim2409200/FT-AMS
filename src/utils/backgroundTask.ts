// background.ts

import BackgroundFetch from 'react-native-background-fetch';
import Geolocation from 'react-native-geolocation-service';
import {PermissionsAndroid, Platform} from 'react-native';
import {RootState, store} from '../redux/store';
import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

const requestPermissions = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    ]);

    return (
      granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted' &&
      granted['android.permission.ACCESS_BACKGROUND_LOCATION'] === 'granted'
    );
  }

  return true; // iOS mein handle karlo agar zarurat ho
};

let logObj = {};

const sendLocationToAPI = async (coords: {
  latitude: number;
  longitude: number;
}) => {
  try {
    let user = store.getState().auth.user;
    const deviceId = await DeviceInfo.getAndroidId();
    
    const platform = DeviceInfo.getSystemName();
    const model = DeviceInfo.getModel();
    const manufacturer = DeviceInfo.getManufacturerSync();
    const version = DeviceInfo.getSystemVersion();

    if (!user) {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        user = JSON.parse(userStr);
      }
    }
    const empId = user?.nsUserInfo?.employeeId.toString() || '';
    console.log(user, ':::::::::::user ');

    // Build single location entry
    logObj = {
      date: new Date().toISOString(),
      time: new Date().toISOString(),
      type: 'Check In', // or 'Check Out' as needed
      employeeId: empId,
      devicePlatform: platform,
      model: model,
      manufacturer: manufacturer,
      version: version,
      deviceId: deviceId,
      longitude: coords.longitude.toString(),
      latitude: coords.latitude.toString(),
      reason: '',
      inRange: false,
    };

    // 1. Load existing unsynced logs
    const existing = await AsyncStorage.getItem('unsyncedLogs');
    const logs = existing ? JSON.parse(existing) : [];

    // 2. Push new log
    logs.push(logObj);

    // 3. Try sending ALL logs
    let payload = {
      records: logs,
    };

    console.log(
      payload,
      ':::::::::::::::::::::::payload::::::::::::::::',
      user?.access_token,
    );

    const response = await api.post(
      '/attendance/mark-attendance-timestamp',
      payload,
      {
        headers: {Authorization: `${user?.access_token}`},
      },
    );

    console.log('📡 Synced all logs:', response.data, new Date());

    // 4. Clear stored logs if successful
    await AsyncStorage.removeItem('unsyncedLogs');
  } catch (err: any) {
    console.log('⚠️ API call failed, saving log locally.', err);

    // If error occurs, store the log locally
    const existing = await AsyncStorage.getItem('unsyncedLogs');
    const logs = existing ? JSON.parse(existing) : [];
    logs.push({
      ...logObj,
      failedAt: new Date().toISOString(),
    });

    await AsyncStorage.setItem('unsyncedLogs', JSON.stringify(logs));
  }
};

export const backgroundFetchHandler = async () => {
  console.log('[📦 BackgroundFetch] Triggered');

  Geolocation.getCurrentPosition(
    async position => {
      console.log('✅ Location:', position.coords);
      await sendLocationToAPI(position.coords);
      console.log('done');
    },
    error => {
      console.log('❌ Location error:', error);
    },
    {
      enableHighAccuracy: true,
      forceRequestLocation: true,
    },
  );

  BackgroundFetch.finish();
};

export const initBackgroundFetch = async () => {
  const permissionGranted = await requestPermissions();
  if (!permissionGranted) {
    console.log('❌ Location permission not granted');
    return;
  }

  BackgroundFetch.configure(
    {
      minimumFetchInterval: 30, // minutes
      stopOnTerminate: false,
      startOnBoot: true,
      enableHeadless: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_ANY,
    },
    backgroundFetchHandler,
    error => {
      console.log(error);
    },
  );

  BackgroundFetch.start().then(() => {
    console.log('✅ BackgroundFetch started');
  });
};

// ✅ Headless Task Registration (for Android release mode)
BackgroundFetch.registerHeadlessTask(async event => {
  console.log('[📦 HeadlessTask] Event received in background.');
  await backgroundFetchHandler();
});

