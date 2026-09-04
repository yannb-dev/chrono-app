import { StyleSheet } from "react-native";

const rose = "rgb(240,76,139)";
const green = "rgb(139,241,77)";
const blue = "rgb(76,139,240)";
const black = "rgb(38,8,21)";
const gray = "rgb(212,212,212)";
const white = "rgb(240,240,240)";

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
    borderBottomColor: gray,
    borderBottomWidth: 1,
  },

  inputPasswordLogin: {
    width: "100%",
    borderBottomColor: gray,
    borderBottomWidth: 1,
    marginBottom: 30,
  },

  btnRegister: {
    color: black,
    fontSize: 14,
    fontWeight: 600,
  },

  // register page

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

  titlePage: {
    fontFamily: "mono",
    fontSize: 10,
    color: "rgb(29, 28, 28)",
  },

  inputRunner: {
    marginTop: 20,
    width: 120,
    height: 60,
    padding: 5,
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgb(134, 233, 150)",
    borderRadius: 5,
  },
  containerChrono: {
    width: "80%",
    height: 60,
    borderRadius: 10,
    margin: 10,
    alignItems: "center",
    backgroundColor: "rgb(201, 196, 196)",
  },
  textChrono: {
    fontSize: 30,
    margin: 5,
  },
  containerBtnChrono: {
    marginTop: 10,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "80%",
  },
  btnChrono: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "rgb(201, 196, 196)",
  },

  containerBtnRunner: {
    marginTop: 20,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },

  btnRunner: {
    width: "15%",
    margin: 6,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    borderColor: "rgb(14, 13, 13)",
    borderWidth: 3,
  },

  containerListChrono: {
    height: 200,
    marginTop: 40,
  },

  list: {
    width: "80%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
  },

  containerListResult: {
    height: 260,
    width: "90%",
    marginTop: 40,
  },

  btnCourse: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    padding: 10,
    backgroundColor: "rgb(54, 235, 84)",
    borderRadius: 5,
    marginTop: 20,
  },
});
