import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VoiceButton } from '../../components/VoiceButton';
import { Waveform } from '../../components/Waveform';
import { VoiceClient } from '../../services/voice';

// expo-av is native-only — conditionally import for audio recording
let Audio: typeof import('expo-av').Audio | null = null;
if (Platform.OS !== 'web') {
  Audio = require('expo-av').Audio;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function VoiceScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const voiceClientRef = useRef<VoiceClient | null>(null);
  const recordingRef = useRef<any>(null);

  // Request microphone permission on mount (native only)
  useEffect(() => {
    (async () => {
      if (Audio) {
        const { status: audioStatus } = await Audio.requestPermissionsAsync();
        setHasPermission(audioStatus === 'granted');
        if (audioStatus === 'granted') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
        }
      } else {
        // On web, no native audio — mic button won't record
        setHasPermission(false);
      }
    })();

    // Cleanup on unmount
    return () => {
      voiceClientRef.current?.disconnect();
      stopRecording();
    };
  }, []);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [...prev, { role, content, timestamp: new Date() }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const connectVoice = useCallback(async (): Promise<boolean> => {
    if (voiceClientRef.current?.isConnected) return true;

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
      return true;
    } catch (err) {
      console.error('Connection failed:', err);
      Alert.alert(
        'Connection Failed',
        'Could not connect to the voice server. Make sure the API is running.'
      );
      return false;
    }
  }, [addMessage]);

  const startRecording = async () => {
    if (!Audio) return;
    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
    } catch (err) {
      console.error('Failed to start recording:', err);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    const recording = recordingRef.current;
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      if (uri && voiceClientRef.current?.isConnected) {
        // Read the audio file and send it via WebSocket
        const response = await fetch(uri);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          const buffer = reader.result as ArrayBuffer;
          voiceClientRef.current?.sendAudio(buffer);
          setIsProcessing(true);
        };
        reader.readAsArrayBuffer(blob);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const handleMicPress = useCallback(async () => {
    if (hasPermission === false) {
      if (Platform.OS === 'web') {
        // On web, voice recording isn't available — use text input
        return;
      }
      Alert.alert(
        'Microphone Access Required',
        'Please enable microphone access in Settings to use voice features.',
      );
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      await stopRecording();
      return;
    }

    const connected = await connectVoice();
    if (!connected) return;

    setIsRecording(true);
    await startRecording();
  }, [isRecording, connectVoice, hasPermission]);

  const handleSendText = useCallback(async () => {
    if (!textInput.trim()) return;

    const message = textInput.trim();
    setTextInput('');
    addMessage('user', message);
    setIsProcessing(true);

    const connected = await connectVoice();
    if (!connected) {
      setIsProcessing(false);
      return;
    }
    voiceClientRef.current?.sendText(message);
  }, [textInput, connectVoice, addMessage]);

  const statusLabel =
    status === 'connected'
      ? 'Ready'
      : status === 'processing'
        ? 'Thinking...'
        : status === 'listening'
          ? 'Listening...'
          : status === 'disconnected'
            ? 'Disconnected'
            : 'Tap to connect';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Partnerships AI</Text>
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusDot,
              status === 'connected' && styles.statusDotConnected,
              status === 'disconnected' && styles.statusDotDisconnected,
              (status === 'processing' || status === 'listening') && styles.statusDotActive,
            ]}
          />
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
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
              Tap the mic or type below to get started.{'\n\n'}
              Try:{'\n'}
              "I just met someone at the Goldman event"{'\n'}
              "Who do we know at Sequoia?"{'\n'}
              "Log a call with Sarah Chen"
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
        {isProcessing && (
          <View style={[styles.messageBubble, styles.assistantBubble]}>
            <Text style={styles.thinkingText}>...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.controls}>
        {isRecording && <Waveform isActive={isRecording} />}
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
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
  },
  statusDotConnected: {
    backgroundColor: '#22C55E',
  },
  statusDotDisconnected: {
    backgroundColor: '#EF4444',
  },
  statusDotActive: {
    backgroundColor: '#C4B99A',
  },
  statusText: {
    color: '#C4B99A',
    fontSize: 13,
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
    paddingTop: 48,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    color: '#FAFAFA',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
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
    backgroundColor: '#3D3A33',
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
  thinkingText: {
    color: '#6B7280',
    fontSize: 18,
    letterSpacing: 4,
  },
  controls: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
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
    backgroundColor: '#F1EFE7',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    color: '#0A0A0A',
    fontWeight: '600',
    fontSize: 14,
  },
});
