import { useState, useRef, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, KeyboardAvoidingView,
    Alert, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Input } from '../components/ui/Input';
import { Colors, BorderRadius, Gradients, Shadows } from '../theme';
import { useTheme } from '../hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import {
    aiService,
    AIMessageData,
    AIConversationData,
} from '../services/api';

// ── Local chat message type (display model) ──
interface ChatMessage {
    id: string;
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
}

const WELCOME_MESSAGE: ChatMessage = {
    id: 'welcome',
    type: 'ai',
    message: 'Namaste! 🙏 I\'m your DilCare AI Health Assistant. Ask me anything about health, medicines, fitness, nutrition, or wellness. I\'m here to help!',
    timestamp: new Date(),
};

const QUICK_PROMPTS = [
    { label: '❤️ Heart Health', prompt: 'Give me tips for heart health' },
    { label: '💊 Medicine Info', prompt: 'How to manage daily medicines' },
    { label: '🏃 Fitness', prompt: 'Suggest a simple exercise routine' },
    { label: '🧘 Stress', prompt: 'How to manage stress naturally' },
    { label: '🍎 Nutrition', prompt: 'What is a heart‑healthy Indian diet?' },
    { label: '😴 Sleep', prompt: 'Tips for better sleep quality' },
];

// Helper to convert API message to display message
const toChat = (m: AIMessageData): ChatMessage => ({
    id: String(m.id),
    type: m.role === 'user' ? 'user' : 'ai',
    message: m.content,
    timestamp: new Date(m.created_at),
});

const AIAssistantScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();
    const flatListRef = useRef<FlatList>(null);

    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [conversations, setConversations] = useState<AIConversationData[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // ── Load conversation list on mount ──
    useEffect(() => {
        loadConversations();
    }, []);

    const loadConversations = async () => {
        const res = await aiService.getConversations();
        if (res.data) {
            const list = Array.isArray(res.data) ? res.data : (res.data as any).results ?? [];
            setConversations(list);
        }
    };

    // ── Resume a previous conversation ──
    const resumeConversation = async (convId: string) => {
        setLoadingHistory(true);
        setShowHistory(false);
        const res = await aiService.getConversation(convId);
        if (res.data) {
            const conv = res.data;
            const chatMsgs: ChatMessage[] = conv.messages
                .filter((m: AIMessageData) => m.role !== 'system')
                .map(toChat);
            setMessages([WELCOME_MESSAGE, ...chatMsgs]);
            setConversationId(convId);
        }
        setLoadingHistory(false);
    };

    // ── Start new conversation ──
    const startNewConversation = () => {
        setConversationId(null);
        setMessages([WELCOME_MESSAGE]);
        setShowHistory(false);
    };

    // ── Delete a conversation ──
    const deleteConversation = (convId: string) => {
        Alert.alert('Delete Chat', 'Remove this conversation?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive',
                onPress: async () => {
                    await aiService.deleteConversation(convId);
                    setConversations(prev => prev.filter(c => c.id !== convId));
                    if (conversationId === convId) startNewConversation();
                },
            },
        ]);
    };

    // ── Send message ──
    const sendMessage = useCallback(async (text?: string) => {
        const messageText = text || inputText.trim();
        if (!messageText || isLoading) return;

        // Optimistic user message
        const tempId = Date.now().toString();
        const userMsg: ChatMessage = {
            id: tempId, type: 'user', message: messageText, timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        const res = await aiService.sendMessage(messageText, conversationId ?? undefined);

        if (res.data) {
            const { conversation_id, user_message, ai_message } = res.data;

            // Replace temp user msg with real one, add AI response
            setMessages(prev => [
                ...prev.filter(m => m.id !== tempId),
                toChat(user_message),
                toChat(ai_message),
            ]);

            // Track conversation id
            if (!conversationId) {
                setConversationId(conversation_id);
                loadConversations(); // refresh sidebar list
            }
        } else {
            // API error — show fallback
            setMessages(prev => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    type: 'ai',
                    message: res.error || 'Sorry, something went wrong. Please try again. 🙏',
                    timestamp: new Date(),
                },
            ]);
        }

        setIsLoading(false);
    }, [inputText, isLoading, conversationId]);

    // ── Render a single chat message ──
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

    // ── Render conversation history item ──
    const renderConvItem = (conv: AIConversationData) => (
        <TouchableOpacity
            key={conv.id}
            style={[styles.convItem, conversationId === conv.id && styles.convItemActive]}
            onPress={() => resumeConversation(conv.id)}
            onLongPress={() => deleteConversation(conv.id)}
        >
            <View style={{ flex: 1 }}>
                <Text style={styles.convTitle} numberOfLines={1}>{conv.title}</Text>
                <Text style={styles.convPreview} numberOfLines={1}>
                    {conv.last_message || 'No messages yet'}
                </Text>
            </View>
            <View style={styles.convMeta}>
                <Text style={styles.convCount}>{conv.message_count} msgs</Text>
            </View>
        </TouchableOpacity>
    );

    // ── History sidebar overlay ──
    const renderHistoryPanel = () => (
        <View style={styles.historyOverlay}>
            <View style={[styles.historyPanel, { backgroundColor: colors.card }]}>
                <View style={styles.historyHeader}>
                    <Text style={styles.historyTitle}>Conversations</Text>
                    <TouchableOpacity onPress={() => setShowHistory(false)}>
                        <Ionicons name="close" size={22} color={Colors.foreground} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.newChatBtn} onPress={startNewConversation}>
                    <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                    <Text style={styles.newChatText}>New Conversation</Text>
                </TouchableOpacity>

                {conversations.length === 0 ? (
                    <Text style={styles.emptyHistory}>No conversations yet. Start chatting!</Text>
                ) : (
                    <FlatList
                        data={conversations}
                        keyExtractor={c => c.id}
                        renderItem={({ item }) => renderConvItem(item)}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
            <TouchableOpacity style={styles.historyBackdrop} activeOpacity={1} onPress={() => setShowHistory(false)} />
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
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
                        <Text style={styles.headerSubtitle}>
                            {conversationId ? 'In conversation' : 'New chat'} · Powered by AI
                        </Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.backButton} onPress={() => { loadConversations(); setShowHistory(true); }}>
                    <Ionicons name="chatbubbles-outline" size={22} color={Colors.mutedForeground} />
                </TouchableOpacity>
            </View>

            {/* Loading overlay */}
            {loadingHistory && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator color={Colors.primary} size="large" />
                    <Text style={styles.loadingText}>Loading conversation…</Text>
                </View>
            )}

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
                                <Text style={styles.quickPromptsTitle}>Quick topics:</Text>
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
                                <View style={[styles.messageBubble, styles.aiBubble, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                    <Text style={styles.typingText}>Thinking…</Text>
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
                            placeholder="Ask about your health…"
                            value={inputText}
                            onChangeText={setInputText}
                            onSubmitEditing={() => sendMessage()}
                            containerStyle={{ marginBottom: 0 }}
                            style={styles.textInput}
                        />
                    </View>
                    <TouchableOpacity onPress={() => sendMessage()} style={styles.sendButton} disabled={!inputText.trim() || isLoading}>
                        <LinearGradient colors={inputText.trim() ? Gradients.primary : [Colors.muted, Colors.muted]} style={styles.sendGradient}>
                            <Ionicons name="send" size={18} color={inputText.trim() ? Colors.white : Colors.mutedForeground} />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* History panel */}
            {showHistory && renderHistoryPanel()}
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

    // Loading
    loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
    loadingText: { marginTop: 12, fontSize: 14, color: Colors.white, fontWeight: '600' },

    // History panel
    historyOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, flexDirection: 'row' },
    historyBackdrop: { flex: 1 },
    historyPanel: { width: '75%', backgroundColor: Colors.card, paddingTop: Platform.OS === 'ios' ? 56 : 40, borderRightWidth: 0.5, borderRightColor: Colors.border, ...Shadows.lg },
    historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
    historyTitle: { fontSize: 18, fontWeight: '700', color: Colors.foreground },
    newChatBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
    newChatText: { fontSize: 15, fontWeight: '600', color: Colors.primary },
    emptyHistory: { textAlign: 'center', marginTop: 40, fontSize: 14, color: Colors.mutedForeground },
    convItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
    convItemActive: { backgroundColor: Colors.primaryLight },
    convTitle: { fontSize: 14, fontWeight: '600', color: Colors.foreground },
    convPreview: { fontSize: 12, color: Colors.mutedForeground, marginTop: 2 },
    convMeta: { marginLeft: 8 },
    convCount: { fontSize: 11, color: Colors.mutedForeground },
});

export default AIAssistantScreen;
