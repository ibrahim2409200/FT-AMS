import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import DeviceInfo from 'react-native-device-info';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../redux/store';
import {resetSignupStatus, signupAsync} from '../redux/slices/authSlice';

const SignupScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [nsAccountId, setnsAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [fetchingDeviceId, setFetchingDeviceId] = useState(false);
  const devicePlatform = DeviceInfo.getSystemName();
  const model = DeviceInfo.getModel();
  const manufacturer = DeviceInfo.getManufacturerSync();
  const version = DeviceInfo.getSystemVersion();

  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const {loading, signupSuccess, signupError} = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    fetchDeviceId();
  }, []);

  useEffect(() => {
    if (signupSuccess) {
      Alert.alert('Success', 'Signup submitted. You can log in once approved. Please wait.', [
        {text: 'OK', 
          onPress: () => {
            dispatch(resetSignupStatus()); // RESET before navigating
            navigation.navigate('Login');
          },}
      ]);
    } else if (signupError) {
      Alert.alert('Signup Failed', signupError);
    }
  }, [signupSuccess, signupError]);

  const fetchDeviceId = async () => {
    setFetchingDeviceId(true);
    try {
      const id = await DeviceInfo.getAndroidId();
      setDeviceId(id);
    } catch (error) {
      Alert.alert('Error', 'Could not fetch device ID');
    } finally {
      setFetchingDeviceId(false);
    }
  };

  const handleSignUp = () => {
    if (!email || !nsAccountId || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', "Passwords don't match!");
      return;
    }
    // if (nsAccountId !== "tstdrv2524855") {
    //   Alert.alert('Error', "NsAccountID is not valid");
    //   return;
    // }
    if (!deviceId) {
      Alert.alert('Error', 'Device ID is required.');
      return;
    }

    dispatch(
      signupAsync({
        email,
        nsAccountId : nsAccountId.toLowerCase(),
        password,
        deviceId,
        devicePlatform,
        model,
        manufacturer,
        version
      })
    );
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{flex: 1}}>
          <ScrollView
            contentContainerStyle={{flexGrow: 1}}
            keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.title}>Create an Account</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="black"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Company ID</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter NS Account Id"
                  value={nsAccountId}
                  onChangeText={setnsAccountId}
                  autoCapitalize="none"
                  placeholderTextColor="black"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  placeholderTextColor="black"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  placeholderTextColor="black"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Device ID</Text>
                <View style={styles.deviceIdContainer}>
                  <TextInput
                    style={styles.deviceIdInput}
                    placeholder="Fetching device ID..."
                    value={deviceId}
                    editable={false}
                    placeholderTextColor="black"
                  />
                  {fetchingDeviceId && (
                    <ActivityIndicator size="small" color="#0093dd" style={styles.spinner} />
                  )}
                </View>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Copyright © 2024 DynasoftCloud</Text>
            <Text style={styles.footerText}>All rights reserved</Text>
          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 25,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0093dd',
  },
  formContainer: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
    color:'black'
  },
  deviceIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIdInput: {
    flex: 1,
    height: 48,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#f0f0f0',
    color:"black"
  },
  spinner: {
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#0093dd',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  loginText: {
    color: '#666',
    fontSize: 14,
  },
  loginLink: {
    color: '#0093dd',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default SignupScreen;
