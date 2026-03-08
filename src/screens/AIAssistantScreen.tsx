import React, { useState, useRef } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Colors, BorderRadius, Gradients, Shadows } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import { aiService } from '../services/api';

interface ChatMessage {
    id: string; type: 'user' | 'ai'; message: string; timestamp: Date;
}

const QUICK_PROMPTS = [
    { label: '❤️ Heart Health', prompt: 'Give me tips for heart health' },
    { label: '💊 Medicine Info', prompt: 'How to manage daily medicines' },
    { label: '🏃 Fitness', prompt: 'Suggest a simple exercise routine' },
    { label: '🧘 Stress', prompt: 'How to manage stress naturally' },
];

const AIAssistantScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '0', type: 'ai', message: 'Namaste! 🙏 I\'m your DilCare AI Health Assistant. Ask me anything about health, medicines, fitness, nutrition, or wellness. I\'m here to help!', timestamp: new Date() },
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const flatListRef = useRef<FlatList>(null);

    const sendMessage = async (text?: string) => {
        const messageText = text || inputText.trim();
        if (!messageText) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(), type: 'user', message: messageText, timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        // API call placeholder
        await aiService.sendMessage(messageText);

        // Placeholder response - will be replaced with real API
        setTimeout(() => {
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(), type: 'ai',
                message: 'Thank you for your question! This feature will provide real AI-powered health advice once the backend API is connected. For now, please consult your healthcare provider for medical advice.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsLoading(false);
        }, 1000);
    };

    const renderMessage = ({ item }: { item: ChatMessage }) => (
        <View style={[styles.messageContainer, item.type === 'user' ? styles.userMessage : styles.aiMessage]}>
            {item.type === 'ai' && (
                <View style={styles.aiAvatar}>
                    <Ionicons name="sparkles" size={16} color={Colors.primary} />
                </View>
            )}
            <View style={[styles.messageBubble, item.type === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.messageText, item.type === 'user' && { color: Colors.white }]}>
                    {item.message}
                </Text>
                <Text style={[styles.messageTime, item.type === 'user' && { color: 'rgba(255,255,255,0.7)' }]}>
                    {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.glassBackground, borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.foreground} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <View style={styles.headerAvatar}>
                        <Ionicons name="sparkles" size={18} color={Colors.white} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>AI Health Assistant</Text>
                        <Text style={styles.headerSubtitle}>Powered by AI</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.backButton}>
                    <Ionicons name="settings-outline" size={22} color={Colors.mutedForeground} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messageList}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
                    ListHeaderComponent={
                        messages.length <= 1 ? (
                            <View style={styles.quickPromptsContainer}>
                                <Text style={styles.quickPromptsTitle}>Try asking:</Text>
                                <View style={styles.quickPromptsGrid}>
                                    {QUICK_PROMPTS.map((prompt, i) => (
                                        <TouchableOpacity key={i} style={styles.quickPrompt} onPress={() => sendMessage(prompt.prompt)}>
                                            <Text style={styles.quickPromptText}>{prompt.label}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ) : null
                    }
                    ListFooterComponent={
                        isLoading ? (
                            <View style={[styles.messageContainer, styles.aiMessage]}>
                                <View style={styles.aiAvatar}>
                                    <Ionicons name="sparkles" size={16} color={Colors.primary} />
                                </View>
                                <View style={[styles.messageBubble, styles.aiBubble]}>
                                    <Text style={styles.typingText}>Thinking...</Text>
                                </View>
                            </View>
                        ) : null
                    }
                />

                {/* Input Bar */}
                <View style={styles.inputBar}>
                    <TouchableOpacity style={styles.voiceButton}>
                        <Ionicons name="mic" size={22} color={Colors.mutedForeground} />
                    </TouchableOpacity>
                    <View style={styles.inputContainer}>
                        <Input
                            placeholder="Ask about your health..."
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={() => sendMessage()}
                            containerStyle={{ marginBottom: 0 }}
                            style={styles.textInput}
                        />
                    </View>
                    <TouchableOpacity onPress={() => sendMessage()} style={styles.sendButton} disabled={!inputText.trim()}>
                        <LinearGradient colors={inputText.trim() ? Gradients.primary : [Colors.muted, Colors.muted]} style={styles.sendGradient}>
                            <Ionicons name="send" size={18} color={inputText.trim() ? Colors.white : Colors.mutedForeground} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12,
        backgroundColor: Colors.glassBackground, borderBottomWidth: 0.5, borderBottomColor: Colors.border,
    },
    backButton: { padding: 8 },
    headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.foreground },
    headerSubtitle: { fontSize: 11, color: Colors.mutedForeground },
    messageList: { padding: 16, paddingBottom: 8 },
    messageContainer: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
    userMessage: { justifyContent: 'flex-end' },
    aiMessage: { justifyContent: 'flex-start' },
    aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
    messageBubble: { maxWidth: '78%', paddingHorizontal: 16, paddingVertical: 10, borderRadius: BorderRadius.lg },
    userBubble: { backgroundColor: Colors.primary, borderBottomRightRadius: 4, marginLeft: 'auto' },
    aiBubble: { backgroundColor: Colors.card, borderBottomLeftRadius: 4, ...Shadows.sm },
    messageText: { fontSize: 14, lineHeight: 20, color: Colors.foreground },
    messageTime: { fontSize: 10, color: Colors.mutedForeground, marginTop: 4, textAlign: 'right' },
    typingText: { fontSize: 14, color: Colors.mutedForeground, fontStyle: 'italic' },
    quickPromptsContainer: { marginBottom: 16 },
    quickPromptsTitle: { fontSize: 14, fontWeight: '600', color: Colors.mutedForeground, marginBottom: 10 },
    quickPromptsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    quickPrompt: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: Colors.card, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border, ...Shadows.sm },
    quickPromptText: { fontSize: 13, fontWeight: '500', color: Colors.foreground },
    inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, paddingBottom: Platform.OS === 'ios' ? 28 : 12, backgroundColor: Colors.card, borderTopWidth: 0.5, borderTopColor: Colors.border },
    voiceButton: { padding: 10 },
    inputContainer: { flex: 1, marginHorizontal: 8 },
    textInput: { borderRadius: BorderRadius.full, paddingHorizontal: 16 },
    sendButton: {},
    sendGradient: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});

export default AIAssistantScreen;
