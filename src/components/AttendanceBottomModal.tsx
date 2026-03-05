import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface AttendanceBottomModalProps {
  visible: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onClose: () => void;
  isCheckInActive: boolean;
  isInRange: boolean;
  isLoading?: boolean;
}

const AttendanceBottomModal: React.FC<AttendanceBottomModalProps> = ({
  visible,
  onCheckIn,
  onCheckOut,
  onClose,
  isCheckInActive,
  isInRange,
  isLoading = false,
}) => {
  const slideAnim = React.useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Mark Attendance</Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.checkInButton,
                !isInRange || !isCheckInActive ? styles.disabledButton : null,
              ]}
              disabled={!isInRange || !isCheckInActive || isLoading}
              onPress={onCheckIn}>
              <Text style={styles.buttonText}>Check In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.checkOutButton,
                !isInRange || isCheckInActive ? styles.disabledButton : null,
              ]}
              disabled={!isInRange || isCheckInActive || isLoading}
              onPress={onCheckOut}>
              <Text style={styles.buttonText}>Check Out</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#272757',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: height * 0.03,
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.02,
    elevation: 10,
  },
  handle: {
    width: width * 0.15,
    height: 5,
    backgroundColor: '#8686AC',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: height * 0.02,
  },
  title: {
    fontSize: width * 0.055,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: height * 0.03,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: width * 0.04,
    marginBottom: height * 0.02,
  },
  button: {
    flex: 1,
    paddingVertical: height * 0.025,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  checkInButton: {
    backgroundColor: '#34b9a3',
  },
  checkOutButton: {
    backgroundColor: '#ff6b6b',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: width * 0.045,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#B8B8B8',
    opacity: 0.6,
  },
  closeButton: {
    paddingVertical: height * 0.015,
    borderRadius: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#8686AC',
    marginTop: height * 0.01,
  },
  closeButtonText: {
    color: '#8686AC',
    fontSize: width * 0.04,
    fontWeight: '500',
  },
});

export default AttendanceBottomModal;
