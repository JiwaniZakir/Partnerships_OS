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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { colors, spacing, radius, fontSize } from '../../constants/theme';
import * as FileSystem from 'expo-file-system';

let Audio: typeof import('expo-av').Audio | null = null;
if (Platform.OS !== 'web') {
  Audio = require('expo-av').Audio;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  response: string;
  intent: string;
  action?: {
    type: 'contact_created' | 'interaction_logged';
    data: Record<string, unknown>;
  };
}

export default function AddScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const recordingRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      if (Audio) {
        const { status } = await Audio.requestPermissionsAsync();
        setHasPermission(status === 'granted');
        if (status === 'granted') {
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
        }
      } else {
        setHasPermission(false);
      }
    })();

    return () => {
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  // Pulse animation for recording state
  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording, pulseAnim]);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const userMsg = text.trim();

    addMessage('user', userMsg);
    setIsProcessing(true);

    try {
      const result = await api.post<ChatResponse>('/chat/message', {
        message: userMsg,
        conversationHistory: messages,
        intent: 'NEW_CONTACT',
      });

      addMessage('assistant', result.response);

      if (result.action?.type === 'contact_created') {
        const data = result.action.data;
        setTimeout(() => {
          addMessage('assistant', `Contact saved! ${data.fullName} from ${data.organization} is now in your network. Research is running in the background.`);
        }, 500);
      }
    } catch (err: any) {
      addMessage('assistant', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [messages, addMessage]);

  const handleSend = useCallback(() => {
    if (!textInput.trim() || isProcessing) return;
    const msg = textInput;
    setTextInput('');
    sendMessage(msg);
  }, [textInput, isProcessing, sendMessage]);

  const handleMicPress = useCallback(async () => {
    if (!Audio || !hasPermission) {
      if (Platform.OS !== 'web') {
        Alert.alert('Microphone Required', 'Please enable microphone access in Settings.');
      }
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      const recording = recordingRef.current;
      if (!recording) return;

      try {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        recordingRef.current = null;
        if (!uri) return;

        setIsProcessing(true);
        const base64Audio = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const { transcript } = await api.post<{ transcript: string }>(
          '/chat/transcribe',
          { audio: base64Audio, mimeType: 'audio/m4a' }
        );

        if (transcript?.trim()) {
          setTextInput(transcript);
        }
      } catch (err) {
        console.error('Transcription failed:', err);
      } finally {
        setIsProcessing(false);
        Audio?.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        }).catch(() => {});
      }
      return;
    }

    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [isRecording, hasPermission]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setTextInput('');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Add Contact</Text>
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={handleNewConversation}
            style={styles.newButtonContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.newButtonIcon}>+</Text>
            <Text style={styles.newButtonText}>New</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>+</Text>
            </View>
            <Text style={styles.emptyTitle}>Who did you meet?</Text>
            <Text style={styles.emptySubtitle}>
              Tell me about someone new and I will ask follow-up questions to add them to your network.
            </Text>
            <View style={styles.examples}>
              <Text style={styles.examplesLabel}>Try saying...</Text>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() => sendMessage('I just met someone at the Goldman Sachs event')}
                activeOpacity={0.7}
              >
                <Text style={styles.exampleText}>
                  "Met someone at the Goldman event"
                </Text>
                <Text style={styles.exampleArrow}>{'\u2192'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exampleChip}
                onPress={() => sendMessage('I want to add Sarah Chen from Sequoia Capital, she\'s a Partner')}
                activeOpacity={0.7}
              >
                <Text style={styles.exampleText}>
                  "Add Sarah Chen from Sequoia Capital"
                </Text>
                <Text style={styles.exampleArrow}>{'\u2192'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {messages.map((msg, i) => (
          <View
            key={i}
            style={[
              styles.bubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
            ]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.assistantAvatarSmall}>
                <Text style={styles.assistantAvatarText}>f</Text>
              </View>
            )}
            <View style={[
              styles.bubbleContent,
              msg.role === 'user' ? styles.userBubbleContent : styles.assistantBubbleContent,
            ]}>
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === 'user' ? styles.userText : styles.assistantText,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {isProcessing && (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <View style={styles.assistantAvatarSmall}>
              <Text style={styles.assistantAvatarText}>f</Text>
            </View>
            <View style={[styles.bubbleContent, styles.assistantBubbleContent]}>
              <Text style={styles.thinkingText}>Thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputArea}
      >
        <View style={styles.inputRow}>
          {hasPermission && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.micButton, isRecording && styles.micButtonActive]}
                onPress={handleMicPress}
                activeOpacity={0.7}
              >
                <Text style={[styles.micIcon, isRecording && styles.micIconActive]}>
                  {isRecording ? '\u25A0' : '\u{1F3A4}'}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Tell me about a new contact..."
              placeholderTextColor={colors.foregroundTertiary}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              multiline
              maxLength={1000}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, (!textInput.trim() || isProcessing) && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!textInput.trim() || isProcessing}
            activeOpacity={0.7}
          >
            <Text style={styles.sendIcon}>{'\u2191'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  title: {
    color: colors.foreground,
    fontSize: fontSize.xl,
    fontWeight: '700',
  },
  newButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    gap: 4,
  },
  newButtonIcon: {
    color: colors.foregroundSecondary,
    fontSize: 16,
    fontWeight: '400',
  },
  newButtonText: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  // Messages
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.xl,
    paddingBottom: 40,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: spacing.lg,
  },
  emptyIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyIcon: {
    fontSize: 28,
    color: colors.foregroundMuted,
    fontWeight: '300',
  },
  emptyTitle: {
    color: colors.foreground,
    fontSize: fontSize.xl,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 23,
    marginBottom: 36,
    maxWidth: 300,
  },
  examples: {
    width: '100%',
    gap: spacing.sm,
  },
  examplesLabel: {
    color: colors.foregroundMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
    paddingLeft: 2,
  },
  exampleChip: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exampleText: {
    color: colors.foregroundSecondary,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    flex: 1,
  },
  exampleArrow: {
    color: colors.foregroundMuted,
    fontSize: 16,
    marginLeft: spacing.sm,
  },

  // Chat Bubbles
  bubble: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    alignItems: 'flex-start',
  },
  userBubble: {
    justifyContent: 'flex-end',
  },
  assistantBubble: {
    justifyContent: 'flex-start',
  },
  assistantAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.foreground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    marginTop: 2,
  },
  assistantAvatarText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  bubbleContent: {
    maxWidth: '78%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 18,
  },
  userBubbleContent: {
    backgroundColor: colors.userBubble,
    borderBottomRightRadius: 6,
    marginLeft: 'auto',
  },
  assistantBubbleContent: {
    backgroundColor: colors.assistantBubble,
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  bubbleText: {
    fontSize: fontSize.md,
    lineHeight: 22,
  },
  userText: {
    color: colors.userBubbleText,
  },
  assistantText: {
    color: colors.assistantBubbleText,
  },
  thinkingText: {
    color: colors.foregroundMuted,
    fontSize: fontSize.sm,
    fontStyle: 'italic',
  },

  // Input Area
  inputArea: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.backgroundCard,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  micButtonActive: {
    backgroundColor: colors.destructive,
    borderColor: colors.destructive,
  },
  micIcon: {
    fontSize: 16,
  },
  micIconActive: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: colors.backgroundSubtle,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  textInput: {
    color: colors.foreground,
    paddingHorizontal: 18,
    paddingVertical: 10,
    paddingTop: 11,
    fontSize: fontSize.md,
    maxHeight: 100,
    minHeight: 42,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendDisabled: {
    opacity: 0.25,
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
