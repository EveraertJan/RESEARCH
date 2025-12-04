import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { chatAPI } from '../services/api';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';

export default function ChatScreen({ route, navigation }) {
  const { projectId, stackId, stackName } = route.params;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sharing, setSharing] = useState(false);
  const chatViewRef = useRef();

  useEffect(() => {
    navigation.setOptions({
      title: stackName || 'Chat',
    });
    loadMessages();
  }, [stackId, stackName]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await chatAPI.getMessages(projectId, stackId);
      setMessages(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load messages');
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      await chatAPI.sendMessage(projectId, stackId, newMessage);
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  const shareChat = async () => {
    try {
      setSharing(true);

      // Capture the chat view as an image
      const uri = await captureRef(chatViewRef, {
        format: 'png',
        quality: 0.8,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Sharing is not available on this device');
        return;
      }

      // Share the screenshot
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: 'Share Chat Screenshot',
        UTI: 'public.png',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share screenshot');
      console.error('Error sharing screenshot:', error);
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={shareChat}
          disabled={sharing}
        >
          <Text style={styles.shareButtonText}>
            {sharing ? 'Sharing...' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        ref={chatViewRef}
        contentContainerStyle={styles.messagesContainer}
      >
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <View key={index} style={styles.message}>
              <Text style={styles.messageAuthor}>
                {message.author || 'User'}
              </Text>
              <Text style={styles.messageContent}>{message.content}</Text>
              <Text style={styles.messageTime}>
                {new Date(message.created_at).toLocaleString()}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No messages yet</Text>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (sending || !newMessage.trim()) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={sending || !newMessage.trim()}
        >
          <Text style={styles.sendButtonText}>
            {sending ? 'Sending...' : 'Send'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    alignItems: 'flex-end',
  },
  shareButton: {
    backgroundColor: '#C2FE0B',
    padding: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#000',
  },
  shareButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    padding: 20,
  },
  message: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  messageAuthor: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageContent: {
    fontSize: 14,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#999',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#000',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#000',
    padding: 12,
    marginRight: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#C2FE0B',
    padding: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#000',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
