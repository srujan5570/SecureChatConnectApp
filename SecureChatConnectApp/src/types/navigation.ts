import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  ChatList: undefined;
  Chat: {
    receiverId: string;
    receiverName: string;
  };
  VideoCall: {
    meetingId: string;
    userName: string;
    userID: string;
    targetUserId?: string;
    isVoiceCall?: boolean;
  };
  CallLog: undefined;
  ZegoUIKitPrebuiltCallWaitingScreen: undefined;
  ZegoUIKitPrebuiltCallInCallScreen: undefined;
  // ... other screens ...
};

export type LoginScreenProps = NativeStackScreenProps<RootStackParamList, 'Login'>;
export type RegisterScreenProps = NativeStackScreenProps<RootStackParamList, 'Register'>;
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type ChatScreenProps = NativeStackScreenProps<RootStackParamList, 'Chat'>;
export type VideoCallScreenProps = {
  route: {
    params: {
      meetingId: string;
      userID: string;
      userName: string;
      targetUserId?: string;
      isVoiceCall?: boolean;
    };
  };
  navigation: any;
};
export type ChatListScreenProps = NativeStackScreenProps<RootStackParamList, 'ChatList'>;
export type CallLogScreenProps = NativeStackScreenProps<RootStackParamList, 'CallLog'>; 