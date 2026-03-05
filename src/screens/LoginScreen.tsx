import React, {useEffect, useState} from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {loginAsync} from '../redux/slices/authSlice';
import Icon from 'react-native-vector-icons/FontAwesome';
import {AppDispatch, RootState} from '../redux/store';
import DeviceInfo from 'react-native-device-info';
import Spinner from '../components/Spinner';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {launchCamera, CameraOptions} from 'react-native-image-picker';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';

const API_BASE_URL = 'http://192.168.1.230:8000/'; // Replace with actual facial API URL

const {width, height} = Dimensions.get('window'); // For responsive design

const LoginScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [mobId, setMobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [facialLoading, setFacialLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();

  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const loginError = useSelector((state: RootState) => state.auth.loginError);

  useEffect(() => {
    if (isAuthenticated) {
      setLoggingIn(true); // Start spinner
      setTimeout(() => {
        setLoggingIn(false); // Stop spinner
        navigation.replace('SideMenu'); // Redirect to Dashboard
      }, 2000); // 2 seconds delay
    }
  }, [isAuthenticated, loginError, navigation]);

  const fetchAndroidId = async () => {
    setLoading(true);
    try {
      const id = await DeviceInfo.getAndroidId();
      setMobId(id as string);
      await AsyncStorage.setItem('deviceId', id as string);
    } catch (error) {
      Alert.alert('Device id could not be fetched');
    } finally {
      setLoading(false);
    }
  };
  const handleLogin = async () => {
    if (mobId) {
      setLoading(true);
      try {
        await dispatch(loginAsync(mobId)).unwrap();
        await AsyncStorage.setItem('isAuthenticated', 'true');
      } catch (error: any) {
        Alert.alert('Error', error || 'Server not responding.');
      } finally {
        setLoading(false);
      }
    } else {
      //setErrorMsg('Device ID is required for login');
    }
  };

  const handleFacialLogin = () => {
    const options: CameraOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 600,
      maxWidth: 600,
    };
    launchCamera(options, (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorMessage) {
        console.log('Camera Error: ', response.errorMessage);
      } else if (response.assets && response.assets[0]) {
        sendImageForLogin(response.assets[0]);
      }
    });
  };

  const sendImageForLogin = async (asset: any) => {
  setFacialLoading(true);

  try {
    const formData = new FormData();

    formData.append('file', {
      uri: asset.uri,
      type: asset.type || 'image/png',
      name: asset.fileName || 'face.jpg',
    } as any);
    console.log(formData,"formadatta payload");
    
    const response = await axios.post(
      'http://192.168.1.230:8000/login',
      formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );  

    console.log('FACE LOGIN RESPONSE 👉', response.data);

    if (
      response.data.match_status === true &&
      !response.data.user.includes('Spoofing') &&
      !response.data.user.includes('Clear')
    ) {
      Alert.alert('Check In Success', `Welcome ${response.data.user}`);
    } else if (response.data.user.includes('Spoofing')) {
      Alert.alert('Error', 'Spoofing Detected!');
    } else if (response.data.user.includes('Clear')) {
      Alert.alert('Error', 'Image is not clear!');
    } else {
      Alert.alert('Error', 'Unknown user! Please try again!');
    }

  } catch (error: any) {
    console.log('AXIOS ERROR 👉', error.message);
    Alert.alert('Network Error', 'Face login failed');
  } finally {
    setFacialLoading(false);
  }
};


  if (loggingIn) {
    return <Spinner message="Logging in..." />;
  }

  return (
    <LinearGradient
      colors={['#8686AC', '#272757']}
      locations={[0, 0.15]}
      style={styles.gradient}>
      <View style={styles.container}>
      <Image
        source={require('../../assets/images/logo12.png')}
        style={styles.logo}
      />
      <View style={styles.subContainer}>
        <Text style={styles.textHeader}>Login</Text>
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              value={mobId}
              editable={false}
              placeholder="Device ID"
              placeholderTextColor="#fff"
              style={styles.inputWithIcon}
            />
            <Icon
              name="mobile"
              size={28}
              color="#8686AC"
              style={styles.iconInside}
            />
          </View>
          <View style={styles.button}>
            {loading ? (
              <TouchableOpacity style={styles.customButton} disabled>
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.spinner}
                />
              </TouchableOpacity>
            ) : mobId ? (
              <TouchableOpacity style={styles.customButton} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.customButton} onPress={fetchAndroidId}>
                <Text style={styles.buttonText}>Click to Fetch ID</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.button}>
            {facialLoading ? (
              <TouchableOpacity style={styles.customButton} disabled>
                <ActivityIndicator
                  size="small"
                  color="#fff"
                  style={styles.spinner}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.customButton} onPress={handleFacialLogin}>
                <Text style={styles.buttonText}>Login with Face</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
          <Text style={styles.signUpLink}>Sign Up</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
              <Text style={styles.footerText}>Copyright © 2024 DynasoftCloud</Text>
              <Text style={styles.footerText}>All rights reserved</Text>
            </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: width * 0.05,
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
  },
  subContainer: {
    marginTop: height * 0.05, // Reduced from 0.1 to make space
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
  },
  textHeader: {
    fontSize: width * 0.06,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: height * 0.02,
  },
  button: {
    width: '100%',
    marginTop: height * 0.02,
    backgroundColor: '#FFFFFF',
  },
  inputContainer: {
    width: '100%',
    alignItems: 'center',
  },
  inputWrapper: {
    width: '100%',
    marginVertical: height * 0.01,
    position: 'relative',
  },
  inputWithIcon: {
    padding: height * 0.02,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    color: 'black',
    fontWeight: 'bold',
    fontSize: width * 0.045,
  },
  iconInside: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{translateY: -14}],
  },
  spinner: {
    backgroundColor: '#272757',
    padding: 8,
    borderRadius: 5,
  },
  customButton: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#272757',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logo: {
    marginTop: height * 0.05, // Reduced from 0.1
    alignSelf: 'center',
    width: width * 0.6,
    height: width * 0.2,
    resizeMode: 'contain',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: height * -0.06,
  },
  signUpText: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
  },
  signUpLink: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
    marginBottom: 10, // Small margin at bottom
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default LoginScreen;

