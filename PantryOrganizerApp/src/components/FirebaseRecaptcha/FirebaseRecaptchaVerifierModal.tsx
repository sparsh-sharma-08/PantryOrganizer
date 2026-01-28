import * as React from 'react';
import { StyleSheet, Button, View, Text, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FirebaseRecaptcha from './FirebaseRecaptcha';

// Simple error class to replace CodedError
class CodedError extends Error {
    code: string;
    constructor(code: string, message: string) {
        super(message);
        this.code = code;
    }
}

export default class FirebaseRecaptchaVerifierModal extends React.Component<any, any> {
    // Patched for Firebase SDK compatibility
    _reset() {
        // No-op to satisfy the verifier interface
    }

    static defaultProps = {
        title: 'reCAPTCHA',
        cancelLabel: 'Cancel',
    };

    constructor(props: any) {
        super(props);
        this.state = {
            visible: false,
            visibleLoaded: false,
            invisibleLoaded: false,
            invisibleVerify: false,
            invisibleKey: 1,
            resolve: undefined,
            reject: undefined,
        };
    }

    onVisibleLoad = () => {
        this.setState({
            visibleLoaded: true,
        });
    };

    onInvisibleLoad = () => {
        this.setState({
            invisibleLoaded: true,
        });
    };

    onFullChallenge = async () => {
        this.setState({
            invisibleVerify: false,
            visible: true,
        });
    };

    onError = () => {
        const { reject } = this.state;
        if (reject) {
            reject(new CodedError('ERR_FIREBASE_RECAPTCHA_ERROR', 'Failed to load reCAPTCHA'));
        }
        this.setState({
            visible: false,
            invisibleVerify: false,
        });
    };

    onVerify = (token: string) => {
        const { resolve } = this.state;
        if (resolve) {
            resolve(token);
        }
        this.setState((state: any) => ({
            visible: false,
            invisibleVerify: false,
            invisibleLoaded: false,
            invisibleKey: state.invisibleKey + 1,
        }));
    };

    cancel = () => {
        const { reject } = this.state;
        if (reject) {
            reject(new CodedError('ERR_FIREBASE_RECAPTCHA_CANCEL', 'Cancelled by user'));
        }
        this.setState({
            visible: false,
        });
    };

    onDismiss = () => {
        if (this.state.visible) {
            this.cancel();
        }
    };

    static getDerivedStateFromProps(props: any, state: any) {
        if (!props.attemptInvisibleVerification && state.invisibleLoaded) {
            return {
                invisibleLoaded: false,
                invisibleVerify: false,
            };
        }
        return null;
    }

    // Provide a type string for firebase auth to identify this verifier
    get type() {
        return 'recaptcha';
    }

    // The verify method is what firebase calls
    async verify() {
        return new Promise((resolve, reject) => {
            if (this.props.attemptInvisibleVerification) {
                this.setState({
                    invisibleVerify: true,
                    resolve,
                    reject,
                });
            }
            else {
                this.setState({
                    visible: true,
                    visibleLoaded: false,
                    resolve,
                    reject,
                });
            }
        });
    }

    render() {
        const { title, cancelLabel, attemptInvisibleVerification, ...otherProps } = this.props;
        const { visible, visibleLoaded, invisibleLoaded, invisibleVerify, invisibleKey } = this.state;
        return (
            <View style={styles.container}>
                {attemptInvisibleVerification && (
                    <FirebaseRecaptcha
                        key={`invisible${invisibleKey}`}
                        style={styles.invisible}
                        onLoad={this.onInvisibleLoad}
                        onError={this.onError}
                        onVerify={this.onVerify}
                        onFullChallenge={this.onFullChallenge}
                        invisible={true}
                        verify={invisibleLoaded && invisibleVerify}
                        {...otherProps}
                    />
                )}
                <Modal
                    visible={visible}
                    animationType="slide"
                    presentationStyle="pageSheet"
                    onRequestClose={this.cancel}
                    onDismiss={this.onDismiss}
                >
                    <SafeAreaView style={styles.modalContainer}>
                        <View style={styles.header}>
                            <Text style={styles.title}>{title}</Text>
                            <View style={styles.cancel}>
                                <Button title={cancelLabel || 'Cancel'} onPress={this.cancel} />
                            </View>
                        </View>
                        <View style={styles.content}>
                            <FirebaseRecaptcha
                                style={styles.content}
                                onLoad={this.onVisibleLoad}
                                onError={this.onError}
                                onVerify={this.onVerify}
                                {...otherProps}
                            />
                            {!visibleLoaded ? (
                                <View style={styles.loader}>
                                    <ActivityIndicator size="large" />
                                </View>
                            ) : undefined}
                        </View>
                    </SafeAreaView>
                </Modal>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        width: 0,
        height: 0,
    },
    invisible: {
        width: 300,
        height: 300,
    },
    modalContainer: {
        flex: 1,
    },
    header: {
        backgroundColor: '#FBFBFB',
        height: 44,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomColor: '#CECECE',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    cancel: {
        position: 'absolute',
        left: 8,
        justifyContent: 'center',
    },
    title: {
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
    loader: {
        ...StyleSheet.absoluteFillObject,
        paddingTop: 20,
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
});
