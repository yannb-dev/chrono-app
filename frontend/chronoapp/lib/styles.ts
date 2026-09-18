import { StyleSheet } from "react-native";

const rose = "rgb(240,76,139)";
const green = "rgb(139,241,77)";
const black = "rgb(38,8,21)";
const gray = "#d4d4d4";
const white = "rgb(240,240,240)";
const grayDark = "#575656";

export const styles = StyleSheet.create({
  // all page

  container: {
    height: "100%",
    width: "100%",
    padding: 10,
    backgroundColor: white,
    alignItems: "center",
  },

  btnSelect: {
    backgroundColor: green,
    width: 130,
    padding: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
  },

  btnPressed: {
    backgroundColor: white,
    borderColor: green,
    borderWidth: 1,
  },

  text: {
    fontFamily: "Orbitron-Medium",
  },

  textError: {
    fontFamily: "Orbitron-Medium",
    color: rose,
  },

  errorForm: {
    fontFamily: "Orbitron-Regular",
    color: rose,
    fontWeight: 400,
  },

  containerError: {
    height: "30%",
    width: "90%",
    padding: 10,
    backgroundColor: gray,
    borderRadius: 6,
    justifyContent: "space-evenly",
    alignItems: "center",
  },

  // loadingAnim.tsx

  containerSupLoading: {
    height: "100%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  containerLoading: {
    height: 50,
    width: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
  },

  pointLoading: {
    height: 16,
    width: 16,
    borderRadius: 8,
    backgroundColor: black,
  },

  // login.tsx

  containerLogo: {
    height: "25%",
    width: "75%",
    justifyContent: "center",
    alignItems: "center",
  },

  containerInput: {
    height: "50%",
    width: "75%",
    justifyContent: "center",
    alignItems: "center",
  },

  containerBtnLogin: {
    height: "25%",
    width: "75%",
    justifyContent: "flex-start",
    alignItems: "center",
  },

  inputEmailLogin: {
    width: "100%",
    borderBottomColor: grayDark,
    borderBottomWidth: 1,
  },

  inputPasswordLogin: {
    width: "100%",
    borderBottomColor: grayDark,
    borderBottomWidth: 1,
    marginBottom: 30,
  },

  btnRegister: {
    color: black,
    fontSize: 14,
    fontWeight: 600,
    fontFamily: "Orbitron-Regular",
    marginTop: 30,
  },

  // register page

  containerSupRegister: {
    height: "100%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  // index.tsx

  containerLogout: {
    height: "20%",
    width: "100%",
    alignItems: "flex-end",
    justifyContent: "center",
  },

  containerLogoIndex: {
    height: "20%",
    width: "100%",
    justifyContent: "space-evenly",
    alignItems: "center",
  },

  containerBtnNew: {
    height: "60%",
    width: "75%",
    justifyContent: "center",
    alignItems: "center",
  },

  // formSeance page.tsx

  containerSupForm: {
    height: "100%",
    justifyContent: "center",
  },

  containerForm: {
    height: "70%",
    justifyContent: "center",
  },

  containerValidForm: {
    height: "30%",
    justifyContent: "center",
    alignItems: "center",
  },

  textTotalRunner: {
    fontFamily: "Orbitron-Medium",
    fontSize: 30,
    padding: 20,
    borderRadius: 6,
    color: black,
    backgroundColor: gray,
    borderWidth: 2,
    borderColor: black,
  },

  btnChangeTotalRunner: {
    fontFamily: "Orbitron-Medium",
    fontSize: 20,
    padding: 10,
    borderRadius: 6,
    color: black,
    backgroundColor: gray,
    borderWidth: 2,
    borderColor: black,
    margin: 30,
  },

  containerSelectColor: {
    alignItems: "center",
  },

  selectColor: {
    width: 50,
    height: 50,
    borderRadius: 6,
    margin: 5,
  },

  // [id].tsx

  containerChrono: {
    height: "20%",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  boxChrono: {
    height: "80%",
    width: "70%",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 6,
    backgroundColor: "gray",
    borderRadius: 6,
  },

  time: {
    width: "100%",
    height: "55%",
    alignItems: "center",
    justifyContent: "center",
  },

  containerBtnChrono: {
    height: "40%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "70%",
  },
  containerBtnRunner: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },

  list: {
    width: "80%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },

  btnChrono: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
    backgroundColor: "rgb(201, 196, 196)",
  },

  textChrono: {
    fontFamily: "Orbitron-Medium",
    color: black,
    margin: 5,
  },

  btnRunner: {
    height: 60,
    width: "15%",
    margin: 6,
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    borderColor: gray,
    borderWidth: 2,
  },

  textBtnRunner: {
    fontFamily: "Orbitron-Regular",
  },

  containerListChrono: {
    height: "15%",
    marginTop: 8,
  },

  containerBtnSave: {
    height: "5%",
    justifyContent: "center",
    alignItems: "center",
  },

  containerErrorFetchBtnChrono: {
    width: "100%",
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // list.tsx

  containerLogoDelete: {
    height: "20%",
    width: "100%",
    padding: 15,
    flexDirection: "row",
  },

  containerLogoList: {
    height: "100%",
    width: "80%",
    justifyContent: "center",
    alignItems: "center",
  },

  containerDeleteList: {
    height: "100%",
    width: "20%",
    justifyContent: "center",
    alignItems: "center",
  },

  containerListResult: {
    height: "80%",
    width: "100%",
  },

  containerListRun: {
    width: "70%",
    height: 70,
    backgroundColor: gray,
    borderRadius: 6,
    padding: 6,
    marginBottom: 12,
  },

  containerListDate: {
    width: "100%",
    height: "40%",
    padding: 4,
  },

  containerListState: {
    width: "100%",
    height: "60%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },

  stateResult: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },

  colorRun: {
    height: 20,
    width: 20,
    borderRadius: 4,
    borderWidth: 1,
  },

  pointColorState: {
    height: 10,
    width: 10,
    borderRadius: 5,
    marginRight: 10,
  },

  btntrashPressed: {
    transform: [{ scale: 1.1 }],
  },

  // [id].tsx run

  containerResult: {
    height: "100%",
    width: "100%",
    padding: 20,
    alignItems: "center",
  },

  containerFlatListResultPage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: gray,
    height: 80,
    width: "100%",
    borderRadius: 10,
    marginBottom: 20,
    padding: 20,
  },
});

// result
