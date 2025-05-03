import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ZegoUIKitPrebuiltCallService from '@zegocloud/zego-uikit-prebuilt-call-rn';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { format } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CallLog {
  id: string;
  callID: string;
  callerName: string;
  callerID: string;
  receiverName: string;
  receiverID: string;
  timestamp: string;
  duration: number;
  status: 'missed' | 'completed' | 'ongoing';
  type: 'outgoing' | 'incoming';
}

const CallLogScreen = () => {
  const navigation = useNavigation();
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCallLogs();
    const interval = setInterval(loadCallLogs, 5000); // Refresh every 5 seconds to update ongoing calls
    return () => clearInterval(interval);
  }, []);

  const loadCallLogs = async () => {
    try {
      // Load call logs from AsyncStorage
      const storedLogs = await AsyncStorage.getItem('callLogs');
      const logs = storedLogs ? JSON.parse(storedLogs) : [];

      // Check for any ongoing calls from Zego service
      const activeCallID = await ZegoUIKitPrebuiltCallService.getActiveCallID();
      if (activeCallID) {
        const activeCallInfo = await ZegoUIKitPrebuiltCallService.getCallInfo(activeCallID);
        if (activeCallInfo) {
          // Update or add the active call to the logs
          const existingCallIndex = logs.findIndex(
            (log: CallLog) => log.callID === activeCallID
          );
          if (existingCallIndex >= 0) {
            logs[existingCallIndex].status = 'ongoing';
          } else {
            logs.unshift({
              id: activeCallID,
              callID: activeCallID,
              callerName: activeCallInfo.callerName || 'Unknown',
              callerID: activeCallInfo.callerID || '',
              receiverName: activeCallInfo.receiverName || 'Unknown',
              receiverID: activeCallInfo.receiverID || '',
              timestamp: new Date().toISOString(),
              duration: 0,
              status: 'ongoing',
              type: 'outgoing', // This will be updated when we have the actual type
            });
          }
        }
      }

      setCallLogs(logs);
      setLoading(false);
    } catch (error) {
      console.error('[CallLog] Error loading call logs:', error);
      setLoading(false);
    }
  };

  const handleCallPress = async (call: CallLog) => {
    if (call.status === 'ongoing') {
      // Rejoin the ongoing call
      navigation.navigate('VideoCall', {
        meetingId: call.callID,
        userID: call.receiverID, // This should be the current user's ID
        userName: call.receiverName, // This should be the current user's name
      });
    }
  };

  const renderCallIcon = (call: CallLog) => {
    let iconName = 'call';
    let iconColor = '#4CAF50';

    if (call.status === 'missed') {
      iconName = 'call-missed';
      iconColor = '#F44336';
    } else if (call.type === 'outgoing') {
      iconName = 'call-made';
    } else {
      iconName = 'call-received';
    }

    if (call.status === 'ongoing') {
      iconName = 'phone-in-talk';
      iconColor = '#2196F3';
    }

    return <Icon name={iconName} size={24} color={iconColor} />;
  };

  const renderItem = ({ item }: { item: CallLog }) => (
    <TouchableOpacity
      style={styles.callItem}
      onPress={() => handleCallPress(item)}
      disabled={item.status !== 'ongoing'}
    >
      <View style={styles.callIcon}>{renderCallIcon(item)}</View>
      <View style={styles.callInfo}>
        <Text style={styles.callerName}>
          {item.type === 'outgoing' ? item.receiverName : item.callerName}
        </Text>
        <Text style={styles.callTime}>
          {format(new Date(item.timestamp), 'MMM d, h:mm a')}
        </Text>
      </View>
      {item.status === 'ongoing' && (
        <View style={styles.ongoingBadge}>
          <Text style={styles.ongoingText}>Tap to rejoin</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={callLogs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No call history</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
  },
  callItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  callIcon: {
    marginRight: 16,
  },
  callInfo: {
    flex: 1,
  },
  callerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  callTime: {
    fontSize: 14,
    color: '#757575',
    marginTop: 2,
  },
  ongoingBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  ongoingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
  },
});

export default CallLogScreen; 