import { AuthForm } from "@/components/ui/AuthForm";
import { LoggedInProfile } from "@/components/ui/LoggedInProfile";

export default function Profile() {
  const isUserLoggedIn = false; // Replace this with actual logic

  return isUserLoggedIn ? <LoggedInProfile /> : <AuthForm />;
}
