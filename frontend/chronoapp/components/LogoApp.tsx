import Svg, { G, Text, TSpan, Path } from "react-native-svg";
import { View } from "react-native";

export default function SvgComponent() {
  return (
    <View>
      <Svg
        width="123.89579mm"
        height="38.55677mm"
        viewBox="0 0 123.89579 38.556771"
      >
        <G transform="translate(-72.805954,-111.53393)">
          <Text
            x="71.38356"
            y="129.82191"
            fontFamily="Orbitron-ExtraBold"
            fontWeight="800"
            fontSize="25.4"
            fill="#000000"
            strokeWidth={1.235}
          >
            <TSpan x="71.38356" y="129.82191">
              CHRONO
            </TSpan>
          </Text>

          <Text
            x="71.332741"
            y="149.69737"
            fontFamily="Orbitron-ExtraBold"
            fontWeight="bold"
            fontSize="25.4"
            fill="#000000"
            strokeWidth={1.235}
          >
            <TSpan x="71.332741" y="149.69737">
              APP
            </TSpan>
          </Text>

          <Path
            fill="#000000"
            strokeWidth={1.24968}
            d="m 136.15254,131.80272 6.91482,8.36904 4.03796,-6.14601 3.25336,4.05375 5.86869,-6.40755 4.03795,6.53832 c 0,0 0.76966,-0.46381 2.23819,-0.98024 1.46854,-0.51643 4.15903,5.19131 6.43151,4.45779 2.27247,-0.73352 4.12694,-5.68527 6.53876,-6.33655 2.41182,-0.65127 4.20409,-3.27885 6.09066,-3.54855 2.49749,-0.35703 5.60716,8.63058 5.60716,8.63058 l 9.53014,-8.63058 v 18.28798 h -60.5492 z"
          />
        </G>
      </Svg>
    </View>
  );
}
