import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ZegoUIKitPrebuiltCall, ONE_ON_ONE_VIDEO_CALL_CONFIG } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import { PermissionsAndroid, Platform } from 'react-native';
import Config from 'react-native-config';

// Get Zego credentials from environment variables
const appID = Number(Config.ZEGO_APP_ID);
const appSign = Config.ZEGO_APP_SIGN || '';

interface ZegoCallScreenProps {
  route: {
    params: {
      callID: string;
      userID: string;
      userName: string;
      targetUserID: string;
    };
  };
}

const ZegoCallScreen: React.FC<ZegoCallScreenProps> = ({ route }) => {
  const { callID, userID, userName, targetUserID } = route.params;
  const [hasPermission, setHasPermission] = useState(false);
  const navigation = useNavigation();

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const micPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'App needs access to your microphone for calls.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        const cameraPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs access to your camera for calls.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (
          micPermission === PermissionsAndroid.RESULTS.GRANTED &&
          cameraPermission === PermissionsAndroid.RESULTS.GRANTED
        ) {
          setHasPermission(true);
        } else {
          Alert.alert('Permissions required', 'Please grant camera and microphone permissions to use video call.');
          navigation.goBack();
        }
      } catch (err) {
        console.warn(err);
        Alert.alert('Error', 'Failed to request permissions');
        navigation.goBack();
      }
    } else {
      setHasPermission(true);
    }
  };

  React.useEffect(() => {
    requestPermissions();
  }, []);

  if (!hasPermission) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={appID}
        appSign={appSign}
        userID={userID}
        userName={userName}
        callID={callID}
        config={{
          ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
          onOnlySelfInRoom: () => {
            navigation.goBack();
          },
          onHangUp: () => {
            navigation.goBack();
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default ZegoCallScreen; 