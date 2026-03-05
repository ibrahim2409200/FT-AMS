import React, {useState} from 'react';
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
import {RootStackParamList} from '../navigation/AppNavigator';
import {launchCamera, CameraOptions} from 'react-native-image-picker';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';

const API_BASE_URL = 'http://192.168.1.230:8000/';

interface Employee {
  id: string;
  email: string;
  companyId: string;
  password: string;
  confirmPassword: string;
  imageUri: string | null;
  imageBlob: Blob | null;
}

const AddEmployeeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [employee, setEmployee] = useState<Employee>({
    id: '1',
    email: '',
    companyId: '',
    password: '',
    confirmPassword: '',
    imageUri: null,
    imageBlob: null,
  });
  const [loading, setLoading] = useState(false);
  const [previewImageUri, setPreviewImageUri] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);

  const updateEmployee = (field: string, value: any) => {
    setEmployee({...employee, [field]: value});
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
          updateEmployee('imageUri', response.assets[0].uri!);
          updateEmployee('imageBlob', blob);
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
            updateEmployee('imageUri', null);
            updateEmployee('imageBlob', null);
            Alert.alert('Success', 'Picture removed');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSubmit = async () => {
    // Validation
    if (!employee.email || !employee.companyId || !employee.password || !employee.confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    if (employee.password !== employee.confirmPassword) {
      Alert.alert('Error', "Passwords don't match");
      return;
    }
    if (!employee.imageBlob) {
      Alert.alert('Error', 'Please upload picture');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      const file = new File([employee.imageBlob!], 'webcam-frame.png', {
        type: 'image/png',
        lastModified: Date.now(),
      });
      formData.append('file', file);
      formData.append('email', employee.email);
      formData.append('password', employee.password);
      formData.append('companyId', employee.companyId);

      const response = await axios.post(
        `${API_BASE_URL}/register_new_user`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.registration_status !== 200) {
        throw new Error(`Failed to register ${employee.email}`);
      }

      Alert.alert('Success', 'Employee registered successfully!');
      
      // Clear form
      setEmployee({
        id: '1',
        email: '',
        companyId: '',
        password: '',
        confirmPassword: '',
        imageUri: null,
        imageBlob: null,
      });
    } catch (error) {
      console.error('Error registering employee:', error);
      Alert.alert('Error', 'Failed to register employee');
    } finally {
      setLoading(false);
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
            <View style={styles.titleContainer}>
              <Text style={styles.title}>Add Employee</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.employeeSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter email"
                    value={employee.email}
                    onChangeText={(text) =>
                      updateEmployee('email', text)
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="black"
                  />
                </View>

                <View style={styles.rowContainer}>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Company ID</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Company ID"
                      value={employee.companyId}
                      onChangeText={(text) =>
                        updateEmployee('companyId', text)
                      }
                      autoCapitalize="none"
                      placeholderTextColor="black"
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      value={employee.password}
                      onChangeText={(text) =>
                        updateEmployee('password', text)
                      }
                      secureTextEntry
                      placeholderTextColor="black"
                    />
                  </View>
                </View>

                <View style={styles.rowContainer}>
                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm Password"
                      value={employee.confirmPassword}
                      onChangeText={(text) =>
                        updateEmployee('confirmPassword', text)
                      }
                      secureTextEntry
                      placeholderTextColor="black"
                    />
                  </View>

                  <View style={[styles.inputGroup, styles.halfWidth]}>
                    <Text style={styles.label}>Upload Picture</Text>
                    <View style={styles.uploadContainer}>
                      {!employee.imageUri ? (
                        <TouchableOpacity
                          style={styles.uploadButton}
                          onPress={() => handleUploadPicture()}>
                          <Text style={[styles.buttonText, {color: '#FFFFFF'}]}>
                            📷 Upload
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <Text style={styles.uploadedLabel}>
                            ✓ Uploaded
                          </Text>
                          <View style={styles.imagePreviewContainer}>
                            <TouchableOpacity
                              onPress={() => {
                                setPreviewImageUri(employee.imageUri);
                                setShowImagePreview(true);
                              }}
                              style={styles.imageIcon}>
                              <Text style={styles.imageIconText}>👁️</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleDeleteImage()}
                              style={styles.deleteIcon}>
                              <Text style={styles.deleteIconText}>✂️</Text>
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>

              <Modal
                visible={showImagePreview}
                transparent={true}
                animationType="fade">
                <View style={styles.previewContainer}>
                  <Image
                    source={{uri: previewImageUri!}}
                    style={styles.previewImage}
                    resizeMode="contain"
                  />
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowImagePreview(false)}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </Modal>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}>
                {loading ? (
                  <ActivityIndicator color="#8686AC" />
                ) : (
                  <Text style={styles.submitButtonText}>Register Employee</Text>
                )}
              </TouchableOpacity>
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
    paddingHorizontal: 0,
  },
  titleContainer: {
    backgroundColor: 'transparent',
    padding: 10,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 25,
    marginBottom: 30,
    alignItems: 'center',
    marginTop: 0,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 25,
  },
  employeeSection: {
    marginBottom: 20,
    paddingBottom: 20,
  },
  employeeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  employeeNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8686AC',
  },
  removeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FF6B6B',
    borderRadius: 6,
  },
  removeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
    color: 'black',
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
  divider: {
    height: 1,
    backgroundColor: '#8686AC',
    marginVertical: 15,
  },
  addBtn: {
    backgroundColor: '#272757',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#8686AC',
  },
  addBtnText: {
    color: '#8686AC',
    fontSize: 16,
    fontWeight: 'bold',
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
  submitButton: {
    backgroundColor: '#272757',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#8686AC',
  },
  submitButtonText: {
    color: '#8686AC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonText: {
    color: '#272757',
    fontSize: 14,
    fontWeight: 'bold',
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

export default AddEmployeeScreen;
