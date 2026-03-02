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
import { useRouter } from 'expo-router';
import { api } from '../../services/api';
import { colors, spacing, radius, fontSize } from '../../constants/theme';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatResponse {
  response: string;
  intent: string;
}

export default function SearchScreen() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const addMessage = useCallback((role: 'user' | 'assistant', content: string) => {
    setMessages((prev) => [...prev, { role, content }]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  const sendQuery = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return;
    const query = text.trim();

    addMessage('user', query);
    setIsProcessing(true);

    try {
      const result = await api.post<ChatResponse>('/chat/message', {
        message: query,
        conversationHistory: messages,
      });

      addMessage('assistant', result.response);
    } catch (err: any) {
      addMessage('assistant', 'Something went wrong. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [messages, isProcessing, addMessage]);

  const handleSend = useCallback(() => {
    if (!textInput.trim()) return;
    const msg = textInput;
    setTextInput('');
    sendQuery(msg);
  }, [textInput, sendQuery]);

  const handleClear = useCallback(() => {
    setMessages([]);
    setTextInput('');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButtonContainer}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>Clear</Text>
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
              <Text style={styles.emptyIcon}>{'\u2315'}</Text>
            </View>
            <Text style={styles.emptyTitle}>Ask about your network</Text>
            <Text style={styles.emptySubtitle}>
              Search contacts, find connections, or get AI-powered recommendations.
            </Text>
            <View style={styles.examples}>
              <Text style={styles.examplesLabel}>Popular queries</Text>
              {[
                { text: 'Who do we know at Goldman Sachs?', query: 'Who do we know at Goldman Sachs?' },
                { text: 'Recommend people for our AI panel', query: 'Recommend people for our AI panel event' },
                { text: 'Who in our network is in fintech?', query: 'Who in our network is in fintech?' },
              ].map((example, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.exampleChip}
                  onPress={() => { setTextInput(''); sendQuery(example.query); }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.exampleText}>{example.text}</Text>
                  <Text style={styles.exampleArrow}>{'\u2192'}</Text>
                </TouchableOpacity>
              ))}
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
              <Text style={styles.thinkingText}>Searching...</Text>
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
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Ask about your network..."
              placeholderTextColor={colors.foregroundTertiary}
              onSubmitEditing={handleSend}
              returnKeyType="search"
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
  clearButtonContainer: {
    backgroundColor: colors.backgroundCard,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  clearButtonText: {
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
