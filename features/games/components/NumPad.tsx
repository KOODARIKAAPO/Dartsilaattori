import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type Props = {
    onNumberPress: (num: number) => void;
    onBackspace: () => void;
};

const layout = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['back', '0', 'empty'],
];

const Numpad = ({ onNumberPress, onBackspace }: Props) => {
    return (
        <View style={styles.container}>
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
        maxWidth: 300,
        alignSelf: 'center',
    },
    row: {
        flexDirection: 'row',
    },
    button: {
        flex: 1,
        aspectRatio: 1,
        margin: 5,
        borderRadius: 10,
        backgroundColor: '#eee',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
    },
});