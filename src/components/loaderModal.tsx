import React from 'react';
import {
  View,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
} from 'react-native';

type LoaderModalProps = {
  loading: boolean;
};

const LoaderModal: React.FC<LoaderModalProps> = ({ loading }) => {
  return (
    <Modal transparent={true} animationType="fade" visible={loading}>
      <View style={styles.modalBackground}>
        <View style={styles.activityIndicatorContainer}>
          <ActivityIndicator size="large" color="#34b9a3" />
          <Text>
          Loading...
          </Text>
          
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityIndicatorContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 10,
  },
});

export default LoaderModal;
