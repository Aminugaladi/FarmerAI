import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    ActivityIndicator
} from 'react-native';
import { auth } from '../firebaseConfig'; // Tabbatar path din nan ya nuna inda config din yake
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Kuskure', 'Da fatan ka cika imel da kalmar sirri');
            return;
        }

        setLoading(true);
        try {
            // 1. Shiga account ta amfani da Firebase Auth
            await signInWithEmailAndPassword(auth, email, password);

            // Idan ya yi nasara, zai tura shi zuwa babban shafi
            router.replace('/(tabs)');
        } catch (error: any) {
            let errorMessage = 'An samu matsala wajen shiga';

            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                errorMessage = 'Imel ko kalmar sirri ba daidai ba ne.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Wannan imel din ba daidai yake ba.';
            }

            Alert.alert('Kuskure', errorMessage);
            console.log(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.headerArea}>
                    <Text style={styles.logoText}>Barka da Dawowa! 🌿</Text>
                    <Text style={styles.subTitle}>Shiga don ci gaba da kula da gonarka</Text>
                </View>

                <View style={styles.inputArea}>
                    <Text style={styles.label}>Email (Imel)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="manomi@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />

                    <Text style={styles.label}>Kalmar Sirri (Password)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="********"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <TouchableOpacity
                        style={styles.loginButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Shiga</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.push('/register')} style={styles.registerLink}>
                        <Text style={styles.registerLinkText}>Ba ku da account? <Text style={{ fontWeight: 'bold' }}>Yi Rajista</Text></Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.forgotPass}>
                        <Text style={styles.forgotPassText}>An manta kalmar sirri?</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FFF9',
    },
    scrollContainer: {
        padding: 20,
        justifyContent: 'center',
        flexGrow: 1,
    },
    headerArea: {
        alignItems: 'center',
        marginBottom: 40,
        marginTop: 50,
    },
    logoText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2E7D32',
        textAlign: 'center',
    },
    subTitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
    },
    inputArea: {
        backgroundColor: '#fff',
        padding: 25,
        borderRadius: 20,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
        marginTop: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
    },
    loginButton: {
        backgroundColor: '#2E7D32',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 30,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerLink: {
        marginTop: 25,
        alignItems: 'center',
    },
    registerLinkText: {
        color: '#2E7D32',
        fontSize: 15,
    },
    forgotPass: {
        marginTop: 15,
        alignItems: 'center',
    },
    forgotPassText: {
        color: '#888',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
});