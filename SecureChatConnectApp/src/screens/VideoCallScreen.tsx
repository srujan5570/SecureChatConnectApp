import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { 
  ZegoUIKitPrebuiltCall, 
  ONE_ON_ONE_VIDEO_CALL_CONFIG 
} from '@zegocloud/zego-uikit-prebuilt-call-rn';
import Config from 'react-native-config';
import { VideoCallScreenProps } from '../types/navigation';
import ZegoUIKitPrebuiltCallService from '@zegocloud/zego-uikit-prebuilt-call-rn';
import * as ZIM from 'zego-zim-react-native';
import * as ZPNs from 'zego-zpns-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get Zego credentials from environment variables
const appID = Number(Config.ZEGO_APP_ID) || 0;
const appSign = Config.ZEGO_APP_SIGN || '';

// Create voice call config based on video call config
const ONE_ON_ONE_VOICE_CALL_CONFIG = {
  ...ONE_ON_ONE_VIDEO_CALL_CONFIG,
  turnOnCameraWhenJoining: false,
  turnOnMicrophoneWhenJoining: true,
  useSpeakerWhenJoining: false,
  showPreJoinView: false,
};

// Initialize Zego service with system calling UI
try {
  console.log('[Call] Initializing system calling UI');
  ZegoUIKitPrebuiltCallService.useSystemCallingUI([ZIM, ZPNs]);
  console.log('[Call] System calling UI initialized successfully');
} catch (error) {
  console.error('[Call] Failed to initialize system calling UI:', error);
}

const VideoCallScreen: React.FC<VideoCallScreenProps> = ({ route, navigation }) => {
  const { meetingId, userID, userName, targetUserId, isVoiceCall = false } = route.params;

  const saveCallLog = async (status: 'ongoing' | 'completed' | 'missed') => {
    try {
      const storedLogs = await AsyncStorage.getItem('callLogs');
      const logs = storedLogs ? JSON.parse(storedLogs) : [];
      
      // Add new call log
      const newLog = {
        id: meetingId,
        callID: meetingId,
        callerName: userName,
        callerID: userID,
        receiverName: targetUserId ? 'Unknown' : userName,
        receiverID: targetUserId || '',
        timestamp: new Date().toISOString(),
        duration: 0,
        status,
        type: targetUserId ? 'outgoing' : 'incoming',
        callType: isVoiceCall ? 'voice' : 'video'
      };

      logs.unshift(newLog);
      const trimmedLogs = logs.slice(0, 100);
      await AsyncStorage.setItem('callLogs', JSON.stringify(trimmedLogs));
      console.log('[Call] Call log saved:', newLog);
    } catch (error) {
      console.error('[Call] Error saving call log:', error);
    }
  };

  console.log('[Call] Screen mounted with params:', {
    meetingId,
    userID,
    userName,
    targetUserId,
    isVoiceCall,
    platform: Platform.OS,
    isInitiator: !!targetUserId
  });

  useEffect(() => {
    const initializeCall = async () => {
      try {
        console.log('[Call] Starting initialization with:', {
          appID,
          appSign,
          userID,
          userName,
          targetUserId,
          isVoiceCall,
          deviceInfo: {
            platform: Platform.OS,
            version: Platform.Version,
          }
        });

        await ZegoUIKitPrebuiltCallService.init(
          appID,
          appSign,
          userID,
          userName,
          [ZIM, ZPNs],
          {
            notifyWhenAppRunningInBackgroundOrQuit: true,
            androidNotificationConfig: {
              channelID: "ZegoUIKit",
              channelName: "ZegoUIKit",
            },
          }
        );

        console.log('[Call] Initialization successful');

        if (targetUserId) {
          console.log('[Call] Preparing to send call invitation:', {
            targetUserId,
            meetingId,
            isVoiceCall,
            timestamp: new Date().toISOString()
          });
          
          try {
            const callInvitation = {
              callees: [targetUserId],
              callID: meetingId,
              type: isVoiceCall ? 1 : 0, // 0 for video, 1 for voice
              timeout: 30,
              data: JSON.stringify({
                callType: isVoiceCall ? 'voice' : 'video',
                callerName: userName,
                callerID: userID,
              }),
            };

            console.log('[Call] Sending call invitation:', callInvitation);
            await ZegoUIKitPrebuiltCallService.sendCallInvitation(callInvitation);
            console.log('[Call] Call invitation sent successfully');
            await saveCallLog('ongoing');
          } catch (error) {
            console.error('[Call] Failed to send call invitation:', error);
            await saveCallLog('missed');
          }
        } else {
          console.log('[Call] Joining as call receiver:', {
            meetingId,
            isVoiceCall,
            timestamp: new Date().toISOString()
          });
          await saveCallLog('ongoing');
        }
      } catch (error) {
        console.error('[Call] Initialization failed:', error);
        await saveCallLog('missed');
      }
    };

    initializeCall();

    return () => {
      console.log('[Call] Starting cleanup');
      try {
        ZegoUIKitPrebuiltCallService.uninit();
        console.log('[Call] Cleanup completed successfully');
      } catch (error) {
        console.error('[Call] Cleanup failed:', error);
      }
    };
  }, [userID, userName, targetUserId, meetingId, isVoiceCall]);

  const handleCallEnd = async () => {
    console.log('[Call] Call ended by user');
    await saveCallLog('completed');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ZegoUIKitPrebuiltCall
        appID={appID}
        appSign={appSign}
        userID={userID}
        userName={userName}
        callID={meetingId}
        config={{
          ...(isVoiceCall ? ONE_ON_ONE_VOICE_CALL_CONFIG : ONE_ON_ONE_VIDEO_CALL_CONFIG),
          onCallEnd: handleCallEnd,
          turnOnCameraWhenJoining: !isVoiceCall,
          turnOnMicrophoneWhenJoining: true,
          useSpeakerWhenJoining: !isVoiceCall,
          onOnlySelfInRoom: async () => {
            console.log('[Call] Only self in room, ending call');
            await saveCallLog('completed');
            navigation.goBack();
          },
          onHangUp: async () => {
            console.log('[Call] Call hung up');
            await saveCallLog('completed');
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

export default VideoCallScreen; 