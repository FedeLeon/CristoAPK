import { StyleSheet, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

export function AppBackground() {
  return (
    <View pointerEvents="none" style={styles.background}>
      <Svg height="100%" preserveAspectRatio="none" style={styles.svg} viewBox="0 0 390 844" width="100%">
        <Defs>
          <RadialGradient cx="20%" cy="12%" id="blueGlow" r="60%">
            <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.18" />
            <Stop offset="72%" stopColor="#3b82f6" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient cx="82%" cy="18%" id="greenGlow" r="55%">
            <Stop offset="0%" stopColor="#10b981" stopOpacity="0.16" />
            <Stop offset="72%" stopColor="#10b981" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient cx="50%" cy="48%" id="cyanGlow" r="70%">
            <Stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.12" />
            <Stop offset="76%" stopColor="#0ea5e9" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect fill="#f6f7fb" height="844" width="390" x="0" y="0" />
        <Rect fill="url(#blueGlow)" height="520" width="390" x="0" y="-80" />
        <Rect fill="url(#greenGlow)" height="520" width="390" x="0" y="-72" />
        <Rect fill="url(#cyanGlow)" height="560" width="390" x="0" y="-34" />
        <Path
          d="M0 660C65 725 142 742 206 713C270 685 316 618 390 656V844H0V660Z"
          fill="#3b82f6"
          opacity="0.14"
        />
        <Path
          d="M0 704C78 760 150 777 220 748C290 719 332 645 390 686V844H0V704Z"
          fill="#10b981"
          opacity="0.1"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#f6f7fb',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  svg: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
});
