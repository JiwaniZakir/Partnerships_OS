import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VoiceButton } from '../../components/VoiceButton';
import { VoiceClient } from '../../services/voice';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function VoiceScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const voiceClientRef = useRef<VoiceClient | null>(null);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [...prev, { role, content, timestamp: new Date() }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const connectVoice = useCallback(async () => {
    if (voiceClientRef.current?.isConnected) return;

    const client = new VoiceClient({
      onTranscript: (text) => addMessage('user', text),
      onResponse: (text) => {
        addMessage('assistant', text);
        setIsProcessing(false);
      },
      onStatus: (s) => setStatus(s),
      onError: (err) => {
        console.error('Voice error:', err);
        setIsProcessing(false);
        setIsRecording(false);
      },
    });

    try {
      await client.connect();
      voiceClientRef.current = client;
    } catch (err) {
      console.error('Connection failed:', err);
    }
  }, [addMessage]);

  const handleMicPress = useCallback(async () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    await connectVoice();
    setIsRecording(true);
  }, [isRecording, connectVoice]);

  const handleSendText = useCallback(async () => {
    if (!textInput.trim()) return;

    const message = textInput.trim();
    setTextInput('');
    addMessage('user', message);
    setIsProcessing(true);

    await connectVoice();
    voiceClientRef.current?.sendText(message);
  }, [textInput, connectVoice, addMessage]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Foundry AI</Text>
        <Text style={styles.statusText}>
          {status === 'connected'
            ? 'Ready'
            : status === 'processing'
              ? 'Thinking...'
              : status === 'listening'
                ? 'Listening...'
                : 'Tap to connect'}
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Welcome to Partnerships OS</Text>
            <Text style={styles.emptySubtitle}>
              Tap the mic or type below to get started.{'\n'}
              Try: "I just met someone at the Goldman event"
            </Text>
          </View>
        )}
        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                msg.role === 'user' ? styles.userText : styles.assistantText,
              ]}
            >
              {msg.content}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.controls}>
        <VoiceButton
          isRecording={isRecording}
          isProcessing={isProcessing}
          onPress={handleMicPress}
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.textInput}
          value={textInput}
          onChangeText={setTextInput}
          placeholder="Type a message..."
          placeholderTextColor="#6B7280"
          onSubmitEditing={handleSendText}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, !textInput.trim() && styles.sendButtonDisabled]}
          onPress={handleSendText}
          disabled={!textInput.trim()}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1F1F1F',
  },
  title: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: '700',
  },
  statusText: {
    color: '#6366F1',
    fontSize: 13,
    marginTop: 4,
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyTitle: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptySubtitle: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366F1',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1F1F1F',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FAFAFA',
  },
  assistantText: {
    color: '#E5E5E5',
  },
  controls: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    color: '#FAFAFA',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: '#FAFAFA',
    fontWeight: '600',
    fontSize: 14,
  },
});
