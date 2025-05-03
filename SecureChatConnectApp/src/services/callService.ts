import { ZegoUIKitPrebuiltCall } from '@zegocloud/zego-uikit-prebuilt-call-rn';
import Config from 'react-native-config';

const appID = Number(Config.ZEGO_APP_ID) || 0;
const appSign = Config.ZEGO_APP_SIGN || '';

class CallService {
  async initializeService(userID: string) {
    try {
      console.log('[CallService] Initializing with userID:', userID);
      // Initialize without system calling UI first
      await ZegoUIKitPrebuiltCall.init(
        appID,
        appSign,
        userID,
        {
          notifyWhenAppRunningInBackgroundOrQuit: true,
          isIOSSandboxEnvironment: false,
          androidNotificationConfig: {
            channelID: "ZegoUIKit",
            channelName: "ZegoUIKit",
            sound: "zego_uikit_sound_call",
          },
          ringtoneConfig: {
            incomingCallFileName: 'zego_incoming.mp3',
            outgoingCallFileName: 'zego_outgoing.mp3',
          }
        }
      );
      console.log('[CallService] Initialization successful');
    } catch (error) {
      console.error('[CallService] Initialization failed:', error);
      throw error;
    }
  }

  async sendCallInvitation(targetUserID: string, isVideoCall: boolean = true) {
    try {
      console.log('[CallService] Sending call invitation to:', targetUserID);
      const callID = Math.floor(Math.random() * 10000000).toString();
      
      const result = await ZegoUIKitPrebuiltCall.sendCallInvitation({
        callID,
        invitees: [{ userID: targetUserID }],
        type: isVideoCall ? 0 : 1, // 0 for video call, 1 for voice call
        timeout: 60, // timeout in seconds
      });

      console.log('[CallService] Call invitation result:', result);
      return result;
    } catch (error) {
      console.error('[CallService] Failed to send call invitation:', error);
      throw error;
    }
  }

  async acceptCallInvitation(callID: string) {
    try {
      console.log('[CallService] Accepting call invitation:', callID);
      await ZegoUIKitPrebuiltCall.acceptCallInvitation(callID);
      console.log('[CallService] Call invitation accepted');
    } catch (error) {
      console.error('[CallService] Failed to accept call invitation:', error);
      throw error;
    }
  }

  async rejectCallInvitation(callID: string) {
    try {
      console.log('[CallService] Rejecting call invitation:', callID);
      await ZegoUIKitPrebuiltCall.rejectCallInvitation(callID);
      console.log('[CallService] Call invitation rejected');
    } catch (error) {
      console.error('[CallService] Failed to reject call invitation:', error);
      throw error;
    }
  }

  cleanup() {
    try {
      console.log('[CallService] Cleaning up');
      ZegoUIKitPrebuiltCall.uninit();
    } catch (error) {
      console.error('[CallService] Cleanup failed:', error);
    }
  }
}

export const callService = new CallService(); 