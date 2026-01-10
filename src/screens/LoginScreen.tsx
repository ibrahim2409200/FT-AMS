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

const {width, height} = Dimensions.get('window'); // For responsive design

const LoginScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const [mobId, setMobId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
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

  if (loggingIn) {
    return <Spinner message="Logging in..." />; // Show spinner during login
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/images/dscLogo.png')}
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
              placeholderTextColor="#0093dd"
              style={styles.inputWithIcon}
            />
            <Icon
              name="mobile"
              size={28}
              color="#0093dd"
              style={styles.iconInside}
            />
          </View>
          <View style={styles.button}>
            {loading ? (
              <ActivityIndicator
                size="small"
                color="#fff"
                style={styles.spinner}
              />
            ) : mobId ? (
              <Button title="Login" onPress={handleLogin} />
            ) : (
              <Button title="Click to Fetch ID" onPress={fetchAndroidId} />
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
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    justifyContent: 'space-between', // This pushes footer to bottom
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
    color: '#0093dd',
    marginBottom: height * 0.02,
  },
  button: {
    width: '100%',
    marginTop: height * 0.02,
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
    backgroundColor: '#e6f8ff',
    color: '#0093dd',
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
    backgroundColor: '#0093dd',
    padding: 8,
    borderRadius: 5,
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
    color: '#666',
    fontSize: width * 0.04,
  },
  signUpLink: {
    color: '#0093dd',
    fontSize: width * 0.04,
    fontWeight: 'bold',
  },
  footer: {
    paddingVertical: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginBottom: 10, // Small margin at bottom
  },
  footerText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default LoginScreen;
