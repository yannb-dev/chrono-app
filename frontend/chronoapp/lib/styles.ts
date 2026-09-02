import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    height: "100%",
    paddingTop: 90,
    padding: 20,
    backgroundColor: "rgb(218, 234, 233)",
  },

  btnSelect: {
    backgroundColor: "rgb(54, 235, 84)",
    width: 130,
    padding: 10,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    marginTop: 50,
  },

  btnPressed: {
    backgroundColor: "rgb(248, 246, 246)",
    borderColor: "black",
    borderWidth: 1,
  },

  titlePage: {
    fontFamily: "mono",
    fontSize: 20,
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
