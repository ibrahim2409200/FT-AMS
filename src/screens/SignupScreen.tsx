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
  Image,
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import DeviceInfo from 'react-native-device-info';
import {RootStackParamList} from '../navigation/AppNavigator';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, RootState} from '../redux/store';
import {resetSignupStatus, signupAsync} from '../redux/slices/authSlice';
import {launchCamera, CameraOptions} from 'react-native-image-picker';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';

const API_BASE_URL = 'http://192.168.1.230:8000/'; // Replace with actual facial API URL

const SignupScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [nsAccountId, setnsAccountId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [fetchingDeviceId, setFetchingDeviceId] = useState(false);
  const [facialLoading, setFacialLoading] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [selectedImageBlob, setSelectedImageBlob] = useState<Blob | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
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
          }}
      ]);
    } else if (signupError) {
      Alert.alert('Signup Failed', signupError);
    }
  }, [signupSuccess, signupError, dispatch, navigation]);

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

    if (!selectedImageBlob) {
      Alert.alert('Error', 'Please upload a picture first.');
      return;
    }

    // First register the face, then signup
    registerNewUser(selectedImageBlob, email);
  };

  const handleUploadPicture = () => {
    const options: CameraOptions = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 600,
      maxWidth: 600,
    };
    launchCamera(options, async (response) => {
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.errorMessage) {
        console.log('Camera Error: ', response.errorMessage);
      } else if (response.assets && response.assets[0]) {
        try {
          const responseFetch = await fetch(response.assets[0].uri!);
          const blob = await responseFetch.blob();
          setSelectedImageUri(response.assets[0].uri!);
          setSelectedImageBlob(blob as any);
          Alert.alert('Success', 'Picture uploaded successfully!');
        } catch (error) {
          console.error('Error processing image:', error);
          Alert.alert('Error', 'Failed to process image');
        }
      }
    });
  };

  const handleDeleteImage = () => {
    Alert.alert(
      'Are you sure?',
      'Picture will be removed',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Delete',
          onPress: () => {
            setSelectedImageUri(null);
            setSelectedImageBlob(null);
            Alert.alert('Success', 'Picture removed');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const registerNewUser = async (asset: any, text: string) => {
    setFacialLoading(true);
    try {
      const formData = new FormData();
      const file = new File([asset], 'webcam-frame.png', { type: 'image/png', lastModified: Date.now() });
      formData.append('file', file);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('deviceId', deviceId);
      formData.append('companyId', nsAccountId);

      const response = await axios.post(`${API_BASE_URL}/register_new_user`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log(response.data,"registration point");
      if (response.data.registration_status === 200) {
        Alert.alert('Success', 'User registered successfully!');
        // After successful registration, proceed with signup
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
      } else {
        Alert.alert('Error', 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering user:', error);
      Alert.alert('Error', 'Failed to register user');
    } finally {
      setFacialLoading(false);
    }
  };


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <LinearGradient
        colors={['#8686AC', '#272757']}
        locations={[0, 0.15]}
        style={styles.gradient}>
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
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="black"
                />
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="black"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholderTextColor="black"
                  />
                </View>
              </View>

              <View style={styles.rowContainer}>
                <View style={[styles.inputGroup, styles.halfWidth]}>
                  <Text style={styles.label}>Company ID</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Company Id"
                    value={nsAccountId}
                    onChangeText={setnsAccountId}
                    autoCapitalize="none"
                    placeholderTextColor="black"
                  />
                </View>

                <View style={[styles.inputGroup, styles.halfWidth]}>
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
                      <ActivityIndicator size="small" color="#8686AC" style={styles.spinner} />
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Upload Picture</Text>
                <View style={styles.uploadContainer}>
                  {!selectedImageUri ? (
                    <TouchableOpacity 
                      style={styles.uploadButton} 
                      onPress={handleUploadPicture}
                    >
                      <Text style={[styles.buttonText, {color: '#FFFFFF'}]}>📷 Upload Picture</Text>
                    </TouchableOpacity>
                  ) : (
                    <>
                      <Text style={styles.uploadedLabel}>✓ Picture Uploaded</Text>
                      <View style={styles.imagePreviewContainer}>
                        <TouchableOpacity 
                          onPress={() => setShowImagePreview(true)}
                          style={styles.imageIcon}
                        >
                          <Text style={styles.imageIconText}>👁️</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          onPress={handleDeleteImage}
                          style={styles.deleteIcon}
                        >
                          <Text style={styles.deleteIconText}>✂️</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              </View>

              <Modal
                visible={showImagePreview}
                transparent={true}
                animationType="fade"
              >
                <View style={styles.previewContainer}>
                  <Image 
                    source={{uri: selectedImageUri!}} 
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={() => setShowImagePreview(false)}
                  >
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </Modal>

              <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading || facialLoading}>
                {loading || facialLoading ? (
                  <ActivityIndicator color="#8686AC" />
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
            <Text style={styles.footerText}>Copyright © 2026 FastymTech</Text>
            <Text style={styles.footerText}>All rights reserved</Text>
          </View>
        </KeyboardAvoidingView>
        </View>
      </LinearGradient>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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
    color: '#FFFFFF',
  },
  formContainer: {
    flex: 1,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    flex: 1,
    marginRight: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderColor: '#272757',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: 'black'
  },
  deviceIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIdInput: {
    flex: 1,
    height: 48,
    borderColor: '#272757',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: 'black'
  },
  spinner: {
    marginLeft: 10,
  },
  uploadContainer: {
    marginBottom: 15,
  },
  uploadButton: {
    marginTop: 0,
    backgroundColor: '#8686AC',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadedLabel: {
    color: '#00FF00',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#8686AC',
  },
  imageIcon: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#8686AC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  imageIconText: {
    fontSize: 20,
  },
  deleteIcon: {
    width: 42,
    height: 42,
    borderRadius: 6,
    backgroundColor: '#8686AC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  deleteIconText: {
    fontSize: 20,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  previewImage: {
    width: '100%',
    height: '70%',
    marginBottom: 30,
  },
  closeButton: {
    backgroundColor: '#8686AC',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#272757',
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
    color: '#FFFFFF',
    fontSize: 14,
  },
  loginLink: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#FFFFFF',
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
});

export default SignupScreen;

