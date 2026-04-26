import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type Props = {
    value: string;
    onNumberPress: (num: number) => void;
    onBackspace: () => void;
    onEnter: () => void;
};

const layout = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['back', '0', 'empty'],
];

const Numpad = ({ value, onNumberPress, onBackspace, onEnter }: Props) => {
    return (
        <View style={styles.container}>

            {/* display + enter */}
            <View style={styles.displayRow}>
                <View style={styles.display}>
                    <Text style={styles.displayText}>{value || '-'}</Text>
                </View>

                <Pressable style={styles.enter} onPress={onEnter}>
                    <Text style={styles.enterText}>ENTER</Text>
                </Pressable>
            </View>

            {layout.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.row}>
                    {row.map((item, colIndex) => {
                        if (item === 'empty') {
                            return <View key={colIndex} style={styles.button} />;
                        }

                        if (item === 'back') {
                            return (
                                <Pressable
                                    key={colIndex}
                                    style={styles.button}
                                    onPress={onBackspace}
                                >
                                    <Text style={styles.text}>⌫</Text>
                                </Pressable>
                            );
                        }

                        return (
                            <Pressable
                                key={colIndex}
                                style={styles.button}
                                onPress={() => onNumberPress(Number(item))}
                            >
                                <Text style={styles.text}>{item}</Text>
                            </Pressable>
                        );
                    })}
                </View>
            ))}
        </View>
    );
};

export default Numpad;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 240,
        alignSelf: 'center',
    },

    displayRow: {
        flexDirection: 'row',
        marginBottom: 8,
        gap: 8,
    },

    display: {
        flex: 1,
        backgroundColor: '#333',
        borderRadius: 8,
        justifyContent: 'center',
        paddingHorizontal: 12,
    },

    displayText: {
        fontSize: 24,
        fontWeight: '700',
        color: 'white',
    },

    enter: {
        paddingHorizontal: 16,
        justifyContent: 'center',
        backgroundColor: '#333',
        borderRadius: 8,
    },

    enterText: {
        color: 'white',
        fontWeight: '700',
    },

    row: {
        flexDirection: 'row',
    },

    button: {
        flex: 1,
        aspectRatio: 1,
        margin: 3,
        borderRadius: 8,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },

    text: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
});