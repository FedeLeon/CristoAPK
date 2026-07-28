import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

export type AppModalTransition = 'fade' | 'scale' | 'slide-left' | 'slide-right' | 'slide-up';

type AppModalProps = {
  backdropStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  onClose: () => void;
  transition?: AppModalTransition;
  visible: boolean;
};

export function AppModal({
  backdropStyle,
  children,
  contentStyle,
  onClose,
  transition = 'scale',
  visible,
}: AppModalProps) {
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const useNativeDriver = Platform.OS !== 'web';

  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(() => {
        Animated.timing(progress, {
          duration: 180,
          toValue: 1,
          useNativeDriver,
        }).start();
      });

      return;
    }

    Animated.timing(progress, {
      duration: 150,
      toValue: 0,
      useNativeDriver,
    }).start(({ finished }) => {
      if (finished) {
        setMounted(false);
      }
    });
  }, [progress, visible]);

  if (!mounted) {
    return null;
  }

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible={mounted}>
      <View style={[styles.backdrop, backdropStyle]}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.outsidePress} />
        <Animated.View style={[contentStyle, modalTransitionStyle(progress, transition)]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

function modalTransitionStyle(progress: Animated.Value, transition: AppModalTransition) {
  const opacity = progress;

  if (transition === 'fade') {
    return { opacity };
  }

  if (transition === 'slide-left') {
    return {
      opacity,
      transform: [
        {
          translateX: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [-44, 0],
          }),
        },
      ],
    };
  }

  if (transition === 'slide-right') {
    return {
      opacity,
      transform: [
        {
          translateX: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [44, 0],
          }),
        },
      ],
    };
  }

  if (transition === 'slide-up') {
    return {
      opacity,
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [44, 0],
          }),
        },
      ],
    };
  }

  return {
    opacity,
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(15, 23, 42, 0.28)',
    flex: 1,
    justifyContent: 'center',
    padding: 18,
  },
  outsidePress: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
