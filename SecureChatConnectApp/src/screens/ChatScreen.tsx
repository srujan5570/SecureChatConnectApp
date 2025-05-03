import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socketService from '../services/socketService';
import { API_URL } from '../config/api';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../navigation/types';
import { videoService } from '../services/videoService';
import { useAuth, User } from '../context/AuthContext';
import { generateUniqueId } from '../utils/helpers';
import { ChatScreenProps } from '../types/navigation';
import { COLORS, SPACING, FONTS, SHADOWS, BORDER_RADIUS } from '../config/theme';

interface UserData {
  userId: string;
  name?: string;
  username?: string;
  email?: string;
}

type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    username: string;
  };
  receiver: {
    _id: string;
    username: string;
  };
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { receiverId, receiverName } = route.params;
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    loadUserData();
    setupNavigation();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('[Chat] Loading user data from AsyncStorage...');
      const userDataStr = await AsyncStorage.getItem('userData');
      console.log('[Chat] User data from storage:', userDataStr);
      
      if (!userDataStr) {
        console.error('[Chat] No user data found in AsyncStorage');
        return;
      }

      const parsedUserData = JSON.parse(userDataStr);
      console.log('[Chat] Parsed user data:', parsedUserData);
      
      if (!parsedUserData.userId && parsedUserData.id) {
        // Handle legacy data format
        parsedUserData.userId = parsedUserData.id;
      }

      if (!parsedUserData.userId) {
        console.error('[Chat] No userId found in user data');
        return;
      }

      setUserData(parsedUserData);
      console.log('[Chat] User data set successfully:', parsedUserData);
    } catch (error) {
      console.error('[Chat] Error loading user data:', error);
    }
  };

  const setupNavigation = () => {
    navigation.setOptions({
      title: receiverName,
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.callButton, !userData && styles.callButtonDisabled]} 
            onPress={handleVoiceCall}
            disabled={!userData}
          >
            <View style={[styles.iconContainer, !userData && styles.iconContainerDisabled]}>
              <View style={styles.iconBackground}>
                <Text style={styles.emojiIcon}>📞</Text>
              </View>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.callButton, !userData && styles.callButtonDisabled]} 
            onPress={handleVideoCall}
            disabled={!userData}
          >
            <View style={[styles.iconContainer, styles.videoIconContainer, !userData && styles.iconContainerDisabled]}>
              <View style={styles.iconBackground}>
                <Text style={styles.emojiIcon}>📹</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      ),
    });
  };

  // Update setupNavigation when userData changes
  useEffect(() => {
    setupNavigation();
  }, [userData]);

  const handleVideoCall = () => {
    if (!userData) {
      console.log('[VideoCall] No user data available');
      Alert.alert('Error', 'Unable to start video call. Please try again.');
      return;
    }
    
    console.log('[VideoCall] Current user data:', userData);
    
    const meetingId = generateUniqueId();
    const userID = userData.email || `user_${userData.userId}` || generateUniqueId();
    const displayName = String(userData.username || userData.name || userID.split('@')[0] || 'User');
    
    console.log('[VideoCall] Generated call data:', {
      meetingId,
      userID,
      displayName
    });

    // Send a message with the call link
    const callMessage = `📹 Video Call Started - Click to join: video://${meetingId}`;
    socketService.sendMessage(receiverId, callMessage);
    
    navigation.navigate('VideoCall', {
      meetingId,
      userID,
      userName: displayName,
      targetUserId: receiverId
    });
  };

  const handleVoiceCall = () => {
    if (!userData) {
      console.log('[VoiceCall] No user data available');
      Alert.alert('Error', 'Unable to start voice call. Please try again.');
      return;
    }
    
    console.log('[VoiceCall] Current user data:', userData);
    
    const meetingId = generateUniqueId();
    const userID = userData.email || `user_${userData.userId}` || generateUniqueId();
    const displayName = String(userData.username || userData.name || userID.split('@')[0] || 'User');
    
    console.log('[VoiceCall] Generated call data:', {
      meetingId,
      userID,
      displayName
    });

    // Send a message with the call link
    const callMessage = `📞 Voice Call Started - Click to join: voice://${meetingId}`;
    socketService.sendMessage(receiverId, callMessage);
    
    navigation.navigate('VideoCall', {
      meetingId,
      userID,
      userName: displayName,
      targetUserId: receiverId,
      isVoiceCall: true
    });
  };

  // Load user ID and connect socket
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (!userDataStr) {
          console.error('No user data found in storage');
          return;
        }

        const userData = JSON.parse(userDataStr);
        const currentUserId = userData.id;
        
        if (!currentUserId) {
          console.error('No user ID found in stored data');
          return;
        }

        setUserId(currentUserId);
        console.log('Connecting socket with userId:', currentUserId);
        await socketService.connect(currentUserId);
        
        // Load previous messages
        await loadMessages(currentUserId);
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initializeChat();

    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, []);

  // Set up message listener
  useEffect(() => {
    if (!userId) return;

    console.log('[Chat] Setting up message listener for userId:', userId);
    const cleanup = socketService.onMessageReceived((message: Message) => {
      console.log('[Chat] Message received:', message);
      console.log('[Chat] Current chat with:', receiverId);
      
      const isRelevantMessage = 
        (message.sender._id === userId && message.receiver._id === receiverId) ||
        (message.sender._id === receiverId && message.receiver._id === userId);

      console.log('[Chat] Is message relevant to this chat?', isRelevantMessage);
      
      if (isRelevantMessage) {
        setMessages(prevMessages => {
          const messageExists = prevMessages.some(m => m._id === message._id);
          if (messageExists) {
            console.log('[Chat] Message already exists in chat, skipping:', message._id);
            return prevMessages;
          }
          
          console.log('[Chat] Adding new message to chat:', message._id);
          return [message, ...prevMessages];
        });
      } else {
        console.log('[Chat] Message not relevant to this chat, skipping');
      }
    });

    return () => {
      console.log('[Chat] Cleaning up message listener');
      cleanup();
    };
  }, [userId, receiverId]);

  // Set up typing listener
  useEffect(() => {
    if (!userId) return;

    const cleanup = socketService.onTypingStatusReceived((data) => {
      if (data.userId === receiverId) {
        setRemoteTyping(data.isTyping);
      }
    });

    return cleanup;
  }, [userId, receiverId]);

  // Load messages
  const loadMessages = async (currentUserId: string) => {
    try {
      console.log('[Chat] Loading messages between', currentUserId, 'and', receiverId);
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        console.error('[Chat] No auth token found');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/messages/chat?userId=${currentUserId}&receiverId=${receiverId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Chat] Failed to fetch messages:', errorData);
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      console.log('[Chat] Loaded messages:', data);
      
      // Sort messages in reverse chronological order for inverted FlatList
      const sortedMessages = data.sort((a: Message, b: Message) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      console.log('[Chat] Sorted messages:', sortedMessages);
      setMessages(sortedMessages);
    } catch (error) {
      console.error('[Chat] Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to scroll to bottom (which is actually top in inverted list)
  const scrollToBottom = () => {
    if (shouldAutoScroll && flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  // Scroll to bottom when new message is sent
  const handleSend = async () => {
    if (!userId || !newMessage.trim()) return;

    console.log('[Chat] Sending message to:', receiverId);
    const messageContent = newMessage.trim();
    setNewMessage('');
    
    try {
      socketService.sendMessage(receiverId, messageContent);
      scrollToBottom();
      console.log('[Chat] Message sent successfully');
    } catch (error) {
      console.error('[Chat] Error sending message:', error);
    }
  };

  // Scroll to bottom when keyboard appears
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        scrollToBottom();
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  // Only scroll to bottom for new messages
  useEffect(() => {
    if (messages.length > 0 && shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  const handleTyping = (text: string) => {
    setNewMessage(text);

    if (!userId) return;

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    if (!isTyping && text) {
      setIsTyping(true);
      socketService.sendTyping(receiverId, true);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
    setIsTyping(false);
      socketService.sendTyping(receiverId, false);
    }, 1000);

    setTypingTimeout(timeout);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUserMessage = item.sender._id === userId;
    const isCallLink = item.content.includes('Call Started - Click to join:');
    const isVoiceCall = item.content.includes('Voice Call Started');
    
    const renderMessageStatus = () => {
      if (!isUserMessage) return null;
      
      switch (item.status) {
        case 'sent':
          return <Text style={styles.messageStatus}>✓</Text>;
        case 'delivered':
          return <Text style={styles.messageStatus}>✓✓</Text>;
        case 'read':
          return <Text style={styles.messageStatusRead}>✓✓</Text>;
        default:
          return null;
      }
    };

    const handleCallPress = () => {
      console.log('[Call] Message clicked:', {
      content: item.content,
        isCallLink,
        isVoiceCall,
        userData
      });
      
      if (!isCallLink || !userData) {
        console.log('[Call] Not a call link or no user data');
        return;
      }
      
      const meetingId = item.content.match(/(?:video|voice):\/\/([\w-]+)/)?.[1];
      console.log('[Call] Extracted meeting ID:', meetingId);
      
      if (meetingId) {
        const userID = userData.email || `user_${userData.userId}` || generateUniqueId();
        const displayName = String(userData.username || userData.name || userID.split('@')[0] || 'User');
        
        console.log('[Call] Navigating to call with:', {
          meetingId,
          userID,
          displayName,
          isVoiceCall
        });

        navigation.navigate('VideoCall', {
          meetingId,
          userID,
          userName: displayName,
          isVoiceCall: isVoiceCall
        });
      }
    };

    const messageContent = (
      <View style={[
        styles.messageBubble,
        isUserMessage ? styles.userMessageBubble : styles.receivedMessageBubble,
        isCallLink && (isVoiceCall ? styles.voiceCallLinkBubble : styles.videoCallLinkBubble)
      ]}>
        <View style={isCallLink ? styles.callContent : undefined}>
          {isCallLink && (
            <Icon 
              name={isVoiceCall ? "call" : "videocam"} 
              size={20} 
              color="#fff" 
              style={styles.callIcon} 
            />
          )}
          <Text style={[
            styles.messageText,
            isUserMessage ? styles.userMessageText : styles.receivedMessageText,
            isCallLink && styles.callLinkText
          ]}>
            {item.content}
          </Text>
        </View>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            isUserMessage ? styles.userTimestamp : styles.receivedTimestamp
          ]}>
            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {renderMessageStatus()}
        </View>
      </View>
    );

    return (
      <View style={[
        styles.messageContainer,
        isUserMessage ? styles.userMessageContainer : styles.receivedMessageContainer
      ]}>
        {isCallLink ? (
          <TouchableOpacity 
            onPress={handleCallPress}
            activeOpacity={0.6}
            style={[
              styles.callTouchable,
              isUserMessage ? styles.userCallTouchable : styles.receivedCallTouchable
            ]}
          >
            {messageContent}
          </TouchableOpacity>
        ) : (
          messageContent
        )}
      </View>
    );
  };

  // Load user data immediately when component mounts
  useEffect(() => {
    const loadInitialUserData = async () => {
      try {
        console.log('[Chat] Loading user data...');
        const userDataStr = await AsyncStorage.getItem('userData');
        if (!userDataStr) {
          console.error('[Chat] No user data found in storage');
          Alert.alert('Error', 'Unable to load user data. Please try logging in again.');
          return;
        }

        const parsedUserData = JSON.parse(userDataStr);
        console.log('[Chat] Parsed user data:', parsedUserData);

        if (!parsedUserData.userId && parsedUserData.id) {
          parsedUserData.userId = parsedUserData.id;
        }

        if (!parsedUserData.userId) {
          console.error('[Chat] Invalid user data: no userId found');
          Alert.alert('Error', 'Invalid user data. Please try logging in again.');
          return;
        }

        setUserData(parsedUserData);
        console.log('[Chat] User data loaded successfully:', parsedUserData);
      } catch (error) {
        console.error('[Chat] Error loading initial user data:', error);
        Alert.alert('Error', 'Failed to load user data. Please try again.');
      }
    };

    loadInitialUserData();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item._id}
        contentContainerStyle={[
          styles.messageList,
          messages.length === 0 && styles.emptyList
        ]}
        inverted={true}
        showsVerticalScrollIndicator={true}
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
        onScroll={(event) => {
          const offset = event.nativeEvent.contentOffset.y;
          setScrollOffset(offset);
          // Enable auto-scroll when user is at the bottom (offset 0 for inverted list)
          setShouldAutoScroll(offset <= 0);
        }}
        onScrollBeginDrag={() => {
          setIsScrolling(true);
          setShouldAutoScroll(false);
        }}
        onScrollEndDrag={() => {
          setIsScrolling(false);
          // Re-enable auto-scroll if at bottom
          if (scrollOffset <= 0) {
            setShouldAutoScroll(true);
          }
        }}
        onEndReached={() => {
          // Here you can implement loading more messages when user scrolls up
          console.log('[Chat] Reached end of list, load more messages if needed');
        }}
        onEndReachedThreshold={0.5}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10,
        }}
        scrollEventThrottle={16}
      />
      
      {remoteTyping && (
        <Text style={styles.typingIndicator}>
          {receiverName} is typing...
        </Text>
      )}

      <View style={[
        styles.inputContainer,
        keyboardVisible && styles.inputContainerWithKeyboard
      ]}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={handleTyping}
          placeholder="Type a message..."
          multiline
          maxLength={1000}
          onFocus={() => {
            if (!isScrolling && scrollOffset <= 0) {
              setShouldAutoScroll(true);
              scrollToBottom();
            }
          }}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
          onPress={() => {
            handleSend();
            setShouldAutoScroll(true);
          }}
          disabled={!newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.default,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background.default,
  },
  messageList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    flexGrow: 1,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageContainer: {
    marginVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    width: '100%',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  receivedMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  userMessageBubble: {
    backgroundColor: COLORS.primary.main,
    borderBottomRightRadius: BORDER_RADIUS.xs,
  },
  receivedMessageBubble: {
    backgroundColor: COLORS.background.paper,
    borderBottomLeftRadius: BORDER_RADIUS.xs,
  },
  messageText: {
    fontSize: FONTS.sizes.md,
    lineHeight: FONTS.sizes.md * 1.4,
    marginBottom: SPACING.xs,
    fontFamily: FONTS.families.primary,
  },
  userMessageText: {
    color: COLORS.primary.contrast,
  },
  receivedMessageText: {
    color: COLORS.text.primary,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: SPACING.xs,
  },
  timestamp: {
    fontSize: FONTS.sizes.xs,
    fontFamily: FONTS.families.secondary,
  },
  userTimestamp: {
    color: COLORS.primary.contrast,
    opacity: 0.7,
  },
  receivedTimestamp: {
    color: COLORS.text.secondary,
  },
  typingIndicator: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.text.secondary,
    fontStyle: 'italic',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background.paper,
    fontFamily: FONTS.families.secondary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.background.paper,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingBottom: Platform.OS === 'ios' ? SPACING.xl : SPACING.md,
    ...SHADOWS.md,
  },
  inputContainerWithKeyboard: {
    paddingBottom: SPACING.md,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.grey[100],
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.sizes.md,
    maxHeight: SPACING.xxl * 2,
    minHeight: SPACING.xl,
    marginRight: SPACING.sm,
    fontFamily: FONTS.families.primary,
    color: COLORS.text.primary,
  },
  sendButton: {
    backgroundColor: COLORS.primary.main,
    borderRadius: BORDER_RADIUS.round,
    paddingHorizontal: SPACING.lg,
    height: SPACING.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.action.disabled,
  },
  sendButtonText: {
    color: COLORS.primary.contrast,
    fontSize: FONTS.sizes.md,
    fontWeight: '600' as const,
    fontFamily: FONTS.families.primary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  callButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  callButtonDisabled: {
    opacity: 0.5,
  },
  iconContainer: {
    backgroundColor: COLORS.call.voice,
    width: SPACING.xl,
    height: SPACING.xl,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sm,
  },
  iconContainerDisabled: {
    backgroundColor: COLORS.grey[400],
  },
  videoIconContainer: {
    backgroundColor: COLORS.call.video,
  },
  iconBackground: {
    backgroundColor: COLORS.common.white,
    width: SPACING.lg,
    height: SPACING.lg,
    borderRadius: BORDER_RADIUS.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiIcon: {
    fontSize: FONTS.sizes.lg,
  },
  messageStatus: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.primary.contrast,
    opacity: 0.7,
    marginLeft: SPACING.xs,
    fontFamily: FONTS.families.secondary,
  },
  messageStatusRead: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.info.main,
    marginLeft: SPACING.xs,
    fontFamily: FONTS.families.secondary,
  },
  callContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  callIcon: {
    marginRight: SPACING.sm,
  },
  callLinkText: {
    color: COLORS.common.white,
    fontWeight: '600' as const,
    textDecorationLine: 'underline',
    fontFamily: FONTS.families.primary,
  },
  callTouchable: {
    maxWidth: '80%',
  },
  userCallTouchable: {
    alignSelf: 'flex-end',
  },
  receivedCallTouchable: {
    alignSelf: 'flex-start',
  },
  videoCallLinkBubble: {
    backgroundColor: COLORS.call.video,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  voiceCallLinkBubble: {
    backgroundColor: COLORS.call.voice,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
} as const);

export default ChatScreen; 