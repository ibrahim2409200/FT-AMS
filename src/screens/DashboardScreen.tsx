import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import {PermissionsAndroid, Platform} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../redux/store';
import LinearGradient from 'react-native-linear-gradient';
import RoundIcon from '../components/RoundIcon';
import {check, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {Dimensions} from 'react-native';
import {clockIn, missedAttendance} from '../redux/slices/attendanceSlice';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import CheckOutModal from '../components/CheckOutModal';
import {differenceInHours, differenceInMinutes} from 'date-fns';
import LoaderModal from '../components/loaderModal';
import OneSignal from 'react-native-onesignal';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';


const {width, height} = Dimensions.get('window');

function getThresholds(radiusInMeters: number, latitude: number) {
  const LAT_THRESHOLD = radiusInMeters / 111000 || 0;
  const LON_THRESHOLD =
    radiusInMeters / (111000 * Math.cos((latitude * Math.PI) / 180)) || 0;
  return {LAT_THRESHOLD, LON_THRESHOLD};
}

const DashboardScreen: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  if (user !== null) {
    AsyncStorage.setItem('user', JSON.stringify(user));
  } else {
    AsyncStorage.setItem('user', 'null'); // Or handle this case as needed
    
  }

 

  const CONSTANT_COORDINATES = {
    latitude: user?.latitude || 0.0,
    longitude: user?.longitude || 0.0,
  };
  const dispatch = useDispatch<AppDispatch>();
  const hasSyncedRef = useRef(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [range, setRange] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    longitude: number;
    latitude: number;
  }>({longitude: 0, latitude: 0});
  const [isActiveButton, setIsActiveButton] = useState(true);
  const [syncData, setSyncData] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [apiLoader, setApiLoader] = useState(false);
  const [settingsAlertShown, setSettingsAlertShown] = useState(false);
  const platform = DeviceInfo.getSystemName();
  const model = DeviceInfo.getModel();
  const manufacturer = DeviceInfo.getManufacturerSync();
  const version = DeviceInfo.getSystemVersion();
  let fencing = Number(user?.nsUserInfo?.location?.[0]?.geoFencing) || 0;

  const allowedFromAnywhere =
    user?.nsUserInfo?.allowedAnywhere == true ? true : false;

  const {LAT_THRESHOLD, LON_THRESHOLD} = getThresholds(fencing, currentLocation?.latitude);

  let rangeText = range ? 'In Range' : 'Not in Range';

  // console.log(user?.nsUserInfo?.location,"::::::::::::lcoation");
  

  useEffect(() => {

    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}:${seconds}`);

      const days = [
        'Sunday',
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
      ];
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const day = days[now.getDay()];
      const date = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();

      if (user?.nsUserInfo?.employeeId) {
        OneSignal.sendTags({
          user_id: user.nsUserInfo.employeeId.toString(),
          shift_start: '09:00',
          shift_end: '18:00',
        });
      }

      const suffix =
        date % 10 === 1 && date !== 11
          ? 'st'
          : date % 10 === 2 && date !== 12
          ? 'nd'
          : date % 10 === 3 && date !== 13
          ? 'rd'
          : 'th';

      setCurrentDate(`${day}, ${date}${suffix} ${month} ${year}`);
    };

    const loadingTimeout = setTimeout(() => {
      setLoading(false);
    }, 2000);

    const timerId = setInterval(updateTime, 1000);

    const geoLoc = setInterval(() => {
      if (!settingsAlertShown) {
        getLocation();
      }
    }, 5000);

    const unsubscribe = NetInfo.addEventListener(async state => {

      if (
        state.isConnected &&
        state.isInternetReachable &&
        !hasSyncedRef.current
      ) {
        hasSyncedRef.current = true; // Set the flag to true

        try {
          await syncOfflineActions();
        } catch (error) {
          Alert.alert(`Error syncing offline actions: ${error}`);
        }
      }
    });

    storedCheckInTime();

    const modalInterval = setInterval(modalCheck, 10000); // Check every 60 seconds

    return () => {
      clearInterval(timerId);
      clearInterval(geoLoc);
      clearTimeout(loadingTimeout);
      clearInterval(modalInterval);
      unsubscribe();
    };
  }, [user]);

  const modalCheck = async () => {
    const shiftStart = await AsyncStorage.getItem('shiftStartTime');
    const activeButton = await AsyncStorage.getItem('isActiveButton');
    if (shiftStart && activeButton === 'false') {
      const currentTime = new Date().toISOString();

      const diffInHours = differenceInHours(currentTime, shiftStart);
      if (diffInHours >= 12) {
        await AsyncStorage.setItem('showModal', 'true');
        let modal = await AsyncStorage.getItem('showModal');
        if (modal === 'true') {
          setShowModal(true);
        }
      }
    }
  };

  const storedCheckInTime = async () => {
    const asyncShiftTime = await AsyncStorage.getItem('shiftStartTime');
    const activeButton = await AsyncStorage.getItem('isActiveButton');
    activeButton == 'false'
      ? setIsActiveButton(false)
      : setIsActiveButton(true);
  };
  const handleClockAction = async (status: 'Check In' | 'Check Out') => {
    try {
      setApiLoader(true);
      status == 'Check In'
        ? await AsyncStorage.setItem('isActiveButton', 'false')
        : await AsyncStorage.setItem('isActiveButton', 'true');

      status == 'Check In' ? setIsActiveButton(false) : setIsActiveButton(true);

      let deviceId = await AsyncStorage.getItem('deviceId');
      const uniqueId = new Date().toString();

      const payload = {
        date: new Date().toISOString(),
        time: new Date().toISOString(),
        type: status,
        employeeId: user?.nsUserInfo?.employeeId.toString(),
        devicePlatform: platform.toLowerCase(),
        model: model,
        manufacturer: manufacturer,
        version: version,
        deviceId: deviceId,
        longitude: currentLocation.longitude.toString(),
        latitude: currentLocation.latitude.toString(),
        reason: '',
        uuid: uniqueId,
        inRange: range,
      };

      const netInfo = await NetInfo.fetch();

      if (netInfo.isConnected) {
        // Online: Directly send the payload
        const result = await dispatch(clockIn(payload)).unwrap();
        if (status === 'Check In') {
          const currentTime = new Date().toISOString();
          await AsyncStorage.setItem('shiftStartTime', currentTime);
        } else {
          await AsyncStorage.removeItem('shiftStartTime');
        }
        Alert.alert(
          'Success',
          `${status === 'Check In' ? 'Check-in' : 'Check-out'} successful!`,
        );
      } else {
        // Offline: Save payload to AsyncStorage
        const offlineQueue = JSON.parse(
          (await AsyncStorage.getItem('offlineClockActions')) || '[]',
        );
        offlineQueue.push(payload);
        if (status === 'Check In') {
          const currentTime = new Date().toISOString();
          await AsyncStorage.setItem('shiftStartTime', currentTime);
        } else {
          await AsyncStorage.removeItem('shiftStartTime');
        }
        await AsyncStorage.setItem(
          'offlineClockActions',
          JSON.stringify(offlineQueue),
        );
        Alert.alert(
          'Offline Mode',
          `No internet connection. ${
            status === 'Check In' ? 'Check-in' : 'Check-out'
          } saved locally and will sync when online.`,
        );
      }
    } catch (error: any) {
      let errorMessage: string;

      if (typeof error === 'string') {
        errorMessage = error; // If the error is already a string
      } else if (Array.isArray(error)) {
        errorMessage = error.join(', '); // Convert array to a comma-separated string
      } else {
        errorMessage = 'An unknown error occurred'; // Fallback message
      }

      // Display the error message
      Alert.alert('Error', errorMessage);
    } finally {
      setApiLoader(false);
    }
  };
  var iter = '';
  const syncOfflineActions = async () => {
    try {
      setApiLoader(true);
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && netInfo.isInternetReachable) {
        let offlineQueue = JSON.parse(
          (await AsyncStorage.getItem('offlineClockActions')) || '[]',
        );
        if (offlineQueue.length > 0) {
          for (const payload of offlineQueue) {
            if (iter != payload.uuid) {
              iter = payload.uuid;
              try {
                await dispatch(clockIn(payload)).unwrap();
              } catch (error) {
                const errorMesg = JSON.stringify(error) || 'Data sync failed';
                Alert.alert('Sync Error:', errorMesg);
                break; // Exit if any error occurs to retry later
              }
            }
          }

          // Clear the queue after successful sync
          await AsyncStorage.removeItem('offlineClockActions');
          Alert.alert(
            'Sync Complete',
            'Offline Check-In/Check-Out actions have been synced.',
          );
        }
      }
    } catch {
    } finally {
      setApiLoader(false);
      hasSyncedRef.current = false;
    }
  };

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.DENIED) {
          if (!settingsAlertShown) {
            setSettingsAlertShown(true);
            //await AsyncStorage.setItem('settingsAlertShown', 'true');
            Alert.alert(
              'Permission Denied Permanently',
              'You have permanently denied the location permission. Please go to settings to enable it.',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Open Settings',
                  onPress: () => {
                    setSettingsAlertShown(false); // Update the state to false
                    Linking.openSettings()
                      .then(() => {})
                      .catch(err => {});
                  },
                },
              ],
            );
          }
          return false;
        }
      } catch (err) {
        return false;
      }
    }
    return true;
  };

  const isLocationEnabled = async () => {
    const status = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION); // For Android
    if (status === RESULTS.GRANTED) {
      return true;
    }
    return false;
  };

  const getLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      return;
    }

    const locationServicesEnabled = await isLocationEnabled();
    if (!locationServicesEnabled) {
      setRange(false);
      return;
    }

    Geolocation.getCurrentPosition(
      ({coords}) => {
        const currentLocation = {
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        setCurrentLocation(currentLocation);

        // checking locations array to see if the current lcoation is in range working for multiple locations
        const matchedLocation = user?.nsUserInfo?.location?.find(loc => {
          if (loc.latitude && loc.longitude) {
            const lat = parseFloat(loc.latitude);
            const lon = parseFloat(loc.longitude);
            // console.log(Math.abs(currentLocation.latitude - lat) <= LAT_THRESHOLD &&
            // Math.abs(currentLocation.longitude - lon) <= LON_THRESHOLD,"::::::::::lo:::::::::::::");

            return (
              Math.abs(currentLocation.latitude - lat) <= LAT_THRESHOLD &&
              Math.abs(currentLocation.longitude - lon) <= LON_THRESHOLD
            );
          }
          return false;
        });

        if (matchedLocation || allowedFromAnywhere) {
          setRange(true);
        } else {
          setRange(false);
        }
      },
      error => {
        setRange(false);
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleModalSubmit = (time: string, reason: string) => {
    const response = {
      time: time,
      reason: reason,
    };
    modalCheckout(response);
    AsyncStorage.removeItem('showModal');
    AsyncStorage.removeItem('isActiveButton');
    setShowModal(false);
    setIsActiveButton(true);
  };

  const modalCheckout = async (response: {time: any; reason: any}) => {
    let deviceId = await AsyncStorage.getItem('deviceId');
    const payload = {
      date: response.time,
      time: response.time,
      type: 'Check Out',
      employeeId: user?.nsUserInfo?.employeeId.toString(),
      devicePlatform: platform.toLowerCase(),
      model: model,
      manufacturer: manufacturer,
      version: version,
      deviceId: deviceId,
      longitude: currentLocation.longitude.toString(),
      latitude: currentLocation.latitude.toString(),
      reason: response?.reason || '',
      inRange: true
    };

    const netInfo = await NetInfo.fetch();

    if (netInfo.isConnected) {
      // Online: Directly send the payload
      const result = await dispatch(missedAttendance(payload)).unwrap();
      Alert.alert('Checkout', 'Success');
    } else {
      // Offline: Save payload to AsyncStorage
      const offlineQueue = JSON.parse(
        (await AsyncStorage.getItem('offlineClockActions')) || '[]',
      );
      offlineQueue.push(payload);
      await AsyncStorage.setItem(
        'offlineClockActions',
        JSON.stringify(offlineQueue),
      );
      Alert.alert(
        'Offline Mode',
        `No internet connection.Check-out saved locally and will sync when online.`,
      );
    }
  };

  const closeModal = () => {
    AsyncStorage.removeItem('showModal');
    setShowModal(false);
  };

  // console.log(user?.nsUserInfo?.location, currentLocation);
  // console.log("::::::::::::::::::::::::::");

  return (
    <LinearGradient
      colors={range ? ['#2ac3aa', '#ffffff'] : ['#ee5a51', '#ffffff']}
      locations={[0, 0.2]}
      style={styles.gradient}>
      <View style={styles.content}>
        <RoundIcon />
        <View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#008000" />
            </View>
          ) : (
            <>
              <View
                style={[
                  styles.locationTab,
                  {
                    backgroundColor: range ? '#34b9a3' : '#ee5a51',
                    marginLeft: range ? width * 0.44 : width * 0.37,
                  },
                ]}>
                <Text style={styles.locationText}>{rangeText}</Text>
              </View>
              <Text style={styles.timeText}>{currentTime}</Text>
              <Text style={styles.dateText}>{currentDate}</Text>
            </>
          )}
        </View>
      </View>
      <View style={styles.containerText}>
        <Text style={styles.welcometext}>Welcome,{'\n'}</Text>
        <Text style={styles.nametext}>
          {user?.nsUserInfo?.employeeName || 'User'}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        {!range ? (
          <>
            <TouchableOpacity
              style={[styles.button, {backgroundColor: '#B8B8B8'}]}
              disabled>
              <Text style={styles.buttonText}> Check-In </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonOut, {backgroundColor: '#B8B8B8'}]}
              disabled>
              <Text style={styles.buttonText}>Check-Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.button,
                !isActiveButton ? {backgroundColor: '#B8B8B8'} : null,
              ]}
              disabled={!isActiveButton}
              onPress={() => handleClockAction('Check In')}>
              <Text style={styles.buttonText}>Check-In </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.buttonOut,
                isActiveButton ? {backgroundColor: '#B8B8B8'} : null,
              ]}
              disabled={isActiveButton}
              onPress={() => handleClockAction('Check Out')}>
              <Text style={styles.buttonText}>Check-Out</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      {showModal && (
        <CheckOutModal onSubmit={handleModalSubmit} onClose={closeModal} />
      )}
      {apiLoader && <LoaderModal loading={apiLoader} />}
      <Text style={styles.footer}>
        Copyrights 2024. Powered by Dynasoft Cloud.
      </Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1, // Use entire screen
    justifyContent: 'space-between', // Ensures footer is pushed to the bottom
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: width * 0.05, // 5% of the screen width
    marginTop: height * 0.2, // 20% of the screen height
  },
  switchText: {
    fontSize: width * 0.04, // Font size responsive to screen width
    color: '#0093dd',
    fontWeight: '500',
  },
  // gradient: {
  //   flex: 1, // Fill the entire screen
  // },
  content: {
    padding: width * 0.04, // 4% of screen width
    flexDirection: 'row',
  },
  loadingContainer: {
    alignSelf: 'center', // Center horizontally
    marginTop: height * 0.1, // 10% of screen height
  },
  locationTab: {
    width: '50%',
    paddingVertical: height * 0.01, // Responsive padding
    backgroundColor: '#34b9a3',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    alignSelf: 'flex-end',
    marginTop: height * 0.03, // 3% of screen height
    elevation: 15,
    marginLeft: width * 0.37,
  },
  locationText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: width * 0.04, // 4% of screen width
  },
  timeText: {
    fontSize: width * 0.1, // 10% of screen width
    fontWeight: '500',
    color: '#0093dd',
    textAlign: 'right', // Center text
    marginTop: height * 0.02, // 2% of screen height
  },
  dateText: {
    fontSize: width * 0.035, // Slightly smaller font
    fontWeight: '400',
    color: '#0093dd',
    textAlign: 'right',
    marginTop: height * 0.01, // Add small gap
  },
  containerText: {
    marginTop: height * -0.35,
    paddingHorizontal: width * 0.09,
  },
  welcometext: {
    fontWeight: '400',
    color: '#0093dd',
    fontSize: width * 0.05, // Responsive font size
  },
  nametext: {
    fontWeight: '500',
    color: '#0093dd',
    fontSize: width * 0.06, // 6% of screen width
  },
  textView: {
    backgroundColor: '#ffd9d9',
    width: '80%',
    borderRadius: 15,
    alignSelf: 'center', // Center horizontally
    marginTop: height * 0.05, // 25% of screen height
    padding: height * 0.015, // Responsive padding
  },
  iconError: {
    position: 'absolute',
    left: width * 0.15, // Adjust position dynamically
    top: '110%',
    transform: [{translateY: -13}],
  },
  errorText: {
    color: '#ff5353',
    fontWeight: 'bold',
    fontSize: width * 0.04, // Adjust font size
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: height * -0.3,
    paddingHorizontal: width * 0.05,
  },
  button: {
    backgroundColor: '#2ac3aa',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.1,
    borderRadius: 8,
    elevation: 15,
  },
  buttonOut: {
    backgroundColor: '#ee5a51',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.1,
    borderRadius: 8,
    elevation: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: width * 0.035, // Responsive font size
    color: 'black',
    marginBottom: height * 0.06, // Ensure margin from bottom
  },
});

export default DashboardScreen;
