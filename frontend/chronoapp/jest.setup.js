jest.mock("react-native-worklets", () =>
  require("react-native-worklets/src/mock"),
);

const { setUpTests } = require("react-native-reanimated");
setUpTests();
