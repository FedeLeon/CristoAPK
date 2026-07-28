import { StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

export function AppBackground() {
  return (
    <View style={styles.background}>
      <Svg height="100%" preserveAspectRatio="none" style={styles.svg} viewBox="0 0 390 844" width="100%">
        <Rect fill="#f6f7fb" height="844" width="390" x="0" y="0" />

        <Path
          d="M0 74C62 26 124 22 188 57C252 92 314 92 390 38V0H0V74Z"
          fill="#3b82f6"
          opacity="0.08"
        />
        <Path
          d="M0 126C70 82 135 78 202 111C267 143 326 141 390 94V0H0V126Z"
          fill="#10b981"
          opacity="0.07"
        />
        <Path
          d="M0 222C67 184 135 174 202 207C269 241 326 235 390 188V310C326 357 268 363 201 329C134 296 67 306 0 344V222Z"
          fill="#0ea5e9"
          opacity="0.055"
        />
        <Path
          d="M0 360C78 320 151 318 223 350C294 383 338 372 390 338V452C330 489 282 498 212 467C142 436 72 437 0 478V360Z"
          fill="#3b82f6"
          opacity="0.045"
        />
        <Path
          d="M0 660C65 725 142 742 206 713C270 685 316 618 390 656V844H0V660Z"
          fill="#3b82f6"
          opacity="0.13"
        />
        <Path
          d="M0 704C78 760 150 777 220 748C290 719 332 645 390 686V844H0V704Z"
          fill="#10b981"
          opacity="0.1"
        />
        <Path
          d="M0 744C73 790 150 803 226 775C302 747 340 706 390 730V844H0V744Z"
          fill="#0ea5e9"
          opacity="0.08"
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
    pointerEvents: 'none',
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
