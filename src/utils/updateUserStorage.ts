// src/utils/updateUserStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debugLog } from './logger';

export const updateNSUserInfoInStorage = async (newInfo:  any ) => {
  try {
    const userJson = await AsyncStorage.getItem('user');

    if (userJson) {
      const user = JSON.parse(userJson);
      console.log("::::: user :::::", user);
      
      
      user.nsUserInfo = newInfo;

      await AsyncStorage.setItem('user', JSON.stringify(user));
      console.log('✅ AsyncStorage nsUserInfo updated');
      console.log("::::: await AsyncStorage.getItem('user') :::::", await AsyncStorage.getItem('user'));
      
    } else {
      console.warn('⚠️ No user found in AsyncStorage');
    }
  } catch (error) {
    console.log('❌ Failed to update AsyncStorage:', error);
  }
};


export const removeUserData = async (): Promise<boolean> => {
  try {
    console.log('🗑️ Removing user data from AsyncStorage...');
    
    // ✅ All user-related data remove karo
    await AsyncStorage.multiRemove([
      'user',
      'isActiveButton', 
      'shiftStartTime',
      'offlineClockActions',
      'showModal',
      'deviceId' // Agar deviceId bhi user-specific hai toh
    ]);
    
    console.log('✅ User data removed successfully from AsyncStorage');
    debugLog('✅ User data removed successfully from AsyncStorage')
    return true;
    
  } catch (error) {
    console.log('❌ Error removing user data from AsyncStorage:', error);
    debugLog('❌ Error removing user data from AsyncStorage:', error)
    return false;
  }
};