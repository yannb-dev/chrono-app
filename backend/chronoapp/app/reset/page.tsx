import { connection } from "next/server";
import PasswordReset from "../component/paswwordReset";

export default async function ResetPage() {
  await connection();
  return <PasswordReset />;
}
