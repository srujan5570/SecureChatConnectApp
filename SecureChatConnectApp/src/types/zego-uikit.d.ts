declare module '@zegocloud/zego-uikit-prebuilt-call-rn' {
  export interface ZegoCallConfig {
    onCallEnd?: (callID?: string) => void;
    onOnlySelfInRoom?: () => void;
    onHangUp?: () => void;
    turnOnCameraWhenJoining?: boolean;
    turnOnMicrophoneWhenJoining?: boolean;
    useSpeakerWhenJoining?: boolean;
  }

  export const ONE_ON_ONE_VIDEO_CALL_CONFIG: ZegoCallConfig;

  export interface ZegoUIKitPrebuiltCallProps {
    appID: number;
    appSign: string;
    userID: string;
    userName: string;
    callID: string;
    config?: ZegoCallConfig;
  }

  export interface ZegoInitConfig {
    ringtoneConfig?: {
      incomingCallFileName?: string;
      outgoingCallFileName?: string;
    };
    notifyWhenAppRunningInBackgroundOrQuit?: boolean;
    isIOSSandboxEnvironment?: boolean;
    androidNotificationConfig?: {
      channelID: string;
      channelName: string;
      sound?: string;
    };
    iOSNotificationConfig?: {
      sound?: string;
    };
  }

  export interface ZegoCallInvitation {
    callees: string[];
    callID: string;
    type: number;
    timeout: number;
    data?: string;
  }

  export interface ZegoCallInfo {
    callerName: string;
    callerID: string;
    receiverName: string;
    receiverID: string;
    type: number;
    status: string;
  }

  export const ZegoUIKitPrebuiltCall: React.FC<ZegoUIKitPrebuiltCallProps>;

  const ZegoUIKitPrebuiltCallService: {
    init: (
      appID: number,
      appSign: string,
      userID: string,
      userName: string,
      plugins: any[],
      config: ZegoInitConfig
    ) => Promise<void>;
    uninit: () => void;
    useSystemCallingUI: (modules: any[]) => void;
    sendCallInvitation: (invitation: ZegoCallInvitation) => Promise<void>;
    getActiveCallID: () => Promise<string | null>;
    getCallInfo: (callID: string) => Promise<ZegoCallInfo | null>;
  };

  export default ZegoUIKitPrebuiltCallService;
} 